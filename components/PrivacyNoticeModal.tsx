import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';

interface PrivacyNoticeModalProps {
  onConfirm: () => void;
}

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({ onConfirm }) => {
  const { t } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  
  const confirmationText = t('privacyConfirmationText');
  const isInputCorrect = inputValue.trim() === confirmationText;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleConfirm = () => {
    if (isInputCorrect) {
      onConfirm();
    }
  };

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`}></div>
      <div className={`modal-dialog modal-dialog-md ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col max-w-2xl`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-[var(--text-color)]">{t('privacyNoticeTitle')}</h2>
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto -mr-4 pr-4 pb-4 text-base space-y-4">
          <p>{t('privacyNoticeIntro')}</p>
          
          <h3 className="font-bold text-lg">{t('privacyComplianceTitle')}</h3>
          <p>{t('privacyComplianceText')}</p>
          
          <h3 className="font-bold text-lg">{t('privacyDataTitle')}</h3>
          <p dangerouslySetInnerHTML={{ __html: t('privacyDataIntro') }} />
          <ul className="list-disc list-inside space-y-2 pl-4">
            <li dangerouslySetInnerHTML={{ __html: t('privacyDataPoint1') }} />
            <li dangerouslySetInnerHTML={{ __html: t('privacyDataPoint2') }} />
            <li dangerouslySetInnerHTML={{ __html: t('privacyDataPoint3') }} />
          </ul>

          <h3 className="font-bold text-lg">{t('privacyUserResponsibilityTitle')}</h3>
          <p>{t('privacyUserResponsibilityText')}</p>
        </div>

        <div className="flex-shrink-0 pt-4 border-t border-[var(--glass-border)]">
          <p
            className="text-base mb-3 font-semibold"
            dangerouslySetInnerHTML={{ __html: t('privacyConfirmationPrompt').replace('{confirmationText}', confirmationText) }}
          />
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (!isTouched) setIsTouched(true);
              }}
              className={`input-glass flex-grow transition-colors ${isTouched && inputValue ? (isInputCorrect ? 'border-green-500/50' : 'border-red-500/50') : ''}`}
              placeholder={t('privacyInputPlaceholder')}
            />
            <button
              onClick={handleConfirm}
              disabled={!isInputCorrect}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon icon="check" className="w-4 h-4"/>
              {t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};