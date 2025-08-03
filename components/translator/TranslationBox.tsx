import React, { useState } from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useToast } from '../../contexts/ToastContext';
import { Icon } from '../Icon';

interface TranslationBoxProps {
    text: string;
    setText: (text: string) => void;
    onRead: () => void;
    placeholder?: string;
    readOnly?: boolean;
    isSource?: boolean;
}

export const TranslationBox: React.FC<TranslationBoxProps> = ({ text, setText, onRead, placeholder, readOnly = false, isSource = false }) => {
    const { t } = useLocalization();
    const { addToast } = useToast();
    const [isCopied, setIsCopied] = useState(false);

    const handlePaste = async () => {
        try {
            const clipboardText = await navigator.clipboard.readText();
            setText(clipboardText);
        } catch (err) {
            addToast("Could not paste text.", 'error');
        }
    };

    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="flex-1 flex flex-col rounded-[var(--radius-2xl)] glass-pane p-1">
            <textarea
                value={text}
                onChange={e => !readOnly && setText(e.target.value)}
                readOnly={readOnly}
                placeholder={placeholder}
                className="bg-transparent w-full h-full flex-grow resize-none p-3 focus:outline-none"
            />
            <div className="flex items-center gap-2 p-2">
                {isSource && <button onClick={handlePaste} className="action-btn" data-tooltip={t('paste')} data-tooltip-placement="top"><Icon icon="clipboard" className="w-4 h-4"/></button>}
                <button onClick={onRead} className="action-btn" data-tooltip={t('read')} data-tooltip-placement="top"><Icon icon="volume-2" className="w-4 h-4"/></button>
                <button onClick={handleCopy} className="action-btn" data-tooltip={isCopied ? "Copied!" : t('copy')} data-tooltip-placement="top"><Icon icon="copy" className="w-4 h-4"/></button>
                {!readOnly && <button onClick={() => setText('')} className="action-btn ml-auto" data-tooltip={t('clear')} data-tooltip-placement="top"><Icon icon="delete" className="w-4 h-4"/></button>}
            </div>
        </div>
    );
};
