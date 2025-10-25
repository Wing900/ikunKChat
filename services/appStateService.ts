const ACTIVE_CHAT_KEY = 'kchat-active-chat';
const CUSTOM_LANGUAGES_KEY = 'kchat-custom-languages';

export const loadActiveChatId = (): string | null => {
    try {
        const saved = localStorage.getItem(ACTIVE_CHAT_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Failed to load active chat id from localStorage", error);
        return null;
    }
};

export const saveActiveChatId = (activeChatId: string | null) => {
    try {
        if (activeChatId) {
            localStorage.setItem(ACTIVE_CHAT_KEY, JSON.stringify(activeChatId));
        } else {
            localStorage.removeItem(ACTIVE_CHAT_KEY);
        }
    } catch (error) {
        console.error("Failed to save active chat id to localStorage", error);
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

export const saveCustomLanguages = (languages: { code: string, name: string }[]) => {
    try {
        localStorage.setItem(CUSTOM_LANGUAGES_KEY, JSON.stringify(languages));
    } catch (error) {
        console.error("Failed to save custom languages to localStorage", error);
    }
};