import React, { useState } from 'react';
import { ChatSession } from '../types';
import { Icon } from './Icon';

interface ChatHistoryItemProps {
    chat: ChatSession;
    isActive: boolean;
    isNew: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
}

export const ChatHistoryItem: React.FC<ChatHistoryItemProps> = (
    { chat, isActive, isNew, onSelect, onEdit, onDelete, onDragStart, onDragEnd }
) => {
    const [isBeingDeleted, setIsBeingDeleted] = useState(false);

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsBeingDeleted(true);
        setTimeout(() => {
            onDelete();
        }, 350);
    };

    return (
        <a
            href="#"
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={(e) => { e.preventDefault(); onSelect(); }}
            className={`history-item group flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-2xl)] transition-colors text-left relative ${isActive ? 'bg-[var(--accent-color)] text-white' : 'text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10'
                } ${isBeingDeleted ? 'deleting' : ''} ${isNew ? 'history-item-enter' : ''}`}
        >
            <span className="text-xl">{chat.icon || <Icon icon="chat" className="w-5 h-5" />}</span>
            <span className="truncate flex-grow">{chat.title}</span>
            <div className="history-item-actions ml-auto flex-shrink-0">
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }} aria-label="Edit chat title"><Icon icon="edit" className="w-4 h-4" /></button>
                <button onClick={handleDelete} aria-label="Delete chat"><Icon icon="delete" className="w-4 h-4 text-red-500" /></button>
            </div>
        </a>
    );
};
