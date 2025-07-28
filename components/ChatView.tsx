import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatSession, Message, MessageRole, Settings } from '../types';
import { Icon } from './Icon';
import { ModelSelector } from './ModelSelector';
import { WelcomeView } from './WelcomeView';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { SuggestedReplies } from './SuggestedReplies';
import { useLocalization } from '../contexts/LocalizationContext';

interface ChatViewProps {
  chatSession: ChatSession | null;
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
}

export const ChatView: React.FC<ChatViewProps> = (props) => {
  const { chatSession, onSendMessage, isLoading, onCancelGeneration, currentModel, onSetCurrentModel, onSetModelForActiveChat, availableModels, isSidebarCollapsed, onToggleSidebar, onToggleMobileSidebar, onNewChat, onImageClick, suggestedReplies, settings, onDeleteMessage, onUpdateMessageContent, onRegenerate, onEditAndResubmit, onShowCitations } = props;
  const { t } = useLocalization();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messagesToDisplay, setMessagesToDisplay] = useState<Message[] | null>([]);
  const prevChatIdRef = useRef<string | null | undefined>(undefined);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const getDefaultToolConfig = useCallback(() => ({
    codeExecution: false,
    googleSearch: false, // The UI switch should start OFF by default.
    urlContext: { enabled: false, url: '' },
  }), []);
  
  const [toolConfig, setToolConfig] = useState(getDefaultToolConfig());

  useEffect(() => {
    const currentChatId = chatSession?.id;
    if (currentChatId !== prevChatIdRef.current) {
      setMessagesToDisplay(null); 
      const timer = setTimeout(() => { setMessagesToDisplay(chatSession?.messages || []); }, 50);
      prevChatIdRef.current = currentChatId;
      setToolConfig(getDefaultToolConfig());
      setEditingMessageId(null);
      return () => clearTimeout(timer);
    } else if (chatSession) {
      setMessagesToDisplay(chatSession.messages);
    }
  }, [chatSession, getDefaultToolConfig]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isLoading || messagesToDisplay === null || editingMessageId) return;
    scrollToBottom();
  }, [messagesToDisplay, scrollToBottom, isLoading, editingMessageId]);

  const handleSendMessageWithTools = (message: string, files: File[]) => {
    onSendMessage(message, files, toolConfig);
  };
  
  const handleSendSuggestion = (suggestion: string) => {
    const suggestionToolConfig = {
        codeExecution: false,
        googleSearch: settings.defaultSearch,
        urlContext: { enabled: false, url: '' },
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

  if (!chatSession) {
    return (
        <main className="glass-pane rounded-[var(--radius-2xl)] flex flex-col h-full overflow-hidden relative">
            <button onClick={onToggleMobileSidebar} className="md:hidden absolute top-3 left-3 z-20 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label={t('showSidebar')} data-tooltip={t('showSidebar')} data-tooltip-placement="right"><Icon icon="menu" className="w-6 h-6" /></button>
            <button onClick={onNewChat} className="md:hidden absolute top-3 right-3 z-20 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label={t('newChat')} data-tooltip={t('newChat')} data-tooltip-placement="left"><Icon icon="plus" className="w-6 h-6" /></button>
            {isSidebarCollapsed && <button onClick={onToggleSidebar} className="md:flex hidden items-center justify-center absolute top-3 left-3 z-20 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label={t('showSidebar')} data-tooltip={t('showSidebar')} data-tooltip-placement="right"><Icon icon="menu" className="w-6 h-6" /></button>}
            <WelcomeView currentModel={currentModel} onSetCurrentModel={onSetCurrentModel} availableModels={availableModels} />
            <ChatInput onSendMessage={handleSendMessageWithTools} isLoading={isLoading} onCancel={onCancelGeneration} toolConfig={toolConfig} onToolConfigChange={setToolConfig} />
        </main>
    );
  }

  return (
    <main className="glass-pane rounded-[var(--radius-2xl)] flex flex-col h-full overflow-hidden relative">
        <button onClick={onToggleMobileSidebar} className="md:hidden absolute top-3 left-3 z-20 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label={t('showSidebar')} data-tooltip={t('showSidebar')} data-tooltip-placement="right"><Icon icon="menu" className="w-6 h-6" /></button>
        {isSidebarCollapsed && <button onClick={onToggleSidebar} className="md:flex hidden items-center justify-center absolute top-3 left-3 z-20 p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label={t('showSidebar')} data-tooltip={t('showSidebar')} data-tooltip-placement="right"><Icon icon="menu" className="w-6 h-6" /></button>}
        
        <header className={`p-4 pl-14 md:pl-4 border-b border-[var(--glass-border)] flex-shrink-0 flex items-center justify-between gap-4 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-16' : ''}`}>
            <div className="flex items-center gap-4 truncate">
              <span className="text-2xl">{chatSession.icon || "💬"}</span>
              <h2 className="text-xl font-bold text-[var(--text-color)] truncate">{chatSession.title}</h2>
            </div>
            <div className="w-64 flex-shrink-0 hidden md:block">
              <ModelSelector models={availableModels} selectedModel={chatSession.model} onModelChange={onSetModelForActiveChat} isHeader={true}/>
            </div>
            <button onClick={onNewChat} className="md:hidden p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" aria-label={t('newChat')} data-tooltip={t('newChat')} data-tooltip-placement="left"><Icon icon="plus" className="w-6 h-6" /></button>
        </header>

        <div className="flex-grow overflow-y-auto p-4">
            {messagesToDisplay === null ? (
              <div className="flex justify-center items-center h-full"><div className="w-8 h-8 border-4 border-[var(--glass-border)] border-t-[var(--accent-color)] rounded-full animate-spin"></div></div>
            ) : (
              messagesToDisplay.map((msg, index) => (<MessageBubble key={msg.id} message={msg} index={index} onImageClick={onImageClick} settings={settings} isLastMessageLoading={isLoading && index === messagesToDisplay.length - 1} isEditing={editingMessageId === msg.id} onEditRequest={() => setEditingMessageId(msg.id)} onCancelEdit={() => setEditingMessageId(null)} onSaveEdit={handleSaveEdit} onDelete={onDeleteMessage} onRegenerate={onRegenerate} onCopy={handleCopy} onShowCitations={onShowCitations} />))
            )}
            <div ref={messagesEndRef} />
        </div>
        
        {!isLoading && suggestedReplies.length > 0 && !editingMessageId && <SuggestedReplies suggestions={suggestedReplies} onSendSuggestion={handleSendSuggestion} />}

        <ChatInput onSendMessage={handleSendMessageWithTools} isLoading={isLoading} onCancel={onCancelGeneration} toolConfig={toolConfig} onToolConfigChange={setToolConfig} />
    </main>
  );
};