import React, { lazy, Suspense } from 'react';
import { AppLayout } from './AppLayout';
import { AppContent } from './AppContent';
import { ModalManager } from './ModalManager';
import PasswordView from '../PasswordView';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { useAppInitialization } from '../../hooks/useAppInitialization';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useAppData } from '../../hooks/useAppData';
import { useAppUIManager } from '../../hooks/useAppUIManager';
import { useAppOperations } from '../../hooks/useAppOperations';
import { exportData, exportSelectedChats } from '../../services/storageService';

const PrivacyNoticeModal = lazy(() =>
  import('../PrivacyNoticeModal').then((module) => ({ default: module.PrivacyNoticeModal }))
);

/**
 * AppContainer - 主应用容器组件
 * 职责：业务逻辑协调和组件渲染
 * 优化后：使用拆分后的Hook，代码量从462行减少到约120行
 */
export const AppContainer: React.FC = () => {
  // 认证相关
  const { isAuthenticated, hasPassword, handleVerified } = useAuth();
  const { addToast } = useToast();

  // 应用初始化相关Hook
  const {
    hasConsented,
    handlePrivacyConsent,
    needRefresh,
    updateStatus,
    updateServiceWorker,
    checkForUpdates,
    showUpdateNotice,
    isCheckingUpdate,
    handleUpdateNow,
    handleCheckForUpdates,
    handleCloseUpdateNotice,
    handleDismissUpdateNotice,
    getLatestVersion
  } = useAppInitialization();

  // 设置管理Hook
  const {
    settings,
    setSettings,
    availableModels,
    isStorageLoaded,
    handleSettingsChange,
    validateAndUpdateDefaultPersona
  } = useAppSettings();

  // 数据管理Hook
  const {
    chats,
    setChats,
    folders,
    setFolders,
    activeChatId,
    setActiveChatId,
    activeChat,
    chatDataHandlers,
    personas,
    setPersonas,
    savePersonas,
    deletePersona,
    personasLoading,
    personasError,
    clearPersonasError,
    isLoading,
    handleSendMessage,
    handleCancel,
    handleDeleteMessage,
    handleUpdateMessageContent,
    handleRegenerate,
    handleEditAndResubmit,
    handleNewChat,
    handleSelectChat
  } = useAppData(settings, isStorageLoaded, handleSettingsChange, addToast);

  // UI管理Hook
  const {
    currentView,
    handleOpenView,
    handleOpenEditor,
    handleCloseEditor,
    editingPersona,
    setEditingPersona,
    isMobileSidebarOpen,
    toggleMobileSidebar,
    sidebarState,
    handleSidebarStateChange,
    handleToggleSidebar,
    confirmation,
    setConfirmation,
    handleCloseConfirmation,
    uiState
  } = useAppUIManager();

  // 操作Hook
  const {
    handleImport,
    handleClearAll,
    handleClearChatHistory,
    showChatExportSelector,
    showChatClearSelector,
    setShowChatExportSelector,
    setShowChatClearSelector,
    handleExportSelectedChats,
    handleClearSelectedChats
  } = useAppOperations();

  // 人格验证
  React.useEffect(() => {
    validateAndUpdateDefaultPersona(personas);
  }, [personas, validateAndUpdateDefaultPersona]);

  // 视图关闭处理
  const handleClosePersonas = () => {
    handleOpenView('chat');
    if (isMobileSidebarOpen) {
      toggleMobileSidebar();
    }
  };

  const handleCloseArchive = () => {
    handleOpenView('chat');
  };

  const handleSavePersona = (personaToSave: any) => {
    savePersonas(personaToSave);
    handleOpenView('personas');
  };

  // 从角色页面开始聊天：创建新聊天并自动跳转
  const handleStartChatFromPersonas = (personaId?: string | null) => {
    handleNewChat(personaId);
    handleOpenView('chat');
    if (isMobileSidebarOpen) {
      toggleMobileSidebar();
    }
  };

  // 认证检查
  if (hasPassword && !isAuthenticated) {
    return <PasswordView onVerified={handleVerified} />;
  }

  // 隐私同意检查
  if (!hasConsented) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <PrivacyNoticeModal onConfirm={handlePrivacyConsent} />
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
        onToggleSidebar={handleToggleSidebar}
        onToggleMobileSidebar={toggleMobileSidebar}
        onImageClick={uiState.setLightboxImage}
        onShowCitations={uiState.setCitationChunks}
        onNewChat={handleNewChat}
        onDeleteChat={chatDataHandlers.handleDeleteChat}
        onEditChat={uiState.setEditingChat}
        onStartChat={handleStartChatFromPersonas}
        onEditPersona={handleOpenEditor}
        onCreatePersona={() => handleOpenEditor(null)}
        onDeletePersona={deletePersona}
        onClosePersonas={handleClosePersonas}
        personasError={personasError}
        clearPersonasError={clearPersonasError}
        editingPersona={editingPersona}
        onSavePersona={handleSavePersona}
        onCloseEditor={handleCloseEditor}
        onSelectChat={handleSelectChat}
        onUnarchiveChat={(id) => chatDataHandlers.handleArchiveChat(id, false)}
        onCloseArchive={handleCloseArchive}
      />

      <ModalManager
        isSettingsOpen={uiState.isSettingsOpen}
        settings={settings}
        onCloseSettings={uiState.closeSettings}
        onSettingsChange={handleSettingsChange}
        onExportSettings={() => exportData({ settings })}
        onExportAll={() => exportData({ chats, folders, settings, personas: personas.filter((p) => p && !p.isDefault) })}
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
        onCloseConfirmation={handleCloseConfirmation}
        showChatExportSelector={showChatExportSelector}
        onCloseChatExportSelector={() => setShowChatExportSelector(false)}
        chats={chats}
        folders={folders}
        showChatClearSelector={showChatClearSelector}
        onCloseChatClearSelector={() => setShowChatClearSelector(false)}
        onClearSelectedChats={(selectedChatIds) => 
          handleClearSelectedChats(selectedChatIds, chats, activeChatId, setActiveChatId, setChats)
        }
        infoModal={uiState.infoModal}
        onCloseInfoModal={uiState.closeInfoModal}
        isOverQuotaModalOpen={uiState.isOverQuotaModalOpen}
        overQuotaMessage={uiState.overQuotaMessage}
        onCloseOverQuotaModal={uiState.hideOverQuotaModal}
      />
    </AppLayout>
  );
};
