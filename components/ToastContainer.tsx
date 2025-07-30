import React from 'react';
import ReactDOM from 'react-dom';
import { useToast } from '../contexts/ToastContext';
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return ReactDOM.createPortal(
    <div className="toast-root-container">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
};
