import React, { useState, useMemo } from 'react';
import { ChatSession } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import { ViewHeader } from './common/ViewHeader';

interface ArchivedChatItemProps {
    chat: ChatSession;
    isHiding: boolean;
    onSelect: () => void;
    onUnarchive: () => void;
    onDelete: () => void;
    onEdit: () => void;
    index: number;
}

const ArchivedChatItem: React.FC<ArchivedChatItemProps> = ({ chat, isHiding, onSelect, onUnarchive, onDelete, onEdit, index }) => {
    const { t } = useLocalization();
    const [isLeaving, setIsLeaving] = useState(false);

    const handleAction = (action: () => void) => (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsLeaving(true);
        setTimeout(() => {
            action();
        }, 350);
    };

    return (
        <div
            className={`archived-chat-item ${isLeaving ? 'leaving' : ''} ${isHiding ? 'hiding' : ''}`}
            onClick={onSelect}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <span className="truncate flex-grow font-semibold">{chat.title}</span>
            <div className="archived-chat-item-actions">
                <button onClick={handleAction(onUnarchive)} className="action-btn" aria-label={t('unarchive')}><Icon icon="unarchive" className="w-4 h-4"/></button>
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="action-btn" aria-label={t('editChat')}><Icon icon="edit" className="w-4 h-4"/></button>
                <button onClick={handleAction(onDelete)} className="action-btn danger" aria-label={t('delete')}><Icon icon="delete" className="w-4 h-4"/></button>
            </div>
        </div>
    );
};


interface ArchiveViewProps {
  chats: ChatSession[];
  onClose: () => void;
  onSelectChat: (id: string) => void;
  onUnarchiveChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onEditChat: (chat: ChatSession) => void;
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ chats, onClose, onSelectChat, onUnarchiveChat, onDeleteChat, onEditChat, isSidebarCollapsed, onToggleSidebar, onToggleMobileSidebar }) => {
  const { t } = useLocalization();
  const [searchQuery, setSearchQuery] = useState('');

  const displayedChats = useMemo(() => {
    const baseArchived = chats.filter(c => c.isArchived).sort((a, b) => b.createdAt - a.createdAt);
    if (!searchQuery.trim()) {
        return baseArchived.map(chat => ({ ...chat, isHiding: false }));
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return baseArchived.map(chat => ({
        ...chat,
        isHiding: !chat.title.toLowerCase().includes(lowerCaseQuery)
    }));
  }, [chats, searchQuery]);

  const hasVisibleChats = useMemo(() => displayedChats.some(c => !c.isHiding), [displayedChats]);

  return (
    <main className="glass-pane rounded-[var(--radius-2xl)] flex flex-col h-full overflow-hidden relative p-6">
      <ViewHeader
        title={t('archivedChats')}
        onClose={onClose}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
        onToggleMobileSidebar={onToggleMobileSidebar}
      >
        <div className="sidebar-search-wrapper max-w-xs">
          <Icon icon="search" className="sidebar-search-icon w-4 h-4" />
          <input type="text" placeholder={t('searchHistory')} className="sidebar-search-input !py-2 !text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </ViewHeader>
      <div className="flex-grow overflow-y-auto -mr-6 -ml-2 pr-4 pl-2">
        {hasVisibleChats ? (
            <div className="archived-chats-list p-2 mt-0">
              {displayedChats.map((chat, index) => (
                  <ArchivedChatItem
                      key={chat.id}
                      chat={chat}
                      index={index}
                      isHiding={chat.isHiding}
                      onSelect={() => onSelectChat(chat.id)}
                      onUnarchive={() => onUnarchiveChat(chat.id)}
                      onDelete={() => onDeleteChat(chat.id)}
                      onEdit={() => onEditChat(chat)}
                  />
              ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-color-secondary)]">
                <Icon icon="archive" className="w-16 h-16 opacity-50 mb-4" />
                <h3 className="text-xl font-semibold text-[var(--text-color)]">{searchQuery ? t('noResultsFound') : t('noArchivedChats')}</h3>
                <p>{searchQuery ? t('tryDifferentSearch') : t('canArchiveFromSidebar')}</p>
            </div>
        )}
      </div>
    </main>
  );
};