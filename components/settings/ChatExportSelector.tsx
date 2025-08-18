import React, { useState, useEffect, useMemo } from 'react';
import { ChatSession, Folder } from '../../types';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';

interface ChatExportSelectorProps {
  chats: ChatSession[];
  folders: Folder[];
  onExport: (selectedChatIds: string[]) => void;
  onClose: () => void;
}

export const ChatExportSelector: React.FC<ChatExportSelectorProps> = ({
  chats,
  folders,
  onExport,
  onClose
}) => {
  const { t } = useLocalization();
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    console.log('ChatExportSelector: 组件已挂载');
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      // 检查是否在搜索查询中
      if (searchQuery && !chat.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 检查文件夹筛选
      if (selectedFolderId !== null && chat.folderId !== selectedFolderId) {
        return false;
      }
      
      // 排除已归档的聊天
      if (chat.isArchived) {
        return false;
      }
      
      return true;
    });
  }, [chats, searchQuery, selectedFolderId]);

  const allVisibleSelected = useMemo(() => {
    return filteredChats.length > 0 && filteredChats.every(chat => selectedChatIds.has(chat.id));
  }, [filteredChats, selectedChatIds]);

  const handleToggleAll = () => {
    if (allVisibleSelected) {
      // 取消选择所有可见的聊天
      const newSelected = new Set(selectedChatIds);
      filteredChats.forEach(chat => newSelected.delete(chat.id));
      setSelectedChatIds(newSelected);
    } else {
      // 选择所有可见的聊天
      const newSelected = new Set(selectedChatIds);
      filteredChats.forEach(chat => newSelected.add(chat.id));
      setSelectedChatIds(newSelected);
    }
  };

  const handleToggleChat = (chatId: string) => {
    const newSelected = new Set(selectedChatIds);
    if (newSelected.has(chatId)) {
      newSelected.delete(chatId);
    } else {
      newSelected.add(chatId);
    }
    setSelectedChatIds(newSelected);
  };

  const handleExport = () => {
    if (selectedChatIds.size > 0) {
      onExport(Array.from(selectedChatIds));
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
      <div className={`modal-dialog modal-dialog-lg ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-[var(--text-color)]">{t('exportSelectedChats')}</h2>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2">
            <Icon icon="close" className="w-5 h-5"/>
          </button>
        </div>
        
        {/* 搜索和筛选 */}
        <div className="flex gap-3 mb-4">
          <div className="sidebar-search-wrapper flex-1">
            <Icon icon="search" className="sidebar-search-icon w-4 h-4" />
            <input
              type="text"
              placeholder={t('searchChats')}
              className="sidebar-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Icon icon="folder" className="w-4 h-4 text-[var(--text-color-secondary)]" />
            <select
              value={selectedFolderId || ''}
              onChange={(e) => setSelectedFolderId(e.target.value || null)}
              className="input-glass"
            >
              <option value="">{t('filterByFolder')}</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 选择状态 */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-[var(--text-color-secondary)]">
            {selectedChatIds.size === 0 
              ? t('noChatsSelected')
              : t('selectedChatsCount').replace('{count}', selectedChatIds.size.toString())
            }
          </div>
          
          <button
            onClick={handleToggleAll}
            className="text-sm text-[var(--accent-color)] hover:underline"
          >
            {allVisibleSelected ? t('deselectAll') : t('selectAll')}
          </button>
        </div>
        
        {/* 聊天列表 */}
        <div className="flex-grow min-h-0 overflow-y-auto -mr-4 pr-4 mb-4">
          <div className="space-y-2">
            {filteredChats.map(chat => (
              <div
                key={chat.id}
                className={`flex items-center gap-3 p-3 rounded-[var(--radius-lg)] transition-colors ${
                  selectedChatIds.has(chat.id) 
                    ? 'bg-[var(--accent-color)]/20' 
                    : 'hover:bg-black/10 dark:hover:bg-white/10'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedChatIds.has(chat.id)}
                  onChange={() => handleToggleChat(chat.id)}
                  className="w-4 h-4 accent-[var(--accent-color)]"
                />
                <div className="flex items-center gap-2 flex-grow">
                  <span className="text-xl">{chat.icon || <Icon icon="chat" className="w-5 h-5" />}</span>
                  <div className="flex-grow">
                    <div className="font-medium text-[var(--text-color)]">{chat.title}</div>
                    <div className="text-xs text-[var(--text-color-secondary)]">
                      {new Date(chat.createdAt).toLocaleDateString()} • {chat.messages.length} 条消息
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredChats.length === 0 && (
              <div className="text-center py-8 text-[var(--text-color-secondary)]">
                没有找到匹配的聊天记录
              </div>
            )}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="btn-outline"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleExport}
            disabled={selectedChatIds.size === 0}
            className="btn-primary flex items-center gap-2"
          >
            <Icon icon="download" className="w-4 h-4" />
            {t('exportChats')}
          </button>
        </div>
      </div>
    </>
  );
};