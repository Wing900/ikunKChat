import React, { useState, useEffect, useRef } from 'react';
import { Settings, Persona } from '../../types';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';
import { useSettingsSearch } from '../../hooks/useSettingsSearch';
import { SettingsSection } from './SettingsSection';
import { GeneralSettings } from './GeneralSettings';
import { BehaviorSettings } from './BehaviorSettings';
import { AdvancedSettings } from './AdvancedSettings';
import { DataManagement } from './DataManagement';
import { AboutSettings } from './AboutSettings';

interface SettingsModalProps {
  settings: Settings;
  onClose: () => void;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  onExportSettings: () => void;
  onExportAll: () => void;
  onExportSelectedChats: () => void;
  onImport: (file: File) => void;
  onClearAll: () => void;
  availableModels: string[];
  personas: Persona[];
  versionInfo: { version: string } | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ versionInfo, ...props }) => {
  const { t } = useLocalization();
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'behavior' | 'advanced' | 'data' | 'about'>('general');
  const { visibleSettingIds, sectionVisibility } = useSettingsSearch(searchQuery);

  const handleClose = () => { setIsVisible(false); setTimeout(props.onClose, 300); };

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => { clearTimeout(timer); window.removeEventListener('keydown', handleKeyDown); };
  }, []);

  // 如果有搜索查询，显示所有可见的设置部分
  const showAllSections = !!searchQuery.trim();

  return (
    <>
      <div className={`modal-backdrop ${isVisible ? 'visible' : ''}`} onClick={handleClose}></div>
      <div className={`modal-dialog modal-dialog-md ${isVisible ? 'visible' : ''} glass-pane rounded-[var(--radius-2xl)] p-6 flex flex-col`}>
        <div className="flex items-center justify-between mb-4 flex-shrink-0 gap-4">
          <h2 className="text-xl font-bold text-[var(--text-color)]">{t('settings')}</h2>
          <div className="sidebar-search-wrapper max-w-xs">
              <Icon icon="search" className="sidebar-search-icon w-4 h-4" />
              <input type="text" placeholder="搜索设置..." className="sidebar-search-input !py-2 !text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2"><Icon icon="close" className="w-5 h-5"/></button>
        </div>
        
        {/* 标签导航 */}
        {!showAllSections && (
          <div className="flex border-b border-[var(--glass-border)] mb-4 -mx-6 px-6">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'general' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-[var(--text-color-secondary)] hover:text-[var(--text-color)]'}`}
              onClick={() => setActiveTab('general')}
            >
              {t('general')}
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'behavior' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-[var(--text-color-secondary)] hover:text-[var(--text-color)]'}`}
              onClick={() => setActiveTab('behavior')}
            >
              {t('behavior')}
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'advanced' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-[var(--text-color-secondary)] hover:text-[var(--text-color)]'}`}
              onClick={() => setActiveTab('advanced')}
            >
              {t('advanced')}
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'data' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-[var(--text-color-secondary)] hover:text-[var(--text-color)]'}`}
              onClick={() => setActiveTab('data')}
            >
              {t('dataManagement')}
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'about' ? 'text-[var(--accent-color)] border-b-2 border-[var(--accent-color)]' : 'text-[var(--text-color-secondary)] hover:text-[var(--text-color)]'}`}
              onClick={() => setActiveTab('about')}
            >
              {t('about')}
            </button>
          </div>
        )}
        
        <div className="flex-grow min-h-0 overflow-y-auto -mr-4 pr-4 pb-4">
          {showAllSections || activeTab === 'general' ? (
            <SettingsSection title={t('general')} isVisible={showAllSections || sectionVisibility.general}>
              <GeneralSettings {...props} visibleIds={visibleSettingIds} />
            </SettingsSection>
          ) : null}
          
          {showAllSections || activeTab === 'behavior' ? (
            <SettingsSection title={t('behavior')} isVisible={showAllSections || sectionVisibility.behavior}>
              <BehaviorSettings {...props} visibleIds={visibleSettingIds} availableModels={props.availableModels} />
            </SettingsSection>
          ) : null}

          {showAllSections || activeTab === 'advanced' ? (
            <SettingsSection title={t('advanced')} isVisible={showAllSections || sectionVisibility.advanced}>
              <AdvancedSettings {...props} visibleIds={visibleSettingIds} availableModels={props.availableModels} />
            </SettingsSection>
          ) : null}
          
          {showAllSections || activeTab === 'data' ? (
            <SettingsSection title={t('dataManagement')} isVisible={showAllSections || sectionVisibility.data}>
              <DataManagement
                onExportSettings={props.onExportSettings}
                onExportAll={props.onExportAll}
                onExportSelected={() => {
                  console.log('SettingsModal: 调用 onExportSelectedChats');
                  props.onExportSelectedChats();
                }}
                onImport={props.onImport}
                onClearAll={props.onClearAll}
                visibleIds={visibleSettingIds}
              />
            </SettingsSection>
          ) : null}

          {activeTab === 'about' && !showAllSections ? (
            <SettingsSection title={t('about')} isVisible={true}>
              <AboutSettings versionInfo={versionInfo} />
            </SettingsSection>
          ) : null}
        </div>
      </div>
    </>
  );
};
