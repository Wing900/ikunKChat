import React, { useState, useEffect } from 'react';
import { Message, MessageRole } from '../types';
import { useLocalization } from '../contexts/LocalizationContext';

interface MessageEditModalProps {
  message: Message | null;
  onClose: () => void;
  onSave: (message: Message, newContent: string) => void;
}

export const MessageEditModal: React.FC<MessageEditModalProps> = ({ message, onClose, onSave }) => {
  const { t } = useLocalization();
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (message) {
      setEditedContent(message.content);
    }
  }, [message]);

  if (!message) {
    return null;
  }

  const handleSave = () => {
    if (editedContent.trim()) {
      onSave(message, editedContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const isUser = message.role === MessageRole.USER;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{t('editChat')}</h2>
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="message-edit-textarea"
          autoFocus
        />
        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">{t('cancel')}</button>
          <button onClick={handleSave} className="btn-primary">
            {isUser ? t('saveAndResubmit') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};