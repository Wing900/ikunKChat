import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Persona, Settings } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import { generatePersonaUpdate } from '../services/geminiService';
import { fileToData } from '../utils/fileUtils';
import { Switch } from './Switch';
import { useToast } from '../contexts/ToastContext';

const newPersonaTemplate: Persona = {
  id: '',
  name: '',
  avatar: { type: 'emoji', value: '🤖' },
  bio: '',
  systemPrompt: 'You are a helpful AI assistant.',
  tools: { googleSearch: false, codeExecution: false, urlContext: false },
  isNew: true,
};

const PersonaAvatar: React.FC<{ avatar: Persona['avatar'] }> = ({ avatar }) => {
  if (avatar.type === 'emoji') {
    return <span className="text-4xl flex items-center justify-center w-full h-full">{avatar.value}</span>;
  }
  return <img src={avatar.value} alt="persona avatar" className="w-full h-full object-cover" />;
};

interface BuilderMessage {
    id: string;
    role: 'user' | 'model' | 'status';
    content: string;
}

const AIBuilder: React.FC<{ persona: Persona, onUpdate: (update: Partial<Persona>) => void, settings: Settings }> = ({ persona, onUpdate, settings }) => {
    const { t } = useLocalization();
    const { addToast } = useToast();
    const [messages, setMessages] = useState<BuilderMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userInput = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content: userInput }]);
        setIsLoading(true);
        const statusMessageId = crypto.randomUUID();
        setMessages(prev => [...prev, { id: statusMessageId, role: 'status', content: t('builderApplying') }]);

        try {
            const apiKeys = settings.apiKey && settings.apiKey.length > 0
                ? settings.apiKey
                : (process.env.API_KEY ? [process.env.API_KEY] : []);

            if (apiKeys.length === 0) {
                throw new Error("API Key not set.");
            }

            const { personaUpdate, explanation } = await generatePersonaUpdate(apiKeys, settings.defaultModel, persona, userInput, settings);
            
            onUpdate(personaUpdate);

            setMessages(prev => prev.map(m => 
                m.id === statusMessageId 
                ? { ...m, role: 'model', content: explanation } 
                : m
            ));

        } catch (error) {
            console.error(error);
            const errorMessage = (error as Error).message.includes("API Key not set") 
                ? "API Key not set. Please add it in Settings."
                : "Sorry, I couldn't process that. Please try again.";
            
            addToast(errorMessage, 'error');

            setMessages(prev => prev.filter(m => m.id !== statusMessageId));
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="persona-editor-builder">
            <div className="builder-chat-area">
                {messages.length === 0 && !isLoading && (
                    <div className="builder-welcome">
                        <Icon icon="users" className="w-12 h-12" />
                        <h3>AI Persona Builder</h3>
                        <p>Describe the changes you want to make, and I'll update the form.</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div 
                        key={msg.id} 
                        className={`builder-message ${msg.role}`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {msg.role === 'status' ? (
                            <div className="applying-changes"><div className="spinner-sm"></div><span>{msg.content}</span></div>
                        ) : msg.content}
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="mt-auto flex gap-2">
                <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder={t('builderInputPlaceholder')} className="input-glass flex-grow" disabled={isLoading} />
                <button type="submit" disabled={isLoading || !input.trim()} className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-white rounded-[var(--radius-2xl)] bg-[var(--accent-color)] disabled:opacity-50 transition-transform hover:scale-105">
                    <Icon icon="send" className="w-5 h-5"/>
                </button>
            </form>
        </div>
    );
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
        console.error("Error processing avatar file:", error);
        addToast("Could not load image.", 'error');
      }
    }
  };

  const handleSave = () => {
    if(persona.name.trim() && persona.bio.trim() && persona.systemPrompt.trim()) {
      onSave(persona);
    } else {
      addToast("Please fill out all fields before saving.", 'error');
    }
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
                            <PersonaAvatar avatar={persona.avatar} />
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
                        <div className="flex justify-between items-center">
                            <label className="font-medium">{t('googleSearch')}</label>
                            <Switch size="sm" checked={persona.tools.googleSearch} onChange={e => handleUpdate({tools: {...persona.tools, googleSearch: e.target.checked}})} />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="font-medium">{t('codeExecution')}</label>
                            <Switch size="sm" checked={persona.tools.codeExecution} onChange={e => handleUpdate({tools: { ...persona.tools, codeExecution: e.target.checked }})} />
                        </div>
                        <div className="flex justify-between items-center">
                            <label className="font-medium">{t('urlContext')}</label>
                            <Switch size="sm" checked={persona.tools.urlContext} onChange={e => handleUpdate({tools: { ...persona.tools, urlContext: e.target.checked }})} />
                        </div>
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
