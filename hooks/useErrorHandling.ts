import { useCallback } from 'react';
import { ToastType, useToast } from '../contexts/ToastContext';
import { getUserFacingMessage, logError } from '../utils/errorUtils';

export interface ErrorNotificationOptions {
  context?: string;
  fallbackMessage?: string;
  toastType?: ToastType;
  showToast?: boolean;
  userMessage?: string;
  data?: Record<string, unknown>;
  suppressConsole?: boolean;
}

export const useErrorHandling = (defaultOptions?: ErrorNotificationOptions) => {
  const { addToast } = useToast();

  const notifyError = useCallback(
    (error: unknown, options?: ErrorNotificationOptions) => {
      const merged = {
        toastType: 'error' as ToastType,
        showToast: true,
        ...defaultOptions,
        ...options,
      };

      const toastType: ToastType = merged.toastType ?? 'error';
      const message =
        merged.userMessage ??
        getUserFacingMessage(error, merged.fallbackMessage ?? '发生未知错误，请稍后再试。');

      if (merged.showToast) {
        addToast(message, toastType);
      }

      if (!merged.suppressConsole) {
        logError(error, merged.context, merged.data);
      }

      return message;
    },
    [addToast, defaultOptions]
  );

  const wrapAsync = useCallback(
    async <T>(fn: () => Promise<T>, options?: ErrorNotificationOptions): Promise<T | undefined> => {
      try {
        return await fn();
      } catch (error) {
        notifyError(error, options);
        return undefined;
      }
    },
    [notifyError]
  );

  return { notifyError, wrapAsync };
};
