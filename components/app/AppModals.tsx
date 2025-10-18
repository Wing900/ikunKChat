import React, { lazy, Suspense } from 'react';
import type { ChatSession, Folder, Persona, Settings } from '../../types';
import type { UIState } from '../../contexts/UIStateContext';
import type { ConfirmationState } from './appTypes';
import type { UpdateStatus } from '../../hooks/usePWAUpdate';
import { UpdateSettings } from '../settings/UpdateSettings';
import { UpdateNoticeModal } from '../UpdateNoticeModal';
import { EditChatModal } from '../EditChatModal';
import { FolderActionModal } from '../FolderActionModal';
import { CitationDrawer } from '../CitationDrawer';
import { MessageEditModal } from '../MessageEditModal';

const SettingsModal = lazy(() => import('../settings/SettingsModal').then(module => ({ default: module.SettingsModal })));
const ImageLightbox = lazy(() => import('../ImageLightbox').then(module => ({ default: module.ImageLightbox })));
const ConfirmationModal = lazy(() => import('../ConfirmationModal').then(module => ({ default: module.ConfirmationModal })));
const ChatExportSelector = lazy(() => import('../settings/ChatExportSelector').then(module => ({ default: module.ChatExportSelector })));
const ChatClearSelector = lazy(() => import('../ChatClearSelector').then(module => ({ default: module.ChatClearSelector })));

interface UpdateDialogState {
  isChecking: boolean;
  updateAvailable: boolean;
  updateStatus: UpdateStatus;
}

interface AppModalsProps {
  uiState: UIState;
  settings: Settings;
  personas: Persona[];
  chats: ChatSession[];
  folders: Folder[];
  availableModels: string[];
  versionInfo: any;
  showUpdateNotice: boolean;
  onCloseUpdateNotice: () => void;
  onDismissUpdateNotice: () => void;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onExportSettings: () => void;
  onExportAll: () => void;
  onRequestExportSelectedChats: () => void;
  onImport: (file: File) => void;
  onClearAll: () => void;
  onRequestClearChatHistory: () => void;
  confirmation: ConfirmationState | null;
  onCloseConfirmation: () => void;
  showUpdateSettings: boolean;
  onCloseUpdateSettings: () => void;
  onCheckForUpdates: () => void;
  onUpdateNow: () => void;
  updateDialogState: UpdateDialogState;
  showChatExportSelector: boolean;
  onCloseChatExportSelector: () => void;
  showChatClearSelector: boolean;
  onCloseChatClearSelector: () => void;
  onClearSelectedChats: (chatIds: string[]) => void;
  handleUpdateChatDetails: (chatId: string, title: string) => void;
  handleNewFolder: (id: string, name: string, icon?: string) => void;
  handleUpdateFolder: (id: string, name: string, icon?: string) => void;
  handleEditAndResubmit: (messageId: string, content: string) => void;
  handleUpdateMessageContent: (messageId: string, content: string) => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  uiState,
  settings,
  personas,
  chats,
  folders,
  availableModels,
  versionInfo,
  showUpdateNotice,
  onCloseUpdateNotice,
  onDismissUpdateNotice,
  onSettingsChange,
  onExportSettings,
  onExportAll,
  onRequestExportSelectedChats,
  onImport,
  onClearAll,
  onRequestClearChatHistory,
  confirmation,
  onCloseConfirmation,
  showUpdateSettings,
  onCloseUpdateSettings,
  onCheckForUpdates,
  onUpdateNow,
  updateDialogState,
  showChatExportSelector,
  onCloseChatExportSelector,
  showChatClearSelector,
  onCloseChatClearSelector,
  onClearSelectedChats,
  handleUpdateChatDetails,
  handleNewFolder,
  handleUpdateFolder,
  handleEditAndResubmit,
  handleUpdateMessageContent
}) => {
  return (
    <>
      {/* 更新通知弹窗 */}
      {showUpdateNotice && versionInfo && (
        <UpdateNoticeModal
          versionInfo={versionInfo}
          onClose={onCloseUpdateNotice}
          onDismiss={onDismissUpdateNotice}
        />
      )}

      <Suspense fallback={null}>
        {uiState.isSettingsOpen && (
          <SettingsModal
            settings={settings}
            onClose={uiState.closeSettings}
            onSettingsChange={onSettingsChange}
            onExportSettings={onExportSettings}
            onExportAll={onExportAll}
            onExportSelectedChats={onRequestExportSelectedChats}
            onImport={onImport}
            onClearAll={onClearAll}
            onClearChatHistory={onRequestClearChatHistory}
            availableModels={availableModels}
            personas={personas}
            versionInfo={versionInfo}
          />
        )}
        {uiState.lightboxImage && (
          <ImageLightbox src={uiState.lightboxImage} onClose={() => uiState.setLightboxImage(null)} />
        )}
        {confirmation && (
          <ConfirmationModal
            {...confirmation}
            onClose={onCloseConfirmation}
          />
        )}
      </Suspense>

      {uiState.editingChat && (
        <EditChatModal
          chat={uiState.editingChat}
          onClose={uiState.closeEditChat}
          onSave={handleUpdateChatDetails}
        />
      )}

      {uiState.editingFolder && (
        <FolderActionModal
          folder={uiState.editingFolder === 'new' ? null : uiState.editingFolder}
          onClose={uiState.closeEditFolder}
          onSave={uiState.editingFolder === 'new' ? handleNewFolder : handleUpdateFolder}
        />
      )}

      {uiState.citationChunks && (
        <CitationDrawer chunks={uiState.citationChunks} onClose={uiState.closeCitations} />
      )}

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

      {showUpdateSettings && (
        <UpdateSettings
          versionInfo={versionInfo}
          onClose={onCloseUpdateSettings}
          onCheckUpdate={onCheckForUpdates}
          onUpdateNow={onUpdateNow}
          isCheckingUpdate={updateDialogState.isChecking}
          updateAvailable={updateDialogState.updateAvailable}
          updateStatus={updateDialogState.updateStatus}
        />
      )}

      {showChatExportSelector && (
        <Suspense fallback={null}>
          <ChatExportSelector
            chats={chats}
            folders={folders}
            settings={settings}
            onClose={onCloseChatExportSelector}
          />
        </Suspense>
      )}

      {showChatClearSelector && (
        <Suspense fallback={null}>
          <ChatClearSelector
            chats={chats}
            folders={folders}
            onClose={onCloseChatClearSelector}
            onClearSelected={onClearSelectedChats}
          />
        </Suspense>
      )}
    </>
  );
};
