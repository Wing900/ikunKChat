import React, { useState, useCallback, useRef } from 'react';
import { ChatSession, Message, MessageRole, Settings, Persona, FileAttachment } from '../types';
import { sendMessageStream, generateChatDetails } from '../services/geminiService';
import { fileToData } from '../utils/fileUtils';
import { TITLE_GENERATION_PROMPT } from '../data/prompts';
import { saveAttachment } from '../services/indexedDBService';
import { getUserFacingMessage, logError } from '../utils/errorUtils';

interface UseChatMessagingProps {
  settings: Settings;
  activeChat: ChatSession | null;
  personas: Persona[];
  setChats: React.Dispatch<React.SetStateAction<ChatSession[]>>;

  setActiveChatId: React.Dispatch<React.SetStateAction<string | null>>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const useChatMessaging = ({ settings, activeChat, personas, setChats, setActiveChatId, addToast }: UseChatMessagingProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const isCancelledRef = useRef(false);
  let inactivityTimer: NodeJS.Timeout; // For stream watchdog

  const handleCancel = useCallback(() => {
    isCancelledRef.current = true;
    setIsLoading(false); 
  }, []);

  const _initiateStream = useCallback(async (chatId: string, historyForAPI: Message[], personaId: string | null | undefined) => {
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

    const chatSession = activeChat && activeChat.id === chatId 
        ? activeChat 
        : { id: chatId, messages: historyForAPI, model: settings.defaultModel, personaId, title: "New Chat", createdAt: Date.now(), folderId: null };

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
      const stream = sendMessageStream(apiKeys, historyForAPI.slice(0, -1), promptContent, promptAttachments, currentModel, settings, activePersona);
      
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
      let chunkCount = 0;

      for await (const chunk of stream) {
        if (isCancelledRef.current) {
          break;
        }
        resetInactivityTimer();
        chunkCount++;

        if (chunk.text?.startsWith("Error:")) {
          streamHadError = true;
          fullResponse = chunk.text;
          break;
        }

        const candidate = chunk.candidates?.[0];
        if (candidate?.finishReason) {
          const reason = candidate.finishReason;

          if (reason === 'SAFETY') {
            streamHadError = true;
            fullResponse = "Google Cut It for Safety";
            addToast("Google Cut It for Safety", 'error');
          } else if (reason === 'MAX_TOKENS') {
            streamHadError = true;
            fullResponse = "Google Cut It for Max Length";
            addToast("Google Cut It for Max Length", 'error');
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

      clearTimeout(inactivityTimer);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      // Final, immediate update for the complete response
      if (!isCancelledRef.current) {
        // Final check for empty response after a "STOP" reason, which can indicate a silent refusal to answer.
        if (!streamHadError && fullResponse.trim().length === 0) {
          streamHadError = true;
          fullResponse = "Google Cut It for Unknown Reason";
          addToast("Google Cut It for Unknown Reason", 'error');
        }
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, content: fullResponse || '...', thoughts: settings.showThoughts ? accumulatedThoughts : undefined, groundingMetadata: finalGroundingMetadata, thinkingTime } : m) } : c));
      }
    } catch (error) {
      logError(error, 'ChatStream');
      if (!isCancelledRef.current) {
        streamHadError = true;
        const errorMessage = getUserFacingMessage(error, '请求过程中发生错误。');
        addToast(errorMessage, 'error');
        setChats(p => p.map(c => c.id === chatId ? { ...c, messages: c.messages.map(m => m.id === modelMessage.id ? { ...m, content: errorMessage } : m) } : c));
      }
    } finally {
      clearTimeout(inactivityTimer); // Ensure timer is cleared in finally block
      if (!isCancelledRef.current) {
        setIsLoading(false);
      }
    }
  }, [settings, setChats, activeChat, personas, addToast]);

  const handleSendMessage = useCallback(async (content: string, files: File[] = []) => {
    console.log(`\n[消息发送] 📤 开始处理消息发送`);
    console.log(`[消息发送] 📝 消息内容长度: ${content.length} 字符`);
    console.log(`[消息发送] 📎 附件数量: ${files.length} 个`);
    
    // 串行处理文件以避免内存峰值
    const attachments: FileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`\n[附件处理] 🔄 处理附件 ${i + 1}/${files.length}: "${file.name}"`);
      
      try {
        const attachment = await fileToData(file);
        
        console.log(`[附件处理] ✅ 文件转换成功`);
        console.log(`[附件处理] 📊 附件对象 - 名称: "${attachment.name}", MIME: ${attachment.mimeType}, data存在: ${!!attachment.data}, data类型: ${typeof attachment.data}, data长度: ${attachment.data?.length || 0}`);
        
        // 验证附件数据有效性
        if (!attachment.data || typeof attachment.data !== 'string') {
          console.error(`[附件处理] ❌ 附件数据无效!`);
          console.error(`[附件处理] ❌ data字段: ${attachment.data === undefined ? 'undefined' : attachment.data === null ? 'null' : typeof attachment.data}`);
          addToast(`文件 "${file.name}" 数据无效，已跳过`, 'error');
          continue; // 跳过这个无效附件
        }
        
        // 生成唯一 ID 并保存到 IndexedDB
        const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`[附件处理] 🆔 生成附件ID: ${attachmentId}`);
        
        if (attachment.data) {
          try {
            console.log(`[附件处理] 💾 尝试保存到IndexedDB...`);
            await saveAttachment(attachmentId, attachment.data, attachment.mimeType, attachment.name);
            console.log(`[附件处理] ✅ IndexedDB保存成功: ${attachmentId} (${attachment.name})`);
          } catch (dbError) {
            console.error(`[附件处理] ⚠️ IndexedDB保存失败，将使用内存存储 (${attachment.name}):`, dbError);
            // 如果 IndexedDB 保存失败，继续使用 data 字段（降级处理）
          }
        }
        
        // 保存引用（ID）到消息中，保留 data 用于当前会话
        const attachmentObject = {
          id: attachmentId,
          name: attachment.name,
          mimeType: attachment.mimeType,
          data: attachment.data // 保留用于当前会话显示
        };
        
        console.log(`[附件处理] ✅ 附件对象创建完成`);
        console.log(`[附件处理] 🔍 最终验证 - data存在: ${!!attachmentObject.data}, data类型: ${typeof attachmentObject.data}, data长度: ${attachmentObject.data?.length || 0}`);
        
        attachments.push(attachmentObject);
        console.log(`[附件处理] ✅ 附件 ${i + 1}/${files.length} 处理成功并添加到列表`);
        
      } catch (error) {
        logError(error, 'AttachmentProcessing', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        });
        const friendlyMessage = getUserFacingMessage(error, '未知错误');
        addToast(`文件 "${file.name}" 处理失败: ${friendlyMessage}`, 'error');
        // 继续处理其他文件，不因为单个文件失败而中断
      }
    }
    
    console.log(`\n[附件处理] 📊 处理结果汇总:`);
    console.log(`[附件处理] 📥 输入文件数: ${files.length}`);
    console.log(`[附件处理] ✅ 成功处理数: ${attachments.length}`);
    console.log(`[附件处理] ❌ 失败/跳过数: ${files.length - attachments.length}`);
    
    // 详细列出所有成功的附件
    attachments.forEach((att, idx) => {
      console.log(`[附件处理] 📌 附件[${idx}] - 名称: "${att.name}", MIME: ${att.mimeType}, data有效: ${!!att.data && typeof att.data === 'string'}, 大小: ${att.data?.length || 0} 字符`);
    });
      
    const userMessage: Message = { id: crypto.randomUUID(), role: MessageRole.USER, content: content, timestamp: Date.now(), attachments };
    
    let currentChatId = activeChat?.id;
    let history: Message[];
    let currentPersonaId = activeChat?.personaId;

    const apiKeys = settings.apiKey && settings.apiKey.length > 0
      ? settings.apiKey
      : (process.env.API_KEY ? [process.env.API_KEY] : []);

    // 判断是否是第一条用户消息（用于标题生成）
    const isFirstUserMessage = !currentChatId || (activeChat?.messages || []).filter(m => m.role === MessageRole.USER).length === 0;

    if (!currentChatId) {
      console.log(`[Chat] Creating new chat - Content: "${content.substring(0, 30)}..."`);
      currentPersonaId = settings.defaultPersona;
      const persona = personas.find(p => p.id === currentPersonaId);
      const newChat: ChatSession = { id: crypto.randomUUID(), title: persona?.name || content.substring(0, 40) || "New Chat", icon: (persona?.avatar?.type === 'emoji' ? persona.avatar.value : '👤') || "💬", messages: [userMessage], createdAt: Date.now(), model: persona?.model || settings.defaultModel, folderId: null, personaId: currentPersonaId };
      currentChatId = newChat.id;
      history = newChat.messages;
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    } else {
      console.log(`[Chat] Continuing existing chat - ID: ${currentChatId}`);
      history = [...(activeChat?.messages || []), userMessage];
      setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, userMessage] } : c));
    }

    // 标题自动生成逻辑 - 只在第一条用户消息时触发
    if (isFirstUserMessage && settings.autoTitleGeneration && content && apiKeys.length > 0) {
      const persona = personas.find(p => p.id === currentPersonaId);
      console.log(`[Title Gen] ✨ Triggering - First message, Persona: ${persona?.name || 'None'}, Model: ${settings.titleGenerationModel}`);
      const fullPrompt = `${TITLE_GENERATION_PROMPT}\n\n**CONVERSATION:**\n${content}`;
      generateChatDetails(apiKeys, fullPrompt, settings.titleGenerationModel, settings).then(({ title }) => {
        console.log(`[Title Gen] ✅ Applied - Title: "${title}"`);
        setChats(p => p.map(c => c.id === currentChatId ? { ...c, title } : c))
      }).catch(error => {
        logError(error, 'TitleGeneration');
      });
    } else if (isFirstUserMessage) {
      console.log(`[Title Gen] ⏭️ Skipped - Enabled: ${settings.autoTitleGeneration}, Content: ${!!content}, Keys: ${apiKeys.length > 0}`);
    }

    await _initiateStream(currentChatId, history, currentPersonaId);
  }, [activeChat, settings, setChats, setActiveChatId, _initiateStream, personas]);

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
        _initiateStream(chatId, historyForResubmit, activeChat.personaId);
    }
  }, [activeChat, isLoading, setChats, _initiateStream]);

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
        _initiateStream(chatId, historyForResubmit, activeChat.personaId);
    }
  }, [activeChat, isLoading, setChats, _initiateStream]);

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