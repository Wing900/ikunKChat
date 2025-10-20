<<<<<<< HEAD
import React from 'react';

interface ActiveToolIndicatorProps {
  t: (key: string) => string;
}

export const ActiveToolIndicator: React.FC<ActiveToolIndicatorProps> = ({ t }) => {
  return null;
};
=======
import React from 'react';
import { Icon, IconName } from '../Icon';

interface ActiveToolIndicatorProps {
    isStudyMode: boolean;
    t: (key: any) => string;
}

export const ActiveToolIndicator: React.FC<ActiveToolIndicatorProps> = ({ isStudyMode, t }) => {
    const activeTools = [
        isStudyMode && { name: t('studyLearn'), icon: 'graduation-cap' as const },
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
>>>>>>> abb4fc710d0cdb394efd8c6759347f61f6bc403b
