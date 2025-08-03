import { useState, useCallback, useRef } from 'react';
import { ChatSession, Message, MessageRole, Settings, Persona, FileAttachment } from '../types';
import { sendMessageStream, generateChatDetails, generateSuggestedReplies } from '../services/geminiService';
import { fileToData } from '../utils/fileUtils';

interface UseChatMessagingProps {
  settings: Settings;
  activeChat: ChatSession | null;
  personas: Persona[];
  setChats: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  setSuggestedReplies: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  isNextChatStudyMode: boolean;
  setIsNextChatStudyMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useChatMessaging = ({ settings, activeChat, personas, setChats, setSuggestedReplies, setActiveChatId, addToast, isNextChatStudyMode, setIsNextChatStudyMode }: UseChatMessagingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isCancelledRef = useRef(false);

  const handleCancel = useCallback(() => {
    isCancelledRef.current = true;
    setIsLoading(false); 
  }, []);

  const _initiateStream = useCallback(async (chatId: string, historyForAPI: Message[], toolConfig: any, personaId: string | null | undefined, isStudyMode?: boolean) => {
    const apiKeys = settings.apiKey && settings.apiKey.length > 0
      ? settings.apiKey
      : (process.env.API_KEY ? [process.env.API_KEY] : []);
    
    if (apiKeys.length === 0) {
        addToast("Please set your Gemini API key in Settings.", 'error');
        setIsLoading(false);
        return;
    }

    isCancelledRef.current = false;
    setIsLoading(true);
    setSuggestedReplies([]);

    const chatSession = activeChat && activeChat.id === chatId 
        ? activeChat 
        : { id: chatId, messages: historyForAPI, model: settings.defaultModel, personaId, title: "New Chat", createdAt: Date.now(), folderId: null, isStudyMode };

    const activePersona = chatSession.personaId ? personas.find(p => p.id === chatSession.personaId) : null;

    const lastUserMessage = [...historyForAPI].reverse().find(m => m.role === MessageRole.USER);
    const promptContent = lastUserMessage?.content || '';
    const promptAttachments = lastUserMessage?.attachments || [];
    
    const modelMessage: Message = { id: crypto.randomUUID(), role: MessageRole.MODEL, content: "...", timestamp: Date.now(), groundingMetadata: null, thoughts: settings.showThoughts ? "" : undefined };
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, modelMessage] } : c));
    
    let fullResponse = "";
    let accumulatedThoughts = "";
    let finalGroundingMetadata: any = null;
    let streamHadError = false;

    try {
      const currentModel = chatSession.model;
      const effectiveToolConfig = { ...toolConfig, showThoughts: settings.showThoughts };
      const stream = sendMessageStream(apiKeys, historyForAPI.slice(0, -1), promptContent, promptAttachments, currentModel, settings, effectiveToolConfig, activePersona, chatSession.isStudyMode);
      
      for await (const chunk of stream) {
        if(isCancelledRef.current) break;

        // Check for error messages yielded from the stream wrapper
        if (chunk.text?.startsWith("Error:")) {
            streamHadError = true;
            fullResponse = chunk.text;
            break;
        }

        const candidate = chunk.candidates?.[0];
        if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
                if ((part as any).thought) {
                    if (settings.showThoughts && part.text) { accumulatedThoughts += part.text; }
                } else {
                    if (part.text) { fullResponse += part.text; }
                }
            }
        }
        
        if (candidate?.groundingMetadata) { finalGroundingMetadata = candidate.groundingMetadata; }

        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, content: fullResponse || '...', thoughts: settings.showThoughts ? accumulatedThoughts : undefined } : m) } : c));
      }

      if (finalGroundingMetadata && !isCancelledRef.current) {
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, groundingMetadata: finalGroundingMetadata } : m) } : c));
      }
    } catch(e) {
      console.error(e);
      if (!isCancelledRef.current) {
        streamHadError = true;
        const errorMessage = "Sorry, an error occurred during the request.";
        addToast(errorMessage, 'error');
        setChats(p => p.map(c => c.id === chatId ? { ...c, messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, content: errorMessage } : m) } : c));
      }
    } finally {
      if (!isCancelledRef.current) {
        setIsLoading(false);
        if (settings.showSuggestions && fullResponse && !streamHadError) {
          generateSuggestedReplies(apiKeys, [...historyForAPI, { ...modelMessage, content: fullResponse }], settings.suggestionModel, settings).then(setSuggestedReplies);
        }
      }
    }
  }, [settings, setChats, activeChat, personas, setSuggestedReplies, addToast]);

  const handleSendMessage = useCallback(async (content: string, files: File[] = [], toolConfig: any) => {
    const attachments = await Promise.all(files.map(fileToData));
      
    const userMessage: Message = { id: crypto.randomUUID(), role: MessageRole.USER, content: content, timestamp: Date.now(), attachments };
    
    let currentChatId = activeChat?.id;
    let history: Message[];
    let currentPersonaId = activeChat?.personaId;
    let currentIsStudyMode = activeChat?.isStudyMode;

    const apiKeys = settings.apiKey && settings.apiKey.length > 0
      ? settings.apiKey
      : (process.env.API_KEY ? [process.env.API_KEY] : []);

    if (!currentChatId) {
      currentPersonaId = null;
      currentIsStudyMode = isNextChatStudyMode;
      const newChat: ChatSession = { id: crypto.randomUUID(), title: content.substring(0, 40) || "New Chat", icon: "💬", messages: [userMessage], createdAt: Date.now(), model: settings.defaultModel, folderId: null, personaId: null, isStudyMode: currentIsStudyMode };
      currentChatId = newChat.id;
      history = newChat.messages;
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setIsNextChatStudyMode(false);
      if (settings.autoTitleGeneration && content) {
        if(apiKeys.length > 0) generateChatDetails(apiKeys, content, settings.titleGenerationModel, settings).then(({ title, icon }) => {
          setChats(p => p.map(c => c.id === currentChatId ? { ...c, title, icon } : c))
        });
      }
    } else {
      history = [...(activeChat?.messages || []), userMessage];
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, userMessage] } : c));
    }
    await _initiateStream(currentChatId, history, toolConfig, currentPersonaId, currentIsStudyMode);
  }, [activeChat, settings, setChats, setActiveChatId, _initiateStream, isNextChatStudyMode, setIsNextChatStudyMode]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (!activeChat?.id) return;
    const chatId = activeChat.id;
    setChats(prev => prev.map(chat => {
      if (chat.id !== chatId) return chat;
      
      const messages = [...chat.messages];
      const index = messages.findIndex(m => m.id === messageId);
      if (index === -1) return chat;
      
      messages.splice(index, 1);
      
      return { ...chat, messages };
    }));
  }, [activeChat, setChats]);

  const handleUpdateMessageContent = useCallback((messageId: string, newContent: string) => {
    if (!activeChat?.id) return;
    const chatId = activeChat.id;
    setChats(prev => prev.map(chat => 
      chat.id === chatId
      ? { ...chat, messages: chat.messages.map(m => m.id === messageId ? { ...m, content: newContent } : m) }
      : chat
    ));
  }, [activeChat, setChats]);

  const handleRegenerate = useCallback(() => {
    if (!activeChat?.id || isLoading) return;

    const chatId = activeChat.id;
    const messages = activeChat.messages;

    let lastModelIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === MessageRole.MODEL) {
            lastModelIndex = i;
            break;
        }
    }

    if (lastModelIndex < 1 || messages[lastModelIndex - 1].role !== MessageRole.USER) return;

    const historyForResubmit = messages.slice(0, lastModelIndex);

    if (historyForResubmit.length > 0) {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: historyForResubmit } : c));
        const toolConfig = { codeExecution: false, googleSearch: settings.defaultSearch, urlContext: false };
        _initiateStream(chatId, historyForResubmit, toolConfig, activeChat.personaId, activeChat.isStudyMode);
    }
  }, [activeChat, isLoading, settings.defaultSearch, setChats, _initiateStream]);

  const handleEditAndResubmit = useCallback((messageId: string, newContent: string) => {
    if (!activeChat?.id || isLoading) return;
    
    const chatId = activeChat.id;
    const messages = activeChat.messages;
    const messageIndex = messages.findIndex(m => m.id === messageId);
    
    if (messageIndex === -1) return;

    const truncatedMessages = messages.slice(0, messageIndex);
    const updatedMessage = { ...messages[messageIndex], content: newContent };
    const historyForResubmit = [...truncatedMessages, updatedMessage];

    if (historyForResubmit.length > 0) {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: historyForResubmit } : c));
        const toolConfig = { codeExecution: false, googleSearch: settings.defaultSearch, urlContext: false };
        _initiateStream(chatId, historyForResubmit, toolConfig, activeChat.personaId, activeChat.isStudyMode);
    }
  }, [activeChat, isLoading, settings.defaultSearch, setChats, _initiateStream]);

  return { 
    isLoading, 
    handleSendMessage, 
    handleCancel,
    handleDeleteMessage,
    handleUpdateMessageContent,
    handleRegenerate,
    handleEditAndResubmit
  };
};