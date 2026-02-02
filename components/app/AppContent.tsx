import React, { lazy, Suspense } from 'react';
import { ChatView } from '../ChatView';
import { ViewContainer } from '../common/ViewContainer';
import { ChatSession, Settings, Persona, Message } from '../../types';

// Lazy load views
const RolesView = lazy(() => import('../RolesView').then(module => ({ default: module.RolesView })));
const PersonaEditor = lazy(() => import('../persona/PersonaEditor').then(module => ({ default: module.PersonaEditor })));
const ArchiveView = lazy(() => import('../ArchiveView').then(module => ({ default: module.ArchiveView })));

type View = 'chat' | 'personas' | 'editor' | 'archive';

interface AppContentProps {
  currentView: View;
  activeChat: ChatSession | null;
  personas: Persona[];
  settings: Settings;
  availableModels: string[];
  chats: ChatSession[];
  
  // Chat view props
  isLoading: boolean;
  onCancelGeneration: () => void;
  onSendMessage: (content: string, attachments?: any[]) => void;
  onDeleteMessage: (messageId: string) => void;
  onUpdateMessageContent: (messageId: string, content: string) => void;
  onRegenerate: (messageId: string) => void;
  onEditAndResubmit: (messageId: string, content: string) => void;
  onEditMessage: (message: Message) => void;
  onSetCurrentModel: (model: string) => void;
  onSetModelForActiveChat: (model: string) => void;
  
  // UI interactions
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
  onImageClick: (src: string | null) => void;
  onShowCitations: (chunks: any[] | null) => void;
  
  // Chat management
  onNewChat: (personaId?: string | null) => void;
  onDeleteChat: (id: string) => void;
  onEditChat: (chat: ChatSession) => void;
  
  // Personas view props
  onStartChat: (personaId: string) => void;
  onEditPersona: (persona: Persona | null) => void;
  onCreatePersona: () => void;
  onDeletePersona: (id: string) => void;
  onClosePersonas: () => void;
  personasError: string | null;
  clearPersonasError: () => void;
  
  // Editor props
  editingPersona: Persona | null;
  onSavePersona: (persona: Persona) => void;
  onCloseEditor: () => void;
  
  // Archive view props
  onSelectChat: (id: string) => void;
  onUnarchiveChat: (id: string) => void;
  onCloseArchive: () => void;
}

/**
 * AppContent - Manages view switching and renders appropriate content
 */
export const AppContent: React.FC<AppContentProps> = ({
  currentView,
  activeChat,
  personas,
  settings,
  availableModels,
  chats,
  isLoading,
  onCancelGeneration,
  onSendMessage,
  onDeleteMessage,
  onUpdateMessageContent,
  onRegenerate,
  onEditAndResubmit,
  onEditMessage,
  onSetCurrentModel,
  onSetModelForActiveChat,
  isSidebarCollapsed,
  onToggleSidebar,
  onToggleMobileSidebar,
  onImageClick,
  onShowCitations,
  onNewChat,
  onDeleteChat,
  onEditChat,
  onStartChat,
  onEditPersona,
  onCreatePersona,
  onDeletePersona,
  onClosePersonas,
  personasError,
  clearPersonasError,
  editingPersona,
  onSavePersona,
  onCloseEditor,
  onSelectChat,
  onUnarchiveChat,
  onCloseArchive,
}) => {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
      <ViewContainer view="chat" activeView={currentView}>
        <ChatView
          chatSession={activeChat}
          personas={personas}
          settings={settings}
          isLoading={isLoading}
          onCancelGeneration={onCancelGeneration}
          messageActions={{
            onSendMessage,
            onDeleteMessage,
            onUpdateMessageContent,
            onRegenerate,
            onEditAndResubmit,
            onEditMessage,
          }}
          modelConfig={{
            currentModel: settings.lastSelectedModel ?? availableModels[0] ?? '',
            availableModels,
            onSetCurrentModel,
            onSetModelForActiveChat,
          }}
          uiInteractions={{
            isSidebarCollapsed,
            onToggleSidebar,
            onToggleMobileSidebar,
            onImageClick,
            onShowCitations,
          }}
          chatManagement={{
            onNewChat,
            onDeleteChat,
            onEditChat,
          }}
        />
      </ViewContainer>
      
      <ViewContainer view="personas" activeView={currentView}>
        <RolesView
          personas={personas}
          onStartChat={onStartChat}
          onEditPersona={onEditPersona}
          onCreatePersona={onCreatePersona}
          onDeletePersona={onDeletePersona}
          onClose={onClosePersonas}
          error={personasError}
          clearError={clearPersonasError}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
          onToggleMobileSidebar={onToggleMobileSidebar}
        />
      </ViewContainer>
      
      <ViewContainer view="archive" activeView={currentView}>
        <ArchiveView
          chats={chats}
          onSelectChat={onSelectChat}
          onUnarchiveChat={onUnarchiveChat}
          onDeleteChat={onDeleteChat}
          onEditChat={onEditChat}
          onClose={onCloseArchive}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={onToggleSidebar}
          onToggleMobileSidebar={onToggleMobileSidebar}
        />
      </ViewContainer>
      
      <ViewContainer view="editor" activeView={currentView}>
        <PersonaEditor
          personaToEdit={editingPersona}
          settings={settings}
          onSave={onSavePersona}
          onClose={onCloseEditor}
          availableModels={availableModels}
        />
      </ViewContainer>
    </Suspense>
  );
};
