import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/sidebar/Sidebar';
import { ChatView } from './components/ChatView';
import { EditChatModal } from './components/EditChatModal';
import { FolderActionModal } from './components/FolderActionModal';
import { ImageLightbox } from './components/ImageLightbox';
import { SettingsModal } from './components/settings/SettingsModal';
import { CitationDrawer } from './components/CitationDrawer';
import { RolesView } from './components/RolesView';
import { PersonaEditor } from './components/persona/PersonaEditor';
import { ArchiveView } from './components/ArchiveView';
import TranslateView from './components/translator/TranslateView';
import { ToastContainer } from './components/ToastContainer';
import { ConfirmationModal } from './components/ConfirmationModal';
import { ChatSession, Folder, Settings, Persona } from './types';
import { LocalizationProvider, useLocalization } from './contexts/LocalizationContext';
import { useSettings } from './hooks/useSettings';
import { useChatData } from './hooks/useChatData';
import { useChatMessaging } from './hooks/useChatMessaging';
import { useToast } from './contexts/ToastContext';
import { usePersonas } from './hooks/usePersonas';
import { useTranslationHistory } from './hooks/useTranslationHistory';
import { exportData, importData, clearAllData } from './services/storageService';
import { ViewContainer } from './components/common/ViewContainer';

type View = 'chat' | 'personas' | 'editor' | 'archive' | 'translate';

const AppContainer = () => {
  const { settings, setSettings, availableModels, isStorageLoaded } = useSettings();
  const { chats, setChats, folders, setFolders, activeChatId, setActiveChatId, ...chatDataHandlers } = useChatData({ settings, isStorageLoaded });
  const { personas, setPersonas, savePersonas } = usePersonas({ isStorageLoaded });
  const { translationHistory, setTranslationHistory } = useTranslationHistory({ isStorageLoaded });
  const { addToast } = useToast();
  const { t } = useLocalization();
  
  const [currentView, setCurrentView] = useState<View>('chat');
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);
  const [isNextChatStudyMode, setIsNextChatStudyMode] = useState(false);

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const { 
    isLoading, handleSendMessage, handleCancel, handleDeleteMessage, 
    handleUpdateMessageContent, handleRegenerate, handleEditAndResubmit 
  } = useChatMessaging({ 
    settings, activeChat, personas, setChats, 
    setSuggestedReplies: chatDataHandlers.setSuggestedReplies, setActiveChatId, addToast,
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
  
  const handleSettingsChange = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const handleNewChat = useCallback((personaId?: string | null) => { 
    const persona = personaId ? personas.find(p => p.id === personaId) : null;
    if (persona) {
      const newChatSession: ChatSession = {
        id: crypto.randomUUID(),
        title: persona?.name || 'New Persona Chat',
        icon: persona?.avatar.type === 'emoji' ? persona.avatar.value : '💬',
        messages: [], createdAt: Date.now(), model: settings.defaultModel,
        folderId: null, personaId: personaId, isStudyMode: isNextChatStudyMode,
      };
      setChats(prev => [newChatSession, ...prev]);
      setActiveChatId(newChatSession.id);
      setIsNextChatStudyMode(false);
    } else { setActiveChatId(null); }
    setSearchQuery(''); chatDataHandlers.setSuggestedReplies([]); 
    setIsMobileSidebarOpen(false); setCurrentView('chat');
  }, [setActiveChatId, chatDataHandlers.setSuggestedReplies, settings.defaultModel, setChats, personas, isNextChatStudyMode, setIsNextChatStudyMode]);

  const handleSelectChat = useCallback((id: string) => { setActiveChatId(id); chatDataHandlers.setSuggestedReplies([]); setIsMobileSidebarOpen(false); setCurrentView('chat'); }, [setActiveChatId, chatDataHandlers.setSuggestedReplies]);
  
  const handleOpenView = (view: View) => {
    setIsMobileSidebarOpen(false);
    setCurrentView(view);
  }
  
  const handleOpenEditor = (persona: Persona | null) => { setEditingPersona(persona); setCurrentView('editor'); }
  const handleSavePersona = (personaToSave: Persona) => { savePersonas(personaToSave); setCurrentView('personas'); };
  const handleDeletePersona = (id: string) => setPersonas(p => p.filter(persona => persona.id !== id));

  const handleImport = (file: File) => {
    importData(file).then(({ settings, chats, folders, personas: importedPersonas }) => {
        if (settings) handleSettingsChange(settings);
        if (chats) setChats(chats);
        if (folders) setFolders(folders);
        if (importedPersonas) setPersonas(p => [...p.filter(p => p.isDefault), ...importedPersonas]);
        addToast("Import successful!", 'success');
    }).catch(err => { 
        addToast("Invalid backup file.", 'error');
        console.error(err); 
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
            setPersonas(p => p.filter(p => p.isDefault)); 
            setTranslationHistory([]); 
            setActiveChatId(null);
            setConfirmation(null);
            addToast("All data cleared.", 'success');
        }
    });
  };
  
  return (
    <div className="h-dvh-screen w-screen flex bg-[var(--bg-image)] text-[var(--text-color)] overflow-hidden">
        <ToastContainer />
        {isMobileSidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} aria-hidden="true"/>}
        <Sidebar chats={chats} folders={folders} activeChatId={activeChatId} onNewChat={() => handleNewChat(null)} onSelectChat={handleSelectChat} onDeleteChat={chatDataHandlers.handleDeleteChat} onEditChat={setEditingChat} onArchiveChat={(id) => chatDataHandlers.handleArchiveChat(id, true)} onNewFolder={() => setEditingFolder('new')} onEditFolder={setEditingFolder} onDeleteFolder={chatDataHandlers.handleDeleteFolder} onMoveChatToFolder={chatDataHandlers.handleMoveChatToFolder} isCollapsed={isSidebarCollapsed} onToggleCollapse={() => setIsSidebarCollapsed(p => !p)} isMobileSidebarOpen={isMobileSidebarOpen} onToggleMobileSidebar={() => setIsMobileSidebarOpen(false)} searchQuery={searchQuery} onSetSearchQuery={setSearchQuery} onOpenSettings={() => setIsSettingsOpen(true)} onOpenPersonas={() => handleOpenView('personas')} onOpenArchive={() => handleOpenView('archive')} onOpenTranslate={() => handleOpenView('translate')} />
        <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarCollapsed ? 'p-3 pb-2' : 'p-3 pb-2 md:pl-0'}`}>
          <div className="view-wrapper">
              <ViewContainer view="chat" activeView={currentView}>
                <ChatView chatSession={activeChat} personas={personas} onSendMessage={handleSendMessage} isLoading={isLoading} onCancelGeneration={handleCancel} currentModel={settings.defaultModel} onSetCurrentModel={(model) => handleSettingsChange({ defaultModel: model })} onSetModelForActiveChat={chatDataHandlers.handleSetModelForActiveChat} availableModels={availableModels} isSidebarCollapsed={isSidebarCollapsed} onToggleSidebar={() => setIsSidebarCollapsed(p => !p)} onToggleMobileSidebar={() => setIsMobileSidebarOpen(p => !p)} onNewChat={() => handleNewChat(null)} onImageClick={setLightboxImage} suggestedReplies={chatDataHandlers.suggestedReplies} settings={settings} onDeleteMessage={handleDeleteMessage} onUpdateMessageContent={handleUpdateMessageContent} onRegenerate={handleRegenerate} onEditAndResubmit={handleEditAndResubmit} onShowCitations={setCitationChunks} onDeleteChat={chatDataHandlers.handleDeleteChat} onEditChat={setEditingChat} onToggleStudyMode={chatDataHandlers.handleToggleStudyMode} isNextChatStudyMode={isNextChatStudyMode} onToggleNextChatStudyMode={setIsNextChatStudyMode} />
              </ViewContainer>
              <ViewContainer view="personas" activeView={currentView}>
                <RolesView personas={personas} onStartChat={handleNewChat} onEditPersona={handleOpenEditor} onCreatePersona={() => handleOpenEditor(null)} onDeletePersona={handleDeletePersona} onClose={() => setCurrentView('chat')} />
              </ViewContainer>
              <ViewContainer view="archive" activeView={currentView}>
                <ArchiveView chats={chats} onSelectChat={handleSelectChat} onUnarchiveChat={(id) => chatDataHandlers.handleArchiveChat(id, false)} onDeleteChat={chatDataHandlers.handleDeleteChat} onEditChat={setEditingChat} onClose={() => setCurrentView('chat')} />
              </ViewContainer>
              <ViewContainer view="editor" activeView={currentView}>
                <PersonaEditor personaToEdit={editingPersona} settings={settings} onSave={handleSavePersona} onClose={() => setCurrentView('personas')} />
              </ViewContainer>
               <ViewContainer view="translate" activeView={currentView}>
                <TranslateView settings={settings} onClose={() => setCurrentView('chat')} history={translationHistory} setHistory={setTranslationHistory} />
              </ViewContainer>
          </div>
        </div>
        
        {isSettingsOpen && <SettingsModal settings={settings} onClose={() => setIsSettingsOpen(false)} onSettingsChange={handleSettingsChange} onExportSettings={() => exportData({ settings })} onExportAll={() => exportData({ chats, folders, settings, personas: personas.filter(p => !p.isDefault) })} onImport={handleImport} onClearAll={handleClearAll} availableModels={availableModels} />}
        {editingChat && <EditChatModal chat={editingChat} onClose={() => setEditingChat(null)} onSave={chatDataHandlers.handleUpdateChatDetails} />}
        {editingFolder && <FolderActionModal folder={editingFolder === 'new' ? null : editingFolder} onClose={() => setEditingFolder(null)} onSave={editingFolder === 'new' ? chatDataHandlers.handleNewFolder : chatDataHandlers.handleUpdateFolder} />}
        {lightboxImage && <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}
        {citationChunks && <CitationDrawer chunks={citationChunks} onClose={() => setCitationChunks(null)} />}
        {confirmation && <ConfirmationModal {...confirmation} onClose={() => setConfirmation(null)} />}
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