import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { ToastMessage } from '../contexts/ToastContext';

interface ToastProps {
  toast: ToastMessage;
  onRemove: (id: string) => void;
}

const toastIcons = {
  success: <Icon icon="check-circle" className="text-green-500 w-6 h-6" />,
  error: <Icon icon="alert-circle" className="text-red-500 w-6 h-6" />,
  info: <Icon icon="info" className="text-blue-500 w-6 h-6" />,
};

export const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onRemove(toast.id), 400); // Corresponds to animation duration
    }, 4000);

    return () => {
      clearTimeout(exitTimer);
    };
  }, [toast.id, onRemove]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 400);
  };

  return (
    <div
      className={`toast-item glass-pane ${isLeaving ? 'leaving' : ''}`}
      role="alert"
    >
      <div className="toast-icon">{toastIcons[toast.type]}</div>
      <p className="toast-message">{toast.message}</p>
      <button onClick={handleRemove} className="toast-close-btn">
        <Icon icon="close" className="w-4 h-4" />
      </button>
    </div>
  );
};
