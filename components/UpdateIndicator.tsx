import React from 'react';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';

interface UpdateIndicatorProps {
  updateAvailable: boolean;
  isCheckingUpdate: boolean;
  onClick: () => void;
}

export const UpdateIndicator: React.FC<UpdateIndicatorProps> = ({
  updateAvailable,
  isCheckingUpdate,
  onClick
}) => {
  const { t } = useLocalization();

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-2xl)] text-[var(--text-color)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors relative`}
      data-tooltip={t('update')}
      data-tooltip-placement="right"
    >
      <Icon
        icon="download"
        className={`w-5 h-5 ${isCheckingUpdate ? 'animate-spin' : ''}`}
      />
      <span className="font-semibold">{t('update')}</span>
      
      {/* 更新状态指示器 */}
      {updateAvailable && (
        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--glass-bg)]"></span>
      )}
      
      {/* 检查更新状态指示器 */}
      {isCheckingUpdate && (
        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-[var(--glass-bg)] animate-pulse"></span>
      )}
    </button>
  );
};