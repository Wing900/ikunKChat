import React, { lazy, Suspense } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { ChatView } from '../ChatView';
import { ViewContainer } from '../common/ViewContainer';
import { UpdateIndicator } from '../UpdateIndicator';
import type { ChatSession, Folder, Persona, Settings } from '../../types';
import type { UIState } from '../../contexts/UIStateContext';
import type { AppView } from './appTypes';

const RolesView = lazy(() => import('../RolesView').then(module => ({ default: module.RolesView })));
const PersonaEditor = lazy(() => import('../persona/PersonaEditor').then(module => ({ default: module.PersonaEditor })));
const ArchiveView = lazy(() => import('../ArchiveView').then(module => ({ default: module.ArchiveView })));

interface ChatMessagingHandlers {
  isLoading: boolean;
  onSendMessage: (content: string, files?: File[]) => Promise<void>;
  onCancel: () => void;
  onDeleteMessage: (messageId: string) => void;
  onUpdateMessageContent: (messageId: string, content: string) => void;
  onRegenerate: () => void;
  onEditAndResubmit: (messageId: string, content: string) => void;
}

interface ChatDataHandlers {
  handleDeleteChat: (chatId: string) => void;
  handleMoveChatToFolder: (chatId: string, folderId: string | null) => void;
  handleArchiveChat: (chatId: string, archive: boolean) => void;
  handleUpdateChatDetails: (chatId: string, title: string) => void;
  handleNewFolder: (id: string, name: string, icon?: string) => void;
  handleUpdateFolder: (id: string, name: string, icon?: string) => void;
  handleDeleteFolder: (id: string) => void;
  handleSetModelForActiveChat: (model: string) => void;
}

interface UpdateControls {
  updateAvailable: boolean;
  isCheckingUpdate: boolean;
  onClick: () => void;
  versionInfo: any;
}

interface AppLayoutProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  chats: ChatSession[];
  folders: Folder[];
  personas: Persona[];
  settings: Settings;
  availableModels: string[];
  activeChat: ChatSession | null;
  activeChatId: string | null;
  chatMessaging: ChatMessagingHandlers;
  chatDataHandlers: ChatDataHandlers;
  uiState: UIState;
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;
  sidebarState: { isCollapsed: boolean };
  onSidebarStateChange: (state: { isCollapsed: boolean }) => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: (personaId?: string | null) => void;
  onOpenEditor: (persona: Persona | null) => void;
  onSavePersona: (persona: Persona) => void;
  onDeletePersona: (personaId: string) => void;
  editingPersona: Persona | null;
  rolesError: string | null;
  clearRolesError: () => void;
  updateControls: UpdateControls;
  onUpdateDefaultModel: (model: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onViewChange,
  chats,
  folders,
  personas,
  settings,
  availableModels,
  activeChat,
  activeChatId,
  chatMessaging,
  chatDataHandlers,
  uiState,
  isMobileSidebarOpen,
  toggleMobileSidebar,
  sidebarState,
  onSidebarStateChange,
  onSelectChat,
  onNewChat,
  onOpenEditor,
  onSavePersona,
  onDeletePersona,
  editingPersona,
  rolesError,
  clearRolesError,
  updateControls,
  onUpdateDefaultModel
}) => {
  return (
    <div className="main-layout-container flex flex-1 h-full overflow-hidden relative">
      <Sidebar
        chats={chats}
        folders={folders}
        activeChatId={activeChatId}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onSelectChat={onSelectChat}
        onDeleteChat={chatDataHandlers.handleDeleteChat}
        onEditChat={uiState.setEditingChat}
        onArchiveChat={(chatId) => chatDataHandlers.handleArchiveChat(chatId, true)}
        onNewFolder={uiState.openNewFolder}
        onEditFolder={uiState.setEditingFolder}
        onDeleteFolder={chatDataHandlers.handleDeleteFolder}
        onMoveChatToFolder={chatDataHandlers.handleMoveChatToFolder}
        onOpenSettings={uiState.openSettings}
        onOpenPersonas={() => onViewChange('personas')}
        onOpenArchive={() => onViewChange('archive')}
        onToggleMobileSidebar={toggleMobileSidebar}
        onSidebarStateChange={onSidebarStateChange}
      >
        <UpdateIndicator
          updateAvailable={updateControls.updateAvailable}
          isCheckingUpdate={updateControls.isCheckingUpdate}
          onClick={updateControls.onClick}
          versionInfo={updateControls.versionInfo}
        />
      </Sidebar>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
          <ViewContainer view="chat" activeView={currentView}>
            <ChatView
              chatSession={activeChat}
              personas={personas}
              settings={settings}
              isLoading={chatMessaging.isLoading}
              onCancelGeneration={chatMessaging.onCancel}
              messageActions={{
                onSendMessage: chatMessaging.onSendMessage,
                onDeleteMessage: chatMessaging.onDeleteMessage,
                onUpdateMessageContent: chatMessaging.onUpdateMessageContent,
                onRegenerate: chatMessaging.onRegenerate,
                onEditAndResubmit: chatMessaging.onEditAndResubmit,
                onEditMessage: uiState.setEditingMessage,
              }}
              modelConfig={{
                currentModel: settings.defaultModel,
                availableModels,
                onSetCurrentModel: onUpdateDefaultModel,
                onSetModelForActiveChat: chatDataHandlers.handleSetModelForActiveChat,
              }}
              uiInteractions={{
                isSidebarCollapsed: sidebarState.isCollapsed,
                onToggleSidebar: () => {},
                onToggleMobileSidebar: toggleMobileSidebar,
                onImageClick: uiState.setLightboxImage,
                onShowCitations: uiState.setCitationChunks,
              }}
              chatManagement={{
                onNewChat,
                onDeleteChat: chatDataHandlers.handleDeleteChat,
                onEditChat: uiState.setEditingChat,
              }}
            />
          </ViewContainer>

          <ViewContainer view="personas" activeView={currentView}>
            <RolesView
              personas={personas}
              onStartChat={(personaId) => onNewChat(personaId)}
              onEditPersona={(persona) => onOpenEditor(persona)}
              onCreatePersona={() => onOpenEditor(null)}
              onDeletePersona={onDeletePersona}
              onClose={() => onViewChange('chat')}
              error={rolesError || undefined}
              clearError={rolesError ? clearRolesError : undefined}
              isSidebarCollapsed={sidebarState.isCollapsed}
              onToggleSidebar={() => {}}
              onToggleMobileSidebar={toggleMobileSidebar}
            />
          </ViewContainer>

          <ViewContainer view="archive" activeView={currentView}>
            <ArchiveView
              chats={chats}
              onSelectChat={onSelectChat}
              onUnarchiveChat={(chatId) => chatDataHandlers.handleArchiveChat(chatId, false)}
              onDeleteChat={chatDataHandlers.handleDeleteChat}
              onEditChat={uiState.setEditingChat}
              onClose={() => onViewChange('chat')}
              isSidebarCollapsed={sidebarState.isCollapsed}
              onToggleSidebar={() => {}}
              onToggleMobileSidebar={toggleMobileSidebar}
            />
          </ViewContainer>

          <ViewContainer view="editor" activeView={currentView}>
            <PersonaEditor
              personaToEdit={editingPersona}
              settings={settings}
              onSave={onSavePersona}
              onClose={() => onViewChange('personas')}
              availableModels={availableModels}
            />
          </ViewContainer>
        </Suspense>
      </div>
    </div>
  );
};
