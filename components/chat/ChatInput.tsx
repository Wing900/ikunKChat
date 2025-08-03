import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useToast } from '../../contexts/ToastContext';
import { getSupportedMimeTypes, isFileSupported } from '../../utils/fileUtils';
import { ChatSession } from '../../types';
import { ToolItem } from './ToolItem';
import { ActiveToolIndicator } from './ActiveToolIndicator';
import { FilePreview } from './FilePreview';

export interface ChatInputRef {
  addFiles: (files: File[]) => void;
}

interface ChatInputProps {
  onSendMessage: (message: string, files: File[]) => void;
  isLoading: boolean;
  onCancel: () => void;
  toolConfig: any;
  onToolConfigChange: (config: any) => void;
  input: string;
  setInput: (value: string) => void;
  chatSession: ChatSession | null;
  onToggleStudyMode: (enabled: boolean) => void;
  isNextChatStudyMode: boolean;
}

export interface FileWithId {
  file: File;
  id: string;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ onSendMessage, isLoading, onCancel, toolConfig, onToolConfigChange, input, setInput, chatSession, onToggleStudyMode, isNextChatStudyMode }, ref) => {
  const { t } = useLocalization();
  const { addToast } = useToast();
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsWrapperRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  const isStudyModeActive = chatSession ? !!chatSession.isStudyMode : isNextChatStudyMode;

  useEffect(() => { setFiles([]); }, [chatSession?.id]);
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
      if (toolsWrapperRef.current && !toolsWrapperRef.current.contains(event.target as Node) && toolsButtonRef.current && !toolsButtonRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const supportedFiles = newFiles.filter(isFileSupported);
    if (newFiles.length - supportedFiles.length > 0) {
      addToast(`${newFiles.length - supportedFiles.length} file(s) have an unsupported format.`, 'error');
    }
    if (supportedFiles.length > 0) {
      setFiles(prev => [...prev, ...supportedFiles.map(file => ({ file, id: crypto.randomUUID() }))]);
    }
  };

  useImperativeHandle(ref, () => ({ addFiles }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
  const handleRemoveFile = (idToRemove: string) => setFiles(prev => prev.filter(f => f.id !== idToRemove));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || files.length > 0) && !isLoading) {
      onSendMessage(input.trim(), files.map(f => f.file));
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
  
  const handleToolChange = (tool: string, value: boolean) => {
      const newConfig = {...toolConfig, [tool]: value};
      if(tool === 'urlContext' && value) newConfig.codeExecution = false;
      else if (tool === 'codeExecution' && value) newConfig.urlContext = false;
      onToolConfigChange(newConfig);
  }

  return (
    <form onSubmit={handleSubmit} className="p-2 pt-0 flex flex-col relative">
        <div ref={toolsWrapperRef} className={`tool-selector-options glass-pane ${isToolsOpen ? 'visible' : ''}`}>
            <ToolItem icon="code" label={t('codeExecution')} checked={toolConfig.codeExecution} onChange={e => handleToolChange('codeExecution', e.target.checked)} disabled={toolConfig.urlContext} />
            <ToolItem icon="search" label={t('googleSearch')} checked={toolConfig.googleSearch} onChange={e => handleToolChange('googleSearch', e.target.checked)} />
            <ToolItem icon="link" label={t('urlContext')} checked={toolConfig.urlContext} onChange={e => handleToolChange('urlContext', e.target.checked)} disabled={toolConfig.codeExecution} />
            <div className="my-1 mx-2 h-[1px] bg-[var(--glass-border)]"></div>
            <div className="p-2 pt-1">
                <ToolItem icon="graduation-cap" label={t('studyLearn')} checked={isStudyModeActive} onChange={e => onToggleStudyMode(e.target.checked)} />
                <p className="text-xs text-[var(--text-color-secondary)] px-3 -mt-1">{t('studyLearnDesc')}</p>
            </div>
        </div>
        <div className="glass-pane rounded-[var(--radius-2xl)] flex flex-col transition-all duration-300 focus-within:border-[var(--accent-color)] focus-within:ring-2 ring-[var(--accent-color)]">
          <FilePreview files={files} onRemoveFile={handleRemoveFile} />
          <ActiveToolIndicator toolConfig={toolConfig} isStudyMode={isStudyModeActive} t={t} />
          <div className="flex items-end p-2">
            <button ref={toolsButtonRef} type="button" onClick={() => setIsToolsOpen(p => !p)} className={`p-2 rounded-full flex-shrink-0 transition-colors ${isToolsOpen ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-color-secondary)] hover:bg-black/10 dark:hover:bg-white/10'}`} aria-label={t('tools')}><Icon icon="tools" className="w-6 h-6" /></button>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-[var(--text-color-secondary)] hover:text-[var(--accent-color)] disabled:opacity-50 flex-shrink-0" aria-label="Attach files"><Icon icon="paperclip" className="w-6 h-6" /></button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} multiple accept={getSupportedMimeTypes()} />
            <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t('typeMessage')} rows={1} className="flex-grow bg-transparent focus:outline-none resize-none max-h-48 text-[var(--text-color)] px-2 py-2" />
            <button type={isLoading ? 'button' : 'submit'} onClick={isLoading ? onCancel : undefined} disabled={!isLoading && (!input.trim() && files.length === 0)} className={`w-10 h-10 flex-shrink-0 flex items-center justify-center text-white rounded-[var(--radius-2xl)] disabled:opacity-50 disabled:cursor-not-allowed transition-all ${isLoading ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--accent-color)] transition-transform hover:scale-105'}`} aria-label={isLoading ? 'Stop generation' : 'Send message'}>
                {isLoading ? <Icon icon="stop" className="w-5 h-5" /> : <Icon icon="send" className="w-5 h-5" />}
            </button>
          </div>
        </div>
    </form>
  )
});
