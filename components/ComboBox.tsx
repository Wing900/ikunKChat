import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
}

interface ComboBoxProps {
  options: SelectOption[];
  value: string;
  onSelect: (value: string) => void;
  className?: string;
  placeholder?: string;
  allowCustom?: boolean;
  disabled?: boolean;
}

export const ComboBox: React.FC<ComboBoxProps> = ({
  options,
  value,
  onSelect,
  className = '',
  placeholder = 'Select an option',
  allowCustom = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  const getLabelByValue = useCallback((val: string) => {
    return options.find(opt => opt.value === val)?.label || val;
  }, [options]);

  useEffect(() => {
    setInputValue(getLabelByValue(value));
  }, [value, getLabelByValue]);

  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    const lowerInput = inputValue.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(lowerInput)
    );
  }, [inputValue, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setInputValue(getLabelByValue(value));
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, value, getLabelByValue]);

  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current) {
      const el = optionsRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleSelect = (selectedValue: string) => {
    setIsOpen(false);
    onSelect(selectedValue);
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value);
        } else if (allowCustom && inputValue.trim()) {
          handleSelect(inputValue.trim());
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % filteredOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        break;
      case 'Escape':
        setIsOpen(false);
        setInputValue(getLabelByValue(value));
        inputRef.current?.blur();
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
        if (!isOpen) { // If a click inside options list is happening, isOpen would be true
             setInputValue(getLabelByValue(value));
        }
    }, 200);
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="input-glass w-full pr-8"
        />
        <Icon icon="chevron-down" className={`w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-color-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div ref={optionsRef} className="absolute z-20 mt-2 w-full glass-pane rounded-[var(--radius-2xl)] p-1 shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                data-index={index}
                onMouseDown={() => handleSelect(option.value)}
                className={`px-3 py-2 rounded-[var(--radius-2xl)] cursor-pointer transition-colors duration-150 ${
                  highlightedIndex === index
                    ? 'bg-[rgba(0,122,255,0.2)] dark:bg-[rgba(10,132,255,0.25)]'
                    : 'text-[var(--text-color)]'
                }`}
              >
                {option.label}
              </div>
            ))
          ) : allowCustom ? (
            <div className="px-3 py-2 text-[var(--text-color-secondary)] italic">No results. Press Enter to add "{inputValue}".</div>
          ) : (
            <div className="px-3 py-2 text-[var(--text-color-secondary)] italic">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
};