import { ChatSession, Folder, Settings, Persona, TranslationHistoryItem } from '../types';

const CHATS_KEY = 'kchat-sessions';
const FOLDERS_KEY = 'kchat-folders';
const SETTINGS_KEY = 'kchat-settings';
const ROLES_KEY = 'kchat-roles';
const TRANSLATION_HISTORY_KEY = 'kchat-translation-history';
const CUSTOM_LANGUAGES_KEY = 'kchat-custom-languages';

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
        if (!saved) return null;

        const parsed = JSON.parse(saved);
        
        // Data migration: Handle legacy apiKey format (string or null)
        if (parsed.apiKey && typeof parsed.apiKey === 'string') {
            parsed.apiKey = [parsed.apiKey];
        } else if (!Array.isArray(parsed.apiKey)) {
            // Ensure apiKey is always an array if it exists but is not one, or is null/undefined.
            parsed.apiKey = [];
        }

        return parsed;
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

export const loadTranslationHistory = (): TranslationHistoryItem[] => {
    try {
        const saved = localStorage.getItem(TRANSLATION_HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to load translation history from localStorage", error);
        return [];
    }
};

export const loadCustomLanguages = (): { code: string, name: string }[] => {
    try {
        const saved = localStorage.getItem(CUSTOM_LANGUAGES_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to load custom languages from localStorage", error);
        return [];
    }
};


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

export const saveTranslationHistory = (history: TranslationHistoryItem[]) => {
    try {
        localStorage.setItem(TRANSLATION_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error("Failed to save translation history to localStorage", error);
    }
};

export const saveCustomLanguages = (languages: { code: string, name: string }[]) => {
    try {
        localStorage.setItem(CUSTOM_LANGUAGES_KEY, JSON.stringify(languages));
    } catch (error) {
        console.error("Failed to save custom languages to localStorage", error);
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
    localStorage.removeItem(TRANSLATION_HISTORY_KEY);
    localStorage.removeItem(CUSTOM_LANGUAGES_KEY);
};