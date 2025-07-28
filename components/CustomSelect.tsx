

import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({ options, selectedValue, onSelect, id, className, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find(opt => opt.value === selectedValue)?.label || selectedValue;

  const positionOptions = () => {
    if (!wrapperRef.current || !optionsRef.current) return;
    const triggerRect = wrapperRef.current.getBoundingClientRect();
    const optionsHeight = optionsRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    
    if (spaceBelow < optionsHeight && triggerRect.top > optionsHeight) {
      optionsRef.current.style.bottom = '100%';
      optionsRef.current.style.top = 'auto';
    } else {
      optionsRef.current.style.top = '100%';
      optionsRef.current.style.bottom = 'auto';
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      positionOptions();
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', positionOptions, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', positionOptions);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className || ''}`} ref={wrapperRef}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-2xl)] glass-pane border-none text-[var(--text-color)] disabled:opacity-50 disabled:cursor-not-allowed"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate">{selectedLabel}</span>
        <Icon icon="chevron-down" className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <div
          ref={optionsRef}
          className={`absolute z-20 mt-2 w-full glass-pane rounded-[var(--radius-2xl)] p-1 shadow-lg max-h-60 overflow-y-auto transition-opacity duration-200 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          role="listbox"
        >
          {options.map(option => (
            <div
              key={option.value}
              onClick={() => { onSelect(option.value); setIsOpen(false); }}
              className={`px-3 py-2 rounded-[var(--radius-2xl)] cursor-pointer transition-colors duration-150 ${
                selectedValue === option.value
                  ? 'bg-[var(--accent-color)] text-white font-semibold'
                  : 'text-[var(--text-color)] hover:bg-[rgba(0,122,255,0.2)] dark:hover:bg-[rgba(10,132,255,0.25)]'
              }`}
              role="option"
              aria-selected={selectedValue === option.value}
            >
              {option.label}
            </div>
          ))}
      </div>
    </div>
  );
};