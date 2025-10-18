import React, { lazy, Suspense } from 'react';
import { EditChatModal } from '../EditChatModal';
import { FolderActionModal } from '../FolderActionModal';
import { CitationDrawer } from '../CitationDrawer';
import { MessageEditModal } from '../MessageEditModal';
import { UpdateSettings } from '../settings/UpdateSettings';
import { UpdateNoticeModal } from '../UpdateNoticeModal';
import { ChatSession, Folder, Settings, Persona, Message } from '../../types';

// Lazy load heavy modals
const ImageLightbox = lazy(() => import('../ImageLightbox').then(module => ({ default: module.ImageLightbox })));
const SettingsModal = lazy(() => import('../settings/SettingsModal').then(module => ({ default: module.SettingsModal })));
const ConfirmationModal = lazy(() => import('../ConfirmationModal').then(module => ({ default: module.ConfirmationModal })));
const ChatExportSelector = lazy(() => import('../settings/ChatExportSelector').then(module => ({ default: module.ChatExportSelector })));
const ChatClearSelector = lazy(() => import('../ChatClearSelector').then(module => ({ default: module.ChatClearSelector })));

interface ModalManagerProps {
  // Settings Modal
  isSettingsOpen: boolean;
  settings: Settings;
  onCloseSettings: () => void;
  onSettingsChange: (settings: Partial<Settings>) => void;
  onExportSettings: () => void;
  onExportAll: () => void;
  onExportSelectedChats: () => void;
  onImport: (file: File) => void;
  onClearAll: () => void;
  onClearChatHistory: () => void;
  availableModels: string[];
  personas: Persona[];
  versionInfo: any;

  // Update Notice Modal
  showUpdateNotice: boolean;
  onCloseUpdateNotice: () => void;
  onDismissUpdateNotice: () => void;

  // Edit Chat Modal
  editingChat: ChatSession | null;
  onCloseEditChat: () => void;
  onSaveChatDetails: (id: string, title: string, folderId: string | null) => void;

  // Folder Action Modal
  editingFolder: Folder | 'new' | null;
  onCloseEditFolder: () => void;
  onNewFolder: (name: string) => void;
  onUpdateFolder: (id: string, name: string) => void;

  // Citation Drawer
  citationChunks: any[] | null;
  onCloseCitations: () => void;

  // Message Edit Modal
  editingMessage: Message | null;
  onCloseEditMessage: () => void;
  onEditAndResubmit: (messageId: string, newContent: string) => void;
  onUpdateMessageContent: (messageId: string, newContent: string) => void;

  // Lightbox
  lightboxImage: string | null;
  onCloseLightbox: () => void;

  // Confirmation Modal
  confirmation: { title: string; message: string; onConfirm: () => void } | null;
  onCloseConfirmation: () => void;

  // Update Settings Modal
  showUpdateSettings: boolean;
  onCloseUpdateSettings: () => void;
  onCheckUpdate: () => void;
  onUpdateNow: () => void;
  isCheckingUpdate: boolean;
  updateAvailable: boolean;
  updateStatus: string;

  // Chat Export Selector
  showChatExportSelector: boolean;
  onCloseChatExportSelector: () => void;
  chats: ChatSession[];
  folders: Folder[];

  // Chat Clear Selector
  showChatClearSelector: boolean;
  onCloseChatClearSelector: () => void;
  onClearSelectedChats: (chatIds: string[]) => void;
}

/**
 * ModalManager - Centralized modal rendering and management
 */
export const ModalManager: React.FC<ModalManagerProps> = ({
  isSettingsOpen,
  settings,
  onCloseSettings,
  onSettingsChange,
  onExportSettings,
  onExportAll,
  onExportSelectedChats,
  onImport,
  onClearAll,
  onClearChatHistory,
  availableModels,
  personas,
  versionInfo,
  showUpdateNotice,
  onCloseUpdateNotice,
  onDismissUpdateNotice,
  editingChat,
  onCloseEditChat,
  onSaveChatDetails,
  editingFolder,
  onCloseEditFolder,
  onNewFolder,
  onUpdateFolder,
  citationChunks,
  onCloseCitations,
  editingMessage,
  onCloseEditMessage,
  onEditAndResubmit,
  onUpdateMessageContent,
  lightboxImage,
  onCloseLightbox,
  confirmation,
  onCloseConfirmation,
  showUpdateSettings,
  onCloseUpdateSettings,
  onCheckUpdate,
  onUpdateNow,
  isCheckingUpdate,
  updateAvailable,
  updateStatus,
  showChatExportSelector,
  onCloseChatExportSelector,
  chats,
  folders,
  showChatClearSelector,
  onCloseChatClearSelector,
  onClearSelectedChats,
}) => {
  return (
    <>
      {/* Update Notice Modal - 重要更新通知 */}
      {showUpdateNotice && versionInfo && (
        <UpdateNoticeModal
          versionInfo={versionInfo}
          onClose={onCloseUpdateNotice}
          onDismiss={onDismissUpdateNotice}
        />
      )}

      {/* Lazy loaded modals */}
      <Suspense fallback={null}>
        {isSettingsOpen && (
          <SettingsModal
            settings={settings}
            onClose={onCloseSettings}
            onSettingsChange={onSettingsChange}
            onExportSettings={onExportSettings}
            onExportAll={onExportAll}
            onExportSelectedChats={onExportSelectedChats}
            onImport={onImport}
            onClearAll={onClearAll}
            onClearChatHistory={onClearChatHistory}
            availableModels={availableModels}
            personas={personas}
            versionInfo={versionInfo}
          />
        )}
        {lightboxImage && (
          <ImageLightbox
            src={lightboxImage}
            onClose={onCloseLightbox}
          />
        )}
        {confirmation && (
          <ConfirmationModal
            {...confirmation}
            onClose={onCloseConfirmation}
          />
        )}
        {showChatExportSelector && (
          <ChatExportSelector
            chats={chats}
            folders={folders}
            settings={settings}
            onClose={onCloseChatExportSelector}
          />
        )}
        {showChatClearSelector && (
          <ChatClearSelector
            chats={chats}
            folders={folders}
            onClose={onCloseChatClearSelector}
            onClearSelected={onClearSelectedChats}
          />
        )}
      </Suspense>

      {/* Frequently used modals - not lazy loaded */}
      {editingChat && (
        <EditChatModal
          chat={editingChat}
          onClose={onCloseEditChat}
          onSave={onSaveChatDetails}
        />
      )}
      {editingFolder && (
        <FolderActionModal
          folder={editingFolder === 'new' ? null : editingFolder}
          onClose={onCloseEditFolder}
          onSave={editingFolder === 'new' ? onNewFolder : onUpdateFolder}
        />
      )}
      {citationChunks && (
        <CitationDrawer
          chunks={citationChunks}
          onClose={onCloseCitations}
        />
      )}
      {editingMessage && (
        <MessageEditModal
          message={editingMessage}
          onClose={onCloseEditMessage}
          onSave={(message, newContent) => {
            if (message.role === 'user') {
              onEditAndResubmit(message.id, newContent);
            } else {
              onUpdateMessageContent(message.id, newContent);
            }
            onCloseEditMessage();
          }}
        />
      )}
      {showUpdateSettings && (
        <UpdateSettings
          versionInfo={versionInfo}
          onClose={onCloseUpdateSettings}
          onCheckUpdate={onCheckUpdate}
          onUpdateNow={onUpdateNow}
          isCheckingUpdate={isCheckingUpdate}
          updateAvailable={updateAvailable}
          updateStatus={updateStatus}
        />
      )}
    </>
  );
};
