// 新的 storageService.ts - 作为统一入口和常量定义
export const CHATS_KEY = 'kchat-sessions';
export const FOLDERS_KEY = 'kchat-folders';
export const SETTINGS_KEY = 'kchat-settings';
export const ROLES_KEY = 'kchat-roles';
export const CUSTOM_LANGUAGES_KEY = 'kchat-custom-languages';
export const ACTIVE_CHAT_KEY = 'kchat-active-chat';
export const DATA_VERSION_KEY = 'kchat-data-version';
export const CURRENT_DATA_VERSION = '1.2.0'; // 数据版本号，用于数据迁移
export const PRIVACY_CONSENT_KEY = 'kchat-privacy-consent';
export const LAST_READ_VERSION_KEY = 'kchat-last-read-version';

// 重新导出各个服务模块
export { loadChats, saveChats } from './chatService';
export { loadSettings, saveSettings } from './settingsService';
export { loadRoles, saveRoles, validatePersona, sanitizePersona } from './roleService';
export type { PersonaValidationResult } from './roleService';
export { loadFolders, saveFolders } from './folderService';
export { loadActiveChatId, saveActiveChatId, loadCustomLanguages, saveCustomLanguages } from './appStateService';
export { exportData, exportSelectedChats, importData, clearAllData, clearChatHistory } from './dataManagementService';
export { loadPrivacyConsent, savePrivacyConsent, loadLastReadVersion, saveLastReadVersion } from './privacyService';

// 为了向后兼容，保留所有原有的函数导出
// 如果需要移除，可以在后续版本中逐步清理