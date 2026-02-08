import { Settings } from '../types';

const SETTINGS_KEY = 'kchat-settings';
const CURRENT_DATA_VERSION = '1.2.0'; // 数据版本号，用于数据迁移
const DATA_VERSION_KEY = 'kchat-data-version';

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

        // 颜色主题迁移：只迁移旧的 'red' 主题到 'neutral'
        // Color palette migration: only migrate legacy 'red' theme to 'neutral'
        if (parsed.colorPalette === 'red') {
            // 将旧的红色主题迁移为中性灰
            parsed.colorPalette = 'neutral';
            // 立即保存更新后的设置
            try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
            } catch (e) {
                console.error("Failed to save migrated settings", e);
            }
        }

        return parsed;
    } catch (error) {
        console.error("Failed to load settings from localStorage", error);
        return null;
    }
};

export const saveSettings = (settings: Settings) => {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
    }
};