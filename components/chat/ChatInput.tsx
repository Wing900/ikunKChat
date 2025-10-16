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
  availableModels: string[];
  currentModel: string;
  onSetModelForActiveChat: (model: string) => void;
}

export interface FileWithId {
  file: File;
  id: string;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({ onSendMessage, isLoading, onCancel, toolConfig, onToolConfigChange, input, setInput, chatSession, onToggleStudyMode, isNextChatStudyMode, availableModels, currentModel, onSetModelForActiveChat }, ref) => {
  const { t } = useLocalization();
  const { addToast } = useToast();
  const [files, setFiles] = useState<FileWithId[]>([]);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isMobileModelSelectorOpen, setIsMobileModelSelectorOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolsWrapperRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const mobileModelSelectorRef = useRef<HTMLDivElement>(null);
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
      if (mobileModelSelectorRef.current && !mobileModelSelectorRef.current.contains(event.target as Node)) {
        setIsMobileModelSelectorOpen(false);
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

  const toggleMobileModelSelector = () => {
    setIsMobileModelSelectorOpen(prev => !prev);
  };

  const handleMobileModelSelect = (model: string) => {
    onSetModelForActiveChat(model);
    setIsMobileModelSelectorOpen(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 pt-0 flex flex-col relative">
        <div ref={toolsWrapperRef} className={`tool-selector-options ${isToolsOpen ? 'visible' : ''}`} style={{backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-md)'}}>
            <div className="my-1 mx-2 h-[1px] bg-[var(--glass-border)]"></div>
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full p-2 text-left hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-3 text-[var(--text-color)]">
                <Icon icon="paperclip" className="w-4 h-4" />
                <span>{t('attachFile') || '上传文件'}</span>
            </button>
            <div className="p-2 pt-1 pb-2">
                <ToolItem icon="code" label={t('codeExecution')} checked={toolConfig.codeExecution} onChange={e => handleToolChange('codeExecution', e.target.checked)} disabled={toolConfig.urlContext} />
                <ToolItem icon="search" label={t('googleSearch')} checked={toolConfig.googleSearch} onChange={e => handleToolChange('googleSearch', e.target.checked)} />
                <ToolItem icon="link" label={t('urlContext')} checked={toolConfig.urlContext} onChange={e => handleToolChange('urlContext', e.target.checked)} disabled={toolConfig.codeExecution} />
                <ToolItem icon="graduation-cap" label={t('studyLearn')} checked={isStudyModeActive} onChange={e => onToggleStudyMode(e.target.checked)} />
                <p className="text-xs text-[var(--text-color-secondary)] px-3 mt-1 opacity-75">{t('studyLearnDesc')}</p>
            </div>
            <input ref={fileInputRef} type="file" onChange={handleFileChange} accept="image/*,.pdf,.txt,.md,.doc,.docx" multiple className="hidden" />
        </div>
        <div className="rounded-[var(--radius-2xl)] flex flex-col transition-all duration-300 focus-within:border-[var(--accent-color)] focus-within:ring-2 ring-[var(--accent-color)]" style={{backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-md)'}}>
          <FilePreview files={files} onRemoveFile={handleRemoveFile} />
          <ActiveToolIndicator toolConfig={toolConfig} isStudyMode={isStudyModeActive} t={t} />
          <div className="flex items-end p-1.5">
            <button ref={toolsButtonRef} type="button" onClick={() => setIsToolsOpen(p => !p)} className={`p-1.5 rounded-full flex-shrink-0 transition-colors mr-2 ${isToolsOpen ? 'bg-[var(--accent-color)] text-[var(--accent-color-text)]' : 'text-[var(--text-color-secondary)] hover:bg-black/10 dark:hover:bg-white/10'}`} aria-label={t('tools')}><Icon icon="plus" className="w-4 h-4" /></button>
            <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t('typeMessage')} rows={1} maxLength={15000} className="flex-grow bg-transparent focus:outline-none resize-none max-h-48 text-[var(--text-color)] px-2 py-1" />
            <button type={isLoading ? 'button' : 'submit'} onClick={isLoading ? onCancel : undefined} disabled={!isLoading && (!input.trim() && files.length === 0)} className={`w-9 h-9 flex-shrink-0 flex items-center justify-center text-[var(--text-color)] rounded-[var(--radius-2xl)] disabled:opacity-50 disabled:cursor-not-allowed transition-all ${isLoading ? 'bg-red-400 hover:bg-red-500' : 'bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500'}`} aria-label={isLoading ? 'Stop generation' : 'Send message'}>
                {isLoading ? <Icon icon="stop" className="w-4 h-4" /> : <Icon icon="send" className="w-4 h-4" />}
            </button>
          </div>
        </div>
    </form>
  )
});
