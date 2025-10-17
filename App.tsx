import React, { useState, useCallback, useEffect, lazy, Suspense, useLayoutEffect } from 'react';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatView } from './components/ChatView';
import { EditChatModal } from './components/EditChatModal';
import { FolderActionModal } from './components/FolderActionModal';
import { CitationDrawer } from './components/CitationDrawer';
import { ToastContainer } from './components/ToastContainer';
import { UpdateIndicator } from './components/UpdateIndicator';
import { UpdateSettings } from './components/settings/UpdateSettings';
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { initDB, migrateAttachmentsFromLocalStorage } from './services/indexedDBService';

// Lazy load components
const ImageLightbox = lazy(() => import('./components/ImageLightbox').then(module => ({ default: module.ImageLightbox })));
const SettingsModal = lazy(() => import('./components/settings/SettingsModal').then(module => ({ default: module.SettingsModal })));
const RolesView = lazy(() => import('./components/RolesView').then(module => ({ default: module.RolesView })));
const PersonaEditor = lazy(() => import('./components/persona/PersonaEditor').then(module => ({ default: module.PersonaEditor })));
const ArchiveView = lazy(() => import('./components/ArchiveView').then(module => ({ default: module.ArchiveView })));
const ConfirmationModal = lazy(() => import('./components/ConfirmationModal').then(module => ({ default: module.ConfirmationModal })));
import PasswordView from './components/PasswordView';
const PrivacyNoticeModal = lazy(() => import('./components/PrivacyNoticeModal').then(module => ({ default: module.PrivacyNoticeModal })));
const UpdateNoticeModal = lazy(() => import('./components/UpdateNoticeModal').then(module => ({ default: module.UpdateNoticeModal })));
const ChatExportSelector = lazy(() => import('./components/settings/ChatExportSelector').then(module => ({ default: module.ChatExportSelector })));
const ChatClearSelector = lazy(() => import('./components/ChatClearSelector').then(module => ({ default: module.ChatClearSelector })));
import { ChatSession, Folder, Settings, Persona, Message } from './types';
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';
import { useSettings } from './hooks/useSettings';
import { useChatData } from './hooks/useChatData';
import { useChatMessaging } from './hooks/useChatMessaging';
import { useToast } from './contexts/ToastContext';
import { usePersonas } from './hooks/usePersonas';
import { useUIState } from './hooks/useUIState';
import { exportData, importData, clearAllData, clearChatHistory, loadPrivacyConsent, savePrivacyConsent, loadLastReadVersion, saveLastReadVersion, exportSelectedChats } from './services/storageService';
import { ViewContainer } from './components/common/ViewContainer';
import { MessageEditModal } from './components/MessageEditModal';

type View = 'chat' | 'personas' | 'editor' | 'archive';

const AppContainer = () => {
  const PRIVACY_STATEMENT_VERSION = '1.0.0'; // 声明版本号

  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [showUpdateSettings, setShowUpdateSettings] = useState(false);
  const [showChatExportSelector, setShowChatExportSelector] = useState(false);
  const [showChatClearSelector, setShowChatClearSelector] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const { needRefresh, updateStatus, updateServiceWorker, checkForUpdates } = usePWAUpdate();

  const [hasConsented, setHasConsented] = useState(() => {
    const consent = loadPrivacyConsent();
    return consent?.consented && consent.version === PRIVACY_STATEMENT_VERSION;
  });

  // 认证管理（抽离到 useAuth hook）
  const { isAuthenticated, hasPassword, handleVerified } = useAuth();

  const { settings, setSettings, availableModels, isStorageLoaded } = useSettings();
  
  // 应用主题和调色板（抽离到 useTheme hook）
  useTheme(settings, isStorageLoaded);

  const handleSettingsChange = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const { chats, setChats, folders, setFolders, activeChatId, setActiveChatId, ...chatDataHandlers } = useChatData({ settings, isStorageLoaded, onSettingsChange: handleSettingsChange });
  const { personas, setPersonas, savePersonas, deletePersona, loading, error, clearError } = usePersonas({ isStorageLoaded });
  const { addToast } = useToast();
  const { t } = useLocalization();
  
  // UI 状态管理（模态框、抽屉等）
  const uiState = useUIState();

  // 初始化 IndexedDB 并迁移旧数据
  useEffect(() => {
    const initStorage = async () => {
      try {
        await initDB();
        const migratedCount = await migrateAttachmentsFromLocalStorage();
        if (migratedCount > 0) {
          console.log(`[IndexedDB] Migrated ${migratedCount} attachments from localStorage`);
        }
      } catch (error) {
        console.error('[IndexedDB] Initialization failed:', error);
      }
    };
    initStorage();
  }, []);

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const res = await fetch('/version.json');
        const data = await res.json();
        setVersionInfo(data);
      } catch (error) {
        console.error("Failed to fetch version info:", error);
      }
    };
    fetchVersionInfo();
  }, []);

  const handleUpdateNow = () => {
    updateServiceWorker();
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    
    try {
      const result = await checkForUpdates();
      
      if (result.error) {
        addToast(`检查更新失败: ${result.error}`, 'error');
      } else if (result.hasUpdate) {
        addToast(`发现新版本 ${result.remoteVersion}，请点击更新按钮`, 'success');
      } else {
        addToast('当前已是最新版本', 'info');
      }
    } catch (error) {
      console.error('[Update] Check failed:', error);
      addToast('检查更新时发生错误', 'error');
    } finally {
      setIsCheckingUpdate(false);
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
  
  const [hasCreatedInitialChat, setHasCreatedInitialChat] = useState(false);
  const [isInitialSetupComplete, setIsInitialSetupComplete] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const { 
    isLoading, handleSendMessage, handleCancel, handleDeleteMessage, 
    handleUpdateMessageContent, handleRegenerate, handleEditAndResubmit
  } = useChatMessaging({
    settings, activeChat, personas, setChats,
    setActiveChatId, addToast
  });

  // Sidebar 状态（由 Sidebar 组件管理，这里只读）
  const [sidebarState, setSidebarState] = useState({ isCollapsed: false, isMobileSidebarOpen: false });
  
  const handleNewChat = useCallback((personaId?: string | null) => {
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
            messages: [],
            createdAt: Date.now(),
            model: persona.model ?? settings.defaultModel,
            folderId: null,
            personaId: persona.id,
        };
        setChats(prev => [newChatSession, ...prev]);
        setActiveChatId(newChatSession.id);
        
    } else {
        setActiveChatId(null);
        if (personas.length === 0) {
            addToast("角色列表正在加载中，请稍后再试", 'info');
        } else {
            addToast("未找到默认角色，请先在设置中配置一个角色", 'info');
        }
    }

    setCurrentView('chat');
  }, [settings.defaultPersona, settings.defaultModel, personas, setChats, setActiveChatId, addToast, loading]);

// 已禁用自动创建聊天 - 让用户每次进入都看到欢迎页面
// 用户需要点击"开始聊天"按钮来创建第一个对话

// Validate and fix defaultPersona after all personas are loaded
useEffect(() => {
  if (personas.length > 0) {
    const currentDefaultPersonaId = settings.defaultPersona;
    const isDefaultPersonaValid = personas.some(p => p.id === currentDefaultPersonaId);

    if (!isDefaultPersonaValid) {
      console.warn(`[Persona] Invalid defaultPersona: ${currentDefaultPersonaId}, resetting to first available`);
      const firstAvailablePersona = personas[0];
      if (firstAvailablePersona) {
        handleSettingsChange({ defaultPersona: firstAvailablePersona.id });
      }
    }
    // 标记初始设置完成
    setIsInitialSetupComplete(true);
  }
}, [personas, settings.defaultPersona, handleSettingsChange]);

const handleSelectChat = useCallback((id: string) => { setActiveChatId(id); setCurrentView('chat'); }, [setActiveChatId]);
  
  const handleOpenView = (view: View) => {
    setCurrentView(view);
  }
  
  const handleOpenEditor = (persona: Persona | null) => { setEditingPersona(persona); setCurrentView('editor'); }
  const handleSavePersona = (personaToSave: Persona) => { savePersonas(personaToSave); setCurrentView('personas'); };
  const handleDeletePersona = (id: string) => {
    deletePersona(id);
  };

  const handleImport = (file: File) => {
    importData(file).then(({ settings, chats, folders, personas: importedPersonas }) => {
        if (settings) handleSettingsChange(settings);
        if (chats) setChats(chats);
        if (folders) setFolders(folders);
        if (importedPersonas) {
          // 确保不会重复添加角色
          const existingPersonaIds = new Set(personas.map(p => p && p.id).filter(Boolean));
          const newPersonas = importedPersonas.filter(p => p && !existingPersonaIds.has(p.id));
          setPersonas(p => [...p.filter(p => p && p.isDefault), ...newPersonas]);
        }
        addToast("Import successful!", 'success');
    }).catch(err => {
        addToast("Invalid backup file.", 'error');
        console.error('[Import] Failed:', err);
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
            setActiveChatId(null);
            setConfirmation(null);
            addToast("All data cleared.", 'success');
        }
    });
  };

  const handleClearChatHistory = () => {
    setShowChatClearSelector(true);
  };

  // 处理导出选中的聊天
  const handleExportSelectedChats = (selectedChatIds: string[]) => {
    exportSelectedChats(selectedChatIds, chats);
    setShowChatExportSelector(false);
    addToast("Selected chats exported successfully", 'success');
  };

  // 处理清除选中的聊天
  const handleClearSelectedChats = (selectedChatIds: string[]) => {
    setConfirmation({
      title: "确认清除聊天记录",
      message: `确定要清除选中的 ${selectedChatIds.length} 个聊天记录吗？此操作无法撤销。归档的聊天不会被影响。`,
      onConfirm: () => {
        setChats(prev => prev.filter(chat => !selectedChatIds.includes(chat.id)));
        if (activeChatId && selectedChatIds.includes(activeChatId)) {
          setActiveChatId(null);
        }
        setConfirmation(null);
        addToast(`已清除 ${selectedChatIds.length} 个聊天记录`, 'success');
      }
    });
  };

  // 如果需要密码验证且未认证，显示密码输入界面
  if (hasPassword && !isAuthenticated) {
    return <PasswordView onVerified={handleVerified} />;
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
    <div className="h-dvh-screen w-screen flex bg-[var(--bg-image)] text-[var(--text-color)] overflow-hidden fixed inset-0">
        <ToastContainer />
        
        {/* 移动端遮罩层已删除 - 通过侧边栏内的关闭按钮或汉堡按钮关闭 */}

          <div className="main-layout-container flex flex-1 h-full overflow-hidden relative">
          {/* 侧边栏 - 直接渲染，无额外容器 */}
          <Sidebar
            chats={chats}
            folders={folders}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onDeleteChat={chatDataHandlers.handleDeleteChat}
            onEditChat={uiState.setEditingChat}
            onArchiveChat={(id) => chatDataHandlers.handleArchiveChat(id, true)}
            onNewFolder={uiState.openNewFolder}
            onEditFolder={uiState.setEditingFolder}
            onDeleteFolder={chatDataHandlers.handleDeleteFolder}
            onMoveChatToFolder={chatDataHandlers.handleMoveChatToFolder}
            onOpenSettings={uiState.openSettings}
            onOpenPersonas={() => handleOpenView('personas')}
            onOpenArchive={() => handleOpenView('archive')}
            onSidebarStateChange={setSidebarState}
          >
            <UpdateIndicator
              updateAvailable={needRefresh}
              isCheckingUpdate={isCheckingUpdate}
              onClick={openUpdateSettings}
              versionInfo={versionInfo}
            />
          </Sidebar>

          {/* 聊天界面容器 */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
              <ViewContainer view="chat" activeView={currentView}>
                <ChatView
                  chatSession={activeChat}
                  personas={personas}
                  settings={settings}
                  isLoading={isLoading}
                  onCancelGeneration={handleCancel}
                  messageActions={{
                    onSendMessage: handleSendMessage,
                    onDeleteMessage: handleDeleteMessage,
                    onUpdateMessageContent: handleUpdateMessageContent,
                    onRegenerate: handleRegenerate,
                    onEditAndResubmit: handleEditAndResubmit,
                    onEditMessage: uiState.setEditingMessage,
                  }}
                  modelConfig={{
                    currentModel: settings.defaultModel,
                    availableModels: availableModels,
                    onSetCurrentModel: (model) => handleSettingsChange({ defaultModel: model }),
                    onSetModelForActiveChat: chatDataHandlers.handleSetModelForActiveChat,
                  }}
                  uiInteractions={{
                    isSidebarCollapsed: sidebarState.isCollapsed,
                    onToggleSidebar: () => {},
                    onToggleMobileSidebar: () => {},
                    onImageClick: uiState.setLightboxImage,
                    onShowCitations: uiState.setCitationChunks,
                  }}
                  chatManagement={{
                    onNewChat: handleNewChat,
                    onDeleteChat: chatDataHandlers.handleDeleteChat,
                    onEditChat: uiState.setEditingChat,
                  }}
                />
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
                  isSidebarCollapsed={sidebarState.isCollapsed}
                  onToggleSidebar={() => {}}
                  onToggleMobileSidebar={() => {}}
                />
              </ViewContainer>
              <ViewContainer view="archive" activeView={currentView}>
                <ArchiveView
                  chats={chats}
                  onSelectChat={handleSelectChat}
                  onUnarchiveChat={(id) => chatDataHandlers.handleArchiveChat(id, false)}
                  onDeleteChat={chatDataHandlers.handleDeleteChat}
                  onEditChat={uiState.setEditingChat}
                  onClose={() => setCurrentView('chat')}
                  isSidebarCollapsed={sidebarState.isCollapsed}
                  onToggleSidebar={() => {}}
                  onToggleMobileSidebar={() => {}}
                />
              </ViewContainer>
              <ViewContainer view="editor" activeView={currentView}>
                <PersonaEditor
                  personaToEdit={editingPersona}
                  settings={settings}
                  onSave={handleSavePersona}
                  onClose={() => setCurrentView('personas')}
                  availableModels={availableModels}
                />
              </ViewContainer>
            </Suspense>
        </div>

        <Suspense fallback={null}>
          {uiState.isSettingsOpen && <SettingsModal settings={settings} onClose={uiState.closeSettings} onSettingsChange={handleSettingsChange} onExportSettings={() => exportData({ settings })} onExportAll={() => exportData({ chats, folders, settings, personas: personas.filter(p => p && !p.isDefault) })} onExportSelectedChats={() => setShowChatExportSelector(true)} onImport={handleImport} onClearAll={handleClearAll} onClearChatHistory={handleClearChatHistory} availableModels={availableModels} personas={personas} versionInfo={versionInfo} />}
          {uiState.lightboxImage && <ImageLightbox src={uiState.lightboxImage} onClose={uiState.setLightboxImage.bind(null, null)} />}
          {confirmation && <ConfirmationModal {...confirmation} onClose={() => setConfirmation(null)} />}
        </Suspense>

        {/* These modals are small and frequently used, so they are not lazy-loaded */}
        {uiState.editingChat && <EditChatModal chat={uiState.editingChat} onClose={uiState.closeEditChat} onSave={chatDataHandlers.handleUpdateChatDetails} />}
        {uiState.editingFolder && <FolderActionModal folder={uiState.editingFolder === 'new' ? null : uiState.editingFolder} onClose={uiState.closeEditFolder} onSave={uiState.editingFolder === 'new' ? chatDataHandlers.handleNewFolder : chatDataHandlers.handleUpdateFolder} />}
        {uiState.citationChunks && <CitationDrawer chunks={uiState.citationChunks} onClose={uiState.closeCitations} />}
        {uiState.editingMessage && (
          <MessageEditModal
            message={uiState.editingMessage}
            onClose={uiState.closeEditMessage}
            onSave={(message, newContent) => {
              if (message.role === 'user') {
                handleEditAndResubmit(message.id, newContent);
              } else {
                handleUpdateMessageContent(message.id, newContent);
              }
              uiState.closeEditMessage();
            }}
          />
        )}

        {/* 更新设置模态框 */}
        {showUpdateSettings && (
          <UpdateSettings
            versionInfo={versionInfo}
            onClose={closeUpdateSettings}
            onCheckUpdate={handleCheckForUpdates}
            onUpdateNow={handleUpdateNow}
            isCheckingUpdate={isCheckingUpdate}
            updateAvailable={needRefresh}
            updateStatus={updateStatus}
          />
        )}

        {/* 聊天导出选择器 */}
        {showChatExportSelector && (
          <Suspense fallback={null}>
            <ChatExportSelector
              chats={chats}
              folders={folders}
              settings={settings}
              onClose={() => setShowChatExportSelector(false)}
            />
          </Suspense>
        )}

        {/* 聊天清除选择器 */}
        {showChatClearSelector && (
          <Suspense fallback={null}>
            <ChatClearSelector
              chats={chats}
              folders={folders}
              onClose={() => setShowChatClearSelector(false)}
              onClearSelected={handleClearSelectedChats}
            />
          </Suspense>
          )}
      </div>
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