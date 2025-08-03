import React, { useState, useMemo } from 'react';
import { Persona } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import { PersonaAvatar } from './common/PersonaAvatar';

const PersonaCard: React.FC<{ persona: Persona & { isHiding?: boolean }, onStartChat: () => void, onEdit: () => void, onDelete: () => void, index: number }> = ({ persona, onStartChat, onEdit, onDelete, index }) => {
    const { t } = useLocalization();
    const [isBeingDeleted, setIsBeingDeleted] = useState(false);

    const handleDeleteClick = () => {
        setIsBeingDeleted(true);
        setTimeout(() => {
            onDelete();
        }, 400); // Animation duration is 0.4s
    };
    
    return (
        <div className={`persona-card group ${isBeingDeleted ? 'deleting' : ''} ${persona.isHiding ? 'hiding' : ''}`} style={{ animationDelay: `${index * 50}ms` }}>
            {!persona.isDefault && (
                <div className="persona-card-actions">
                    <button onClick={onEdit} className="action-btn" data-tooltip={t('editPersona')} data-tooltip-placement="top"><Icon icon="edit" className="w-4 h-4"/></button>
                    <button onClick={handleDeleteClick} className="action-btn danger" data-tooltip={t('deletePersona')} data-tooltip-placement="top"><Icon icon="delete" className="w-4 h-4"/></button>
                </div>
            )}
            <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 flex-shrink-0 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center text-white overflow-hidden">
                    <PersonaAvatar avatar={persona.avatar} className="text-4xl" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">{persona.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-color-secondary)]">
                        {persona.tools.googleSearch && <Icon icon="search" className="w-4 h-4" data-tooltip="Google Search Enabled" />}
                        {persona.tools.codeExecution && <Icon icon="code" className="w-4 h-4" data-tooltip="Code Execution Enabled" />}
                    </div>
                </div>
            </div>
            <p className="text-sm text-[var(--text-color-secondary)] flex-grow mb-4 h-16 overflow-hidden">{persona.bio}</p>
            <button onClick={onStartChat} className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2 text-md font-semibold bg-[var(--accent-color)] text-white rounded-[var(--radius-2xl)] transition-transform hover:scale-105 active:scale-100">
                <Icon icon="plus" className="w-5 h-5" />
                {t('startChat')}
            </button>
        </div>
    );
}

const CreatePersonaCard: React.FC<{ onClick: () => void, index: number, isHiding: boolean }> = ({ onClick, index, isHiding }) => {
    const { t } = useLocalization();
    return (
        <button onClick={onClick} className={`persona-card persona-card-new flex flex-col items-center justify-center text-center ${isHiding ? 'hiding' : ''}`} style={{ animationDelay: `${index * 50}ms` }}>
            <div className="w-16 h-16 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center mb-3 transition-colors duration-300">
                <Icon icon="plus" className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">{t('createPersona')}</h3>
        </button>
    );
};


interface RolesViewProps {
  personas: Persona[];
  onClose: () => void;
  onStartChat: (id: string) => void;
  onEditPersona: (persona: Persona) => void;
  onCreatePersona: () => void;
  onDeletePersona: (id: string) => void;
}

export const RolesView: React.FC<RolesViewProps> = ({ personas, onClose, onStartChat, onEditPersona, onCreatePersona, onDeletePersona }) => {
  const { t } = useLocalization();
  const [searchQuery, setSearchQuery] = useState('');

  const displayedPersonas = useMemo(() => {
      const hasQuery = !!searchQuery.trim();
      if (!hasQuery) return personas.map(p => ({ ...p, isHiding: false }));

      const lowerQuery = searchQuery.toLowerCase();
      return personas.map(p => ({
          ...p,
          isHiding: !(p.name.toLowerCase().includes(lowerQuery) || p.bio.toLowerCase().includes(lowerQuery))
      }));
  }, [personas, searchQuery]);
  
  const createCardIsHiding = useMemo(() => !!searchQuery.trim(), [searchQuery]);

  return (
    <main className="glass-pane rounded-[var(--radius-2xl)] flex flex-col h-full overflow-hidden relative p-4 md:p-6">
      <header className="flex items-center justify-between mb-4 md:mb-6 flex-shrink-0 gap-4">
        <h2 className="text-2xl font-bold text-[var(--text-color)]">{t('selectPersona')}</h2>
         <div className="flex items-center gap-2">
            <div className="sidebar-search-wrapper max-w-xs">
                <Icon icon="search" className="sidebar-search-icon w-4 h-4" />
                <input type="text" placeholder="Search personas..." className="sidebar-search-input !py-2 !text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2">
                <Icon icon="close" className="w-5 h-5"/>
            </button>
        </div>
      </header>
      <div className="flex-grow overflow-y-auto -mr-4 md:-mr-6 -ml-2 pr-2 md:pr-4 pl-2">
          <div className="personas-grid p-2">
            {displayedPersonas.map((p, i) => (
                <PersonaCard 
                    key={p.id} 
                    persona={p} 
                    index={i}
                    onStartChat={() => onStartChat(p.id)}
                    onEdit={() => onEditPersona(p)}
                    onDelete={() => onDeletePersona(p.id)}
                />
            ))}
            <CreatePersonaCard onClick={onCreatePersona} index={personas.length} isHiding={createCardIsHiding} />
          </div>
      </div>
    </main>
  );
};
