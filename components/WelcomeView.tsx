import React from 'react';
import { Icon } from './Icon';
import { ModelSelector } from './ModelSelector';
import { useLocalization } from '../contexts/LocalizationContext';

interface WelcomeViewProps {
  onSetCurrentModel: (model: string) => void;
  currentModel: string;
  availableModels: string[];
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ onSetCurrentModel, currentModel, availableModels }) => {
  const { t } = useLocalization();
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
      <Icon icon="kchat" className="w-24 h-24 text-[var(--accent-color)] opacity-80" />
      <h1 className="mt-6 text-4xl font-bold text-[var(--text-color)]">{t('welcomeTo')}</h1>
      <p className="mt-2 text-lg text-[var(--text-color-secondary)] max-w-md">
        {t('welcomeDesc')}
      </p>
      <div className="mt-8">
        <ModelSelector
          models={availableModels}
          selectedModel={currentModel}
          onModelChange={onSetCurrentModel}
        />
      </div>
    </div>
  );
};
