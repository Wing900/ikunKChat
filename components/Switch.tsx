import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, disabled = false, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'switch-sm' : '';
  
  return (
    <label className={`switch ${sizeClass}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <span className="switch-slider"></span>
    </label>
  );
};
