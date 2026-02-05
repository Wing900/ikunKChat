import React from 'react';
import { ToastProvider } from '../../contexts/ToastContext';
import { LocalizationProvider } from '../../contexts/LocalizationContext';
import { UIStateProvider } from '../../contexts/UIStateContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * AppProviders - Wraps the application with all necessary context providers
 * Order matters: ToastProvider should be outermost as it's used by many components
 */
export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ToastProvider>
      <LocalizationProvider initialLanguage="en">
        <UIStateProvider>
          {children}
        </UIStateProvider>
      </LocalizationProvider>
    </ToastProvider>
  );
};
