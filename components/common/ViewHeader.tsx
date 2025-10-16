import React from 'react';
import { Icon } from '../Icon';
import { useLocalization } from '../../contexts/LocalizationContext';

interface ViewHeaderProps {
    title: string;
    onClose?: () => void;
    isSidebarCollapsed: boolean;
    onToggleSidebar: () => void;
    onToggleMobileSidebar: () => void;
    children?: React.ReactNode;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({ title, onClose, isSidebarCollapsed, onToggleSidebar, onToggleMobileSidebar, children }) => {
    const { t } = useLocalization();

    return (
        <header className="flex items-center justify-between mb-4 md:mb-6 flex-shrink-0 gap-4">
            <div className="flex items-center gap-2 min-w-0">
                {/* Mobile Sidebar Toggle */}
                <button
                    onClick={onToggleMobileSidebar}
                    className="md:hidden p-2 -ml-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95"
                    aria-label={t('expandSidebar')}
                >
                    <Icon icon="menu" className="w-6 h-6" />
                </button>

                {/* Desktop Sidebar Toggle */}
                {isSidebarCollapsed ? (
                    <button
                        onClick={onToggleSidebar}
                        className="hidden md:flex items-center justify-center p-3 -ml-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95"
                        aria-label={t('expandSidebar')}
                        data-tooltip={t('expandSidebar')}
                        data-tooltip-placement="right"
                    >
                        <Icon icon="menu" className="w-6 h-6" />
                    </button>
                ) : (
                    <button
                        onClick={onToggleSidebar}
                        className="hidden md:flex items-center justify-center p-3 -ml-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95"
                        aria-label={t('collapseSidebar')}
                        data-tooltip={t('collapseSidebar')}
                        data-tooltip-placement="right"
                    >
                        <Icon icon="panel-left-close" className="w-6 h-6" />
                    </button>
                )}
                <h2 className="text-2xl font-bold text-[var(--text-color)] truncate">{title}</h2>
            </div>
            <div className="flex items-center gap-2">
                {children}
                {onClose && (
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 -mr-2">
                        <Icon icon="close" className="w-5 h-5"/>
                    </button>
                )}
            </div>
        </header>
    );
};