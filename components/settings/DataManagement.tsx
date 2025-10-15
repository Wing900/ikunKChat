import React, { useRef } from 'react';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';

import { Settings } from '../../types';
import { SettingsItem } from '../SettingsItem';
import { CustomSelect } from '../CustomSelect';

interface DataManagementProps {
  settings: Settings;
  onSettingsChange: (newSettings: Partial<Settings>) => void;
  onExportSettings: () => void;
  onExportAll: () => void;
  onExportSelected: () => void;
  onImport: (file: File) => void;
  onClearAll: () => void;
  onClearChatHistory: () => void;
  visibleIds: Set<string>;
}

export const DataManagement: React.FC<DataManagementProps> = ({
  settings,
  onSettingsChange,
  onExportSettings,
  onExportAll,
  onExportSelected,
  onImport,
  onClearAll,
  onClearChatHistory,
  visibleIds
}) => {
  const { t } = useLocalization();
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const handleImportClick = () => importFileRef.current?.click();
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onImport(e.target.files[0]);
  };

  if (!visibleIds.has('dataManagement')) return null;

  return (
    <div className="space-y-4">
      {/* 导出设置 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--text-color-secondary)] uppercase tracking-wider">
          导出设置
        </h4>
        <SettingsItem label="PDF 导出清晰度">
          <CustomSelect
            options={[
              { value: 'sd', label: '标准' },
              { value: 'hd', label: '高清' },
              { value: 'uhd', label: '超清' },
            ]}
            selectedValue={settings.pdfQuality || 'hd'}
            onSelect={(value) => onSettingsChange({ pdfQuality: value as any })}
            className="w-48"
          />
        </SettingsItem>
      </div>

      {/* 导入/导出数据 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--text-color-secondary)] uppercase tracking-wider">
          导入/导出数据
        </h4>
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => {
              console.log('导出所选聊天按钮被点击');
              onExportSelected();
            }}
            className="btn-outline flex items-center justify-center gap-2 w-full"
          >
            <Icon icon="download" className="w-4 h-4"/>
            {t('exportSelectedChats')}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onExportSettings}
              className="btn-outline flex items-center justify-center gap-2"
            >
              <Icon icon="download" className="w-4 h-4"/>
              {t('exportSettings')}
            </button>
            <button
              onClick={onExportAll}
              className="btn-outline flex items-center justify-center gap-2"
            >
              <Icon icon="download" className="w-4 h-4"/>
              {t('exportData')}
            </button>
          </div>
        </div>
      </div>
      
      {/* 导入和清理功能区域 */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-[var(--text-color-secondary)] uppercase tracking-wider">
          {t('importData')}
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleImportClick}
            className="btn-outline flex items-center justify-center gap-2"
          >
            <Icon icon="upload" className="w-4 h-4"/>
            {t('importData')}
          </button>
          <button
            onClick={onClearChatHistory}
            className="btn-outline btn-warning flex items-center justify-center gap-2"
          >
            <Icon icon="delete" className="w-4 h-4"/>
            清除聊天历史
          </button>
          <input
            type="file"
            ref={importFileRef}
            accept=".json"
            onChange={handleFileImport}
            className="hidden"
          />
          <button
            onClick={onClearAll}
            className="btn-outline btn-danger flex items-center justify-center gap-2 col-span-2"
          >
            <Icon icon="delete" className="w-4 h-4"/>
            {t('clearHistory')}
          </button>
        </div>
      </div>
    </div>
  );
};
