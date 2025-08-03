import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChatSession, Folder } from '../../types';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';
import { ChatHistoryItem } from '../ChatHistoryItem';

interface SidebarProps {
  chats: ChatSession[];
  folders: Folder[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onEditChat: (chat: ChatSession) => void;
  onArchiveChat: (id: string) => void;
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
  onOpenPersonas: () => void;
  onOpenArchive: () => void;
  onOpenTranslate: () => void;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const { chats, folders, activeChatId, onSelectChat, onNewChat, onDeleteChat, onEditChat, onArchiveChat, isCollapsed, onToggleCollapse, isMobileSidebarOpen, onToggleMobileSidebar, searchQuery, onSetSearchQuery, onNewFolder, onEditFolder, onDeleteFolder, onMoveChatToFolder, onOpenSettings, onOpenPersonas, onOpenArchive, onOpenTranslate } = props;
  const { t } = useLocalization();
  
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [openFolderIds, setOpenFolderIds] = useState<Set<string>>(new Set());
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  
  const nonArchivedChats = useMemo(() => chats.filter(c => !c.isArchived), [chats]);
  const prevChatIdsRef = useRef<Set<string>>(new Set(nonArchivedChats.map(c => c.id)));
  const prevFolderIdsRef = useRef<Set<string>>(new Set(folders.map(f => f.id)));
  
  useEffect(() => { prevChatIdsRef.current = new Set(nonArchivedChats.map(c => c.id)); }, [nonArchivedChats]);
  useEffect(() => { prevFolderIdsRef.current = new Set(folders.map(f => f.id)); }, [folders]);

  const sortedChats = useMemo(() => [...nonArchivedChats].sort((a, b) => b.createdAt - a.createdAt), [nonArchivedChats]);

  const { visibleFolders, visibleRootChats } = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const hasQuery = !!lowerQuery;

    const rootChats = sortedChats.filter(c => !c.folderId);
    const chatsByFolder = sortedChats.reduce((acc, chat) => {
        if (chat.folderId) {
            if (!acc[chat.folderId]) acc[chat.folderId] = [];
            acc[chat.folderId].push(chat);
        }
        return acc;
    }, {} as Record<string, ChatSession[]>);

    const visibleRootChats = rootChats.map(c => ({
        ...c,
        isHiding: hasQuery && !c.title.toLowerCase().includes(lowerQuery)
    }));

    const visibleFolders = folders.map(folder => {
        const folderChats = chatsByFolder[folder.id] || [];
        const chatsWithVisibility = folderChats.map(c => ({
            ...c,
            isHiding: hasQuery && !c.title.toLowerCase().includes(lowerQuery)
        }));

        const folderNameMatches = folder.name.toLowerCase().includes(lowerQuery);
        const anyChildIsVisible = chatsWithVisibility.some(c => !c.isHiding);
        
        const isFolderHiding = hasQuery && !folderNameMatches && !anyChildIsVisible;
        
        return {
            ...folder,
            chats: chatsWithVisibility,
            isHiding: isFolderHiding
        };
    });

    return { visibleFolders, visibleRootChats };
  }, [sortedChats, folders, searchQuery]);

  useEffect(() => {
    if (searchQuery) { setOpenFolderIds(new Set(visibleFolders.filter(f => !f.isHiding).map(f => f.id))); }
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

  const renderChat = (chat: ChatSession & { isHiding: boolean }) => (
    <ChatHistoryItem 
      key={chat.id} chat={chat} isActive={activeChatId === chat.id} 
      isNew={!prevChatIdsRef.current.has(chat.id)} 
      isHiding={chat.isHiding}
      onSelect={() => onSelectChat(chat.id)} onEdit={() => onEditChat(chat)} 
      onDelete={() => onDeleteChat(chat.id)} onArchive={() => onArchiveChat(chat.id)}
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', chat.id); e.currentTarget.classList.add('dragging'); }} 
      onDragEnd={(e) => e.currentTarget.classList.remove('dragging')} />
  );
  
  return (
    <aside className={`h-full flex-col flex flex-shrink-0 transition-transform md:transition-all duration-300 ease-in-out fixed md:relative inset-y-0 left-0 z-40 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:transform-none ${isCollapsed ? 'md:w-0 md:p-0' : 'w-80 p-3'}`}>
      <div className={`glass-pane rounded-[var(--radius-2xl)] h-full flex flex-col p-4 relative overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0' : 'opacity-100'}`}>
        <div className="flex items-center justify-between gap-3 mb-4 px-2">
            <div className="flex items-center gap-3"><Icon icon="kchat" className="w-8 h-8 text-[var(--accent-color)]" /><h1 className="text-2xl font-bold text-[var(--text-color)]">KChat</h1></div>
            <button onClick={onToggleCollapse} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2 hidden md:block" aria-label={t('collapseSidebar')} data-tooltip={t('collapseSidebar')} data-tooltip-placement="left"><Icon icon="panel-left-close" className="w-5 h-5" /></button>
            <button onClick={onToggleMobileSidebar} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2 md:hidden" aria-label={t('collapseSidebar')} data-tooltip={t('collapseSidebar')} data-tooltip-placement="left"><Icon icon="panel-left-close" className="w-5 h-5" /></button>
        </div>
        <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-4 text-lg font-semibold bg-[var(--accent-color)] text-white rounded-[var(--radius-2xl)] transition-transform hover:scale-105 active:scale-100"><Icon icon="plus" className="w-6 h-6" />{t('newChat')}</button>
        <div className="sidebar-search-wrapper mb-2"><Icon icon="search" className="sidebar-search-icon w-5 h-5" /><input type="text" placeholder={t('searchHistory')} className="sidebar-search-input" value={searchQuery} onChange={(e) => onSetSearchQuery(e.target.value)} /></div>

        <div className="flex-grow overflow-y-auto -mr-2 pr-2 pt-2">
          <div className="flex items-center justify-between mt-2 mb-1 px-2"><h2 className="text-sm font-semibold text-[var(--text-color-secondary)] uppercase tracking-wider">{t('history')}</h2><button onClick={onNewFolder} className="p-1 rounded-full text-[var(--text-color-secondary)] hover:text-[var(--text-color)]" data-tooltip={t('newFolder')} data-tooltip-placement="left"><Icon icon="folder-plus" className="w-5 h-5" /></button></div>
          
          <nav className="flex flex-col gap-1">
            {visibleFolders.map(folder => (
              <div key={folder.id} className={`folder-wrapper ${deletingFolderId === folder.id ? 'deleting' : ''} ${!prevFolderIdsRef.current.has(folder.id) ? 'history-item-enter' : ''} ${folder.isHiding ? 'hiding' : ''}`} onDrop={(e) => handleDrop(e, folder.id)} onDragOver={(e) => handleDragOver(e, folder.id)} onDragLeave={() => setDragOverTarget(null)}>
                <div className={`folder-header ${dragOverTarget === folder.id ? 'drop-target' : ''}`} onClick={() => toggleFolder(folder.id)}>
                  <Icon icon="chevron-down" className={`folder-chevron w-4 h-4 flex-shrink-0 ${openFolderIds.has(folder.id) ? 'open' : ''}`} />
                  <span className="text-xl">{folder.icon || <Icon icon="folder" className="w-5 h-5 text-[var(--accent-color)]" />}</span>
                  <span className="truncate flex-grow">{folder.name}</span>
                  <div className="folder-actions ml-auto flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }} aria-label="Edit folder"><Icon icon="edit" className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteFolderClick(folder.id); }} aria-label="Delete folder"><Icon icon="delete" className="w-4 h-4 text-red-500" /></button>
                  </div>
                </div>
                <div className="folder-content" style={{ maxHeight: openFolderIds.has(folder.id) ? `${folder.chats.filter(c => !c.isHiding).length * 52 + 8}px` : '0px' }}>
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
            <button onClick={onOpenPersonas} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-2xl)] text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10" data-tooltip={t('personas')} data-tooltip-placement="right">
                <Icon icon="users" className="w-5 h-5" />
                <span className="font-semibold">{t('personas')}</span>
            </button>
            <button onClick={onOpenTranslate} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-2xl)] text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10" data-tooltip={t('translate')} data-tooltip-placement="right">
                <Icon icon="translate-logo" className="w-5 h-5" />
                <span className="font-semibold">{t('translate')}</span>
            </button>
            <button onClick={onOpenArchive} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-2xl)] text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10" data-tooltip={t('archiveDesc')} data-tooltip-placement="right">
                <Icon icon="archive" className="w-5 h-5" />
                <span className="font-semibold">{t('archive')}</span>
            </button>
            <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-2xl)] text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10" data-tooltip={t('settings')} data-tooltip-placement="right">
                <Icon icon="settings" className="w-5 h-5" />
                <span className="font-semibold">{t('settings')}</span>
            </button>
        </div>
      </div>
    </aside>
  );
};