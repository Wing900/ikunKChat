import React, { useState, useEffect, useCallback } from 'react';
import { Message, MessageRole, Settings, Persona } from '../types';
import { Icon } from './Icon';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useLocalization } from '../contexts/LocalizationContext';
import { MessageActions } from './MessageActions';
import { getAttachment } from '../services/indexedDBService';
import { LazyImage } from './LazyImage';
import { useChatContext } from '../contexts/ChatContext';

const TypingIndicator: React.FC<{ thoughts?: string | null }> = ({ thoughts }) => {
  const [text, setText] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const hasThoughts = thoughts && thoughts.trim().length > 0;

    if (hasThoughts) {
      // Stage 2: Typewriter effect for "唱、跳、rap..." with static prefix
      const baseText = 'AI 正在';
      const animatedText = '唱、跳、rap...';
      let currentIndex = 0;
      let isPaused = false;

      interval = setInterval(() => {
        if (isPaused) return;

        if (currentIndex < animatedText.length) {
          setText(baseText + animatedText.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          // Pause at the end of the line before restarting
          isPaused = true;
          setTimeout(() => {
            currentIndex = 0;
            setText(baseText); // Reset to just the base text
            isPaused = false;
          }, 500); // Hold the full text for 500ms
        }
      }, 150); // Adjust typing speed here
    } else {
      // Stage 1: "..." animation
      const dots = ['\u00A0', '.', '..', '...'];
      let dotIndex = 0;

      interval = setInterval(() => {
        setText(dots[dotIndex]);
        dotIndex = (dotIndex + 1) % dots.length;
      }, 500);
    }

    return () => {
      clearInterval(interval);
    };
  }, [thoughts && thoughts.trim().length > 0]);

  return (
    <div className="whitespace-pre-wrap flex items-center gap-2">
      <span>{text}</span>
    </div>
  );
};

interface MessageBubbleProps {
    message: Message;
    index: number;
    persona: Persona | null;
    isLastMessageLoading?: boolean;
    isEditing: boolean;
    onEditRequest: () => void;
    onCancelEdit: () => void;
    onSaveEdit: (message: Message, newContent: string) => void;
    onDelete: (messageId: string) => void;
    onRegenerate: () => void;
    onCopy: (content: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo((props) => {
  const { message, index, persona, onEditRequest, onDelete, onRegenerate, onCopy, isLastMessageLoading } = props;
  const { settings, onImageClick, onShowCitations } = useChatContext();
  const { t } = useLocalization();
  const isUser = message.role === MessageRole.USER;
  const hasContent = message.content && message.content !== '...';
  const hasThoughts = message.thoughts && message.thoughts.trim().length > 0;

  const [isThoughtsOpen, setIsThoughtsOpen] = useState(false);
  const hasCitations = message.groundingMetadata?.groundingChunks?.length > 0;

  const [isBeingDeleted, setIsBeingDeleted] = useState(false);
  const [isRawView, setIsRawView] = useState(false);
  
  // 用于存储从 IndexedDB 加载的图片数据
  const [loadedAttachments, setLoadedAttachments] = useState<Record<string, string>>({});

  const handleDelete = () => { setIsBeingDeleted(true); setTimeout(() => onDelete(message.id), 350); };

  // 从 IndexedDB 加载缺失的附件数据
  useEffect(() => {
    const loadMissingAttachments = async () => {
      if (!message.attachments) return;
      
      const attachmentsToLoad = message.attachments.filter(
        att => att.id && !att.data && att.mimeType.startsWith('image/')
      );
      
      if (attachmentsToLoad.length === 0) return;
      
      const loaded: Record<string, string> = {};
      
      for (const att of attachmentsToLoad) {
        if (att.id) {
          try {
            const data = await getAttachment(att.id);
            if (data) {
              loaded[att.id] = data;
            }
          } catch (error) {
            console.error(`[MessageBubble] Failed to load attachment ${att.id}:`, error);
          }
        }
      }
      
      if (Object.keys(loaded).length > 0) {
        setLoadedAttachments(prev => ({ ...prev, ...loaded }));
      }
    };
    
    loadMissingAttachments();
  }, [message.id, message.attachments]);

  return (
      <div
        className={`flex flex-col items-start mt-6 ${isBeingDeleted ? 'deleting' : ''}`}>
        <div className={`max-w-full text-base flex flex-col relative transition-all duration-300 group ${isUser ? 'user-bubble' : 'model-bubble'} items-start`}>
          <div className="overflow-hidden">
            {hasThoughts && (
                <div className={`thoughts-container ${isThoughtsOpen ? 'expanded' : ''}`}>
                    <button onClick={() => setIsThoughtsOpen(!isThoughtsOpen)} className="thoughts-expander-header">
                        {isThoughtsOpen ? (
                            <>
                                <Icon icon="brain" className="w-4 h-4" />
                                <span>{t('thoughts')}</span>
                                {message.thinkingTime && (
                                    <span className="ml-2 text-xs text-[var(--text-color-secondary)]">({message.thinkingTime.toFixed(2)}s)</span>
                                )}
                                <Icon icon="chevron-down" className={`w-4 h-4 transition-transform duration-200 ml-auto ${isThoughtsOpen ? 'rotate-180' : ''}`} />
                            </>
                        ) : (
                            <span className="thinking-text">
                                {message.thinkingTime ? `Thought for ${message.thinkingTime.toFixed(2)}s` : 'Thinking...'}
                            </span>
                        )}
                    </button>
                    <div className={`thoughts-expander-content ${isThoughtsOpen ? 'expanded' : ''}`}>
                        <div className="inner-content"><MarkdownRenderer content={message.thoughts!} theme={settings.theme} /></div>
                    </div>
                </div>
            )}
            <div className={`p-2 ${isUser ? '' : 'text-[var(--text-color)]'}`}>
                {message.attachments && message.attachments.length > 0 && (
                  <div className={`mb-3 grid gap-2 ${
                    message.attachments.length === 1 ? 'grid-cols-1' :
                    message.attachments.length === 2 ? 'grid-cols-2' :
                    'grid-cols-2 sm:grid-cols-3'
                  }`}>
                    {message.attachments.map((att, i) => {
                      // 优先使用附件自带的 data，其次使用从 IndexedDB 加载的数据
                      const imageData = att.data || (att.id ? loadedAttachments[att.id] : undefined);
                      
                      return (
                        <div key={i} className={`rounded-xl overflow-hidden border border-black/10 dark:border-white/10 ${
                          message.attachments.length === 1 ? 'max-w-md' : ''
                        }`} style={{ backgroundColor: 'rgba(0, 0, 0, 0.01)' }}>
                          {att.mimeType.startsWith('image/') && imageData ? (
                            <LazyImage
                              src={`data:${att.mimeType};base64,${imageData}`}
                              alt={att.name}
                              onClick={() => onImageClick(`data:${att.mimeType};base64,${imageData}`)}
                              style={{
                                width: '100%',
                                height: message.attachments.length === 1 ? 'auto' : '160px',
                                maxHeight: message.attachments.length === 1 ? '400px' : '160px',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                display: 'block'
                              }}
                              showLoadingIndicator={true}
                            />
                          ) : att.mimeType.startsWith('image/') && att.id && !imageData ? (
                            // 图片加载中
                            <div className="flex items-center justify-center h-[160px]">
                              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--accent-color)] border-t-transparent"></div>
                            </div>
                          ) : (
                            <div className="p-4 flex items-center gap-3 text-current min-h-[80px]">
                              <Icon icon="file" className="w-8 h-8 flex-shrink-0 opacity-60" />
                              <span className="text-sm truncate font-medium">{att.name}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {(isLastMessageLoading && !hasContent) ? (
                  <TypingIndicator thoughts={message.thoughts} />
                ) : (
                  hasContent && (
                    <div className="grid items-start">
                      {/* Rendered View */}
                      <div className={`col-start-1 row-start-1 grid transition-all duration-300 ease-in-out ${isRawView ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`} aria-hidden={isRawView}>
                        <div className="overflow-hidden break-words text-justify">
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
                  )
                )}
            </div>
            {hasCitations && (
                <div className="border-t border-[var(--glass-border)] mt-2 mx-2 mb-2 pt-2">
                    <button onClick={() => onShowCitations(message.groundingMetadata!.groundingChunks)} className="citations-button">
                        <Icon icon="search" className="w-4 h-4" /><span>Sources</span>
                    </button>
                </div>
            )}
          </div>
          {/* 操作按钮 - 绝对定位到气泡下方 */}
          <div className="absolute bottom-0 left-0 translate-y-full mt-1">
            <MessageActions message={message} isModelResponse={!isUser} onCopy={() => onCopy(message.content)} onEdit={onEditRequest} onDelete={handleDelete} onRegenerate={onRegenerate} onToggleRawView={() => setIsRawView(p => !p)} isRawView={isRawView} />
          </div>
        </div>
      </div>
  );
});