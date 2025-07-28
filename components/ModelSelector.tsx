
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

interface ModelSelectorProps {
  models: string[];
  selectedModel: string;
  onModelChange: (model: string) => void;
  isHeader?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModel, onModelChange, isHeader = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleSelect = (model: string) => {
    onModelChange(model);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="model-selector-wrapper" ref={wrapperRef}>
      <div className={`model-selector-options glass-pane ${isOpen ? 'visible' : ''} ${isHeader ? 'header-selector' : ''}`}>
        {models.map(model => (
          <div key={model} onClick={() => handleSelect(model)} className={`model-selector-option ${selectedModel === model ? 'active' : ''}`}>
            <Icon icon="chip" className="w-5 h-5 flex-shrink-0" />
            <span>{model}</span>
          </div>
        ))}
      </div>
      <button onClick={toggleOpen} className="model-selector-trigger glass-pane">
        <div className="flex items-center gap-3">
          <Icon icon="chip" className="w-5 h-5 text-[var(--accent-color)]" />
          <span className="font-semibold text-[var(--text-color)]">{selectedModel || "Select Model"}</span>
        </div>
        <Icon icon="chevron-down" className={`w-5 h-5 text-[var(--text-color-secondary)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};