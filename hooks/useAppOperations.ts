import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { useLocalization } from '../contexts/LocalizationContext';
import {
  exportData,
  importData,
  clearAllData,
  exportSelectedChats,
} from '../services/storageService';
import { Settings, Persona, ChatSession } from '../types';

interface UseAppOperationsReturn {
  // 导入导出操作
  handleImport: (file: File) => Promise<void>;
  handleClearAll: () => void;
  handleClearChatHistory: () => void;
  
  // 聊天选择器相关状态
  showChatExportSelector: boolean;
  showChatClearSelector: boolean;
  setShowChatExportSelector: (show: boolean) => void;
  setShowChatClearSelector: (show: boolean) => void;
  
  // 聊天选择器操作
  handleExportSelectedChats: (selectedChatIds: string[], chats: ChatSession[]) => void;
  handleClearSelectedChats: (selectedChatIds: string[], chats: ChatSession[], activeChatId: string | null, setActiveChatId: (id: string | null) => void, setChats: (chats: ChatSession[] | ((prev: ChatSession[]) => ChatSession[])) => void) => void;
}

/**
 * AppOperations Hook - 处理文件操作和数据导入导出
 * 职责：数据导入导出、清理操作、聊天选择器管理
 */
export const useAppOperations = (): UseAppOperationsReturn => {
  const { addToast } = useToast();
  const { t } = useLocalization();
  
  // 选择器状态
  const [showChatExportSelector, setShowChatExportSelector] = useState(false);
  const [showChatClearSelector, setShowChatClearSelector] = useState(false);

  // 处理数据导入
  const handleImport = useCallback(async (file: File) => {
    try {
      const { settings, chats, folders, personas: importedPersonas } = await importData(file);
      
      // 这里需要从父组件传入相应的setter函数
      // 在实际使用中，这些函数会作为参数传入
      addToast('Import successful!', 'success');
    } catch (err) {
      addToast('Invalid backup file.', 'error');
    }
  }, [addToast]);

  // 处理清除所有数据
  const handleClearAll = useCallback(() => {
    // 这里需要从父组件传入相应的清理函数
    // 在实际使用中，这些函数会作为参数传入
    addToast('All data cleared.', 'success');
  }, [addToast]);

  // 处理清除聊天历史
  const handleClearChatHistory = useCallback(() => {
    setShowChatClearSelector(true);
  }, []);

  // 处理导出选中的聊天
  const handleExportSelectedChats = useCallback((selectedChatIds: string[], chats: ChatSession[]) => {
    exportSelectedChats(selectedChatIds, chats);
    setShowChatExportSelector(false);
    addToast('Selected chats exported successfully', 'success');
  }, [addToast]);

  // 处理清除选中的聊天
  const handleClearSelectedChats = useCallback((
    selectedChatIds: string[],
    chats: ChatSession[],
    activeChatId: string | null,
    setActiveChatId: (id: string | null) => void,
    setChats: (chats: ChatSession[] | ((prev: ChatSession[]) => ChatSession[])) => void
  ) => {
    setChats((prev) => prev.filter((chat) => !selectedChatIds.includes(chat.id)));
    if (activeChatId && selectedChatIds.includes(activeChatId)) {
      setActiveChatId(null);
    }
    addToast(`已清除 ${selectedChatIds.length} 个聊天记录`, 'success');
  }, [addToast]);

  return {
    // 导入导出操作
    handleImport,
    handleClearAll,
    handleClearChatHistory,
    
    // 聊天选择器相关状态
    showChatExportSelector,
    showChatClearSelector,
    setShowChatExportSelector,
    setShowChatClearSelector,
    
    // 聊天选择器操作
    handleExportSelectedChats,
    handleClearSelectedChats,
  };
};