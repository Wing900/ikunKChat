import React, { useState, useMemo } from 'react';
import { ChatSession } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';

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
            <span className="text-xl">{chat.icon || '💬'}</span>
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
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ chats, onClose, onSelectChat, onUnarchiveChat, onDeleteChat, onEditChat }) => {
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
      <header className="flex items-center justify-between mb-4 flex-shrink-0 gap-4">
        <h2 className="text-2xl font-bold text-[var(--text-color)]">{t('archivedChats')}</h2>
        <div className="flex items-center gap-2">
            <div className="sidebar-search-wrapper max-w-xs">
              <Icon icon="search" className="sidebar-search-icon w-4 h-4" />
              <input type="text" placeholder={t('searchHistory')} className="sidebar-search-input !py-2 !text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2">
                <Icon icon="close" className="w-5 h-5"/>
            </button>
        </div>
      </header>
      <div className="flex-grow overflow-y-auto -mr-6 -ml-2 pr-4 pl-2">
        {hasVisibleChats ? (
            <div className="archived-chats-list p-2">
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
                <h3 className="text-xl font-semibold text-[var(--text-color)]">{searchQuery ? 'No Results Found' : 'No Archived Chats'}</h3>
                <p>{searchQuery ? 'Try a different search term.' : 'You can archive chats from the sidebar.'}</p>
            </div>
        )}
      </div>
    </main>
  );
};