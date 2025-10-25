import { Folder } from '../types';

const FOLDERS_KEY = 'kchat-folders';

export const loadFolders = (): Folder[] => {
    try {
        const saved = localStorage.getItem(FOLDERS_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("Failed to load folders from localStorage", error);
        return [];
    }
};

export const saveFolders = (folders: Folder[]) => {
    try {
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    } catch (error) {
        console.error("Failed to save folders to localStorage", error);
    }
};