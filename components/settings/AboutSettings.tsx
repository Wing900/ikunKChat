import React from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Icon } from '../Icon';

interface AboutSettingsProps {
  versionInfo: { version: string } | null;
}

export const AboutSettings: React.FC<AboutSettingsProps> = ({ versionInfo }) => {
  const { t } = useLocalization();

  return (
    <div className="space-y-6 text-sm text-[var(--text-color-secondary)]">
      
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[var(--text-color)]">{t('privacyComplianceTitle')}</h3>
        <p>{t('privacyComplianceText')}</p>
        
        <h3 className="font-bold text-lg text-[var(--text-color)]">{t('privacyDataTitle')}</h3>
        <p dangerouslySetInnerHTML={{ __html: t('privacyDataIntro') }} />
        <ul className="list-disc list-inside space-y-2 pl-4">
          <li dangerouslySetInnerHTML={{ __html: t('privacyDataPoint1') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacyDataPoint2') }} />
          <li dangerouslySetInnerHTML={{ __html: t('privacyDataPoint3') }} />
        </ul>

        <h3 className="font-bold text-lg text-[var(--text-color)]">{t('privacyUserResponsibilityTitle')}</h3>
        <p>{t('privacyUserResponsibilityText')}</p>
      </div>

      <div className="border-t border-[var(--glass-border)] pt-6 space-y-4">
        <h3 className="font-bold text-lg text-[var(--text-color)]">{t('usefulLinks')}</h3>
        <div className="flex flex-wrap gap-4">
          <a href="https://github.com/Wing900/KChat" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--accent-color)] hover:underline">
            <Icon icon="github" className="w-4 h-4" />
            <span>{t('sourceCode')}</span>
          </a>
          <a href="https://github.com/Wing900/KChat/issues" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--accent-color)] hover:underline">
            <Icon icon="bug" className="w-4 h-4" />
            <span>{t('reportBug')}</span>
          </a>
          <a href="https://github.com/Wing900/KChat/discussions" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--accent-color)] hover:underline">
            <Icon icon="message-square" className="w-4 h-4" />
            <span>{t('discussions')}</span>
          </a>
        </div>
      </div>
    </div>
  );
};