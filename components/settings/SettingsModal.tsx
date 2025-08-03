import React, { useState, useEffect, useRef } from 'react';
import { Settings } from '../../types';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useSettingsSearch } from '../../hooks/useSettingsSearch';
import { SettingsSection } from './SettingsSection';
import { GeneralSettings } from './GeneralSettings';
import { BehaviorSettings } from './BehaviorSettings';
import { AdvancedSettings } from './AdvancedSettings';
import { DataManagement } from './DataManagement';

interface SettingsModalProps {
  settings: Settings;
  onClose: () => void;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  onExportSettings: () => void;
  onExportAll: () => void;
  onImport: (file: File) => void;
  onClearAll: () => void;
  availableModels: string[];
}

export const SettingsModal: React.FC<SettingsModalProps> = (props) => {
  const { t } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { visibleSettingIds, sectionVisibility } = useSettingsSearch(searchQuery);

  const handleClose = () => { setIsVisible(false); setTimeout(props.onClose, 300); };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handleKeyDown); };
  }, []);

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
      <div className={`modal-dialog modal-dialog-md ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0 gap-4">
          <h2 className="text-xl font-bold text-[var(--text-color)]">{t('settings')}</h2>
          <div className="sidebar-search-wrapper max-w-xs">
              <Icon icon="search" className="sidebar-search-icon w-4 h-4" />
              <input type="text" placeholder="Search settings..." className="sidebar-search-input !py-2 !text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2"><Icon icon="close" className="w-5 h-5"/></button>
        </div>
        
        <div className="flex-grow min-h-0 overflow-y-auto -mr-4 pr-4 pb-4">
          <SettingsSection title={t('general')} isVisible={sectionVisibility.general}>
            <GeneralSettings {...props} visibleIds={visibleSettingIds} />
          </SettingsSection>
          
          <SettingsSection title={t('behavior')} isVisible={sectionVisibility.behavior}>
            <BehaviorSettings {...props} visibleIds={visibleSettingIds} />
          </SettingsSection>

          <SettingsSection title={t('advanced')} isVisible={sectionVisibility.advanced}>
            <AdvancedSettings {...props} visibleIds={visibleSettingIds} />
          </SettingsSection>
          
          <SettingsSection title={t('dataManagement')} isVisible={sectionVisibility.data}>
            <DataManagement {...props} visibleIds={visibleSettingIds} />
          </SettingsSection>
        </div>
      </div>
    </>
  );
};
