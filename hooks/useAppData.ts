import { useCallback } from 'react';
import { useChatData } from './useChatData';
import { usePersonas } from './usePersonas';
import { useChatMessaging } from './useChatMessaging';
import { useToast } from '../contexts/ToastContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { Settings, ChatSession, Persona } from '../types';

interface UseAppDataReturn {
  // 聊天数据相关
  chats: ChatSession[];
  setChats: (chats: ChatSession[] | ((prev: ChatSession[]) => ChatSession[])) => void;
  folders: any[];
  setFolders: (folders: any[] | ((prev: any[]) => any[])) => void;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  activeChat: ChatSession | null;
  
  // 聊天数据操作方法
  chatDataHandlers: {
    handleDeleteChat: (id: string) => void;
    handleArchiveChat: (id: string, archived: boolean) => void;
    handleDeleteFolder: (id: string) => void;
    handleMoveChatToFolder: (chatId: string, folderId: string | null) => void;
    handleSetModelForActiveChat: (model: string) => void;
    handleUpdateChatDetails: (id: string, title: string, folderId: string | null) => void;
    handleNewFolder: (name: string) => void;
    handleUpdateFolder: (id: string, name: string) => void;
  };
  
  // 人格数据相关
  personas: Persona[];
  setPersonas: (personas: Persona[] | ((prev: Persona[]) => Persona[])) => void;
  savePersonas: (persona: Persona) => void;
  deletePersona: (id: string) => void;
  personasLoading: boolean;
  personasError: string | null;
  clearPersonasError: () => void;
  
  // 聊天消息操作
  isLoading: boolean;
  handleSendMessage: (content: string, attachments?: any[]) => void;
  handleCancel: () => void;
  handleDeleteMessage: (messageId: string) => void;
  handleUpdateMessageContent: (messageId: string, content: string) => void;
  handleRegenerate: (messageId: string) => void;
  handleEditAndResubmit: (messageId: string, content: string) => void;
  
  // 聊天创建
  handleNewChat: (personaId?: string | null) => void;
  handleSelectChat: (id: string) => void;
}

/**
 * AppData Hook - 处理业务数据管理
 * 职责：聊天会话管理、人格数据管理、消息操作
 */
export const useAppData = (
  settings: Settings,
  isStorageLoaded: boolean,
  onSettingsChange: (settings: Partial<Settings>) => void,
  addToast?: (message: string, type: 'success' | 'error' | 'info') => void
): UseAppDataReturn => {
  const { addToast: addToastFromContext } = useToast();
  const { t } = useLocalization();
  const toast = addToast || addToastFromContext;

  // 聊天数据管理
  const { 
    chats, 
    setChats, 
    folders, 
    setFolders, 
    activeChatId, 
    setActiveChatId, 
    ...chatDataHandlers 
  } = useChatData({ 
    settings, 
    isStorageLoaded, 
    onSettingsChange 
  });

  // 人格数据管理
  const { 
    personas, 
    setPersonas, 
    savePersonas, 
    deletePersona, 
    loading: personasLoading, 
    error: personasError, 
    clearError 
  } = usePersonas({ 
    isStorageLoaded 
  });

  // 聊天消息管理
  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const availableModels = settings.availableModels || [];

  const {
    isLoading,
    handleSendMessage,
    handleCancel,
    handleDeleteMessage,
    handleUpdateMessageContent,
    handleRegenerate,
    handleEditAndResubmit,
  } = useChatMessaging({
    settings,
    activeChat,
    personas,
    setChats,
    setActiveChatId,
    addToast: toast,
    availableModels,
  });

  // 处理新聊天创建
  const handleNewChat = useCallback(
    (personaId?: string | null) => {
      if (personasLoading) {
        toast('角色数据正在加载，请稍后再试', 'info');
        return;
      }

      const selectedPersonaId = personaId ?? settings.defaultPersona;
      const persona = selectedPersonaId ? personas.find((p) => p && p.id === selectedPersonaId) : null;

      if (persona) {
        // 优先级：角色默认模型 > 用户最后选择的模型 > 模型列表第一个
        const modelToUse = persona.model ?? settings.lastSelectedModel ?? availableModels[0] ?? '';

        const newChatSession: ChatSession = {
          id: crypto.randomUUID(),
          title: persona.name || 'New Persona Chat',
          messages: [],
          createdAt: Date.now(),
          model: modelToUse,
          folderId: null,
          personaId: persona.id,
        };
        setChats((prev) => [newChatSession, ...prev]);
        setActiveChatId(newChatSession.id);
      } else {
        setActiveChatId(null);
        if (personas.length === 0) {
          toast('角色列表正在加载中，请稍后再试', 'info');
        } else {
          toast('未找到默认角色，请先在设置中配置一个角色', 'info');
        }
      }
    },
    [
      settings.defaultPersona,
      settings.lastSelectedModel,
      availableModels,
      personas,
      setChats,
      setActiveChatId,
      toast,
      personasLoading,
    ]
  );

  // 处理聊天选择
  const handleSelectChat = useCallback(
    (id: string) => {
      setActiveChatId(id);
    },
    [setActiveChatId]
  );

  return {
    // 聊天数据
    chats,
    setChats,
    folders,
    setFolders,
    activeChatId,
    setActiveChatId,
    activeChat,
    chatDataHandlers,
    
    // 人格数据
    personas,
    setPersonas,
    savePersonas,
    deletePersona,
    personasLoading,
    personasError,
    clearPersonasError: clearError,
    
    // 聊天消息操作
    isLoading,
    handleSendMessage,
    handleCancel,
    handleDeleteMessage,
    handleUpdateMessageContent,
    handleRegenerate,
    handleEditAndResubmit,
    
    // 聊天管理
    handleNewChat,
    handleSelectChat,
  };
};