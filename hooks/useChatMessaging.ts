import React, { useState, useCallback, useRef } from 'react';
import { ChatSession, Message, MessageRole, Settings, Persona, FileAttachment, PersonaMemory } from '../types';
import { sendMessageStream, generateChatDetails, generateSuggestedReplies } from '../services/geminiService';
import { fileToData } from '../utils/fileUtils';

interface UseChatMessagingProps {
  settings: Settings;
  activeChat: ChatSession | null;
  personas: Persona[];
  memories: Record<string, PersonaMemory[]>;
  setChats: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  setSuggestedReplies: React.Dispatch<React.SetStateAction<string[]>>;
  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  isNextChatStudyMode: boolean;
  setIsNextChatStudyMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useChatMessaging = ({ settings, activeChat, personas, memories, setChats, setSuggestedReplies, setActiveChatId, addToast, isNextChatStudyMode, setIsNextChatStudyMode }: UseChatMessagingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isCancelledRef = useRef(false);
  let inactivityTimer: NodeJS.Timeout; // For stream watchdog

  const handleCancel = useCallback(() => {
    isCancelledRef.current = true;
    setIsLoading(false); 
  }, []);

  const _initiateStream = useCallback(async (chatId: string, historyForAPI: Message[], toolConfig: any, personaId: string | null | undefined, isStudyMode?: boolean) => {
    const personaMemories = personaId ? memories[personaId] : undefined;
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

    const activePersona = chatSession.personaId ? personas.find(p => p && p.id === chatSession.personaId) : null;

    const lastUserMessage = [...historyForAPI].reverse().find(m => m.role === MessageRole.USER);
    const promptContent = lastUserMessage?.content || '';
    const promptAttachments = lastUserMessage?.attachments || [];
    
    const modelMessage: Message = { id: crypto.randomUUID(), role: MessageRole.MODEL, content: "...", timestamp: Date.now(), groundingMetadata: null, thoughts: settings.showThoughts ? "" : undefined };
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, modelMessage] } : c));
    
    let fullResponse = "";
    let accumulatedThoughts = "";
    let finalGroundingMetadata: any = null;
    let streamHadError = false;

    let thinkingTime: number | undefined = undefined;
    const thinkingStartTime = Date.now();

    try {
      const currentModel = chatSession.model;
      const effectiveToolConfig = { ...toolConfig, showThoughts: settings.showThoughts };
      const stream = sendMessageStream(apiKeys, historyForAPI.slice(0, -1), promptContent, promptAttachments, currentModel, settings, effectiveToolConfig, activePersona, chatSession.isStudyMode, personaMemories);
      
      // --- UI Update Logic using requestAnimationFrame ---
      let animationFrameId: number | null = null;
      let needsUpdate = false;

      const updateUI = () => {
        if (needsUpdate) {
          setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, content: fullResponse || '...', thoughts: settings.showThoughts ? accumulatedThoughts : undefined, thinkingTime } : m) } : c));
          needsUpdate = false;
        }
        if (!isCancelledRef.current && !streamHadError) {
          animationFrameId = requestAnimationFrame(updateUI);
        }
      };
      
      animationFrameId = requestAnimationFrame(updateUI);

      // --- Stream Watchdog ---
      const INACTIVITY_TIMEOUT_MS = (settings.streamInactivityTimeout || 60) * 1000;
      let inactivityTimer: NodeJS.Timeout;

      const resetInactivityTimer = () => {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
          if (!isCancelledRef.current) {
            console.warn("Stream inactivity timeout reached. Aborting.");
            isCancelledRef.current = true;
            streamHadError = true;
            fullResponse = "请求超时，模型响应时间过长或连接中断。";
            setChats(p => p.map(c => c.id === chatId ? { ...c, messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, content: fullResponse } : m) } : c));
            addToast(fullResponse, 'error');
          }
        }, INACTIVITY_TIMEOUT_MS);
      };

      resetInactivityTimer();

      console.log(`[STREAM_ANALYSIS] Starting to process stream for chat ${chatId} at ${new Date().toISOString()}`);
      let chunkCount = 0;

      for await (const chunk of stream) {
        if (isCancelledRef.current) {
          console.log(`[STREAM_ANALYSIS] Stream cancelled by user at chunk ${chunkCount}.`);
          break;
        }
        resetInactivityTimer();
        chunkCount++;
        const chunkSize = JSON.stringify(chunk).length;
        const chunkContentPreview = chunk.text ? `"${chunk.text.substring(0, 50)}..."` : "no text content";
        console.log(`[STREAM_ANALYSIS] Received chunk #${chunkCount} at ${new Date().toISOString()}. Size: ${chunkSize} bytes. Content preview: ${chunkContentPreview}`);

        if (chunk.text?.startsWith("Error:")) {
          streamHadError = true;
          fullResponse = chunk.text;
          console.error(`[STREAM_ANALYSIS] Stream error reported in chunk: ${chunk.text}`);
          break;
        }

        const candidate = chunk.candidates?.[0];
        if (candidate?.finishReason) {
          const reason = candidate.finishReason;
          console.log(`[STREAM_ANALYSIS] Received finish reason: "${reason}" at chunk #${chunkCount}.`);

          if (reason === 'SAFETY') {
            streamHadError = true;
            fullResponse = "Google Cut It for Safety";
            addToast("Google Cut It for Safety", 'error');
            console.log(`[STREAM_ANALYSIS] Identified as a "Google Cut It" event. Reason: ${reason}`);
          } else if (reason === 'MAX_TOKENS') {
            streamHadError = true;
            fullResponse = "Google Cut It for Max Length";
            addToast("Google Cut It for Max Length", 'error');
            console.log(`[STREAM_ANALYSIS] Identified as a "Google Cut It" event. Reason: ${reason}`);
          }
        }

        let hasNewContent = false;
        if (candidate?.content?.parts) {
          for (const part of candidate.content.parts) {
            if ((part as any).thought) {
              if (settings.showThoughts && part.text) { accumulatedThoughts += part.text; }
            } else {
              if (part.text) {
                fullResponse += part.text;
                hasNewContent = true;
              }
            }
          }
        }
        
        if (hasNewContent && thinkingTime === undefined) {
          thinkingTime = (Date.now() - thinkingStartTime) / 1000;
        }

        if (candidate?.groundingMetadata) { finalGroundingMetadata = candidate.groundingMetadata; }
        
        needsUpdate = true; // Signal that an update is ready for the next animation frame
      }
      console.log(`[STREAM_ANALYSIS] Stream processing finished for chat ${chatId} at ${new Date().toISOString()}. Total chunks: ${chunkCount}.`);
      
      clearTimeout(inactivityTimer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      // Final, immediate update for the complete response
      if (!isCancelledRef.current) {
        // Final check for empty response after a "STOP" reason, which can indicate a silent refusal to answer.
        if (!streamHadError && fullResponse.trim().length === 0) {
          streamHadError = true; // Also treat this as an error so suggestions don't generate
          fullResponse = "Google Cut It for Unknown Reason";
          addToast("Google Cut It for Unknown Reason", 'error');
          console.log(`[STREAM_ANALYSIS] Identified as a "Google Cut It" event. Reason: Empty response on normal stop.`);
        }
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, content: fullResponse || '...', thoughts: settings.showThoughts ? accumulatedThoughts : undefined, groundingMetadata: finalGroundingMetadata } : m) } : c));
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
      clearTimeout(inactivityTimer); // Ensure timer is cleared in finally block
      if (!isCancelledRef.current) {
        setIsLoading(false);
        if (settings.showSuggestions && fullResponse && !streamHadError) {
          generateSuggestedReplies(apiKeys, [...historyForAPI, { ...modelMessage, content: fullResponse }], settings.suggestionModel, settings).then(setSuggestedReplies);
        }
      }
    }
  }, [settings, setChats, activeChat, personas, memories, setSuggestedReplies, addToast]);

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
      currentPersonaId = settings.defaultPersona;
      currentIsStudyMode = isNextChatStudyMode;
      const persona = personas.find(p => p.id === currentPersonaId);
      const newChat: ChatSession = { id: crypto.randomUUID(), title: persona?.name || content.substring(0, 40) || "New Chat", icon: (persona?.avatar?.type === 'emoji' ? persona.avatar.value : '👤') || "💬", messages: [userMessage], createdAt: Date.now(), model: persona?.model || settings.defaultModel, folderId: null, personaId: currentPersonaId, isStudyMode: currentIsStudyMode };
      currentChatId = newChat.id;
      history = newChat.messages;
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setIsNextChatStudyMode(false);
      // 仅当未使用角色时才生成标题
      if (settings.autoTitleGeneration && content && !persona) {
        if(apiKeys.length > 0) generateChatDetails(apiKeys, content, settings.titleGenerationModel, settings).then(({ title, icon }) => {
          setChats(p => p.map(c => c.id === currentChatId ? { ...c, title, icon } : c))
        });
      }
    } else {
      history = [...(activeChat?.messages || []), userMessage];
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, userMessage] } : c));
    }
    await _initiateStream(currentChatId, history, toolConfig, currentPersonaId, currentIsStudyMode);
  }, [activeChat, settings, setChats, setActiveChatId, _initiateStream, isNextChatStudyMode, setIsNextChatStudyMode, personas]);

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