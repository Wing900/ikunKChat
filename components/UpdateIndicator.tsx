import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';

interface UpdateIndicatorProps {
  updateAvailable: boolean;
  isCheckingUpdate: boolean;
  onClick: () => void;
  versionInfo?: {
    version: string;
    releaseDate: string;
    notes: {
      [key: string]: string[];
    };
  };
}

export const UpdateIndicator: React.FC<UpdateIndicatorProps> = ({
  updateAvailable,
  isCheckingUpdate,
  onClick,
  versionInfo
}) => {
  const { t, language } = useLocalization();
  const [showUpdateDropdown, setShowUpdateDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUpdateDropdown(false);
      }
    };

    if (showUpdateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUpdateDropdown]);

  const handleIndicatorClick = () => {
    if (updateAvailable && versionInfo) {
      setShowUpdateDropdown(!showUpdateDropdown);
    } else {
      onClick();
    }
  };

  const getReleaseNotes = () => {
    if (!versionInfo) return [];
    return versionInfo.notes[language] || versionInfo.notes['en'] || [];
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleIndicatorClick}
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

      {/* 更新日志下拉菜单 */}
      {showUpdateDropdown && updateAvailable && versionInfo && (
        <div className="absolute bottom-full left-0 mb-2 w-72 glass-pane rounded-[var(--radius-lg)] shadow-lg z-50 border border-[var(--border-color)] overflow-hidden">
          {/* 头部信息 */}
          <div className="px-4 py-3 bg-green-500/10 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Icon icon="gift" className="w-5 h-5 text-green-500" />
              <div>
                <h3 className="font-semibold text-[var(--text-color)]">
                  {t('updateAvailable')}!
                </h3>
                <p className="text-xs text-[var(--text-color-secondary)]">
                  Version {versionInfo.version} - {versionInfo.releaseDate}
                </p>
              </div>
            </div>
          </div>

          {/* 更新日志内容 */}
          <div className="max-h-60 overflow-y-auto p-4">
            <h4 className="font-semibold mb-2 text-[var(--text-color)]">{t('releaseNotes')}:</h4>
            <ul className="space-y-2">
              {getReleaseNotes().map((note, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-[var(--text-color)]">{note}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 操作按钮 */}
          <div className="px-4 py-3 bg-[var(--hover-bg)] border-t border-[var(--border-color)]">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowUpdateDropdown(false);
                  onClick();
                }}
                className="flex-1 px-3 py-1.5 text-sm bg-[var(--accent-color)] text-[var(--accent-color-text)] rounded-[var(--radius-md)] hover:bg-[var(--accent-color)]/80 transition-colors font-medium"
              >
                {t('updateNow')}
              </button>
              <button
                onClick={() => setShowUpdateDropdown(false)}
                className="flex-1 px-3 py-1.5 text-sm text-[var(--text-color)] bg-[var(--glass-bg)] rounded-[var(--radius-md)] hover:bg-[var(--hover-bg)] transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};