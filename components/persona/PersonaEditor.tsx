import React, { useState, useEffect, useRef } from 'react';
import { Persona, Settings } from '../../types';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';
import { fileToData } from '../../utils/fileUtils';
import { Switch } from '../Switch';
import { useToast } from '../../contexts/ToastContext';
import { PersonaAvatar } from '../common/PersonaAvatar';
import { AIBuilder } from './AIBuilder';

const newPersonaTemplate: Persona = {
  id: '',
  name: '',
  avatar: { type: 'emoji', value: '🤖' },
  bio: '',
  systemPrompt: 'You are a helpful AI assistant.',
  tools: { googleSearch: false, codeExecution: false, urlContext: false },
  isNew: true,
};

interface PersonaEditorProps {
  personaToEdit: Persona | null;
  onSave: (persona: Persona) => void;
  onClose: () => void;
  settings: Settings;
}

export const PersonaEditor: React.FC<PersonaEditorProps> = ({ personaToEdit, onSave, onClose, settings }) => {
  const { t } = useLocalization();
  const { addToast } = useToast();
  const [persona, setPersona] = useState<Persona>(personaToEdit || newPersonaTemplate);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPersona(personaToEdit || newPersonaTemplate);
  }, [personaToEdit]);

  const handleUpdate = (update: Partial<Persona>) => {
    setPersona(prev => {
        const newTools = { ...prev.tools, ...update.tools };
        if (update.tools?.codeExecution === true) newTools.urlContext = false;
        if (update.tools?.urlContext === true) newTools.codeExecution = false;
        return { ...prev, ...update, tools: newTools, avatar: { ...prev.avatar, ...update.avatar } };
    });
  };
  
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const { data } = await fileToData(file);
        handleUpdate({ avatar: { type: 'base64', value: `data:${file.type};base64,${data}` } });
      } catch (error) {
        addToast("Could not load image.", 'error');
      }
    }
  };

  const handleSave = () => {
    if(!persona.name.trim() || !persona.bio.trim() || !persona.systemPrompt.trim()) {
      addToast("Please fill out all fields before saving.", 'error');
      return;
    }
    onSave(persona);
  };

  return (
    <main className="persona-editor-container flex-col md:flex-row">
        <div className="persona-editor-form-pane w-full md:w-auto border-b-2 md:border-b-0 md:border-r-2 border-[var(--glass-border)]">
            <header className="persona-editor-header">
                <h2>{persona.isNew ? t('createPersona') : t('editPersona')}</h2>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-[var(--radius-2xl)] font-semibold glass-pane border-none text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10">{t('cancel')}</button>
                    <button onClick={handleSave} className="px-5 py-2 rounded-[var(--radius-2xl)] font-semibold bg-[var(--accent-color)] text-white transition-transform hover:scale-105">{t('savePersona')}</button>
                </div>
            </header>
            <div className="persona-editor-scroll-area">
                <div className="form-group">
                    <label>{t('personaName')}</label>
                    <input type="text" value={persona.name} onChange={e => handleUpdate({name: e.target.value})} placeholder={t('personaNamePlaceholder')} className="input-glass"/>
                </div>
                <div className="flex gap-4 items-start">
                    <div className="form-group">
                        <label>{t('personaAvatar')}</label>
                        <div className="w-24 h-24 rounded-full bg-white/10 dark:bg-black/10 overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <PersonaAvatar avatar={persona.avatar} className="text-4xl" />
                            <input type="file" ref={fileInputRef} onChange={handleAvatarFileChange} accept="image/*" className="hidden"/>
                        </div>
                    </div>
                    <div className="form-group flex-grow">
                        <label htmlFor="avatar-input" className="text-sm font-medium text-[var(--text-color-secondary)] mb-1 block">{t('personaAvatarDesc')}</label>
                        <input id="avatar-input" type="text" value={persona.avatar.type !== 'base64' ? persona.avatar.value : ''} onChange={e => handleUpdate({avatar: {type: 'emoji', value: e.target.value}})} placeholder="🤖 or https://..." className="input-glass"/>
                    </div>
                </div>
                <div className="form-group">
                    <label>{t('personaBio')}</label>
                    <textarea value={persona.bio} onChange={e => handleUpdate({bio: e.target.value})} placeholder={t('personaBioPlaceholder')} className="input-glass" rows={3}/>
                </div>
                <div className="form-group">
                    <label>{t('personaSystemPrompt')}</label>
                    <textarea value={persona.systemPrompt} onChange={e => handleUpdate({systemPrompt: e.target.value})} placeholder={t('personaSystemPromptPlaceholder')} className="input-glass" rows={6}/>
                </div>
                <div className="form-group">
                    <label>{t('personaTools')}</label>
                    <div className="p-3 rounded-[var(--radius-2xl)] glass-pane flex flex-col gap-2">
                        <div className="flex justify-between items-center"><label className="font-medium">{t('googleSearch')}</label><Switch size="sm" checked={persona.tools.googleSearch} onChange={e => handleUpdate({tools: {...persona.tools, googleSearch: e.target.checked}})} /></div>
                        <div className="flex justify-between items-center"><label className="font-medium">{t('codeExecution')}</label><Switch size="sm" checked={persona.tools.codeExecution} onChange={e => handleUpdate({tools: { ...persona.tools, codeExecution: e.target.checked }})} /></div>
                        <div className="flex justify-between items-center"><label className="font-medium">{t('urlContext')}</label><Switch size="sm" checked={persona.tools.urlContext} onChange={e => handleUpdate({tools: { ...persona.tools, urlContext: e.target.checked }})} /></div>
                    </div>
                </div>
            </div>
        </div>
        <div className="persona-editor-builder-pane w-full md:w-auto h-96 md:h-auto">
          <AIBuilder persona={persona} onUpdate={handleUpdate} settings={settings} />
        </div>
    </main>
  );
};
