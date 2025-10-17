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
import { generateMd3Palette } from './utils/colorUtils';
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
import { getColorPalette, getDefaultColorPalette } from './data/colorPalettes';
import { useSettings } from './hooks/useSettings';
import { useChatData } from './hooks/useChatData';
import { useChatMessaging } from './hooks/useChatMessaging';
import { useToast } from './contexts/ToastContext';
import { usePersonas } from './hooks/usePersonas';
import { usePersonaMemories } from './hooks/usePersonaMemories';
import { exportData, importData, clearAllData, clearChatHistory, loadPrivacyConsent, savePrivacyConsent, loadLastReadVersion, saveLastReadVersion, exportSelectedChats } from './services/storageService';
import { authService } from './services/authService';
import { ViewContainer } from './components/common/ViewContainer';
import { MessageEditModal } from './components/MessageEditModal';

type View = 'chat' | 'personas' | 'editor' | 'archive';

const AppContainer = () => {
  const PRIVACY_STATEMENT_VERSION = '1.0.0'; // 声明版本号

  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [showUpdateSettings, setShowUpdateSettings] = useState(false);
  const [showChatExportSelector, setShowChatExportSelector] = useState(false);
  const [showChatClearSelector, setShowChatClearSelector] = useState(false);
  const { needRefresh, updateServiceWorker } = usePWAUpdate();

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

  // 应用调色板到CSS变量
  useLayoutEffect(() => {
    const applyColorPalette = () => {
      const isDark = settings.theme.includes('dark');
      
      // 如果有自定义颜色，使用 MD3 生成完整调色板
      if (settings.customColor) {
        try {
          const md3Palette = generateMd3Palette(settings.customColor);
          const colorScheme = isDark ? md3Palette.dark : md3Palette.light;
          
          // 应用所有生成的颜色
          Object.entries(colorScheme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
          });
          
          // 额外设置 dynamic 变量以覆盖默认值
          document.documentElement.style.setProperty('--dynamic-primary', colorScheme['--md-sys-color-primary']);
          document.documentElement.style.setProperty('--dynamic-on-primary', colorScheme['--md-sys-color-on-primary']);
          document.documentElement.style.setProperty('--dynamic-surface', colorScheme['--md-sys-color-surface']);
          document.documentElement.style.setProperty('--dynamic-on-surface', colorScheme['--md-sys-color-on-surface']);
          document.documentElement.style.setProperty('--dynamic-on-surface-variant', colorScheme['--md-sys-color-on-surface-variant']);
          document.documentElement.style.setProperty('--dynamic-outline-variant', colorScheme['--md-sys-color-outline-variant']);
          document.documentElement.style.setProperty('--dynamic-surface-container', colorScheme['--md-sys-color-surface-variant']);
          document.documentElement.style.setProperty('--dynamic-on-surface-container', colorScheme['--md-sys-color-on-surface-variant']);
          document.documentElement.style.setProperty('--dynamic-error', colorScheme['--md-sys-color-error']);
          document.documentElement.style.setProperty('--dynamic-glass-bg', colorScheme['--glass-bg']);
          document.documentElement.style.setProperty('--dynamic-code-bg', colorScheme['--code-bg']);
          document.documentElement.style.setProperty('--dynamic-user-bubble-bg', colorScheme['--user-bubble-bg']);
          return;
        } catch (error) {
          console.error('[Color] Failed to generate MD3 palette:', error);
        }
      }
      
      // 使用预设调色板
      const paletteId = settings.colorPalette || 'blue';
      const palette = getColorPalette(paletteId) || getDefaultColorPalette();
      
      if (isDark) {
        document.documentElement.style.setProperty('--dynamic-primary', palette.primaryDark);
        document.documentElement.style.setProperty('--dynamic-on-primary', palette.onPrimaryDark);
        document.documentElement.style.setProperty('--dynamic-surface', palette.surfaceDark);
        document.documentElement.style.setProperty('--dynamic-on-surface', palette.onSurfaceDark);
        document.documentElement.style.setProperty('--dynamic-on-surface-variant', palette.onSurfaceVariantDark);
        document.documentElement.style.setProperty('--dynamic-outline-variant', palette.outlineVariantDark);
        document.documentElement.style.setProperty('--dynamic-surface-container', palette.surfaceContainerDark);
        document.documentElement.style.setProperty('--dynamic-on-surface-container', palette.onSurfaceContainerDark);
        document.documentElement.style.setProperty('--dynamic-error', palette.errorDark);
        document.documentElement.style.setProperty('--dynamic-glass-bg', palette.glassBgDark);
        document.documentElement.style.setProperty('--dynamic-code-bg', palette.codeBgDark);
        document.documentElement.style.setProperty('--dynamic-user-bubble-bg', palette.userBubbleBgDark);
      } else {
        document.documentElement.style.setProperty('--dynamic-primary', palette.primaryLight);
        document.documentElement.style.setProperty('--dynamic-on-primary', palette.onPrimaryLight);
        document.documentElement.style.setProperty('--dynamic-surface', palette.surfaceLight);
        document.documentElement.style.setProperty('--dynamic-on-surface', palette.onSurfaceLight);
        document.documentElement.style.setProperty('--dynamic-on-surface-variant', palette.onSurfaceVariantLight);
        document.documentElement.style.setProperty('--dynamic-outline-variant', palette.outlineVariantLight);
        document.documentElement.style.setProperty('--dynamic-surface-container', palette.surfaceContainerLight);
        document.documentElement.style.setProperty('--dynamic-on-surface-container', palette.onSurfaceContainerLight);
        document.documentElement.style.setProperty('--dynamic-error', palette.errorLight);
        document.documentElement.style.setProperty('--dynamic-glass-bg', palette.glassBgLight);
        document.documentElement.style.setProperty('--dynamic-code-bg', palette.codeBgLight);
        document.documentElement.style.setProperty('--dynamic-user-bubble-bg', palette.userBubbleBgLight);
      }
    };

    if (isStorageLoaded) {
      applyColorPalette();
    }
  }, [settings.theme, settings.colorPalette, settings.customColor, isStorageLoaded]);

  const handleSettingsChange = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const { chats, setChats, folders, setFolders, activeChatId, setActiveChatId, ...chatDataHandlers } = useChatData({ settings, isStorageLoaded, onSettingsChange: handleSettingsChange });
  const { personas, setPersonas, savePersonas, deletePersona, loading, error, clearError } = usePersonas({ isStorageLoaded });
  const { memories, getMemoriesForPersona, addMemory, updateMemory, deleteMemory } = usePersonaMemories({ isStorageLoaded });
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
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        try {
          await registration.update();
          addToast('正在检查更新...', 'info');
          // In dev mode, onNeedRefresh might not fire reliably.
          // We can add a timeout to check if needRefresh becomes true.
          // If not, we can inform the user.
          setTimeout(() => {
            if (!needRefresh) {
              addToast('当前已是最新版本', 'info');
            }
          }, 3000); // Wait 3 seconds to see if needRefresh is triggered
        } catch (error) {
          console.error('[Update] Check failed:', error);
          addToast('检查更新失败', 'error');
        }
      } else {
        addToast('Service Worker 未注册', 'error');
      }
    } else {
      addToast('浏览器不支持 Service Worker', 'error');
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
    setActiveChatId, addToast,
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
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  

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
    setIsMobileSidebarOpen(false);
    setCurrentView('chat');
  }, [settings.defaultPersona, settings.defaultModel, personas, isNextChatStudyMode, setChats, setActiveChatId, setIsNextChatStudyMode, addToast, loading]);

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

const handleSelectChat = useCallback((id: string) => { setActiveChatId(id); setIsMobileSidebarOpen(false); setCurrentView('chat'); }, [setActiveChatId]);
  
  const handleNewChatSidebar = useCallback(() => {
    handleNewChat(null);
  }, [handleNewChat]);
  
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
    <div className="h-dvh-screen w-screen flex bg-[var(--bg-image)] text-[var(--text-color)] overflow-hidden fixed inset-0">
        <ToastContainer />
        
        {/* 移动端遮罩层已删除 - 通过侧边栏内的关闭按钮或汉堡按钮关闭 */}

          <div className="main-layout-container flex flex-1 h-full overflow-hidden relative">
          {/* 侧边栏 - 直接渲染，无额外容器 */}
          <Sidebar
            chats={chats}
            folders={folders}
            activeChatId={activeChatId}
            onNewChat={handleNewChatSidebar}
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
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(p => !p)}
            searchQuery={searchQuery}
            onSetSearchQuery={setSearchQuery}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenPersonas={() => handleOpenView('personas')}
            onOpenArchive={() => handleOpenView('archive')}
          >
            <UpdateIndicator
              updateAvailable={needRefresh}
              isCheckingUpdate={false}
              onClick={openUpdateSettings}
              versionInfo={versionInfo}
            />
          </Sidebar>

          {/* 聊天界面容器 */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
              <ViewContainer view="chat" activeView={currentView}>
                <ChatView chatSession={activeChat} personas={personas} onSendMessage={handleSendMessage} isLoading={isLoading} onCancelGeneration={handleCancel} currentModel={settings.defaultModel} onSetCurrentModel={(model) => handleSettingsChange({ defaultModel: model })} onSetModelForActiveChat={chatDataHandlers.handleSetModelForActiveChat} availableModels={availableModels} isSidebarCollapsed={isSidebarCollapsed} onToggleSidebar={() => setIsSidebarCollapsed(p => !p)} onToggleMobileSidebar={() => setIsMobileSidebarOpen(p => !p)} onNewChat={handleNewChat} onImageClick={setLightboxImage} settings={settings} onDeleteMessage={handleDeleteMessage} onUpdateMessageContent={handleUpdateMessageContent} onRegenerate={handleRegenerate} onEditAndResubmit={handleEditAndResubmit} onShowCitations={setCitationChunks} onDeleteChat={chatDataHandlers.handleDeleteChat} onEditChat={setEditingChat} onToggleStudyMode={chatDataHandlers.handleToggleStudyMode} isNextChatStudyMode={isNextChatStudyMode} onToggleNextChatStudyMode={setIsNextChatStudyMode} onEditMessage={setEditingMessage} />
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
                  isSidebarCollapsed={isSidebarCollapsed}
                  onToggleSidebar={() => setIsSidebarCollapsed(p => !p)}
                  onToggleMobileSidebar={() => setIsMobileSidebarOpen(p => !p)}
                />
              </ViewContainer>
              <ViewContainer view="archive" activeView={currentView}>
                <ArchiveView
                  chats={chats}
                  onSelectChat={handleSelectChat}
                  onUnarchiveChat={(id) => chatDataHandlers.handleArchiveChat(id, false)}
                  onDeleteChat={chatDataHandlers.handleDeleteChat}
                  onEditChat={setEditingChat}
                  onClose={() => setCurrentView('chat')}
                  isSidebarCollapsed={isSidebarCollapsed}
                  onToggleSidebar={() => setIsSidebarCollapsed(p => !p)}
                  onToggleMobileSidebar={() => setIsMobileSidebarOpen(p => !p)}
                />
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
            </Suspense>
        </div>

        <Suspense fallback={null}>
          {isSettingsOpen && <SettingsModal settings={settings} onClose={() => setIsSettingsOpen(false)} onSettingsChange={handleSettingsChange} onExportSettings={() => exportData({ settings })} onExportAll={() => exportData({ chats, folders, settings, personas: personas.filter(p => p && !p.isDefault), memories })} onExportSelectedChats={() => setShowChatExportSelector(true)} onImport={handleImport} onClearAll={handleClearAll} onClearChatHistory={handleClearChatHistory} availableModels={availableModels} personas={personas} versionInfo={versionInfo} />}
          {lightboxImage && <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}
          {confirmation && <ConfirmationModal {...confirmation} onClose={() => setConfirmation(null)} />}
        </Suspense>

        {/* These modals are small and frequently used, so they are not lazy-loaded */}
        {editingChat && <EditChatModal chat={editingChat} onClose={() => setEditingChat(null)} onSave={chatDataHandlers.handleUpdateChatDetails} />}
        {editingFolder && <FolderActionModal folder={editingFolder === 'new' ? null : editingFolder} onClose={() => setEditingFolder(null)} onSave={editingFolder === 'new' ? chatDataHandlers.handleNewFolder : chatDataHandlers.handleUpdateFolder} />}
        {citationChunks && <CitationDrawer chunks={citationChunks} onClose={() => setCitationChunks(null)} />}
        {editingMessage && (
          <MessageEditModal
            message={editingMessage}
            onClose={() => setEditingMessage(null)}
            onSave={(message, newContent) => {
              if (message.role === 'user') {
                handleEditAndResubmit(message.id, newContent);
              } else {
                handleUpdateMessageContent(message.id, newContent);
              }
              setEditingMessage(null);
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
            isCheckingUpdate={false} // No longer needed
            updateAvailable={needRefresh}
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