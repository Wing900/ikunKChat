import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatSession, Message, MessageRole, Settings, Persona } from '../types';
import { Icon } from './Icon';
import { ModelSelector } from './ModelSelector';
import { WelcomeView } from './WelcomeView';
import { MessageBubble } from './MessageBubble';
import { ChatInput, ChatInputRef } from './ChatInput';
import { SuggestedReplies } from './SuggestedReplies';
import { useLocalization } from '../contexts/LocalizationContext';

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
  onNewChat: () => void;
  onImageClick: (src: string) => void;
  suggestedReplies: string[];
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
}

const InternalView: React.FC<{ active: boolean; children: React.ReactNode }> = ({ active, children }) => {
    return (
        <div 
            className="absolute inset-0 flex flex-col transition-all duration-300 ease-in-out"
            style={{
                opacity: active ? 1 : 0,
                transform: `scale(${active ? 1 : 0.98})`,
                pointerEvents: active ? 'auto' : 'none',
            }}
        >
            {children}
        </div>
    );
};

export const ChatView: React.FC<ChatViewProps> = (props) => {
  const { chatSession, personas, onSendMessage, isLoading, onCancelGeneration, currentModel, onSetCurrentModel, onSetModelForActiveChat, availableModels, isSidebarCollapsed, onToggleSidebar, onToggleMobileSidebar, onNewChat, onImageClick, suggestedReplies, settings, onDeleteMessage, onUpdateMessageContent, onRegenerate, onEditAndResubmit, onShowCitations, onDeleteChat, onEditChat, onToggleStudyMode: onToggleSessionStudyMode, isNextChatStudyMode, onToggleNextChatStudyMode } = props;
  const { t } = useLocalization();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputRef>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragCounter = useRef(0);
  
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  const activePersona = chatSession?.personaId ? personas.find(p => p.id === chatSession.personaId) : null;

  const getDefaultToolConfig = useCallback(() => ({
    codeExecution: false,
    googleSearch: false,
    urlContext: false,
  }), []);
  
  const [toolConfig, setToolConfig] = useState(getDefaultToolConfig());
  
  const prevChatIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const currentChatId = chatSession?.id;
    if (currentChatId !== prevChatIdRef.current) {
        setToolConfig(getDefaultToolConfig());
        setEditingMessageId(null);
        setChatInput('');
    }
    prevChatIdRef.current = currentChatId;
  }, [chatSession, getDefaultToolConfig]);


  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isLoading || editingMessageId || !chatSession) return;
    scrollToBottom();
  }, [chatSession, chatSession?.messages, scrollToBottom, isLoading, editingMessageId]);

  const handleSendMessageWithTools = (message: string, files: File[]) => {
    onSendMessage(message, files, toolConfig);
    setChatInput('');
  };
  
  const handleSendSuggestion = (suggestion: string) => {
    const suggestionToolConfig = {
        codeExecution: false,
        googleSearch: settings.defaultSearch,
        urlContext: false,
    };
    onSendMessage(suggestion, [], suggestionToolConfig);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  }

  const handleSaveEdit = (message: Message, newContent: string) => {
    if (message.role === MessageRole.USER) {
      onEditAndResubmit(message.id, newContent);
    } else {
      onUpdateMessageContent(message.id, newContent);
    }
    setEditingMessageId(null);
  }
  
  const handleShareChat = useCallback(async () => {
    if (!chatSession) return;
    const chatText = chatSession.messages.map(m => `[${m.role === MessageRole.USER ? 'User' : 'AI'}]\n${m.content}`).join('\n\n---\n\n');
    const shareData = {
      title: chatSession.title,
      text: chatText,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(chatText);
        alert('Chat content copied to clipboard.');
      }
    } catch (err) {
      console.error('Error sharing chat:', err);
      await navigator.clipboard.writeText(chatText);
      alert('Sharing failed. Content copied to clipboard instead.');
    }
  }, [chatSession]);
  
  const handleDeleteChat = useCallback(() => {
    if (chatSession && window.confirm(t('deleteChatConfirm'))) {
      onDeleteChat(chatSession.id);
    }
  }, [chatSession, onDeleteChat, t]);

  const handleToggleStudyMode = (enabled: boolean) => {
    if (chatSession) {
      onToggleSessionStudyMode(chatSession.id, enabled);
    } else {
      onToggleNextChatStudyMode(enabled);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
        setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        chatInputRef.current?.addFiles(droppedFiles);
        e.dataTransfer.clearData();
    }
  };


  const ChatHeader = (
      <header className={`p-4 pl-14 md:pl-4 border-b border-[var(--glass-border)] flex-shrink-0 flex items-center justify-between gap-4 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-16' : ''}`}>
          <div className="flex items-center gap-4 truncate">
            <span className="text-2xl">{chatSession?.icon || "💬"}</span>
            <h2 className="text-xl font-bold text-[var(--text-color)] truncate">{chatSession?.title}</h2>
          </div>
          <div className="w-64 flex-shrink-0 hidden md:block">
            <ModelSelector models={availableModels} selectedModel={chatSession?.model || currentModel} onModelChange={onSetModelForActiveChat} isHeader={true}/>
          </div>
          <div className="md:hidden flex items-center gap-1 ml-auto">
            <button onClick={onNewChat} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" data-tooltip={t('newChat')} data-tooltip-placement="left">
              <Icon icon="plus" className="w-6 h-6" />
            </button>
          </div>
      </header>
  );

  const MessagesList = (
      <div className="flex-grow overflow-y-auto p-4">
          {(chatSession?.messages || []).map((msg, index) => (
            <MessageBubble key={msg.id} message={msg} index={index} onImageClick={onImageClick} settings={settings} persona={activePersona} isLastMessageLoading={isLoading && index === chatSession!.messages.length - 1} isEditing={editingMessageId === msg.id} onEditRequest={() => setEditingMessageId(msg.id)} onCancelEdit={() => setEditingMessageId(null)} onSaveEdit={handleSaveEdit} onDelete={onDeleteMessage} onRegenerate={onRegenerate} onCopy={handleCopy} onShowCitations={onShowCitations} />
          ))}
          <div ref={messagesEndRef} />
      </div>
  );

  return (
    <main
      className="glass-pane rounded-[var(--radius-2xl)] flex flex-col h-full overflow-hidden relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
        <button onClick={onToggleMobileSidebar} className="md:hidden absolute top-3 left-3 z-20 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label={t('showSidebar')} data-tooltip={t('showSidebar')} data-tooltip-placement="right"><Icon icon="menu" className="w-6 h-6" /></button>
        {isSidebarCollapsed && <button onClick={onToggleSidebar} className="md:flex hidden items-center justify-center absolute top-3 left-3 z-20 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label={t('showSidebar')} data-tooltip={t('showSidebar')} data-tooltip-placement="right"><Icon icon="menu" className="w-6 h-6" /></button>}
        
        <div className={`dropzone-overlay ${isDraggingOver ? 'visible' : ''}`}>
            <div className="dropzone-overlay-content">
                <Icon icon="upload" className="w-20 h-20" />
                <h3 className="text-2xl font-bold">Drop files here to upload</h3>
            </div>
        </div>
        
        <div className="flex-grow flex flex-col relative min-h-0">
            <InternalView active={!!chatSession}>
              {ChatHeader}
              {MessagesList}
            </InternalView>

            <InternalView active={!chatSession}>
              <WelcomeView currentModel={currentModel} onSetCurrentModel={onSetCurrentModel} availableModels={availableModels} />
            </InternalView>
        </div>
        
        {!isLoading && suggestedReplies.length > 0 && !editingMessageId && !chatInput && <SuggestedReplies suggestions={suggestedReplies} onSendSuggestion={handleSendSuggestion} />}

        <ChatInput ref={chatInputRef} onSendMessage={handleSendMessageWithTools} isLoading={isLoading} onCancel={onCancelGeneration} toolConfig={toolConfig} onToolConfigChange={setToolConfig} input={chatInput} setInput={setChatInput} chatSession={chatSession} onToggleStudyMode={handleToggleStudyMode} isNextChatStudyMode={isNextChatStudyMode}/>
    </main>
  );
};