import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChatSession, Message, Settings, Persona } from '../types';
import { Icon } from './Icon';
import { WelcomeView } from './WelcomeView';
import { MessageBubble } from './MessageBubble';
import { ChatInput, ChatInputRef } from './chat/ChatInput';
import { PDFParseResult } from '../services/pdfService';

import { useLocalization } from '../contexts/LocalizationContext';
import { InternalView } from './common/InternalView';
import { ChatHeader } from './chat/ChatHeader';
import { ChatContextProvider } from '../contexts/ChatContext';

// 消息操作配置
interface MessageActions {
  onSendMessage: (message: string, files: File[], pdfDocuments?: PDFParseResult[]) => void;
  onDeleteMessage: (messageId: string) => void;
  onUpdateMessageContent: (messageId: string, newContent: string) => void;
  onRegenerate: () => void;
  onEditAndResubmit: (messageId: string, newContent: string) => void;
  onEditMessage: (message: Message) => void;
}

// 模型配置
interface ModelConfig {
  currentModel: string;
  availableModels: string[];
  onSetCurrentModel: (model: string) => void;
  onSetModelForActiveChat: (model: string) => void;
}

// UI 交互配置
interface UIInteractions {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
  onImageClick: (src: string) => void;
  onShowCitations: (chunks: any[]) => void;
}

// 聊天管理配置
interface ChatManagement {
  onNewChat: (personaId?: string) => void;
  onDeleteChat: (id: string) => void;
  onEditChat: (chat: ChatSession) => void;
}

interface ChatViewProps {
  // 核心数据
  chatSession: ChatSession | null;
  personas: Persona[];
  settings: Settings;
  isLoading: boolean;
  
  // 分组配置
  messageActions: MessageActions;
  modelConfig: ModelConfig;
  uiInteractions: UIInteractions;
  chatManagement: ChatManagement;
  
  // 生成控制
  onCancelGeneration: () => void;
}

export const ChatView: React.FC<ChatViewProps> = (props) => {
  const { chatSession, personas, isLoading, settings, messageActions, chatManagement } = props;
  const { t } = useLocalization();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  const activePersona = useMemo(() =>
    chatSession?.personaId ? personas.find(p => p && p.id === chatSession.personaId) : null
  , [chatSession?.personaId, personas]);

  const prevChatIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (chatSession?.id !== prevChatIdRef.current) {
        setEditingMessageId(null);
        setChatInput('');
    }
    prevChatIdRef.current = chatSession?.id;
  }, [chatSession]);

  useEffect(() => {
    if (isLoading || editingMessageId || !chatSession) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession, chatSession?.messages, isLoading, editingMessageId]);

  const handleSendMessageWithTools = (message: string, files: File[], pdfDocuments?: PDFParseResult[]) => {
    messageActions.onSendMessage(message, files, pdfDocuments);
    setChatInput('');
  };


  const handleSaveEdit = useCallback((message: Message, newContent: string) => {
    if (message.role === 'user') {
      messageActions.onEditAndResubmit(message.id, newContent);
    } else {
      messageActions.onUpdateMessageContent(message.id, newContent);
    }
    setEditingMessageId(null);
  }, [messageActions]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);
  
  // Study Mode 功能已移除（等待其他 AI 清理）
  const handleToggleStudyMode = (enabled: boolean) => {
    console.warn('[ChatView] Study Mode feature is being removed');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) setIsDraggingOver(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDraggingOver(false);
  };
  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files?.length) {
        chatInputRef.current?.addFiles(Array.from(e.dataTransfer.files));
        e.dataTransfer.clearData();
    }
  };

  return (
    <ChatContextProvider value={{
      settings,
      personas,
      onImageClick: props.uiInteractions.onImageClick,
      onShowCitations: props.uiInteractions.onShowCitations
    }}>
      <main
        className="rounded-[var(--radius-2xl)] flex flex-col h-full overflow-hidden relative"
        onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={(e) => {e.preventDefault(); e.stopPropagation();}} onDrop={handleDrop}
      >
        <div className={`dropzone-overlay ${isDraggingOver ? 'visible' : ''}`}>
            <div className="dropzone-overlay-content">
                <Icon icon="upload" className="w-20 h-20" />
                <h3 className="text-2xl font-bold">Drop files here to upload</h3>
            </div>
        </div>
        
        <ChatHeader
          chatSession={chatSession}
          onNewChat={chatManagement.onNewChat}
          availableModels={props.modelConfig.availableModels}
          onSetModelForActiveChat={props.modelConfig.onSetModelForActiveChat}
          currentModel={props.modelConfig.currentModel}
          isSidebarCollapsed={props.uiInteractions.isSidebarCollapsed}
          onToggleSidebar={props.uiInteractions.onToggleSidebar}
          onToggleMobileSidebar={props.uiInteractions.onToggleMobileSidebar}
        />
        
        <div className="flex-grow flex flex-col relative min-h-0">
            <InternalView active={!!chatSession}>
              <div className="flex-grow overflow-y-auto pt-1 pb-5">
                <div className={`w-full px-6 transition-all duration-300 ${props.uiInteractions.isSidebarCollapsed ? 'max-w-6xl mx-auto' : 'max-w-[672px] mx-auto'}`}>
                  {(chatSession?.messages || []).map((msg, index) => (
                    <MessageBubble key={msg.id} message={msg} index={index} persona={activePersona} isLastMessageLoading={isLoading && index === chatSession!.messages.length - 1} isEditing={editingMessageId === msg.id} onEditRequest={() => messageActions.onEditMessage(msg)} onCancelEdit={handleCancelEdit} onSaveEdit={handleSaveEdit} onDelete={messageActions.onDeleteMessage} onRegenerate={messageActions.onRegenerate} onCopy={handleCopy} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </InternalView>

            <InternalView active={!chatSession}>
              <WelcomeView
                currentModel={props.modelConfig.currentModel}
                onSetCurrentModel={props.modelConfig.onSetCurrentModel}
                availableModels={props.modelConfig.availableModels}
                personas={props.personas}
                onStartChat={props.chatManagement.onNewChat}
                settings={props.settings}
                isSidebarCollapsed={props.uiInteractions.isSidebarCollapsed}
              />
            </InternalView>
        </div>
        
        <div className={`w-full px-6 transition-all duration-300 ${props.uiInteractions.isSidebarCollapsed ? 'max-w-6xl mx-auto' : 'max-w-[672px] mx-auto'}`}>
          <ChatInput
            ref={chatInputRef}
            onSendMessage={handleSendMessageWithTools}
            isLoading={isLoading}
            onCancel={props.onCancelGeneration}
            input={chatInput}
            setInput={setChatInput}
            chatSession={chatSession}
            onToggleStudyMode={handleToggleStudyMode}
            isNextChatStudyMode={false}
            availableModels={props.modelConfig.availableModels}
            currentModel={props.modelConfig.currentModel}
            onSetModelForActiveChat={props.modelConfig.onSetModelForActiveChat}
          />
        </div>
      </main>
    </ChatContextProvider>
  );
};