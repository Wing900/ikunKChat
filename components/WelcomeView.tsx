import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { ModelSelector } from './ModelSelector';
import { useLocalization } from '../contexts/LocalizationContext';
import { Persona } from '../types';
import { PersonaAvatar } from './common/PersonaAvatar';
import { CustomSelect, SelectOption } from './CustomSelect';
import { formatModelName } from '../utils/textUtils';

interface WelcomeViewProps {
  onSetCurrentModel: (model: string) => void;
  currentModel: string;
  availableModels: string[];
  personas: Persona[];
  onStartChat: (personaId: string) => void;
  settings: any;
  isSidebarCollapsed?: boolean;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({
  onSetCurrentModel,
  currentModel,
  availableModels,
  personas,
  onStartChat,
  settings,
  isSidebarCollapsed = false
}) => {
  const { t } = useLocalization();
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [hasSelectedPersona, setHasSelectedPersona] = useState(false);

  useEffect(() => {
    // 设置默认选中的角色
    if (personas.length > 0 && !selectedPersonaId) {
      const defaultPersona = personas.find(p => p.id === settings.defaultPersona) || personas[0];
      setSelectedPersonaId(defaultPersona.id);
    }
  }, [personas, selectedPersonaId, settings.defaultPersona]);

  const selectedPersona = personas.find(p => p.id === selectedPersonaId);

  const handleStartChat = () => {
    if (selectedPersonaId) {
      onStartChat(selectedPersonaId);
      setHasSelectedPersona(true);
    }
  };

  const personaOptions: SelectOption[] = personas.map(persona => ({
    value: persona.id,
    label: persona.name
  }));

  return (
    <div className={`flex-grow flex flex-col items-center justify-center text-center p-8 transition-all duration-300 ${isSidebarCollapsed ? 'max-w-6xl mx-auto' : 'max-w-4xl mx-auto'}`}>
      <Icon icon="ikunchat.svg?v=2" className="w-24 h-24 text-[var(--accent-color)] opacity-80" />
      <h1 className="mt-6 text-4xl font-bold text-[var(--text-color)]">{t('welcomeTo')}</h1>
      <p className="mt-2 text-lg text-[var(--text-color-secondary)] max-w-md">
        {t('welcomeDesc')}
      </p>

      <div className="mt-12">
        <button
          onClick={handleStartChat}
          className="py-2 px-6 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium transition-all hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 shadow-sm"
        >
          开始聊天
        </button>
      </div>
    </div>
  );
};
