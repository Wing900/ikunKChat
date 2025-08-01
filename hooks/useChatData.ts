import { useState, useEffect, useCallback } from 'react';
import { ChatSession, Folder, Settings } from '../types';
import { loadChats, loadFolders, saveChats, saveFolders } from '../services/storageService';

interface UseChatDataProps {
  settings: Settings;
  isStorageLoaded: boolean;
}

export const useChatData = ({ settings, isStorageLoaded }: UseChatDataProps) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);

  useEffect(() => {
    if (isStorageLoaded) {
      setChats(loadChats());
      setFolders(loadFolders());
    }
  }, [isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
      saveChats(chats);
    }
  }, [chats, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
      saveFolders(folders);
    }
  }, [folders, isStorageLoaded]);

  const handleDeleteChat = useCallback((id: string) => {
    setChats(p => p.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  }, [activeChatId]);

  const handleUpdateChatDetails = useCallback((id: string, title: string, icon: string) => {
    setChats(p => p.map(c => c.id === id ? { ...c, title, icon } : c));
  }, []);

  const handleNewFolder = useCallback((name: string, icon: string) => {
    setFolders(p => [{ id: crypto.randomUUID(), name, icon, createdAt: Date.now() }, ...p]);
  }, []);

  const handleUpdateFolder = useCallback((id: string, name: string, icon: string) => {
    setFolders(p => p.map(f => f.id === id ? { ...f, name, icon } : f));
  }, []);

  const handleDeleteFolder = useCallback((id:string) => {
    setFolders(p => p.filter(f => f.id !== id));
    setChats(p => p.map(c => c.folderId === id ? { ...c, folderId: null } : c));
  }, []);

  const handleMoveChatToFolder = useCallback((chatId: string, folderId: string | null) => {
    setChats(p => p.map(c => c.id === chatId ? { ...c, folderId } : c));
  }, []);
  
  const handleArchiveChat = useCallback((chatId: string, archive: boolean) => {
    setChats(p => p.map(c => (c.id === chatId ? { ...c, isArchived: archive } : c)));
    if (archive && activeChatId === chatId) {
      setActiveChatId(null);
    }
  }, [activeChatId]);
  
  const handleToggleStudyMode = useCallback((chatId: string, enabled: boolean) => {
    setChats(p => p.map(c => c.id === chatId ? { ...c, isStudyMode: enabled } : c));
  }, []);

  const handleSetModelForActiveChat = useCallback((model: string) => {
    if (activeChatId) {
      setChats(p => p.map(c => c.id === activeChatId ? { ...c, model } : c));
    }
  }, [activeChatId]);

  // This function is now handled by a callback passed from App.tsx to ChatView
  const handleSetCurrentModel = useCallback((model: string) => {}, []);

  return {
    chats, setChats,
    folders, setFolders,
    activeChatId, setActiveChatId,
    suggestedReplies, setSuggestedReplies,
    handleDeleteChat,
    handleUpdateChatDetails,
    handleNewFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleMoveChatToFolder,
    handleSetModelForActiveChat,
    handleSetCurrentModel,
    handleArchiveChat,
    handleToggleStudyMode,
  };
};