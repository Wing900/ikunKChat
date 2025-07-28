import React, { useState, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { EditChatModal } from './components/EditChatModal';
import { FolderActionModal } from './components/FolderActionModal';
import { ImageLightbox } from './components/ImageLightbox';
import { SettingsModal } from './components/SettingsModal';
import { CitationDrawer } from './components/CitationDrawer';
import { ChatSession, Folder, Settings } from './types';
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';
import { useSettings } from './hooks/useSettings';
import { useChatData } from './hooks/useChatData';
import { useChatMessaging } from './hooks/useChatMessaging';
import { exportData, importData, clearAllData } from './services/storageService';

const AppContainer = () => {
  const { settings, setSettings, availableModels, isStorageLoaded } = useSettings();
  const { chats, setChats, folders, setFolders, activeChatId, setActiveChatId, ...chatDataHandlers } = useChatData({ settings, isStorageLoaded });
  
  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const { 
    isLoading, handleSendMessage, handleCancel, handleDeleteMessage, 
    handleUpdateMessageContent, handleRegenerate, handleEditAndResubmit 
  } = useChatMessaging({ 
    settings, 
    activeChat, 
    setChats, 
    setSuggestedReplies: chatDataHandlers.setSuggestedReplies, 
    setActiveChatId 
  });

  const [editingChat, setEditingChat] = useState<ChatSession | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null | 'new'>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [citationChunks, setCitationChunks] = useState<any[] | null>(null);
  
  const handleSettingsChange = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const handleNewChat = useCallback(() => { setActiveChatId(null); setSearchQuery(''); chatDataHandlers.setSuggestedReplies([]); setIsMobileSidebarOpen(false); }, [setActiveChatId, chatDataHandlers.setSuggestedReplies]);
  const handleSelectChat = useCallback((id: string) => { setActiveChatId(id); chatDataHandlers.setSuggestedReplies([]); setIsMobileSidebarOpen(false); }, [setActiveChatId, chatDataHandlers.setSuggestedReplies]);
  const handleCloseMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);

  const handleImport = (file: File) => {
      importData(file).then(({ settings, chats, folders }) => {
          if (settings) handleSettingsChange(settings);
          if (chats) setChats(chats);
          if (folders) setFolders(folders);
          alert("Import successful!");
      }).catch(err => {
          alert("Invalid backup file.");
          console.error(err);
      });
  };

  const handleClearAll = () => {
      if (window.confirm('Are you sure you want to delete all chats, folders, and settings? This action cannot be undone.')) {
        clearAllData();
        setChats([]);
        setFolders([]);
        setActiveChatId(null);
      }
  };
  
  const handleModelChangeAndPersist = (model: string) => {
    chatDataHandlers.handleSetModelForActiveChat(model);
    handleSettingsChange({ defaultModel: model });
  };
  
  const handleShowCitations = useCallback((chunks: any[]) => {
    setCitationChunks(chunks);
  }, []);

  const handleCloseCitations = useCallback(() => {
    setCitationChunks(null);
  }, []);

  return (
    <div className="h-screen w-screen flex bg-[var(--bg-image)] text-[var(--text-color)] overflow-hidden">
        {isMobileSidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={handleCloseMobileSidebar} aria-hidden="true"/>}
        <Sidebar chats={chats} folders={folders} activeChatId={activeChatId} onNewChat={handleNewChat} onSelectChat={handleSelectChat} onDeleteChat={chatDataHandlers.handleDeleteChat} onEditChat={setEditingChat} onNewFolder={() => setEditingFolder('new')} onEditFolder={setEditingFolder} onDeleteFolder={chatDataHandlers.handleDeleteFolder} onMoveChatToFolder={chatDataHandlers.handleMoveChatToFolder} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(p => !p)} isMobileSidebarOpen={isMobileSidebarOpen} onToggleMobileSidebar={handleCloseMobileSidebar} searchQuery={searchQuery} onSetSearchQuery={setSearchQuery} onOpenSettings={() => setIsSettingsOpen(true)} />
        <div className={`flex-1 flex flex-col h-full transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'p-3' : 'p-3 md:pl-0'}`}>
          <ChatView 
            chatSession={activeChat} 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            onCancelGeneration={handleCancel} 
            currentModel={settings.defaultModel} 
            onSetCurrentModel={(model) => handleSettingsChange({ defaultModel: model })} 
            onSetModelForActiveChat={handleModelChangeAndPersist} 
            availableModels={availableModels} 
            isSidebarCollapsed={isSidebarCollapsed} 
            onToggleSidebar={() => setIsSidebarCollapsed(p => !p)} 
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(p => !p)} 
            onNewChat={handleNewChat} 
            onImageClick={setLightboxImage} 
            suggestedReplies={chatDataHandlers.suggestedReplies} 
            settings={settings} 
            onDeleteMessage={handleDeleteMessage} 
            onUpdateMessageContent={handleUpdateMessageContent} 
            onRegenerate={handleRegenerate} 
            onEditAndResubmit={handleEditAndResubmit}
            onShowCitations={handleShowCitations}
          />
        </div>
        
        {isSettingsOpen && <SettingsModal settings={settings} onClose={() => setIsSettingsOpen(false)} onSettingsChange={handleSettingsChange} onExportSettings={() => exportData({ settings })} onExportAll={() => exportData({ chats, folders, settings })} onImport={handleImport} onClearAll={handleClearAll} availableModels={availableModels} />}
        {editingChat && <EditChatModal chat={editingChat} onClose={() => setEditingChat(null)} onSave={chatDataHandlers.handleUpdateChatDetails} />}
        {editingFolder && <FolderActionModal folder={editingFolder === 'new' ? null : editingFolder} onClose={() => setEditingFolder(null)} onSave={editingFolder === 'new' ? chatDataHandlers.handleNewFolder : chatDataHandlers.handleUpdateFolder} />}
        {lightboxImage && <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}
        {citationChunks && <CitationDrawer chunks={citationChunks} onClose={handleCloseCitations} />}
    </div>
  );
};

export default function App() {
  const getInitialLanguage = (): 'en' | 'zh' => {
     try {
      const savedSettings = localStorage.getItem('kchat-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.language === 'en' || parsed.language === 'zh') return parsed.language;
      }
    } catch {}
    return 'en';
  }

  return (
    <LocalizationProvider initialLanguage={getInitialLanguage()}>
      <AppContainer />
    </LocalizationProvider>
  );
}