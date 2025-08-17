import React, { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatView } from './components/ChatView';
import { EditChatModal } from './components/EditChatModal';
import { FolderActionModal } from './components/FolderActionModal';
import { CitationDrawer } from './components/CitationDrawer';
import { ToastContainer } from './components/ToastContainer';
import { UpdateIndicator } from './components/UpdateIndicator';
import { UpdateSettings } from './components/settings/UpdateSettings';

// Lazy load components
const ImageLightbox = lazy(() => import('./components/ImageLightbox').then(module => ({ default: module.ImageLightbox })));
const SettingsModal = lazy(() => import('./components/settings/SettingsModal').then(module => ({ default: module.SettingsModal })));
const RolesView = lazy(() => import('./components/RolesView').then(module => ({ default: module.RolesView })));
const PersonaEditor = lazy(() => import('./components/persona/PersonaEditor').then(module => ({ default: module.PersonaEditor })));
const ArchiveView = lazy(() => import('./components/ArchiveView').then(module => ({ default: module.ArchiveView })));
const TranslateView = lazy(() => import('./components/translator/TranslateView')); // This is a default export
const ConfirmationModal = lazy(() => import('./components/ConfirmationModal').then(module => ({ default: module.ConfirmationModal })));
import PasswordView from './components/PasswordView';
const PrivacyNoticeModal = lazy(() => import('./components/PrivacyNoticeModal').then(module => ({ default: module.PrivacyNoticeModal })));
const UpdateNoticeModal = lazy(() => import('./components/UpdateNoticeModal').then(module => ({ default: module.UpdateNoticeModal })));
import { ChatSession, Folder, Settings, Persona } from './types';
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';
import { useSettings } from './hooks/useSettings';
import { useChatData } from './hooks/useChatData';
import { useChatMessaging } from './hooks/useChatMessaging';
import { useToast } from './contexts/ToastContext';
import { usePersonas } from './hooks/usePersonas';
import { usePersonaMemories } from './hooks/usePersonaMemories';
import { useTranslationHistory } from './hooks/useTranslationHistory';
import { exportData, importData, clearAllData, loadPrivacyConsent, savePrivacyConsent, loadLastReadVersion, saveLastReadVersion } from './services/storageService';
import { authService } from './services/authService';
import { ViewContainer } from './components/common/ViewContainer';

type View = 'chat' | 'personas' | 'editor' | 'archive' | 'translate';

const AppContainer = () => {
  const PRIVACY_STATEMENT_VERSION = '1.0.0'; // 声明版本号

  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [showUpdateSettings, setShowUpdateSettings] = useState(false);

  const [hasConsented, setHasConsented] = useState(() => {
    const consent = loadPrivacyConsent();
    return consent?.consented && consent.version === PRIVACY_STATEMENT_VERSION;
  });

  // 初始化认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // 检查是否设置了环境变量密码
    const envPassword = (import.meta as any).env.VITE_ACCESS_PASSWORD;
    
    // 检查是否有临时访问令牌
    const urlParams = new URLSearchParams(window.location.search);
    const tempToken = urlParams.get('temp_token');
    
    if (tempToken && authService.verifyTempAccessToken(tempToken)) {
      // 如果有有效的临时访问令牌，则允许访问
      authService.setTempAccessToken(tempToken);
      return true;
    }
    
    if (envPassword && envPassword.trim() !== '') {
      // 如果设置了环境变量密码，则必须验证密码
      return authService.isAuthenticated();
    }
    
    // 如果没有设置环境变量密码且没有有效的临时令牌，则不允许访问
    return false;
  });

  const { settings, setSettings, availableModels, isStorageLoaded } = useSettings();

  const handleSettingsChange = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const { chats, setChats, folders, setFolders, activeChatId, setActiveChatId, ...chatDataHandlers } = useChatData({ settings, isStorageLoaded, onSettingsChange: handleSettingsChange });
  const { personas, setPersonas, savePersonas, deletePersona, loading, error, clearError } = usePersonas({ isStorageLoaded });
  const { memories, getMemoriesForPersona, addMemory, updateMemory, deleteMemory } = usePersonaMemories({ isStorageLoaded });
  const { translationHistory, setTranslationHistory } = useTranslationHistory({ isStorageLoaded });
  const { addToast } = useToast();
  const { t } = useLocalization();

  useEffect(() => {
    if (isAuthenticated) {
      // 使用认证服务设置认证状态，默认记住登录状态
      authService.setAuthenticated(true, authService.isRememberMeSet());
    }
  }, [isAuthenticated]);

  // 检查URL中是否有临时访问令牌
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tempToken = urlParams.get('temp_token');
    
    if (tempToken) {
      // 验证临时访问令牌
      if (authService.verifyTempAccessToken(tempToken)) {
        authService.setTempAccessToken(tempToken);
        setIsAuthenticated(true);
        
        // 从URL中移除临时访问令牌参数
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]temp_token=[^&]*/, '');
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  useEffect(() => {
    console.log("哇真的是你啊");
    console.log("多看一眼就会爆炸");
  }, []);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const res = await fetch('/version.json');
        const data = await res.json();
        setVersionInfo(data);
        const lastReadVersion = loadLastReadVersion();
        if (data.version !== lastReadVersion) {
          setUpdateAvailable(true);
          setShowUpdateModal(true);
        }
      } catch (error) {
        console.error("Failed to fetch version info:", error);
      }
    };
    checkVersion();
  }, []);

  // 手动检查更新
  const checkForUpdates = async () => {
    setIsCheckingUpdate(true);
    try {
      // 添加时间戳防止缓存
      const res = await fetch('/version.json?t=' + Date.now());
      const data = await res.json();
      setVersionInfo(data);
      const lastReadVersion = loadLastReadVersion();
      
      if (data.version !== lastReadVersion) {
        setUpdateAvailable(true);
        addToast(t('updateAvailable'), 'success');
      } else {
        addToast(t('upToDate'), 'info');
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      addToast("检查更新失败", 'error');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // 立即更新
  const updateNow = () => {
    // 对于PWA，尝试通过Service Worker更新
    if ('serviceWorker' in navigator) {
      addToast("正在检查更新...", 'info');
      
      // 先检查是否有新版本
      fetch('/version.json?t=' + Date.now())
        .then(res => res.json())
        .then(data => {
          const lastReadVersion = loadLastReadVersion();
          
          if (data.version !== lastReadVersion) {
            // 有新版本，尝试更新Service Worker
            navigator.serviceWorker.getRegistrations().then(registrations => {
              if (registrations.length > 0) {
                // 强制更新Service Worker
                registrations[0].update().then(() => {
                  addToast("发现新版本，正在下载更新...", 'success');
                  
                  // 监听Service Worker的更新状态
                  navigator.serviceWorker.addEventListener('controllerchange', () => {
                    addToast("更新已完成，正在刷新页面...", 'success');
                    setTimeout(() => {
                      window.location.reload();
                    }, 1000);
                  });
                  
                  // 如果5秒内没有更新，强制刷新
                  setTimeout(() => {
                    saveLastReadVersion(data.version);
                    setUpdateAvailable(false);
                    window.location.reload();
                  }, 5000);
                });
              } else {
                // 没有Service Worker，直接刷新
                saveLastReadVersion(data.version);
                setUpdateAvailable(false);
                window.location.reload();
              }
            });
          } else {
            addToast("已经是最新版本", 'info');
          }
        })
        .catch(error => {
          console.error("Failed to check for updates:", error);
          addToast("检查更新失败", 'error');
        });
    } else {
      // 非PWA环境，直接刷新
      window.location.reload();
    }
  };

  // 更新设置模态框控制
  const openUpdateSettings = () => {
    setShowUpdateSettings(true);
  };

  const closeUpdateSettings = () => {
    setShowUpdateSettings(false);
  };
  
  const [currentView, setCurrentView] = useState<View>('chat');
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);
  const [isNextChatStudyMode, setIsNextChatStudyMode] = useState(false);
  const [hasCreatedInitialChat, setHasCreatedInitialChat] = useState(false);
  const [isInitialSetupComplete, setIsInitialSetupComplete] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const { 
    isLoading, handleSendMessage, handleCancel, handleDeleteMessage, 
    handleUpdateMessageContent, handleRegenerate, handleEditAndResubmit
  } = useChatMessaging({
    settings, activeChat, personas, memories, setChats,
    setSuggestedReplies: chatDataHandlers.setSuggestedReplies, setActiveChatId, addToast,
    isNextChatStudyMode, setIsNextChatStudyMode
  });

  const [editingChat, setEditingChat] = useState<ChatSession | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null | 'new'>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [citationChunks, setCitationChunks] = useState<any[] | null>(null);
  

  const handleNewChat = useCallback((personaId?: string | null) => {
    // 如果角色列表正在加载中，直接提示并返回
    if (loading) {
      addToast("角色数据正在加载，请稍后再试", 'info');
      return;
    }

    const selectedPersonaId = personaId ?? settings.defaultPersona;
    const persona = selectedPersonaId ? personas.find(p => p && p.id === selectedPersonaId) : null;

    if (persona) {
        const newChatSession: ChatSession = {
            id: crypto.randomUUID(),
            title: persona.name || 'New Persona Chat',
            icon: (persona.avatar.type === 'emoji' ? persona.avatar.value : '👤') || '💬',
            messages: [],
            createdAt: Date.now(),
            model: persona.model ?? settings.defaultModel,
            folderId: null,
            personaId: persona.id,
            isStudyMode: isNextChatStudyMode,
        };
        setChats(prev => [newChatSession, ...prev]);
        setActiveChatId(newChatSession.id);
        setIsNextChatStudyMode(false);
    } else {
        setActiveChatId(null);
        // 如果找不到角色，可能是角色列表还没有加载完，或者没有配置默认角色
        if (personas.length === 0) {
            addToast("角色列表正在加载中，请稍后再试", 'info');
        } else {
            addToast("未找到默认角色，请先在设置中配置一个角色", 'info');
        }
    }

    setSearchQuery('');
    chatDataHandlers.setSuggestedReplies([]);
    setIsMobileSidebarOpen(false);
    setCurrentView('chat');
  }, [settings.defaultPersona, settings.defaultModel, personas, isNextChatStudyMode, setChats, setActiveChatId, setIsNextChatStudyMode, chatDataHandlers.setSuggestedReplies, addToast, loading]);

// 在用户首次进入应用时自动创建使用 default-assistant 角色的聊天
useEffect(() => {
  if (isStorageLoaded && !hasCreatedInitialChat && chats.length === 0 && personas.length > 0 && isInitialSetupComplete) {
    const defaultPersona = personas.find(p => p.id === settings.defaultPersona);
    if (defaultPersona) {
      handleNewChat(settings.defaultPersona);
      setHasCreatedInitialChat(true);
    }
  }
}, [isStorageLoaded, hasCreatedInitialChat, chats, personas, settings.defaultPersona, handleNewChat, isInitialSetupComplete]);

// Validate and fix defaultPersona after all personas are loaded
useEffect(() => {
  if (personas.length > 0) {
    const currentDefaultPersonaId = settings.defaultPersona;
    const isDefaultPersonaValid = personas.some(p => p.id === currentDefaultPersonaId);

    if (!isDefaultPersonaValid) {
      console.warn(`Invalid defaultPersona found in settings: ${currentDefaultPersonaId}. Resetting to the first available persona.`);
      const firstAvailablePersona = personas[0];
      if (firstAvailablePersona) {
        handleSettingsChange({ defaultPersona: firstAvailablePersona.id });
      }
    }
    // 标记初始设置完成
    setIsInitialSetupComplete(true);
  }
}, [personas, settings.defaultPersona, handleSettingsChange]);

const handleSelectChat = useCallback((id: string) => { setActiveChatId(id); chatDataHandlers.setSuggestedReplies([]); setIsMobileSidebarOpen(false); setCurrentView('chat'); }, [setActiveChatId, chatDataHandlers.setSuggestedReplies]);
  
  const handleOpenView = (view: View) => {
    setIsMobileSidebarOpen(false);
    setCurrentView(view);
  }
  
  const handleOpenEditor = (persona: Persona | null) => { setEditingPersona(persona); setCurrentView('editor'); }
  const handleSavePersona = (personaToSave: Persona) => { savePersonas(personaToSave); setCurrentView('personas'); };
  const handleDeletePersona = (id: string) => {
    deletePersona(id);
  };

  const handleImport = (file: File) => {
    importData(file).then(({ settings, chats, folders, personas: importedPersonas, memories: importedMemories }) => {
        if (settings) handleSettingsChange(settings);
        if (chats) setChats(chats);
        if (folders) setFolders(folders);
        if (importedPersonas) {
          // 确保不会重复添加角色
          const existingPersonaIds = new Set(personas.map(p => p && p.id).filter(Boolean));
          const newPersonas = importedPersonas.filter(p => p && !existingPersonaIds.has(p.id));
          setPersonas(p => [...p.filter(p => p && p.isDefault), ...newPersonas]);
        }
        if (importedMemories) {
          // This will overwrite existing memories, which is the intended behavior for an import.
          // A more sophisticated merge could be implemented if needed.
          Object.keys(importedMemories).forEach(personaId => {
            importedMemories[personaId].forEach(mem => addMemory(personaId, mem.content));
          });
        }
        addToast("Import successful!", 'success');
    }).catch(err => {
        addToast("Invalid backup file.", 'error');
        console.error(err);
    });
  };

  const handleClearAll = () => {
    setConfirmation({
        title: t('clearHistory'),
        message: t('clearHistoryConfirm'),
        onConfirm: () => {
            clearAllData();
            setChats([]);
            setFolders([]);
            setPersonas(p => p.filter(p => p && p.isDefault));
            setTranslationHistory([]);
            setActiveChatId(null);
            setConfirmation(null);
            addToast("All data cleared.", 'success');
        }
    });
  };

  // 检查是否设置了环境变量密码
  const envPassword = (import.meta as any).env.VITE_ACCESS_PASSWORD;
  const hasPassword = envPassword && envPassword.trim() !== '';
  if (hasPassword && !isAuthenticated) {
    return <PasswordView onVerified={(rememberMe) => {
      setIsAuthenticated(true);
      authService.setAuthenticated(true, rememberMe);
    }} />;
  }

  if (!hasConsented) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <PrivacyNoticeModal onConfirm={() => {
          savePrivacyConsent(PRIVACY_STATEMENT_VERSION);
          setHasConsented(true);
        }} />
      </Suspense>
    );
  }
  
  return (
    <div className="h-dvh-screen w-screen flex bg-[var(--bg-image)] text-[var(--text-color)] overflow-hidden">
        <ToastContainer />
        {isMobileSidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} aria-hidden="true"/>}
        <Sidebar
          chats={chats}
          folders={folders}
          activeChatId={activeChatId}
          onNewChat={useCallback(() => handleNewChat(null), [handleNewChat])}
          onSelectChat={handleSelectChat}
          onDeleteChat={chatDataHandlers.handleDeleteChat}
          onEditChat={setEditingChat}
          onArchiveChat={(id) => chatDataHandlers.handleArchiveChat(id, true)}
          onNewFolder={() => setEditingFolder('new')}
          onEditFolder={setEditingFolder}
          onDeleteFolder={chatDataHandlers.handleDeleteFolder}
          onMoveChatToFolder={chatDataHandlers.handleMoveChatToFolder}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(p => !p)}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(false)}
          searchQuery={searchQuery}
          onSetSearchQuery={setSearchQuery}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenPersonas={() => handleOpenView('personas')}
          onOpenArchive={() => handleOpenView('archive')}
          onOpenTranslate={() => handleOpenView('translate')}
        >
          <UpdateIndicator
            updateAvailable={updateAvailable}
            isCheckingUpdate={isCheckingUpdate}
            onClick={openUpdateSettings}
          />
        </Sidebar>
        <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarCollapsed ? 'p-3 pb-2' : 'p-3 pb-2 md:pl-0'}`}>
          <div className="view-wrapper">
            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
              <ViewContainer view="chat" activeView={currentView}>
                <ChatView chatSession={activeChat} personas={personas} onSendMessage={handleSendMessage} isLoading={isLoading} onCancelGeneration={handleCancel} currentModel={settings.defaultModel} onSetCurrentModel={(model) => handleSettingsChange({ defaultModel: model })} onSetModelForActiveChat={chatDataHandlers.handleSetModelForActiveChat} availableModels={availableModels} isSidebarCollapsed={isSidebarCollapsed} onToggleSidebar={() => setIsSidebarCollapsed(p => !p)} onToggleMobileSidebar={() => setIsMobileSidebarOpen(p => !p)} onNewChat={handleNewChat} onImageClick={setLightboxImage} suggestedReplies={chatDataHandlers.suggestedReplies} settings={settings} onDeleteMessage={handleDeleteMessage} onUpdateMessageContent={handleUpdateMessageContent} onRegenerate={handleRegenerate} onEditAndResubmit={handleEditAndResubmit} onShowCitations={setCitationChunks} onDeleteChat={chatDataHandlers.handleDeleteChat} onEditChat={setEditingChat} onToggleStudyMode={chatDataHandlers.handleToggleStudyMode} isNextChatStudyMode={isNextChatStudyMode} onToggleNextChatStudyMode={setIsNextChatStudyMode} />
              </ViewContainer>
              <ViewContainer view="personas" activeView={currentView}>
                <RolesView
                  personas={personas}
                  onStartChat={handleNewChat}
                  onEditPersona={handleOpenEditor}
                  onCreatePersona={() => handleOpenEditor(null)}
                  onDeletePersona={handleDeletePersona}
                  onClose={() => setCurrentView('chat')}
                  error={error}
                  clearError={clearError}
                />
              </ViewContainer>
              <ViewContainer view="archive" activeView={currentView}>
                <ArchiveView chats={chats} onSelectChat={handleSelectChat} onUnarchiveChat={(id) => chatDataHandlers.handleArchiveChat(id, false)} onDeleteChat={chatDataHandlers.handleDeleteChat} onEditChat={setEditingChat} onClose={() => setCurrentView('chat')} />
              </ViewContainer>
              <ViewContainer view="editor" activeView={currentView}>
                <PersonaEditor
                  personaToEdit={editingPersona}
                  settings={settings}
                  onSave={handleSavePersona}
                  onClose={() => setCurrentView('personas')}
                  availableModels={availableModels}
                  memories={editingPersona ? getMemoriesForPersona(editingPersona.id) : []}
                  onAddMemory={addMemory}
                  onUpdateMemory={updateMemory}
                  onDeleteMemory={deleteMemory}
                />
              </ViewContainer>
               <ViewContainer view="translate" activeView={currentView}>
                <TranslateView settings={settings} onClose={() => setCurrentView('chat')} history={translationHistory} setHistory={setTranslationHistory} />
              </ViewContainer>
            </Suspense>
          </div>
        </div>
        
        <Suspense fallback={null}>
          {isSettingsOpen && <SettingsModal settings={settings} onClose={() => setIsSettingsOpen(false)} onSettingsChange={handleSettingsChange} onExportSettings={() => exportData({ settings })} onExportAll={() => exportData({ chats, folders, settings, personas: personas.filter(p => p && !p.isDefault), memories })} onImport={handleImport} onClearAll={handleClearAll} availableModels={availableModels} personas={personas} versionInfo={versionInfo} />}
          {lightboxImage && <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}
          {confirmation && <ConfirmationModal {...confirmation} onClose={() => setConfirmation(null)} />}
          {showUpdateModal && versionInfo && <UpdateNoticeModal versionInfo={versionInfo} onClose={() => {
            setShowUpdateModal(false);
            setUpdateAvailable(false);
            saveLastReadVersion(versionInfo.version);
          }} />}
        </Suspense>

        {/* These modals are small and frequently used, so they are not lazy-loaded */}
        {editingChat && <EditChatModal chat={editingChat} onClose={() => setEditingChat(null)} onSave={chatDataHandlers.handleUpdateChatDetails} />}
        {editingFolder && <FolderActionModal folder={editingFolder === 'new' ? null : editingFolder} onClose={() => setEditingFolder(null)} onSave={editingFolder === 'new' ? chatDataHandlers.handleNewFolder : chatDataHandlers.handleUpdateFolder} />}
        {citationChunks && <CitationDrawer chunks={citationChunks} onClose={() => setCitationChunks(null)} />}
        
        {/* 更新设置模态框 */}
        {showUpdateSettings && (
          <UpdateSettings
            versionInfo={versionInfo}
            onClose={closeUpdateSettings}
            onCheckUpdate={checkForUpdates}
            onUpdateNow={updateNow}
            isCheckingUpdate={isCheckingUpdate}
            updateAvailable={updateAvailable}
          />
        )}
        
        {/* 全局页脚 */}
        <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        </footer>
    </div>
  );
}

export default function App() {
  return (
    <LocalizationProvider>
      <AppContainer />
    </LocalizationProvider>
  );
}