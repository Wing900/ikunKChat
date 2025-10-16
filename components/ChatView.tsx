import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChatSession, Message, Settings, Persona } from '../types';
import { Icon } from './Icon';
import { WelcomeView } from './WelcomeView';
import { MessageBubble } from './MessageBubble';
import { ChatInput, ChatInputRef } from './chat/ChatInput';

import { useLocalization } from '../contexts/LocalizationContext';
import { InternalView } from './common/InternalView';
import { ChatHeader } from './chat/ChatHeader';

interface ChatViewProps {
  chatSession: ChatSession | null;
  personas: Persona[];
  onSendMessage: (message: string, files: File[], toolConfig: any) => void;
  isLoading: boolean;
  onCancelGeneration: () => void;
  onSetModelForActiveChat: (model: string) => void;
  currentModel: string;
  onSetCurrentModel: (model: string) => void;
  availableModels: string[];
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
  onNewChat: (personaId?: string) => void;
  onImageClick: (src: string) => void;

  settings: Settings;
  onDeleteMessage: (messageId: string) => void;
  onUpdateMessageContent: (messageId: string, newContent: string) => void;
  onRegenerate: () => void;
  onEditAndResubmit: (messageId: string, newContent: string) => void;
  onShowCitations: (chunks: any[]) => void;
  onDeleteChat: (id: string) => void;
  onEditChat: (chat: ChatSession) => void;
  onToggleStudyMode: (chatId: string, enabled: boolean) => void;
  isNextChatStudyMode: boolean;
  onToggleNextChatStudyMode: (enabled: boolean) => void;
  onEditMessage: (message: Message) => void;
}

export const ChatView: React.FC<ChatViewProps> = (props) => {
  const { chatSession, personas, onSendMessage, isLoading, settings, onNewChat } = props;
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

  const getDefaultToolConfig = useCallback(() => ({ codeExecution: false, googleSearch: false, urlContext: false }), []);
  const [toolConfig, setToolConfig] = useState(getDefaultToolConfig());
  
  const prevChatIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (chatSession?.id !== prevChatIdRef.current) {
        setToolConfig(getDefaultToolConfig());
        setEditingMessageId(null);
        setChatInput('');
    }
    prevChatIdRef.current = chatSession?.id;
  }, [chatSession, getDefaultToolConfig]);

  useEffect(() => {
    if (isLoading || editingMessageId || !chatSession) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSession, chatSession?.messages, isLoading, editingMessageId]);

  const handleSendMessageWithTools = (message: string, files: File[]) => { onSendMessage(message, files, toolConfig); setChatInput(''); };


  const handleSaveEdit = useCallback((message: Message, newContent: string) => {
    if (message.role === 'user') {
      props.onEditAndResubmit(message.id, newContent);
    } else {
      props.onUpdateMessageContent(message.id, newContent);
    }
    setEditingMessageId(null);
  }, [props.onEditAndResubmit, props.onUpdateMessageContent]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const handleCopy = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);
  
  const handleToggleStudyMode = (enabled: boolean) => {
    if (chatSession) {
      props.onToggleStudyMode(chatSession.id, enabled);
    } else {
      props.onToggleNextChatStudyMode(enabled);
    }
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
          onNewChat={onNewChat} 
          availableModels={props.availableModels} 
          onSetModelForActiveChat={props.onSetModelForActiveChat} 
          currentModel={props.currentModel} 
          isSidebarCollapsed={props.isSidebarCollapsed}
          onToggleSidebar={props.onToggleSidebar}
          onToggleMobileSidebar={props.onToggleMobileSidebar}
        />
        
        <div className="flex-grow flex flex-col relative min-h-0">
            <InternalView active={!!chatSession}>
              <div className="flex-grow overflow-y-auto pt-1 pb-5">
                <div className={`w-full px-6 transition-all duration-300 ${props.isSidebarCollapsed ? 'max-w-6xl mx-auto' : 'max-w-[672px] mx-auto'}`}>
                  {(chatSession?.messages || []).map((msg, index) => (
                    <MessageBubble key={msg.id} message={msg} index={index} onImageClick={props.onImageClick} settings={settings} persona={activePersona} isLastMessageLoading={isLoading && index === chatSession!.messages.length - 1} isEditing={editingMessageId === msg.id} onEditRequest={() => props.onEditMessage(msg)} onCancelEdit={handleCancelEdit} onSaveEdit={handleSaveEdit} onDelete={props.onDeleteMessage} onRegenerate={props.onRegenerate} onCopy={handleCopy} onShowCitations={props.onShowCitations} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </InternalView>

            <InternalView active={!chatSession}>
              <WelcomeView
                currentModel={props.currentModel}
                onSetCurrentModel={props.onSetCurrentModel}
                availableModels={props.availableModels}
                personas={props.personas}
                onStartChat={props.onNewChat}
                settings={props.settings}
                isSidebarCollapsed={props.isSidebarCollapsed}
              />
            </InternalView>
        </div>
        
        <div className={`w-full px-6 transition-all duration-300 ${props.isSidebarCollapsed ? 'max-w-6xl mx-auto' : 'max-w-[672px] mx-auto'}`}>


          <ChatInput ref={chatInputRef} onSendMessage={handleSendMessageWithTools} isLoading={isLoading} onCancel={props.onCancelGeneration} toolConfig={toolConfig} onToolConfigChange={setToolConfig} input={chatInput} setInput={setChatInput} chatSession={chatSession} onToggleStudyMode={handleToggleStudyMode} isNextChatStudyMode={props.isNextChatStudyMode} availableModels={props.availableModels} currentModel={props.currentModel} onSetModelForActiveChat={props.onSetModelForActiveChat} />
        </div>
    </main>
  );
};