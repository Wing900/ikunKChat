import React, { useState, useMemo } from 'react';
import { Persona } from '../types';
import { Icon } from './Icon';
import { useLocalization } from '../contexts/LocalizationContext';
import { PersonaAvatar } from './common/PersonaAvatar';
import { Toast } from './Toast';

const PersonaCard: React.FC<{ persona: Persona & { isHiding?: boolean }, onStartChat: () => void, onEdit: () => void, onDelete: () => void, index: number }> = ({ persona, onStartChat, onEdit, onDelete, index }) => {
    const { t } = useLocalization();
    const [isBeingDeleted, setIsBeingDeleted] = useState(false);

    const handleDeleteClick = () => {
        setIsBeingDeleted(true);
        setTimeout(() => {
            onDelete();
        }, 400); // Animation duration is 0.4s
    };
    
    return (
        <div className={`persona-card group ${isBeingDeleted ? 'deleting' : ''} ${persona.isHiding ? 'hiding' : ''}`} style={{ animationDelay: `${index * 50}ms` }}>
            <div className="persona-card-actions">
                <button onClick={onEdit} className="action-btn" data-tooltip={t('editPersona')} data-tooltip-placement="top"><Icon icon="edit" className="w-4 h-4"/></button>
                {!persona.isDefault && (
                    <button onClick={handleDeleteClick} className="action-btn danger" data-tooltip={t('deletePersona')} data-tooltip-placement="top"><Icon icon="delete" className="w-4 h-4"/></button>
                )}
            </div>
            <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 flex-shrink-0 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center text-white overflow-hidden">
                    <PersonaAvatar avatar={persona.avatar} className="text-4xl" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">{persona.name}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-color-secondary)]">
                        {persona.tools?.googleSearch && <Icon icon="search" className="w-4 h-4" data-tooltip="Google Search Enabled" />}
                        {persona.tools?.codeExecution && <Icon icon="code" className="w-4 h-4" data-tooltip="Code Execution Enabled" />}
                    </div>
                </div>
            </div>
            <p className="text-sm text-[var(--text-color-secondary)] flex-grow mb-4 h-16 overflow-hidden">{persona.bio}</p>
            <button onClick={onStartChat} className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2 text-md font-semibold bg-[var(--accent-color)] text-white rounded-[var(--radius-2xl)] transition-transform hover:scale-105 active:scale-100">
                <Icon icon="plus" className="w-5 h-5" />
                {t('startChat')}
            </button>
        </div>
    );
}

const CreatePersonaCard: React.FC<{ onClick: () => void, index: number, isHiding: boolean }> = ({ onClick, index, isHiding }) => {
    const { t } = useLocalization();
    return (
        <button onClick={onClick} className={`persona-card persona-card-new flex flex-col items-center justify-center text-center ${isHiding ? 'hiding' : ''}`} style={{ animationDelay: `${index * 50}ms` }}>
            <div className="w-16 h-16 rounded-full bg-white/20 dark:bg-black/20 flex items-center justify-center mb-3 transition-colors duration-300">
                <Icon icon="plus" className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold">{t('createPersona')}</h3>
        </button>
    );
};


interface RolesViewProps {
  personas: Persona[];
  onClose: () => void;
  onStartChat: (id: string) => void;
  onEditPersona: (persona: Persona) => void;
  onCreatePersona: () => void;
  onDeletePersona: (id: string) => void;
  error?: string | null;
  clearError?: () => void;
}

export const RolesView: React.FC<RolesViewProps> = ({
  personas,
  onClose,
  onStartChat,
  onEditPersona,
  onCreatePersona,
  onDeletePersona,
  error,
  clearError
}) => {
  const { t } = useLocalization();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    tools: {
      googleSearch: undefined as boolean | undefined,
      codeExecution: undefined as boolean | undefined,
      urlContext: undefined as boolean | undefined,
    },
    isDefault: undefined as boolean | undefined,
  });

  const displayedPersonas = useMemo(() => {
      // 首先过滤掉无效的 personas
      const validPersonas = personas.filter(p => p);
      const hasQuery = !!searchQuery.trim();
      if (!hasQuery && !showFilters) return validPersonas.map(p => ({ ...p, isHiding: false }));

      let filtered = validPersonas;
      
      // 文本搜索
      if (hasQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(p =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.bio.toLowerCase().includes(lowerQuery) ||
          p.systemPrompt.toLowerCase().includes(lowerQuery)
        );
      }
      
      // 应用过滤器
      if (showFilters) {
        if (filters.tools.googleSearch !== undefined) {
          filtered = filtered.filter(p => p.tools.googleSearch === filters.tools.googleSearch);
        }
        if (filters.tools.codeExecution !== undefined) {
          filtered = filtered.filter(p => p.tools.codeExecution === filters.tools.codeExecution);
        }
        if (filters.tools.urlContext !== undefined) {
          filtered = filtered.filter(p => p.tools.urlContext === filters.tools.urlContext);
        }
        if (filters.isDefault !== undefined) {
          filtered = filtered.filter(p => p.isDefault === filters.isDefault);
        }
      }
      
      return validPersonas.map(p => ({
        ...p,
        isHiding: !filtered.includes(p)
      }));
  }, [personas, searchQuery, showFilters, filters]);
  
  const createCardIsHiding = useMemo(() => !!(searchQuery.trim() || showFilters), [searchQuery, showFilters]);

  return (
    <main className="glass-pane rounded-[var(--radius-2xl)] flex flex-col h-full overflow-hidden relative p-4 md:p-6">
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-700 hover:text-red-900">
            <Icon icon="close" className="w-4 h-4" />
          </button>
        </div>
      )}
      
      <header className="flex items-center justify-between mb-4 md:mb-6 flex-shrink-0 gap-4">
        <h2 className="text-2xl font-bold text-[var(--text-color)]">{t('selectPersona')}</h2>
         <div className="flex items-center gap-2">
            <div className="sidebar-search-wrapper max-w-xs">
                <Icon icon="search" className="sidebar-search-icon w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索角色..."
                  className="sidebar-search-input !py-2 !text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 ${showFilters ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              title="过滤器"
            >
              <Icon icon="settings" className="w-5 h-5"/>
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2">
                <Icon icon="close" className="w-5 h-5"/>
            </button>
         </div>
      </header>
      
      {/* 过滤器面板 */}
      {showFilters && (
        <div className="mb-4 p-4 bg-white/10 dark:bg-black/10 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">工具类型</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.tools.googleSearch === true}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      tools: { ...prev.tools, googleSearch: e.target.checked ? true : undefined }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Google搜索</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.tools.codeExecution === true}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      tools: { ...prev.tools, codeExecution: e.target.checked ? true : undefined }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">代码执行</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.tools.urlContext === true}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      tools: { ...prev.tools, urlContext: e.target.checked ? true : undefined }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">URL上下文</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">角色类型</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="personaType"
                    checked={filters.isDefault === undefined}
                    onChange={() => setFilters(prev => ({ ...prev, isDefault: undefined }))}
                    className="mr-2"
                  />
                  <span className="text-sm">全部</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="personaType"
                    checked={filters.isDefault === true}
                    onChange={() => setFilters(prev => ({ ...prev, isDefault: true }))}
                    className="mr-2"
                  />
                  <span className="text-sm">默认角色</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="personaType"
                    checked={filters.isDefault === false}
                    onChange={() => setFilters(prev => ({ ...prev, isDefault: false }))}
                    className="mr-2"
                  />
                  <span className="text-sm">自定义角色</span>
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setFilters({
                  tools: {
                    googleSearch: undefined,
                    codeExecution: undefined,
                    urlContext: undefined,
                  },
                  isDefault: undefined,
                });
                setSearchQuery('');
              }}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              清除过滤器
            </button>
          </div>
        </div>
      )}
      <div className="flex-grow overflow-y-auto -mr-4 md:-mr-6 -ml-2 pr-2 md:pr-4 pl-2">
          <div className="personas-grid p-2">
            {displayedPersonas.map((p, i) => (
                <PersonaCard
                    key={p.id}
                    persona={p}
                    index={i}
                    onStartChat={() => p && onStartChat(p.id)}
                    onEdit={() => p && onEditPersona(p)}
                    onDelete={() => p && onDeletePersona(p.id)}
                />
            ))}
            <CreatePersonaCard onClick={onCreatePersona} index={personas.filter(p => p).length} isHiding={createCardIsHiding} />
          </div>
      </div>
    </main>
  );
};
