import React, { useState, useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { AppLayout } from './AppLayout';
import { AppContent } from './AppContent';
import { ModalManager } from './ModalManager';
import PasswordView from '../PasswordView';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { initDB, migrateAttachmentsFromLocalStorage } from '../../services/indexedDBService';
import { ChatSession, Folder, Settings, Persona } from '../../types';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useSettings } from '../../hooks/useSettings';
import { useChatData } from '../../hooks/useChatData';
import { useChatMessaging } from '../../hooks/useChatMessaging';
import { useToast } from '../../contexts/ToastContext';
import { usePersonas } from '../../hooks/usePersonas';
import { useUIState } from '../../contexts/UIStateContext';
import { useUpdateService } from '../../services/updateService';
import {
  exportData,
  importData,
  clearAllData,
  loadPrivacyConsent,
  savePrivacyConsent,
  exportSelectedChats,
} from '../../services/storageService';

const PrivacyNoticeModal = lazy(() =>
  import('../PrivacyNoticeModal').then((module) => ({ default: module.PrivacyNoticeModal }))
);

type View = 'chat' | 'personas' | 'editor' | 'archive';

const PRIVACY_STATEMENT_VERSION = '1.0.0';

/**
 * AppContainer - Main application logic and state management
 * Extracted from App.tsx to separate concerns
 */
export const AppContainer: React.FC = () => {
  const [showChatExportSelector, setShowChatExportSelector] = useState(false);
  const [showChatClearSelector, setShowChatClearSelector] = useState(false);
  const [showUpdateNotice, setShowUpdateNotice] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const { needRefresh, updateStatus, updateServiceWorker, checkForUpdates } = usePWAUpdate();

  // 使用新的更新服务
  const {
    currentVersion,
    getLatestVersion,
    markVersionAsRead,
    dismissVersion,
    shouldShowUpdateNotice
  } = useUpdateService();

  const [hasConsented, setHasConsented] = useState(() => {
    const consent = loadPrivacyConsent();
    return consent?.consented && consent.version === PRIVACY_STATEMENT_VERSION;
  });

  const { isAuthenticated, hasPassword, handleVerified } = useAuth();
  const { settings, setSettings, availableModels, isStorageLoaded } = useSettings();
  
  useTheme(settings, isStorageLoaded);

  const handleSettingsChange = useCallback(
    (newSettings: Partial<Settings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [setSettings]
  );

  const { chats, setChats, folders, setFolders, activeChatId, setActiveChatId, ...chatDataHandlers } =
    useChatData({ settings, isStorageLoaded, onSettingsChange: handleSettingsChange });
  const { personas, setPersonas, savePersonas, deletePersona, loading, error, clearError } = usePersonas({
    isStorageLoaded,
  });
  const { addToast } = useToast();
  const { t } = useLocalization();
  
  const { isMobileSidebarOpen, toggleMobileSidebar, ...uiState } = useUIState();

  useEffect(() => {
    const initStorage = async () => {
      try {
        await initDB();
        await migrateAttachmentsFromLocalStorage();
      } catch (error) {
        // Silent fail
      }
    };
    initStorage();
  }, []);

  // 检查是否应该显示更新通知
  useEffect(() => {
    const shouldShow = shouldShowUpdateNotice();

    if (shouldShow) {
      const latestVersion = getLatestVersion();
      if (latestVersion) {
        setShowUpdateNotice(true);
      }
    }
  }, [shouldShowUpdateNotice, getLatestVersion]);

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
      addToast('检查更新时发生错误', 'error');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  // 处理更新通知关闭
  const handleCloseUpdateNotice = () => {
    const latestVersion = getLatestVersion();
    if (latestVersion) {
      markVersionAsRead(latestVersion.version);
    }
    setShowUpdateNotice(false);
  };

  // 处理忽略更新通知
  const handleDismissUpdateNotice = () => {
    const latestVersion = getLatestVersion();
    if (latestVersion) {
      dismissVersion(latestVersion.version);
    }
    setShowUpdateNotice(false);
  };
  
  const [currentView, setCurrentView] = useState<View>('chat');
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const {
    isLoading,
    handleSendMessage,
    handleCancel,
    handleDeleteMessage,
    handleUpdateMessageContent,
    handleRegenerate,
    handleEditAndResubmit,
  } = useChatMessaging({
    settings,
    activeChat,
    personas,
    setChats,
    setActiveChatId,
    addToast,
  });

  const [sidebarState, setSidebarState] = useState({ isCollapsed: false });
  
  const handleSidebarStateChange = useCallback((state: { isCollapsed: boolean }) => {
    setSidebarState({ isCollapsed: state.isCollapsed });
  }, []);

  const handleNewChat = useCallback(
    (personaId?: string | null) => {
      if (loading) {
        addToast('角色数据正在加载，请稍后再试', 'info');
        return;
      }

      const selectedPersonaId = personaId ?? settings.defaultPersona;
      const persona = selectedPersonaId ? personas.find((p) => p && p.id === selectedPersonaId) : null;

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
        setChats((prev) => [newChatSession, ...prev]);
        setActiveChatId(newChatSession.id);
      } else {
        setActiveChatId(null);
        if (personas.length === 0) {
          addToast('角色列表正在加载中，请稍后再试', 'info');
        } else {
          addToast('未找到默认角色，请先在设置中配置一个角色', 'info');
        }
      }

      setCurrentView('chat');
      if (isMobileSidebarOpen) {
        toggleMobileSidebar();
      }
    },
    [
      settings.defaultPersona,
      settings.defaultModel,
      personas,
      setChats,
      setActiveChatId,
      addToast,
      loading,
      isMobileSidebarOpen,
      toggleMobileSidebar,
    ]
  );

  const personaIdsJson = useMemo(() => JSON.stringify(personas.map((p) => p.id).sort()), [personas]);

  useEffect(() => {
    if (personas.length > 0) {
      const currentDefaultPersonaId = settings.defaultPersona;
      const isDefaultPersonaValid = personas.some((p) => p.id === currentDefaultPersonaId);

      if (!isDefaultPersonaValid) {
        const firstAvailablePersona = personas[0];
        if (firstAvailablePersona) {
          handleSettingsChange({ defaultPersona: firstAvailablePersona.id });
        }
      }
    }
  }, [personaIdsJson, settings.defaultPersona, handleSettingsChange]);

  const handleSelectChat = useCallback(
    (id: string) => {
      setActiveChatId(id);
      setCurrentView('chat');
      if (isMobileSidebarOpen) {
        toggleMobileSidebar();
      }
    },
    [setActiveChatId, isMobileSidebarOpen, toggleMobileSidebar]
  );
  
  const handleOpenView = (view: View) => setCurrentView(view);
  const handleOpenEditor = (persona: Persona | null) => {
    setEditingPersona(persona);
    setCurrentView('editor');
  };
  const handleSavePersona = (personaToSave: Persona) => {
    savePersonas(personaToSave);
    setCurrentView('personas');
  };
  const handleDeletePersona = (id: string) => {
    deletePersona(id);
  };

  const handleImport = (file: File) => {
    importData(file)
      .then(({ settings, chats, folders, personas: importedPersonas }) => {
        if (settings) handleSettingsChange(settings);
        if (chats) setChats(chats);
        if (folders) setFolders(folders);
        if (importedPersonas) {
          const existingPersonaIds = new Set(personas.map((p) => p && p.id).filter(Boolean));
          const newPersonas = importedPersonas.filter((p) => p && !existingPersonaIds.has(p.id));
          setPersonas((p) => [...p.filter((p) => p && p.isDefault), ...newPersonas]);
        }
        addToast('Import successful!', 'success');
      })
      .catch((err) => {
        addToast('Invalid backup file.', 'error');
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
        setPersonas((p) => p.filter((p) => p && p.isDefault));
        setActiveChatId(null);
        setConfirmation(null);
        addToast('All data cleared.', 'success');
      },
    });
  };

  const handleClearChatHistory = () => {
    setShowChatClearSelector(true);
  };

  const handleExportSelectedChats = (selectedChatIds: string[]) => {
    exportSelectedChats(selectedChatIds, chats);
    setShowChatExportSelector(false);
    addToast('Selected chats exported successfully', 'success');
  };

  const handleClearSelectedChats = (selectedChatIds: string[]) => {
    setConfirmation({
      title: '确认清除聊天记录',
      message: `确定要清除选中的 ${selectedChatIds.length} 个聊天记录吗？此操作无法撤销。归档的聊天不会被影响。`,
      onConfirm: () => {
        setChats((prev) => prev.filter((chat) => !selectedChatIds.includes(chat.id)));
        if (activeChatId && selectedChatIds.includes(activeChatId)) {
          setActiveChatId(null);
        }
        setConfirmation(null);
        addToast(`已清除 ${selectedChatIds.length} 个聊天记录`, 'success');
      },
    });
  };

  if (hasPassword && !isAuthenticated) {
    return <PasswordView onVerified={handleVerified} />;
  }

  if (!hasConsented) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <PrivacyNoticeModal
          onConfirm={() => {
            savePrivacyConsent(PRIVACY_STATEMENT_VERSION);
            setHasConsented(true);
          }}
        />
      </Suspense>
    );
  }
  
  return (
    <AppLayout
      chats={chats}
      folders={folders}
      activeChatId={activeChatId}
      isMobileSidebarOpen={isMobileSidebarOpen}
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
      onToggleMobileSidebar={toggleMobileSidebar}
      onSidebarStateChange={handleSidebarStateChange}
      updateAvailable={needRefresh}
      isCheckingUpdate={isCheckingUpdate}
      onCheckForUpdates={handleCheckForUpdates}
      onUpdateNow={handleUpdateNow}
      versionInfo={getLatestVersion()}
    >
      <AppContent
        currentView={currentView}
        activeChat={activeChat}
        personas={personas}
        settings={settings}
        availableModels={availableModels}
        chats={chats}
        isLoading={isLoading}
        onCancelGeneration={handleCancel}
        onSendMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        onUpdateMessageContent={handleUpdateMessageContent}
        onRegenerate={handleRegenerate}
        onEditAndResubmit={handleEditAndResubmit}
        onEditMessage={uiState.setEditingMessage}
        onSetCurrentModel={(model) => handleSettingsChange({ defaultModel: model })}
        onSetModelForActiveChat={chatDataHandlers.handleSetModelForActiveChat}
        isSidebarCollapsed={sidebarState.isCollapsed}
        onToggleMobileSidebar={toggleMobileSidebar}
        onImageClick={uiState.setLightboxImage}
        onShowCitations={uiState.setCitationChunks}
        onNewChat={handleNewChat}
        onDeleteChat={chatDataHandlers.handleDeleteChat}
        onEditChat={uiState.setEditingChat}
        onStartChat={handleNewChat}
        onEditPersona={handleOpenEditor}
        onCreatePersona={() => handleOpenEditor(null)}
        onDeletePersona={handleDeletePersona}
        onClosePersonas={() => setCurrentView('chat')}
        personasError={error}
        clearPersonasError={clearError}
        editingPersona={editingPersona}
        onSavePersona={handleSavePersona}
        onCloseEditor={() => setCurrentView('personas')}
        onSelectChat={handleSelectChat}
        onUnarchiveChat={(id) => chatDataHandlers.handleArchiveChat(id, false)}
        onCloseArchive={() => setCurrentView('chat')}
      />

      <ModalManager
        isSettingsOpen={uiState.isSettingsOpen}
        settings={settings}
        onCloseSettings={uiState.closeSettings}
        onSettingsChange={handleSettingsChange}
        onExportSettings={() => exportData({ settings })}
        onExportAll={() =>
          exportData({ chats, folders, settings, personas: personas.filter((p) => p && !p.isDefault) })
        }
        onExportSelectedChats={() => setShowChatExportSelector(true)}
        onImport={handleImport}
        onClearAll={handleClearAll}
        onClearChatHistory={handleClearChatHistory}
        availableModels={availableModels}
        personas={personas}
        versionInfo={getLatestVersion()}
        showUpdateNotice={showUpdateNotice}
        onCloseUpdateNotice={handleCloseUpdateNotice}
        onDismissUpdateNotice={handleDismissUpdateNotice}
        editingChat={uiState.editingChat}
        onCloseEditChat={uiState.closeEditChat}
        onSaveChatDetails={chatDataHandlers.handleUpdateChatDetails}
        editingFolder={uiState.editingFolder}
        onCloseEditFolder={uiState.closeEditFolder}
        onNewFolder={chatDataHandlers.handleNewFolder}
        onUpdateFolder={chatDataHandlers.handleUpdateFolder}
        citationChunks={uiState.citationChunks}
        onCloseCitations={uiState.closeCitations}
        editingMessage={uiState.editingMessage}
        onCloseEditMessage={uiState.closeEditMessage}
        onEditAndResubmit={handleEditAndResubmit}
        onUpdateMessageContent={handleUpdateMessageContent}
        lightboxImage={uiState.lightboxImage}
        onCloseLightbox={() => uiState.setLightboxImage(null)}
        confirmation={confirmation}
        onCloseConfirmation={() => setConfirmation(null)}

        showChatExportSelector={showChatExportSelector}
        onCloseChatExportSelector={() => setShowChatExportSelector(false)}
        chats={chats}
        folders={folders}
        showChatClearSelector={showChatClearSelector}
        onCloseChatClearSelector={() => setShowChatClearSelector(false)}
        onClearSelectedChats={handleClearSelectedChats}
      />
    </AppLayout>
  );
};
