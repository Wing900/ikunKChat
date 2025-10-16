import React, { useState, useMemo } from 'react';
import { ChatSession, Folder } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import { SettingsItem } from './SettingsItem';

interface ChatClearSelectorProps {
  chats: ChatSession[];
  folders: Folder[];
  onClose: () => void;
  onClearSelected: (chatIds: string[]) => void;
}

export const ChatClearSelector: React.FC<ChatClearSelectorProps> = ({
  chats,
  folders,
  onClose,
  onClearSelected
}) => {
  const { t } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 只显示非归档的聊天
  const nonArchivedChats = useMemo(() =>
    chats.filter(chat => !chat.isArchived),
    [chats]
  );

  const filteredChats = useMemo(() => {
    if (!searchQuery) return nonArchivedChats;
    const query = searchQuery.toLowerCase();
    return nonArchivedChats.filter(chat =>
      chat.title.toLowerCase().includes(query)
    );
  }, [nonArchivedChats, searchQuery]);

  const folderMap = useMemo(() =>
    folders.reduce((acc, folder) => {
      acc[folder.id] = folder;
      return acc;
    }, {} as Record<string, Folder>),
    [folders]
  );

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSelectAll = () => {
    if (selectedChatIds.length === filteredChats.length) {
      setSelectedChatIds([]);
    } else {
      setSelectedChatIds(filteredChats.map(chat => chat.id));
    }
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatIds(prev => {
      if (prev.includes(chatId)) {
        return prev.filter(id => id !== chatId);
      } else {
        return [...prev, chatId];
      }
    });
  };

  const handleClearSelected = () => {
    if (selectedChatIds.length === 0) return;

    onClearSelected(selectedChatIds);
    handleClose();
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
      <div className={`modal-dialog modal-dialog-lg ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col max-h-[80vh]`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--text-color)]">选择要清除的聊天记录</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
            <Icon icon="close" className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <div className="sidebar-search-wrapper">
            <Icon icon="search" className="sidebar-search-icon w-4 h-4" />
            <input
              type="text"
              placeholder="搜索聊天记录..."
              className="sidebar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-[var(--text-color-secondary)]">
            已选择 {selectedChatIds.length} 个聊天记录
          </div>
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm rounded-full glass-pane border-none text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10"
          >
            {selectedChatIds.length === filteredChats.length ? '取消全选' : '全选'}
          </button>
        </div>

        <div className="flex-grow overflow-y-auto -mr-2 pr-2 mb-4">
          {filteredChats.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-color-secondary)]">
              {searchQuery ? '没有找到匹配的聊天记录' : '没有可清除的聊天记录'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChats.map(chat => {
                const folder = chat.folderId ? folderMap[chat.folderId] : null;
                const isSelected = selectedChatIds.includes(chat.id);

                return (
                  <div
                    key={chat.id}
                    className={`flex items-center gap-3 p-3 rounded-[var(--radius-2xl)] border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[var(--accent-color)]/20 border-[var(--accent-color)]'
                        : 'glass-pane border-[var(--glass-border)] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-[var(--accent-color)] border-[var(--accent-color)]'
                          : 'border-[var(--text-color-secondary)]'
                      }`}>
                        {isSelected && (
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{chat.icon || '💬'}</span>
                        <span className="font-medium text-[var(--text-color)] truncate">
                          {chat.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[var(--text-color-secondary)]">
                        {folder && (
                          <span className="flex items-center gap-1">
                            <span>{folder.icon || '📁'}</span>
                            <span>{folder.name}</span>
                          </span>
                        )}
                        <span>•</span>
                        <span>{formatDate(chat.createdAt)}</span>
                        <span>•</span>
                        <span>{chat.messages.length} 条消息</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-[var(--radius-2xl)] font-semibold glass-pane border-none text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10"
          >
            取消
          </button>
          <button
            onClick={handleClearSelected}
            disabled={selectedChatIds.length === 0}
            className="px-4 py-2 rounded-[var(--radius-2xl)] font-semibold bg-red-500 text-white transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            清除选中的 {selectedChatIds.length} 个聊天
          </button>
        </div>
      </div>
    </>
  );
};