import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChatSession, Folder } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import { ChatHistoryItem } from './ChatHistoryItem';

interface SidebarProps {
  chats: ChatSession[];
  folders: Folder[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onEditChat: (chat: ChatSession) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  searchQuery: string;
  onSetSearchQuery: (query: string) => void;
  onNewFolder: () => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (id: string) => void;
  onMoveChatToFolder: (chatId: string, folderId: string | null) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const { chats, folders, activeChatId, onSelectChat, onNewChat, onDeleteChat, onEditChat, isCollapsed, onToggleCollapse, isMobileSidebarOpen, onToggleMobileSidebar, searchQuery, onSetSearchQuery, onNewFolder, onEditFolder, onDeleteFolder, onMoveChatToFolder, onOpenSettings } = props;
  const { t } = useLocalization();
  
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(new Set());
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const prevChatIdsRef = useRef<Set<string>>(new Set(chats.map(c => c.id)));
  const prevFolderIdsRef = useRef<Set<string>>(new Set(folders.map(f => f.id)));
  
  useEffect(() => { prevChatIdsRef.current = new Set(chats.map(c => c.id)); }, [chats]);
  useEffect(() => { prevFolderIdsRef.current = new Set(folders.map(f => f.id)); }, [folders]);

  const sortedChats = useMemo(() => [...chats].sort((a, b) => b.createdAt - a.createdAt), [chats]);

  const { visibleFolders, visibleRootChats } = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const folderMap = new Map(folders.map(f => [f.id, { ...f, chats: [] as ChatSession[] }]));
    const rootChats: ChatSession[] = [];

    sortedChats.forEach(chat => {
      if (chat.folderId && folderMap.has(chat.folderId)) {
        folderMap.get(chat.folderId)!.chats.push(chat);
      } else { rootChats.push(chat); }
    });

    if (!searchQuery) return { visibleFolders: Array.from(folderMap.values()), visibleRootChats: rootChats };
    
    const filteredRoot = rootChats.filter(c => c.title.toLowerCase().includes(lowerQuery));
    const filteredFolders = Array.from(folderMap.values()).map(folder => ({
      ...folder,
      chats: folder.chats.filter(c => c.title.toLowerCase().includes(lowerQuery)),
    })).filter(folder => folder.chats.length > 0 || folder.name.toLowerCase().includes(lowerQuery));

    return { visibleFolders: filteredFolders, visibleRootChats: filteredRoot };
  }, [sortedChats, folders, searchQuery]);

  useEffect(() => {
    if (searchQuery) { setOpenFolderIds(new Set(visibleFolders.map(f => f.id))); }
  }, [searchQuery, visibleFolders]);
  
  const toggleFolder = (id: string) => {
    setOpenFolderIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };

  const handleDeleteFolderClick = (id: string) => {
    setDeletingFolderId(id);
    setTimeout(() => { onDeleteFolder(id); setDeletingFolderId(null); }, 350);
  };

  const handleDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    const chatId = e.dataTransfer.getData('text/plain');
    if (chatId) { onMoveChatToFolder(chatId, folderId); }
    setDragOverTarget(null);
  };
  
  const handleDragOver = (e: React.DragEvent, targetId: string | null) => {
    e.preventDefault();
    setDragOverTarget(targetId);
  };

  const renderChat = (chat: ChatSession) => (
    <ChatHistoryItem 
      key={chat.id} chat={chat} isActive={activeChatId === chat.id} 
      isNew={!prevChatIdsRef.current.has(chat.id)} 
      onSelect={() => onSelectChat(chat.id)} onEdit={() => onEditChat(chat)} 
      onDelete={() => onDeleteChat(chat.id)} 
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', chat.id); e.currentTarget.classList.add('dragging'); }} 
      onDragEnd={(e) => e.currentTarget.classList.remove('dragging')} />
  );
  
  return (
    <aside className={`h-full flex-col flex flex-shrink-0 transition-transform md:transition-all duration-300 ease-in-out fixed md:relative inset-y-0 left-0 z-40 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:transform-none ${isCollapsed ? 'md:w-0 md:p-0' : 'w-80 p-3'}`}>
      <div className={`glass-pane rounded-[var(--radius-2xl)] h-full flex flex-col p-4 relative overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center justify-between gap-3 mb-4 px-2">
            <div className="flex items-center gap-3"><Icon icon="kchat" className="w-8 h-8 text-[var(--accent-color)]" /><h1 className="text-2xl font-bold text-[var(--text-color)]">KChat</h1></div>
            <button onClick={onToggleCollapse} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2 hidden md:block" aria-label={t('collapseSidebar')} data-tooltip={t('collapseSidebar')} data-tooltip-placement="left"><Icon icon="panel-left-close" className="w-5 h-5" /></button>
            <button onClick={onToggleMobileSidebar} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2 md:hidden" aria-label={t('closeSidebar')} data-tooltip={t('closeSidebar')} data-tooltip-placement="left"><Icon icon="panel-left-close" className="w-5 h-5" /></button>
        </div>
        <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 text-lg font-semibold bg-[var(--accent-color)] text-white rounded-[var(--radius-2xl)] transition-transform hover:scale-105 active:scale-100"><Icon icon="plus" className="w-6 h-6" />{t('newChat')}</button>
        <div className="sidebar-search-wrapper mb-2"><Icon icon="search" className="sidebar-search-icon w-5 h-5" /><input type="text" placeholder={t('searchHistory')} className="sidebar-search-input" value={searchQuery} onChange={(e) => onSetSearchQuery(e.target.value)} /></div>

        <div className="flex-grow overflow-y-auto -mr-2 pr-2">
          <div className="flex items-center justify-between mt-2 mb-1 px-2"><h2 className="text-sm font-semibold text-[var(--text-color-secondary)] uppercase tracking-wider">{t('history')}</h2><button onClick={onNewFolder} className="p-1 rounded-full text-[var(--text-color-secondary)] hover:text-[var(--text-color)]" data-tooltip={t('newFolder')} data-tooltip-placement="left"><Icon icon="folder-plus" className="w-5 h-5" /></button></div>
          
          <nav className="flex flex-col gap-1">
            {visibleFolders.map(folder => (
              <div key={folder.id} className={`folder-wrapper ${deletingFolderId === folder.id ? 'deleting' : ''} ${!prevFolderIdsRef.current.has(folder.id) ? 'history-item-enter' : ''}`} onDrop={(e) => handleDrop(e, folder.id)} onDragOver={(e) => handleDragOver(e, folder.id)} onDragLeave={() => setDragOverTarget(null)}>
                <div className={`folder-header ${dragOverTarget === folder.id ? 'drop-target' : ''}`} onClick={() => toggleFolder(folder.id)}>
                  <Icon icon="chevron-down" className={`folder-chevron w-4 h-4 flex-shrink-0 ${openFolderIds.has(folder.id) ? 'open' : ''}`} />
                  <span className="text-xl">{folder.icon || <Icon icon="folder" className="w-5 h-5 text-[var(--accent-color)]" />}</span>
                  <span className="truncate flex-grow">{folder.name}</span>
                  <div className="folder-actions ml-auto flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }} aria-label="Edit folder"><Icon icon="edit" className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteFolderClick(folder.id); }} aria-label="Delete folder"><Icon icon="delete" className="w-4 h-4 text-red-500" /></button>
                  </div>
                </div>
                <div className="folder-content" style={{ maxHeight: openFolderIds.has(folder.id) ? `${folder.chats.length * 52 + 8}px` : '0px' }}>
                  <div className="flex flex-col gap-1 py-1">{folder.chats.map(renderChat)}</div>
                </div>
              </div>
            ))}
            
            <div className={`root-drop-zone ${dragOverTarget === 'root' ? 'drop-target' : ''}`} onDrop={(e) => handleDrop(e, null)} onDragOver={(e) => handleDragOver(e, 'root')} onDragLeave={() => setDragOverTarget(null)}>
              {visibleRootChats.map(renderChat)}
            </div>
          </nav>
        </div>
        
        <div className="mt-auto pt-2">
            <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-2xl)] text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10" data-tooltip={t('settings')} data-tooltip-placement="right">
                <Icon icon="settings" className="w-5 h-5" />
                <span className="font-semibold">{t('settings')}</span>
            </button>
        </div>
      </div>
    </aside>
  );
};