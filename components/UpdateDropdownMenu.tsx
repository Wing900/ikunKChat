import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';

interface UpdateDropdownMenuProps {
  isVisible: boolean;
  onClose: () => void;
  onViewDetails: () => void;
  onCheckUpdate: () => void;
  onUpdateNow: () => void;
  isCheckingUpdate: boolean;
  updateAvailable: boolean;
}

export const UpdateDropdownMenu: React.FC<UpdateDropdownMenuProps> = ({
  isVisible,
  onClose,
  onViewDetails,
  onCheckUpdate,
  onUpdateNow,
  isCheckingUpdate,
  updateAvailable
}) => {
  const { t } = useLocalization();
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute bottom-full left-0 mb-2 w-56 glass-pane rounded-[var(--radius-lg)] shadow-lg z-50 border border-[var(--border-color)] overflow-hidden"
    >
      <div className="py-1">
        <button
          onClick={() => {
            onViewDetails();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors"
          disabled={!updateAvailable}
        >
          <Icon icon="gift" className="w-4 h-4" />
          <span className="font-medium">{t('updateDetails')}</span>
          {!updateAvailable && (
            <span className="ml-auto text-xs text-[var(--text-color-secondary)]">
              {t('upToDate')}
            </span>
          )}
        </button>
        
        <button
          onClick={() => {
            onCheckUpdate();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--text-color)] hover:bg-[var(--hover-bg)] transition-colors"
          disabled={isCheckingUpdate}
        >
          <Icon icon="refresh" className={`w-4 h-4 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
          <span className="font-medium">
            {isCheckingUpdate ? t('checkingUpdate') : t('checkForUpdate')}
          </span>
        </button>
        
        {updateAvailable && (
          <>
            <div className="border-t border-[var(--border-color)] my-1"></div>
            <button
              onClick={() => {
                onUpdateNow();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[var(--accent-color)] hover:bg-[var(--accent-color)]/10 transition-colors"
            >
              <Icon icon="download" className="w-4 h-4" />
              <span className="font-medium">{t('updateNow')}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};