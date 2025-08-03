import React, { useState, useEffect, useRef } from 'react';
import { Persona, Settings } from '../../types';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useToast } from '../../contexts/ToastContext';
import { generatePersonaUpdate } from '../../services/geminiService';
import { Icon } from '../Icon';

interface BuilderMessage {
    id: string;
    role: 'user' | 'model' | 'status';
    content: string;
}

interface AIBuilderProps {
    persona: Persona;
    onUpdate: (update: Partial<Persona>) => void;
    settings: Settings;
}

export const AIBuilder: React.FC<AIBuilderProps> = ({ persona, onUpdate, settings }) => {
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
            const apiKeys = settings.apiKey?.length ? settings.apiKey : (process.env.API_KEY ? [process.env.API_KEY] : []);
            if (apiKeys.length === 0) throw new Error("API Key not set.");

            const { personaUpdate, explanation } = await generatePersonaUpdate(apiKeys, settings.defaultModel, persona, userInput, settings);
            
            onUpdate(personaUpdate);
            setMessages(prev => prev.map(m => m.id === statusMessageId ? { ...m, role: 'model', content: explanation } : m));
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
                    <div key={msg.id} className={`builder-message ${msg.role}`} style={{ animationDelay: `${index * 50}ms` }}>
                        {msg.role === 'status' ? <div className="applying-changes"><div className="spinner-sm"></div><span>{msg.content}</span></div> : msg.content}
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