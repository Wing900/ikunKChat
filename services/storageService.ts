import { ChatSession, Folder, Settings, Persona } from '../types';

const CHATS_KEY = 'kchat-sessions';
const FOLDERS_KEY = 'kchat-folders';
const SETTINGS_KEY = 'kchat-settings';
const ROLES_KEY = 'kchat-roles';

// --- Loaders ---
export const loadChats = (): ChatSession[] => {
    try {
        const saved = localStorage.getItem(CHATS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to load chats from localStorage", error);
        return [];
    }
};

export const loadFolders = (): Folder[] => {
    try {
        const saved = localStorage.getItem(FOLDERS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to load folders from localStorage", error);
        return [];
    }
};

export const loadSettings = (): Partial<Settings> | null => {
    try {
        const saved = localStorage.getItem(SETTINGS_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Failed to load settings from localStorage", error);
        return null;
    }
};

export const loadRoles = (): Persona[] => {
    try {
        const saved = localStorage.getItem(ROLES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to load roles from localStorage", error);
        return [];
    }
}

// --- Savers ---
export const saveChats = (chats: ChatSession[]) => {
    try {
        // Strip out attachment data before saving to save space
        const chatsToSave = chats.map(c => ({
            ...c,
            messages: c.messages.map(({ attachments, ...m }) => ({
                ...m,
                attachments: attachments?.map(({ name, mimeType }) => ({ name, mimeType }))
            }))
        }));
        localStorage.setItem(CHATS_KEY, JSON.stringify(chatsToSave));
    } catch (error) {
        console.error("Failed to save chats to localStorage", error);
    }
};

export const saveFolders = (folders: Folder[]) => {
    try {
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } catch (error) {
        console.error("Failed to save folders to localStorage", error);
    }
};

export const saveSettings = (settings: Settings) => {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
};

export const saveRoles = (roles: Persona[]) => {
    try {
        localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
    } catch (error) {
        console.error("Failed to save roles to localStorage", error);
    }
};


// --- Data Management ---
export const exportData = (data: { chats?: ChatSession[], folders?: Folder[], settings?: Settings, personas?: Persona[] }) => {
    const isFullExport = !!data.chats;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isFullExport ? `kchat_backup_${Date.now()}.json` : `kchat_settings_${Date.now()}.json`;
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
};
