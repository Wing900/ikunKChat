import React from 'react';
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
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chatSession, onNewChat, availableModels, onSetModelForActiveChat, currentModel, isSidebarCollapsed }) => {
    const { t } = useLocalization();

    return (
        <header className={`p-4 pl-14 md:pl-4 border-b border-[var(--glass-border)] flex-shrink-0 flex items-center justify-between gap-4 transition-all duration-300 ${isSidebarCollapsed ? 'md:pl-16' : ''}`}>
            <div className="flex items-center gap-4 truncate">
                <span className="text-2xl">{chatSession?.icon || "💬"}</span>
                <h2 className="text-xl font-bold text-[var(--text-color)] truncate">{chatSession?.title}</h2>
            </div>
            <div className="w-64 flex-shrink-0 hidden md:block">
                <ModelSelector models={availableModels} selectedModel={chatSession?.model || currentModel} onModelChange={onSetModelForActiveChat} isHeader={true} />
            </div>
            <div className="md:hidden flex items-center gap-1 ml-auto">
                <button onClick={onNewChat} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" data-tooltip={t('newChat')} data-tooltip-placement="left">
                    <Icon icon="plus" className="w-6 h-6" />
                </button>
            </div>
        </header>
    );
};
