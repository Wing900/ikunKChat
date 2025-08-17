import React, { useState, useRef, useEffect } from 'react';
import { ChatSession } from '../../types';
import { Icon } from '../Icon';
import { ModelSelector } from '../ModelSelector';
import { useLocalization } from '../../contexts/LocalizationContext';

interface ChatHeaderProps {
    chatSession: ChatSession | null;
    onNewChat: () => void;
    availableModels: string[];
    onSetModelForActiveChat: (model: string) => void;
    currentModel: string;
    isSidebarCollapsed: boolean;
    onToggleSidebar: () => void;
    onToggleMobileSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chatSession, onNewChat, availableModels, onSetModelForActiveChat, currentModel, isSidebarCollapsed, onToggleSidebar, onToggleMobileSidebar }) => {
    const { t } = useLocalization();
    const [isMobileModelSelectorOpen, setIsMobileModelSelectorOpen] = useState(false);
    const mobileModelSelectorRef = useRef<HTMLDivElement>(null);

    const toggleMobileModelSelector = () => {
        setIsMobileModelSelectorOpen(prev => !prev);
    };

    const handleMobileModelSelect = (model: string) => {
        onSetModelForActiveChat(model);
        setIsMobileModelSelectorOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileModelSelectorRef.current && !mobileModelSelectorRef.current.contains(event.target as Node)) {
                setIsMobileModelSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className={`p-4 flex-shrink-0 flex items-center justify-between gap-2 ${chatSession ? 'border-b border-[var(--glass-border)]' : ''}`}>
            <div className="flex items-center gap-2 min-w-0">
                <button
                    onClick={onToggleMobileSidebar}
                    className="md:hidden p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                    aria-label={t('expandSidebar')}
                    data-tooltip={t('expandSidebar')}
                    data-tooltip-placement="right"
                >
                    <Icon icon="menu" className="w-6 h-6" />
                </button>
                {isSidebarCollapsed && (
                    <button
                        onClick={onToggleSidebar}
                        className="hidden md:flex items-center justify-center p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                        aria-label={t('expandSidebar')}
                        data-tooltip={t('expandSidebar')}
                        data-tooltip-placement="right"
                    >
                        <Icon icon="menu" className="w-6 h-6" />
                    </button>
                )}
                {chatSession && (
                    <div className="flex items-center gap-2 truncate">
                        <span className="text-2xl">{chatSession.icon || "💬"}</span>
                        <h2 className="text-xl font-bold text-[var(--text-color)] truncate">{chatSession.title}</h2>
                    </div>
                )}
            </div>
            {/* 桌面端按钮 - 始终显示 */}
            <div className="hidden md:flex items-center gap-1 ml-auto">
                <button onClick={() => onNewChat()} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" data-tooltip={t('newChat')} data-tooltip-placement="left">
                    <Icon icon="plus" className="w-6 h-6" />
                </button>
                <div className="w-64">
                    <ModelSelector models={availableModels} selectedModel={chatSession?.model || currentModel} onModelChange={onSetModelForActiveChat} isHeader={true} />
                </div>
            </div>
            
            {/* 移动端按钮 - 始终显示 */}
            <div className="md:hidden flex items-center gap-1 ml-auto">
                <button onClick={() => onNewChat()} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" data-tooltip={t('newChat')} data-tooltip-placement="left">
                    <Icon icon="plus" className="w-6 h-6" />
                </button>
                <div className="relative" ref={mobileModelSelectorRef}>
                    <button
                        onClick={toggleMobileModelSelector}
                        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
                        data-tooltip={t('switchModel')}
                        data-tooltip-placement="left"
                    >
                        <Icon icon="chip" className="w-6 h-6" />
                    </button>
                    {isMobileModelSelectorOpen && (
                        <div className="absolute top-16 right-0 z-10 w-48">
                            <div className="glass-pane rounded-[var(--radius-2xl)] p-2 shadow-lg">
                                {availableModels.map(model => (
                                    <div
                                        key={model}
                                        onClick={() => handleMobileModelSelect(model)}
                                        className={`p-2 rounded-lg cursor-pointer flex items-center gap-2 ${currentModel === model ? 'bg-[var(--accent-color)] text-white' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
                                    >
                                        <Icon icon="chip" className="w-4 h-4" />
                                        <span className="text-sm">{model}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};