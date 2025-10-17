import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatSession, Folder, Settings } from '../types';
import { loadChats, loadFolders, saveChats, saveFolders, loadActiveChatId, saveActiveChatId } from '../services/storageService';
import { debounce } from '../utils/debounce';

interface UseChatDataProps {
  settings: Settings;
  isStorageLoaded: boolean;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
}

export const useChatData = ({ settings, isStorageLoaded, onSettingsChange }: UseChatDataProps) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // 创建防抖保存函数（只创建一次）
  const debouncedSaveChats = useRef(
    debounce((chatsToSave: ChatSession[]) => {
      saveChats(chatsToSave);
    }, 1000)
  ).current;

  const debouncedSaveFolders = useRef(
    debounce((foldersToSave: Folder[]) => {
      saveFolders(foldersToSave);
    }, 1000)
  ).current;


  useEffect(() => {
    if (isStorageLoaded) {
      loadChats().then(loadedChats => {
        setChats(loadedChats);
      }).catch(error => {
        console.error('[useChatData] 加载聊天失败:', error);
        setChats([]);
      });
      
      setFolders(loadFolders());
      setActiveChatId(null);
    }
  }, [isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded && chats.length > 0) {
      debouncedSaveChats(chats);
    }
  }, [chats, isStorageLoaded, debouncedSaveChats]);

  useEffect(() => {
    if (isStorageLoaded && folders.length > 0) {
      debouncedSaveFolders(folders);
    }
  }, [folders, isStorageLoaded, debouncedSaveFolders]);

  useEffect(() => {
    if (isStorageLoaded) {
      saveActiveChatId(activeChatId);
    }
  }, [activeChatId, isStorageLoaded]);

  const handleDeleteChat = useCallback((id: string) => {
    setChats(p => p.filter(c => c.id !== id));
    if (activeChatId === id) setActiveChatId(null);
  }, [activeChatId]);

  const handleUpdateChatDetails = useCallback((id: string, title: string) => {
    setChats(p => p.map(c => c.id === id ? { ...c, title } : c));
  }, []);

  const handleNewFolder = useCallback((id: string, name: string, icon?: string) => {
    setFolders(p => [{ id, name, icon: icon || '', createdAt: Date.now() }, ...p]);
  }, []);

  const handleUpdateFolder = useCallback((id: string, name: string, icon?: string) => {
    setFolders(p => p.map(f => f.id === id ? { ...f, name, icon: icon || f.icon || '' } : f));
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
  
  

  const handleSetModelForActiveChat = useCallback((model: string) => {
    if (activeChatId) {
      setChats(p => p.map(c => c.id === activeChatId ? { ...c, model } : c));
    }
    onSettingsChange({ defaultModel: model });
  }, [activeChatId, onSettingsChange]);

  // This function is now handled by a callback passed from App.tsx to ChatView
  const handleSetCurrentModel = useCallback((model: string) => {}, []);

  return {
    chats, setChats,
    folders, setFolders,
    activeChatId, setActiveChatId,

    handleDeleteChat,
    handleUpdateChatDetails,
    handleNewFolder,
    handleUpdateFolder,
    handleDeleteFolder,
    handleMoveChatToFolder,
    handleSetModelForActiveChat,
    handleSetCurrentModel,
    handleArchiveChat,
    
  };
};