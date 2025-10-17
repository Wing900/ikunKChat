import { useState, useCallback } from 'react';
import { ChatSession, Folder, Message } from '../types';

/**
 * 管理应用的 UI 状态（模态框、抽屉等）
 * 从 App.tsx 抽离出来，减少顶层组件的状态复杂度
 */
export const useUIState = () => {
  // 图片灯箱
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  // 设置模态框
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // 编辑聊天模态框
  const [editingChat, setEditingChat] = useState<ChatSession | null>(null);
  
  // 编辑文件夹模态框
  const [editingFolder, setEditingFolder] = useState<Folder | null | 'new'>(null);
  
  // 引用抽屉
  const [citationChunks, setCitationChunks] = useState<any[] | null>(null);
  
  // 编辑消息模态框
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);

  // 提供便捷的关闭方法
  const closeAllModals = useCallback(() => {
    setLightboxImage(null);
    setIsSettingsOpen(false);
    setEditingChat(null);
    setEditingFolder(null);
    setCitationChunks(null);
    setEditingMessage(null);
  }, []);

  return {
    // 图片灯箱
    lightboxImage,
    setLightboxImage,
    
    // 设置模态框
    isSettingsOpen,
    setIsSettingsOpen,
    openSettings: useCallback(() => setIsSettingsOpen(true), []),
    closeSettings: useCallback(() => setIsSettingsOpen(false), []),
    
    // 编辑聊天
    editingChat,
    setEditingChat,
    closeEditChat: useCallback(() => setEditingChat(null), []),
    
    // 编辑文件夹
    editingFolder,
    setEditingFolder,
    openNewFolder: useCallback(() => setEditingFolder('new'), []),
    closeEditFolder: useCallback(() => setEditingFolder(null), []),
    
    // 引用抽屉
    citationChunks,
    setCitationChunks,
    closeCitations: useCallback(() => setCitationChunks(null), []),
    
    // 编辑消息
    editingMessage,
    setEditingMessage,
    closeEditMessage: useCallback(() => setEditingMessage(null), []),
    
    // 关闭所有
    closeAllModals,
  };
};