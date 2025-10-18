import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PasswordView from '../PasswordView';
import { ToastContainer } from '../ToastContainer';
import { AppLayout } from './AppLayout';
import { AppModals } from './AppModals';
import { PrivacyConsentGate } from './PrivacyConsentGate';
import { usePWAUpdate } from '../../hooks/usePWAUpdate';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { initDB, migrateAttachmentsFromLocalStorage } from '../../services/indexedDBService';
import { useSettings } from '../../hooks/useSettings';
import { useChatData } from '../../hooks/useChatData';
import { useChatMessaging } from '../../hooks/useChatMessaging';
import { useToast } from '../../contexts/ToastContext';
import { useLocalization } from '../../contexts/LocalizationContext';
import { usePersonas } from '../../hooks/usePersonas';
import { useUIState } from '../../contexts/UIStateContext';
import { useErrorHandling } from '../../hooks/useErrorHandling';
import { exportData, importData, clearAllData, loadPrivacyConsent, savePrivacyConsent } from '../../services/storageService';
import type { ChatSession, Persona, Settings } from '../../types';
import type { AppView, ConfirmationState } from './appTypes';

const PRIVACY_STATEMENT_VERSION = '1.0.0';

export const AppContainer: React.FC = () => {
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [showUpdateSettings, setShowUpdateSettings] = useState(false);
  const [showChatExportSelector, setShowChatExportSelector] = useState(false);
  const [showChatClearSelector, setShowChatClearSelector] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('chat');
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [sidebarState, setSidebarState] = useState({ isCollapsed: false });
  const [hasConsented, setHasConsented] = useState(() => {
    const consent = loadPrivacyConsent();
    return consent?.consented && consent.version === PRIVACY_STATEMENT_VERSION;
  });

  const { needRefresh, updateStatus, updateServiceWorker, checkForUpdates } = usePWAUpdate();
  const { isAuthenticated, hasPassword, handleVerified } = useAuth();
  const { addToast } = useToast();
  const { t } = useLocalization();
  const { notifyError } = useErrorHandling({ context: 'App' });

  const { settings, setSettings, availableModels, isStorageLoaded } = useSettings();
  useTheme(settings, isStorageLoaded);

  const handleSettingsChange = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const {
    chats,
    setChats,
    folders,
    setFolders,
    activeChatId,
    setActiveChatId,
    handleDeleteChat,
    handleUpdateChatDetails,
    handleNewFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleMoveChatToFolder,
    handleSetModelForActiveChat,
    handleArchiveChat,
  } = useChatData({ settings, isStorageLoaded, onSettingsChange: handleSettingsChange });

  const chatDataHandlers = useMemo(() => ({
    handleDeleteChat,
    handleMoveChatToFolder,
    handleArchiveChat,
    handleUpdateChatDetails,
    handleNewFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleSetModelForActiveChat,
  }), [
    handleArchiveChat,
    handleDeleteChat,
    handleDeleteFolder,
    handleMoveChatToFolder,
    handleNewFolder,
    handleSetModelForActiveChat,
    handleUpdateChatDetails,
    handleUpdateFolder,
  ]);

  const { personas, setPersonas, savePersonas, deletePersona, loading, error, clearError } = usePersonas({ isStorageLoaded });

  const activeChat = useMemo(() => chats.find(c => c.id === activeChatId) || null, [chats, activeChatId]);

  const {
    isLoading: isGenerating,
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

  const uiState = useUIState();
  const { isMobileSidebarOpen, toggleMobileSidebar } = uiState;

  const personaIdsJson = useMemo(
    () => JSON.stringify(personas.map(p => p.id).sort()),
    [personas]
  );

  useEffect(() => {
    const initiateStorage = async () => {
      try {
        await initDB();
        const migratedCount = await migrateAttachmentsFromLocalStorage();
        if (migratedCount > 0) {
          console.log(`[IndexedDB] Migrated ${migratedCount} attachments from localStorage`);
        }
      } catch (error) {
        notifyError(error, { context: 'IndexedDB', showToast: false });
      }
    };

    initiateStorage();
  }, [notifyError]);

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const response = await fetch('/version.json');
        const data = await response.json();
        setVersionInfo(data);
      } catch (error) {
        notifyError(error, { context: 'VersionInfo', showToast: false });
      }
    };

    fetchVersionInfo();
  }, [notifyError]);

  useEffect(() => {
    if (personas.length > 0) {
      const currentDefaultPersonaId = settings.defaultPersona;
      const isDefaultValid = personas.some(p => p.id === currentDefaultPersonaId);

      if (!isDefaultValid) {
        const firstPersona = personas[0];
        if (firstPersona) {
          console.warn(`[Persona] Invalid defaultPersona: ${currentDefaultPersonaId}, resetting to first available`);
          handleSettingsChange({ defaultPersona: firstPersona.id });
        }
      }
    }
  }, [handleSettingsChange, personaIdsJson, personas, settings.defaultPersona]);

  const handleSidebarStateChange = useCallback((state: { isCollapsed: boolean }) => {
    setSidebarState({ isCollapsed: state.isCollapsed });
  }, []);

  const handleUpdateNow = useCallback(() => {
    updateServiceWorker();
  }, [updateServiceWorker]);

  const handleCheckForUpdates = useCallback(async () => {
    setIsCheckingUpdate(true);
    try {
      const result = await checkForUpdates();

      if (result.error) {
        notifyError(result.error, {
          context: 'UpdateCheck',
          userMessage: `检查更新失败: ${result.error}`,
        });
      } else if (result.hasUpdate) {
        const versionMessage = result.remoteVersion
          ? `发现新版本 ${result.remoteVersion}，请点击更新按钮`
          : '发现新版本，请点击更新按钮。';
        addToast(versionMessage, 'success');
      } else {
        addToast('当前已是最新版本', 'info');
      }
    } catch (error) {
      notifyError(error, { context: 'UpdateCheck', userMessage: '检查更新时发生错误' });
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [addToast, checkForUpdates, notifyError]);

  const openUpdateSettings = useCallback(() => {
    setShowUpdateSettings(true);
  }, []);

  const closeUpdateSettings = useCallback(() => {
    setShowUpdateSettings(false);
  }, []);

  const handleNewChat = useCallback((personaId?: string | null) => {
    if (loading) {
      addToast('角色数据正在加载，请稍后再试', 'info');
      return;
    }

    const selectedPersonaId = personaId ?? settings.defaultPersona;
    const persona = selectedPersonaId ? personas.find(p => p.id === selectedPersonaId) : null;

    if (persona) {
      const newChat: ChatSession = {
        id: crypto.randomUUID(),
        title: persona.name || 'New Persona Chat',
        messages: [],
        createdAt: Date.now(),
        model: persona.model ?? settings.defaultModel,
        folderId: null,
        personaId: persona.id,
      };

      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
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
  }, [
    addToast,
    isMobileSidebarOpen,
    loading,
    personas,
    setActiveChatId,
    setChats,
    settings.defaultModel,
    settings.defaultPersona,
    toggleMobileSidebar,
  ]);

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    setCurrentView('chat');
    if (isMobileSidebarOpen) {
      toggleMobileSidebar();
    }
  }, [isMobileSidebarOpen, setActiveChatId, toggleMobileSidebar]);

  const handleOpenView = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const handleOpenEditor = useCallback((persona: Persona | null) => {
    setEditingPersona(persona);
    setCurrentView('editor');
  }, []);

  const handleSavePersona = useCallback((personaToSave: Persona) => {
    savePersonas(personaToSave);
    setCurrentView('personas');
  }, [savePersonas]);

  const handleDeletePersona = useCallback((personaId: string) => {
    deletePersona(personaId);
  }, [deletePersona]);

  const handleImport = useCallback(async (file: File) => {
    try {
      const { settings: importedSettings, chats: importedChats, folders: importedFolders, personas: importedPersonas } = await importData(file);

      if (importedSettings) {
        handleSettingsChange(importedSettings);
      }
      if (importedChats) {
        setChats(importedChats);
      }
      if (importedFolders) {
        setFolders(importedFolders);
      }
      if (importedPersonas) {
        const existingPersonaIds = new Set(personas.map(p => p.id));
        const newPersonas = importedPersonas.filter(p => p && !existingPersonaIds.has(p.id));
        setPersonas(prev => [...prev.filter(p => p.isDefault), ...newPersonas]);
      }

      addToast('Import successful!', 'success');
    } catch (error) {
      notifyError(error, {
        context: 'Import',
        userMessage: 'Invalid backup file.',
      });
    }
  }, [addToast, handleSettingsChange, notifyError, personas, setChats, setFolders, setPersonas]);

  const handleClearAll = useCallback(() => {
    setConfirmation({
      title: t('clearHistory'),
      message: t('clearHistoryConfirm'),
      onConfirm: () => {
        clearAllData();
        setChats([]);
        setFolders([]);
        setPersonas(prev => prev.filter(p => p.isDefault));
        setActiveChatId(null);
        setConfirmation(null);
        addToast('All data cleared.', 'success');
      },
    });
  }, [addToast, setActiveChatId, setChats, setFolders, setPersonas, t]);

  const handleClearSelectedChats = useCallback((selectedChatIds: string[]) => {
    setConfirmation({
      title: '确认清除聊天记录',
      message: `确定要清除选中的 ${selectedChatIds.length} 个聊天记录吗？此操作无法撤销。归档的聊天不会被影响。`,
      onConfirm: () => {
        setChats(prev => prev.filter(chat => !selectedChatIds.includes(chat.id)));
        setConfirmation(null);
        if (activeChatId && selectedChatIds.includes(activeChatId)) {
          setActiveChatId(null);
        }
        addToast(`已清除 ${selectedChatIds.length} 个聊天记录`, 'success');
      },
    });
  }, [activeChatId, addToast, setActiveChatId, setChats]);

  const openChatExportSelector = useCallback(() => {
    setShowChatExportSelector(true);
  }, []);

  const closeChatExportSelector = useCallback(() => {
    setShowChatExportSelector(false);
  }, []);

  const openChatClearSelector = useCallback(() => {
    setShowChatClearSelector(true);
  }, []);

  const closeChatClearSelector = useCallback(() => {
    setShowChatClearSelector(false);
  }, []);

  const onCloseConfirmation = useCallback(() => {
    setConfirmation(null);
  }, []);

  const handleUpdateDefaultModel = useCallback((model: string) => {
    handleSettingsChange({ defaultModel: model });
  }, [handleSettingsChange]);

  const handleConsentConfirm = useCallback(() => {
    savePrivacyConsent(PRIVACY_STATEMENT_VERSION);
    setHasConsented(true);
  }, []);

  if (hasPassword && !isAuthenticated) {
    return <PasswordView onVerified={handleVerified} />;
  }

  if (!hasConsented) {
    return <PrivacyConsentGate onConfirm={handleConsentConfirm} />;
  }

  const updateControls = {
    updateAvailable: needRefresh,
    isCheckingUpdate,
    onClick: openUpdateSettings,
    versionInfo,
  };

  const chatMessagingHandlers = {
    isLoading: isGenerating,
    onSendMessage: handleSendMessage,
    onCancel: handleCancel,
    onDeleteMessage: handleDeleteMessage,
    onUpdateMessageContent: handleUpdateMessageContent,
    onRegenerate: handleRegenerate,
    onEditAndResubmit: handleEditAndResubmit,
  };

  const updateDialogState = {
    isChecking: isCheckingUpdate,
    updateAvailable: needRefresh,
    updateStatus,
  };

  const exportSettings = useCallback(() => {
    exportData({ settings });
  }, [settings]);

  const exportAllData = useCallback(() => {
    exportData({ chats, folders, settings, personas: personas.filter(p => !p.isDefault) });
  }, [chats, folders, personas, settings]);

  return (
    <div className="h-dvh-screen w-screen flex bg-[var(--bg-image)] text-[var(--text-color)] overflow-hidden fixed inset-0">
      <ToastContainer />

      <AppLayout
        currentView={currentView}
        onViewChange={handleOpenView}
        chats={chats}
        folders={folders}
        personas={personas}
        settings={settings}
        availableModels={availableModels}
        activeChat={activeChat}
        activeChatId={activeChatId}
        chatMessaging={chatMessagingHandlers}
        chatDataHandlers={chatDataHandlers}
        uiState={uiState}
        isMobileSidebarOpen={isMobileSidebarOpen}
        toggleMobileSidebar={toggleMobileSidebar}
        sidebarState={sidebarState}
        onSidebarStateChange={handleSidebarStateChange}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onOpenEditor={handleOpenEditor}
        onSavePersona={handleSavePersona}
        onDeletePersona={handleDeletePersona}
        editingPersona={editingPersona}
        rolesError={error ?? null}
        clearRolesError={clearError}
        updateControls={updateControls}
        onUpdateDefaultModel={handleUpdateDefaultModel}
      />

      <AppModals
        uiState={uiState}
        settings={settings}
        personas={personas}
        chats={chats}
        folders={folders}
        availableModels={availableModels}
        versionInfo={versionInfo}
        onSettingsChange={handleSettingsChange}
        onExportSettings={exportSettings}
        onExportAll={exportAllData}
        onRequestExportSelectedChats={openChatExportSelector}
        onImport={handleImport}
        onClearAll={handleClearAll}
        onRequestClearChatHistory={openChatClearSelector}
        confirmation={confirmation}
        onCloseConfirmation={onCloseConfirmation}
        showUpdateSettings={showUpdateSettings}
        onCloseUpdateSettings={closeUpdateSettings}
        onCheckForUpdates={handleCheckForUpdates}
        onUpdateNow={handleUpdateNow}
        updateDialogState={updateDialogState}
        showChatExportSelector={showChatExportSelector}
        onCloseChatExportSelector={closeChatExportSelector}
        showChatClearSelector={showChatClearSelector}
        onCloseChatClearSelector={closeChatClearSelector}
        onClearSelectedChats={handleClearSelectedChats}
        handleUpdateChatDetails={chatDataHandlers.handleUpdateChatDetails}
        handleNewFolder={chatDataHandlers.handleNewFolder}
        handleUpdateFolder={chatDataHandlers.handleUpdateFolder}
        handleEditAndResubmit={handleEditAndResubmit}
        handleUpdateMessageContent={handleUpdateMessageContent}
      />
    </div>
  );
};

export default AppContainer;
