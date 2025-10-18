import React from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import { UpdateIndicator } from '../UpdateIndicator';
import { ToastContainer } from '../ToastContainer';
import { ChatSession, Folder } from '../../types';

interface AppLayoutProps {
  // Sidebar props
  chats: ChatSession[];
  folders: Folder[];
  activeChatId: string | null;
  isMobileSidebarOpen: boolean;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onEditChat: (chat: ChatSession) => void;
  onArchiveChat: (id: string) => void;
  onNewFolder: () => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (id: string) => void;
  onMoveChatToFolder: (chatId: string, folderId: string | null) => void;
  onOpenSettings: () => void;
  onOpenPersonas: () => void;
  onOpenArchive: () => void;
  onToggleMobileSidebar: () => void;
  onSidebarStateChange: (state: { isCollapsed: boolean }) => void;

  // Update props
  updateAvailable: boolean;
  isCheckingUpdate: boolean;
  onCheckForUpdates: () => void;
  onUpdateNow: () => void;
  versionInfo: any;

  // Content
  children: React.ReactNode;
}

/**
 * AppLayout - Main application layout with sidebar and content area
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  chats,
  folders,
  activeChatId,
  isMobileSidebarOpen,
  onSelectChat,
  onDeleteChat,
  onEditChat,
  onArchiveChat,
  onNewFolder,
  onEditFolder,
  onDeleteFolder,
  onMoveChatToFolder,
  onOpenSettings,
  onOpenPersonas,
  onOpenArchive,
  onToggleMobileSidebar,
  onSidebarStateChange,

  updateAvailable,
  isCheckingUpdate,
  onCheckForUpdates,
  onUpdateNow,
  versionInfo,
  children,
}) => {
  return (
    <div className="h-dvh-screen w-screen flex bg-[var(--bg-image)] text-[var(--text-color)] overflow-hidden fixed inset-0">
      <ToastContainer />
      
      <div className="main-layout-container flex flex-1 h-full overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          chats={chats}
          folders={folders}
          activeChatId={activeChatId}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onSelectChat={onSelectChat}
          onDeleteChat={onDeleteChat}
          onEditChat={onEditChat}
          onArchiveChat={onArchiveChat}
          onNewFolder={onNewFolder}
          onEditFolder={onEditFolder}
          onDeleteFolder={onDeleteFolder}
          onMoveChatToFolder={onMoveChatToFolder}
          onOpenSettings={onOpenSettings}
          onOpenPersonas={onOpenPersonas}
          onOpenArchive={onOpenArchive}
          onToggleMobileSidebar={onToggleMobileSidebar}
          onSidebarStateChange={onSidebarStateChange}
        >
          <UpdateIndicator
            updateAvailable={updateAvailable}
            isCheckingUpdate={isCheckingUpdate}
            onClick={onCheckForUpdates}
            versionInfo={versionInfo}
          />
        </Sidebar>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};
