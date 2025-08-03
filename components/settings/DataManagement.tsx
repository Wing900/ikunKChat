import React, { useRef } from 'react';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';

interface DataManagementProps {
  onExportSettings: () => void;
  onExportAll: () => void;
  onImport: (file: File) => void;
  onClearAll: () => void;
  visibleIds: Set<string>;
}

export const DataManagement: React.FC<DataManagementProps> = ({ onExportSettings, onExportAll, onImport, onClearAll, visibleIds }) => {
  const { t } = useLocalization();
  const importFileRef = useRef<HTMLInputElement>(null);
  
  const handleImportClick = () => importFileRef.current?.click();
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) onImport(e.target.files[0]); };

  if (!visibleIds.has('dataManagement')) return null;

  return (
    <div className="grid grid-cols-2 gap-3 mt-2">
      <button onClick={handleImportClick} className="btn-outline flex items-center justify-center gap-2"><Icon icon="upload" className="w-4 h-4"/>{t('importData')}</button>
      <input type="file" ref={importFileRef} accept=".json" onChange={handleFileImport} className="hidden" />
      <button onClick={onExportSettings} className="btn-outline flex items-center justify-center gap-2"><Icon icon="download" className="w-4 h-4"/>{t('exportSettings')}</button>
      <button onClick={onExportAll} className="btn-outline flex items-center justify-center gap-2"><Icon icon="download" className="w-4 h-4"/>{t('exportData')}</button>
      <button onClick={onClearAll} className="btn-outline btn-danger flex items-center justify-center gap-2"><Icon icon="delete" className="w-4 h-4"/>{t('clearHistory')}</button>
    </div>
  );
};
