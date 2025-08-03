import React from 'react';

interface SettingsSectionProps {
    title: string;
    isVisible: boolean;
    children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, isVisible, children }) => {
    if (!isVisible) {
        return null;
    }

    return (
        <>
            <h3 className="settings-section-title">{title}</h3>
            {children}
        </>
    );
};
