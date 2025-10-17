import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import { Switch } from './Switch';
import { ChatSession } from '../types';
import { useToast } from '../contexts/ToastContext';
import { getSupportedMimeTypes, isFileSupported } from '../utils/fileUtils';

export interface ChatInputRef {
  addFiles: (files: File[]) => void;
}

interface ChatInputProps {
  onSendMessage: (message: string, files: File[]) => void;
  isLoading: boolean;
  onCancel: () => void;
  input: string;
  setInput: (value: string) => void;
  chatSession: ChatSession | null;
  onToggleStudyMode: (enabled: boolean) => void;
  isNextChatStudyMode: boolean;
}

interface FileWithId {
  file: File;
  id: string;
}

const ToolItem: React.FC<{icon: any, label: string, checked: boolean, onChange: (e:any)=>void, disabled?: boolean}> = ({icon, label, checked, onChange, disabled}) => (
    <div className={`flex items-center justify-between p-2 rounded-lg ${disabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-3">
            <Icon icon={icon} className="w-5 h-5" />
            <span className="font-semibold">{label}</span>
        </div>
        <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
);

const ActiveToolIndicator: React.FC<{ isStudyMode: boolean, t: (key: any) => string }> = ({ isStudyMode, t }) => {
    if (!isStudyMode) return null;

    return (
        <div className="active-tools-indicator">
            <div className="active-tool-chip">
                <Icon icon="graduation-cap" className="w-4 h-4" />
                <span>{t('studyLearn')}</span>
            </div>
        </div>
    );
};


export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ onSendMessage, isLoading, onCancel, input, setInput, chatSession, onToggleStudyMode, isNextChatStudyMode }, ref) => {
  const { t } = useLocalization();
  const { addToast } = useToast();
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [enteringFileIds, setEnteringFileIds] = useState<Set<string>>(new Set());
  const [deletingFileIds, setDeletingFileIds] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsWrapperRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  const isStudyModeActive = chatSession ? !!chatSession.isStudyMode : isNextChatStudyMode;

  useEffect(() => {
    setFiles([]);
  }, [chatSession?.id]);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = parseInt(getComputedStyle(textareaRef.current).maxHeight, 10);
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolsWrapperRef.current && !toolsWrapperRef.current.contains(event.target as Node) &&
        toolsButtonRef.current && !toolsButtonRef.current.contains(event.target as Node)
      ) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const supportedFiles = newFiles.filter(isFileSupported);
    const unsupportedCount = newFiles.length - supportedFiles.length;

    if (unsupportedCount > 0) {
      addToast(`${unsupportedCount} file(s) have an unsupported format and were not added.`, 'error');
    }

    if (supportedFiles.length === 0) {
      return;
    }

    const newFilesWithId = supportedFiles.map(file => ({ file, id: crypto.randomUUID() }));
    const newFileIds = newFilesWithId.map(f => f.id);
    
    setFiles(prev => [...prev, ...newFilesWithId]);
    setEnteringFileIds(prev => new Set([...prev, ...newFileIds]));

    setTimeout(() => {
      setEnteringFileIds(prev => {
        const nextSet = new Set(prev);
        newFileIds.forEach(id => nextSet.delete(id));
        return nextSet;
      });
    }, 350);
  };

  useImperativeHandle(ref, () => ({
    addFiles
  }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (idToRemove: string) => {
    setDeletingFileIds(prev => new Set(prev).add(idToRemove));
    setTimeout(() => {
      setFiles(prev => prev.filter(f => f.id !== idToRemove));
      setDeletingFileIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(idToRemove);
        return newSet;
      });
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || files.length > 0) && !isLoading) {
      onSendMessage(input.trim(), files.map(f => f.file));
      // setInput is now handled by ChatView
      setFiles([]);
      setIsToolsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isMobileView) {
        e.preventDefault();
        handleSubmit(e as any);
    }
  }
  

  return (
    <form onSubmit={handleSubmit} className="p-2 pt-0 flex flex-col relative">
        <div ref={toolsWrapperRef} className={`tool-selector-options glass-pane ${isToolsOpen ? 'visible' : ''}`}>
            <div className="p-2">
                <ToolItem icon="graduation-cap" label={t('studyLearn')} checked={isStudyModeActive} onChange={e => onToggleStudyMode(e.target.checked)} />
            </div>
        </div>

        <div className="glass-pane rounded-[var(--radius-2xl)] flex flex-col transition-all duration-300 focus-within:border-[var(--accent-color)] focus-within:ring-2 ring-[var(--accent-color)]">
          {files.length > 0 && (
            <div className="file-preview-container">
              {files.map(({ file, id }) => (
                <div key={id} className={`file-preview-wrapper ${enteringFileIds.has(id) ? 'entering' : ''} ${deletingFileIds.has(id) ? 'deleting' : ''}`}>
                  <div className="file-preview-item">
                    {file.type.startsWith('image/') ? (
                      <img src={URL.createObjectURL(file)} alt={file.name} onLoad={e => URL.revokeObjectURL(e.currentTarget.src)} />
                    ) : (
                      <div className="file-info"> <Icon icon="file" className="w-8 h-8"/> <span>{file.name}</span> </div>
                    )}
                    <button type="button" className="remove-file-btn" onClick={() => handleRemoveFile(id)} aria-label={`Remove ${file.name}`}>
                      <Icon icon="close" className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <ActiveToolIndicator isStudyMode={isStudyModeActive} t={t} />

          <div className="flex items-end p-2">
            <button ref={toolsButtonRef} type="button" onClick={() => setIsToolsOpen(p => !p)} className={`p-2 rounded-full flex-shrink-0 transition-colors ${isToolsOpen ? 'bg-[var(--accent-color)] text-[var(--accent-color-text)]' : 'text-[var(--text-color-secondary)] hover:bg-black/10 dark:hover:bg-white/10'}`} aria-label="Tools">
              <Icon icon="tools" className="w-6 h-6" />
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-[var(--text-color-secondary)] hover:text-[var(--accent-color)] disabled:opacity-50 flex-shrink-0" aria-label="Attach files">
              <Icon icon="paperclip" className="w-6 h-6" />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} multiple accept={getSupportedMimeTypes()} />
            <textarea
                ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={t('typeMessage')} rows={1}
                className="flex-grow bg-transparent focus:outline-none resize-none max-h-48 text-[var(--text-color)] px-2 py-2"
            />
            <button
                type={isLoading ? 'button' : 'submit'}
                onClick={isLoading ? onCancel : undefined}
                disabled={!isLoading && (!input.trim() && files.length === 0)}
                className={`w-10 h-10 flex-shrink-0 flex items-center justify-center text-white rounded-[var(--radius-2xl)] disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                    isLoading ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--accent-color)] transition-transform hover:scale-105'
                }`}
                aria-label={isLoading ? 'Stop generation' : 'Send message'}
            >
                {isLoading ? <Icon icon="stop" className="w-5 h-5" /> : <Icon icon="send" className="w-5 h-5" />}
            </button>
          </div>
        </div>
    </form>
  )
});