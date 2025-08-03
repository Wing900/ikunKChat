import React, { useState, useEffect } from 'react';
import { Message, MessageRole, Settings, Persona } from '../types';
import { Icon } from './Icon';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useLocalization } from '../contexts/LocalizationContext';
import { PersonaAvatar } from './common/PersonaAvatar';
import { MessageActions } from './MessageActions';

interface MessageBubbleProps {
    message: Message;
    index: number;
    onImageClick: (src: string) => void;
    settings: Settings;
    persona: Persona | null;
    isLastMessageLoading?: boolean;
    isEditing: boolean;
    onEditRequest: () => void;
    onCancelEdit: () => void;
    onSaveEdit: (message: Message, newContent: string) => void;
    onDelete: (messageId: string) => void;
    onRegenerate: () => void;
    onCopy: (content: string) => void;
    onShowCitations: (chunks: any[]) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = (props) => {
  const { message, index, onImageClick, settings, persona, isEditing, onEditRequest, onCancelEdit, onSaveEdit, onDelete, onRegenerate, onCopy, onShowCitations } = props;
  const { t } = useLocalization();
  const isUser = message.role === MessageRole.USER;
  const hasContent = message.content && message.content !== '...';
  const hasThoughts = message.thoughts && message.thoughts.trim().length > 0;
  const isPulsing = message.content === '...';

  const [isThoughtsOpen, setIsThoughtsOpen] = useState(false);
  const hasCitations = message.groundingMetadata?.groundingChunks?.length > 0;
  
  const [editedContent, setEditedContent] = useState(message.content);
  const [isBeingDeleted, setIsBeingDeleted] = useState(false);
  const [isRawView, setIsRawView] = useState(false);

  useEffect(() => {
    setEditedContent(message.content);
    setIsRawView(false); // Reset raw view when edit mode is toggled
  }, [message.content, isEditing]);
  
  const handleDelete = () => { setIsBeingDeleted(true); setTimeout(() => onDelete(message.id), 350); };
  const handleSave = () => { if (editedContent.trim()) onSaveEdit(message, editedContent); };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') { e.preventDefault(); onCancelEdit(); }
  };

  return (
    <div
      className={`message-row group flex items-start gap-3 mt-4 relative ${isUser ? 'justify-end' : 'justify-start'} ${isBeingDeleted ? 'deleting' : ''}`}
      style={{ animationDelay: `${Math.min(index * 100, 500)}ms` }}
    >
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[var(--accent-color)] flex items-center justify-center text-white overflow-hidden">
          {persona ? <PersonaAvatar avatar={persona.avatar} className="text-xl"/> : <Icon icon="kchat" className="w-5 h-5"/>}
        </div>
      )}
      
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`max-w-xl text-base flex flex-col relative transition-all duration-300 ${isUser ? 'bg-[var(--accent-color)] text-white rounded-[var(--radius-2xl)] rounded-br-lg' : 'model-bubble rounded-[var(--radius-2xl)] rounded-bl-lg'}`}>
          <div className={`grid transition-all duration-300 ease-in-out ${isEditing ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
            <div className="overflow-hidden">
              {hasThoughts && (
                  <div className="thoughts-container">
                      <button onClick={() => setIsThoughtsOpen(!isThoughtsOpen)} className="thoughts-expander-header">
                          <Icon icon="brain" className="w-4 h-4" />
                          <span>{t('thoughts')}</span>
                          <Icon icon="chevron-down" className={`w-4 h-4 transition-transform duration-200 ml-auto ${isThoughtsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`thoughts-expander-content ${isThoughtsOpen ? 'expanded' : ''}`}>
                          <div className="inner-content"><MarkdownRenderer content={message.thoughts!} theme={settings.theme} /></div>
                      </div>
                  </div>
              )}
              <div className={`p-4 ${isPulsing ? 'animate-pulse' : ''} ${isUser ? '' : 'text-[var(--text-color)]'}`}>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {message.attachments.map((att, i) => (
                        <div key={i} className="rounded-lg overflow-hidden border border-black/10 dark:border-white/10 max-w-[200px]">
                          {att.mimeType.startsWith('image/') && att.data ? (
                            <button onClick={() => onImageClick(`data:${att.mimeType};base64,${att.data}`)} className="block w-full h-full">
                              <img src={`data:${att.mimeType};base64,${att.data}`} className="max-h-[200px] object-contain" alt={att.name} />
                            </button>
                          ) : (
                             <div className="p-3 bg-black/10 dark:bg-white/10 flex items-center gap-2 text-current">
                              <Icon icon="file" className="w-6 h-6 flex-shrink-0" />
                              <span className="text-sm truncate">{att.name}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {hasContent && (
                    <div className="grid items-start">
                      {/* Rendered View */}
                      <div className={`col-start-1 row-start-1 grid transition-all duration-300 ease-in-out ${isRawView ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`} aria-hidden={isRawView}>
                        <div className="overflow-hidden">
                            <MarkdownRenderer content={message.content} theme={settings.theme} />
                        </div>
                      </div>
                      {/* Raw View */}
                      <div className={`col-start-1 row-start-1 grid transition-all duration-300 ease-in-out ${isRawView ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`} aria-hidden={!isRawView}>
                        <div className="overflow-hidden">
                            <pre className="raw-text-view"><code>{message.content}</code></pre>
                        </div>
                      </div>
                    </div>
                  )}
                  {isPulsing && <div className="whitespace-pre-wrap">{message.content}</div>}
              </div>
              {hasCitations && (
                  <div className="border-t border-[var(--glass-border)] mt-2 mx-2 mb-2 pt-2">
                      <button onClick={() => onShowCitations(message.groundingMetadata!.groundingChunks)} className="citations-button">
                          <Icon icon="search" className="w-4 h-4" /><span>Sources</span>
                      </button>
                  </div>
              )}
            </div>
          </div>
          
          <div className={`grid transition-all duration-300 ease-in-out ${isEditing ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden p-2 w-full">
              <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} onKeyDown={handleKeyDown} className="message-edit-textarea" autoFocus={isEditing} />
              <div className="message-edit-actions">
                  <button onClick={onCancelEdit} className="px-3 py-1.5 rounded-[var(--radius-2xl)] font-semibold glass-pane border-none text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                  <button onClick={handleSave} className="px-3 py-1.5 rounded-[var(--radius-2xl)] font-semibold bg-[var(--accent-color)] text-white transition-transform hover:scale-105">{isUser ? 'Save & Resubmit' : t('save')}</button>
              </div>
            </div>
          </div>
        </div>
        <MessageActions message={message} isModelResponse={!isUser} onCopy={() => onCopy(message.content)} onEdit={onEditRequest} onDelete={handleDelete} onRegenerate={onRegenerate} onToggleRawView={() => setIsRawView(p => !p)} isRawView={isRawView} />
      </div>

       {isUser && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-[var(--text-color-secondary)]"><Icon icon="user" className="w-5 h-5"/></div>}
    </div>
  );
};