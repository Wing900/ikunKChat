import React, { createContext, useState, useCallback, useContext, useMemo, ReactNode } from 'react';
import { ChatSession, Folder, Message } from '../types';

export interface InfoModalData {
  title: string;
  message: string;
}

export interface UIState {
  // 图片灯箱
  lightboxImage: string | null;
  setLightboxImage: (image: string | null) => void;
  
  // 设置模态框
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  
  // 移动端侧边栏
  isMobileSidebarOpen: boolean;
  toggleMobileSidebar: () => void;

  // 编辑聊天
  editingChat: ChatSession | null;
  setEditingChat: (chat: ChatSession | null) => void;
  closeEditChat: () => void;
  
  // 编辑文件夹
  editingFolder: Folder | null | 'new';
  setEditingFolder: (folder: Folder | null | 'new') => void;
  openNewFolder: () => void;
  closeEditFolder: () => void;
  
  // 引用抽屉
  citationChunks: any[] | null;
  setCitationChunks: (chunks: any[] | null) => void;
  closeCitations: () => void;
  
  // 编辑消息
  editingMessage: Message | null;
  setEditingMessage: (message: Message | null) => void;
  closeEditMessage: () => void;
  
  // 信息弹窗
  infoModal: InfoModalData | null;
  showInfoModal: (title: string, message: string) => void;
  closeInfoModal: () => void;

  // 超额弹窗
  isOverQuotaModalOpen: boolean;
  overQuotaMessage: string;
  showOverQuotaModal: (message: string) => void;
  hideOverQuotaModal: () => void;
  
  // 关闭所有
  closeAllModals: () => void;
}

const UIStateContext = createContext<UIState | undefined>(undefined);

export const UIStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingChat, setEditingChat] = useState<ChatSession | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null | 'new'>(null);
  const [citationChunks, setCitationChunks] = useState<any[] | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<InfoModalData | null>(null);
  const [isOverQuotaModalOpen, setIsOverQuotaModalOpen] = useState(false);
  const [overQuotaMessage, setOverQuotaMessage] = useState('');

  const openSettings = useCallback(() => setIsSettingsOpen(true), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const toggleMobileSidebar = useCallback(() => setIsMobileSidebarOpen(p => !p), []);
  const closeEditChat = useCallback(() => setEditingChat(null), []);
  const openNewFolder = useCallback(() => setEditingFolder('new'), []);
  const closeEditFolder = useCallback(() => setEditingFolder(null), []);
  const closeCitations = useCallback(() => setCitationChunks(null), []);
  const closeEditMessage = useCallback(() => setEditingMessage(null), []);
  const showInfoModal = useCallback((title: string, message: string) => {
    setInfoModal({ title, message });
  }, []);
  const closeInfoModal = useCallback(() => setInfoModal(null), []);
  const showOverQuotaModal = useCallback((message: string) => {
    setOverQuotaMessage(message);
    setIsOverQuotaModalOpen(true);
  }, []);
  const hideOverQuotaModal = useCallback(() => {
    setIsOverQuotaModalOpen(false);
    setOverQuotaMessage('');
  }, []);

  const closeAllModals = useCallback(() => {
    setLightboxImage(null);
    setIsSettingsOpen(false);
    setEditingChat(null);
    setEditingFolder(null);
    setCitationChunks(null);
    setEditingMessage(null);
    setInfoModal(null);
    setIsOverQuotaModalOpen(false);
  }, []);

  const value = useMemo(() => ({
    lightboxImage, setLightboxImage,
    isSettingsOpen, openSettings, closeSettings,
    isMobileSidebarOpen, toggleMobileSidebar,
    editingChat, setEditingChat, closeEditChat,
    editingFolder, setEditingFolder, openNewFolder, closeEditFolder,
    citationChunks, setCitationChunks, closeCitations,
    editingMessage, setEditingMessage, closeEditMessage,
    infoModal, showInfoModal, closeInfoModal,
    isOverQuotaModalOpen, overQuotaMessage, showOverQuotaModal, hideOverQuotaModal,
    closeAllModals
  }), [
    lightboxImage, isSettingsOpen, isMobileSidebarOpen, editingChat,
    editingFolder, citationChunks, editingMessage, infoModal,
    isOverQuotaModalOpen, overQuotaMessage,
    openSettings, closeSettings, toggleMobileSidebar, closeEditChat,
    openNewFolder, closeEditFolder, closeCitations, closeEditMessage,
    showInfoModal, closeInfoModal, showOverQuotaModal, hideOverQuotaModal,
    closeAllModals
  ]);

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIState = (): UIState => {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};
