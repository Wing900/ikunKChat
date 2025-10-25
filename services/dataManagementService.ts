import { ChatSession, Folder, Settings, Persona } from '../types';

const CHATS_KEY = 'kchat-sessions';
const FOLDERS_KEY = 'kchat-folders';
const SETTINGS_KEY = 'kchat-settings';
const ROLES_KEY = 'kchat-roles';
const CUSTOM_LANGUAGES_KEY = 'kchat-custom-languages';
const ACTIVE_CHAT_KEY = 'kchat-active-chat';

// --- Data Management ---
export const exportData = (data: { chats?: ChatSession[], folders?: Folder[], settings?: Settings, personas?: Persona[] }) => {
    const isFullExport = !!data.chats;
    const dataToExport = { ...data };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isFullExport ? `kchat_backup_${Date.now()}.json` : `kchat_settings_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const exportSelectedChats = (selectedChatIds: string[], allChats: ChatSession[]) => {
    // 筛选出选中的聊天
    const selectedChats = allChats.filter(chat => selectedChatIds.includes(chat.id));
    
    const dataToExport = {
        chats: selectedChats,
        exportType: 'selected-chats',
        exportDate: new Date().toISOString(),
        count: selectedChats.length
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kchat_selected_chats_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<{ chats?: ChatSession[], folders?: Folder[], settings?: Settings, personas?: Persona[] }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                // Basic validation
                if (typeof data === 'object' && data !== null && (data.settings || data.chats || data.folders || data.personas)) {
                    resolve(data);
                } else {
                    reject(new Error("Invalid file structure."));
                }
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

export const clearAllData = () => {
    localStorage.removeItem(CHATS_KEY);
    localStorage.removeItem(FOLDERS_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(ROLES_KEY);
    localStorage.removeItem(CUSTOM_LANGUAGES_KEY);
    localStorage.removeItem(ACTIVE_CHAT_KEY);
    // 清理记忆数据（如果存在）
    localStorage.removeItem('kchat-persona-memories');
    // We don't clear privacy consent here, as it should persist
};

export const clearChatHistory = () => {
    localStorage.removeItem(CHATS_KEY);
    localStorage.removeItem(FOLDERS_KEY);
    localStorage.removeItem(ACTIVE_CHAT_KEY);
    // 保留设置、角色和其他数据
};