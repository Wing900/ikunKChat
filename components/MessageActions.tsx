import React, { useState } from 'react';
import { Message } from '../types';
import { Icon } from './Icon';

interface MessageActionsProps {
  message: Message;
  isModelResponse: boolean;
  onEdit: () => void;
  onCopy: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  onToggleRawView: () => void;
  isRawView: boolean;
}

export const MessageActions: React.FC<MessageActionsProps> = ({ message, isModelResponse, onEdit, onCopy, onRegenerate, onDelete, onToggleRawView, isRawView }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="message-actions">
            {!isModelResponse && (
                <button className="action-btn" onClick={onEdit} data-tooltip="Edit & Resubmit" data-tooltip-placement="top">
                    <Icon icon="edit" className="w-4 h-4"/>
                </button>
            )}
            {isModelResponse && (
                 <button className="action-btn" onClick={onRegenerate} data-tooltip="Regenerate" data-tooltip-placement="top">
                    <Icon icon="regenerate" className="w-4 h-4"/>
                </button>
            )}
             {isModelResponse && (
                <button className="action-btn" onClick={onEdit} data-tooltip="Edit" data-tooltip-placement="top">
                    <Icon icon="edit" className="w-4 h-4"/>
                </button>
            )}
            <button className="action-btn" onClick={onToggleRawView} data-tooltip={isRawView ? "Show Rendered" : "Show Raw Text"} data-tooltip-placement="top">
                <Icon icon="eye" className="w-4 h-4"/>
            </button>
            <button className="action-btn" onClick={handleCopy} data-tooltip={copied ? "Copied!" : "Copy"} data-tooltip-placement="top">
                <Icon icon="copy" className="w-4 h-4"/>
            </button>
            <button className="action-btn danger" onClick={onDelete} data-tooltip="Delete" data-tooltip-placement="top">
                <Icon icon="delete" className="w-4 h-4"/>
            </button>
        </div>
    );
};
