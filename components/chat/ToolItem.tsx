import React from 'react';
import { Icon, IconName } from '../Icon';
import { Switch } from '../Switch';

interface ToolItemProps {
    icon: IconName;
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
}

export const ToolItem: React.FC<ToolItemProps> = ({ icon, label, checked, onChange, disabled }) => (
    <div className={`flex items-center justify-between p-2 rounded-lg ${disabled ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-3">
            <Icon icon={icon} className="w-5 h-5" />
            <span className="font-semibold">{label}</span>
        </div>
        <Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
);
