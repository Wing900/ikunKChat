import React from 'react';
import { Icon, IconName } from '../Icon';

interface ActiveToolIndicatorProps {
    toolConfig: any;
    isStudyMode: boolean;
    t: (key: any) => string;
}

export const ActiveToolIndicator: React.FC<ActiveToolIndicatorProps> = ({ toolConfig, isStudyMode, t }) => {
    const activeTools = [
        isStudyMode && { name: t('studyLearn'), icon: 'graduation-cap' as const },
        toolConfig.googleSearch && { name: t('googleSearch'), icon: 'search' as const },
        toolConfig.codeExecution && { name: t('codeExecution'), icon: 'code' as const },
        toolConfig.urlContext && { name: t('urlContext'), icon: 'link' as const },
    ].filter(Boolean) as { name: string, icon: IconName }[];

    if (activeTools.length === 0) return null;

    return (
        <div className="active-tools-indicator">
            {activeTools.map((tool, index) => (
                <div key={tool.name} className="active-tool-chip" style={{animationDelay: `${index * 50}ms`}}>
                    <Icon icon={tool.icon} className="w-4 h-4" />
                    <span>{tool.name}</span>
                </div>
            ))}
        </div>
    );
};
