import React from 'react';

interface SettingsItemProps {
    label: string;
    description: string;
    children: React.ReactNode;
    isDisabled?: boolean;
    className?: string;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({ label, description, children, isDisabled, className = '' }) => {
    return (
        <div className={`settings-item transition-opacity ${isDisabled ? 'opacity-50' : ''} ${className}`}>
            <div>
                <p className="settings-item-label">{label}</p>
                <p className="settings-item-description">{description}</p>
            </div>
            {children}
        </div>
    );
};
