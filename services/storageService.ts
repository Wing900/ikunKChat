import { ChatSession, Folder, Settings, Persona, TranslationHistoryItem, PersonaMemory } from '../types';

const CHATS_KEY = 'kchat-sessions';
const FOLDERS_KEY = 'kchat-folders';
const SETTINGS_KEY = 'kchat-settings';
const ROLES_KEY = 'kchat-roles';
const TRANSLATION_HISTORY_KEY = 'kchat-translation-history';
const CUSTOM_LANGUAGES_KEY = 'kchat-custom-languages';
const PERSONA_MEMORIES_KEY = 'kchat-persona-memories';
const ACTIVE_CHAT_KEY = 'kchat-active-chat';
const DATA_VERSION_KEY = 'kchat-data-version';
const CURRENT_DATA_VERSION = '1.2.0'; // 数据版本号，用于数据迁移
const PRIVACY_CONSENT_KEY = 'kchat-privacy-consent';
const LAST_READ_VERSION_KEY = 'kchat-last-read-version';

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


// 角色数据验证接口
interface PersonaValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// 验证单个角色数据
const validatePersona = (persona: Persona): PersonaValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 必填字段验证
    if (!persona.name || persona.name.trim() === '') {
        errors.push('角色名称不能为空');
    }
    
    if (!persona.bio || persona.bio.trim() === '') {
        errors.push('角色简介不能为空');
    }
    
    if (!persona.systemPrompt || persona.systemPrompt.trim() === '') {
        errors.push('系统提示不能为空');
    }
    
    // 头像验证
    if (!persona.avatar || !['emoji', 'url', 'base64'].includes(persona.avatar.type)) {
        errors.push('角色头像类型无效');
    }
    
    if (!persona.avatar.value || persona.avatar.value.trim() === '') {
        errors.push('角色头像值不能为空');
    }
    
    // 工具配置验证
    if (typeof persona.tools !== 'object') {
        errors.push('工具配置格式不正确');
    } else {
        if (typeof persona.tools.googleSearch !== 'boolean') {
            errors.push('Google搜索配置必须为布尔值');
        }
        if (typeof persona.tools.codeExecution !== 'boolean') {
            errors.push('代码执行配置必须为布尔值');
        }
        if (typeof persona.tools.urlContext !== 'boolean') {
            errors.push('URL上下文配置必须为布尔值');
        }
    }
    
    // 模型参数验证
    if (persona.temperature !== undefined && (typeof persona.temperature !== 'number' || persona.temperature < 0 || persona.temperature > 1)) {
        errors.push('温度值必须在0到1之间');
    }
    
    if (persona.contextLength !== undefined && (typeof persona.contextLength !== 'number' || persona.contextLength < 0)) {
        errors.push('上下文长度必须为非负数');
    }
    
    if (persona.maxOutputTokens !== undefined && (typeof persona.maxOutputTokens !== 'number' || persona.maxOutputTokens < 1)) {
        errors.push('最大输出字符数必须为正数');
    }
    
    // 警告信息
    if (persona.name && persona.name.length > 50) {
        warnings.push('角色名称过长，可能影响显示效果');
    }
    
    if (persona.bio && persona.bio.length > 500) {
        warnings.push('角色简介过长，可能影响显示效果');
    }
    
    if (persona.systemPrompt && persona.systemPrompt.length > 2000) {
        warnings.push('系统提示过长，可能影响性能');
    }
    
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

// 清理角色数据
const sanitizePersona = (persona: Persona): Persona => {
    return {
        ...persona,
        name: persona.name?.trim() || '',
        bio: persona.bio?.trim() || '',
        systemPrompt: persona.systemPrompt?.trim() || '',
        avatar: {
            type: persona.avatar.type || 'emoji',
            value: persona.avatar.value || '🤖'
        },
        tools: {
            googleSearch: Boolean(persona.tools.googleSearch),
            codeExecution: Boolean(persona.tools.codeExecution),
            urlContext: Boolean(persona.tools.urlContext)
        },
        temperature: persona.temperature !== undefined ? parseFloat(persona.temperature.toFixed(1)) : undefined,
        contextLength: persona.contextLength !== undefined ? parseInt(persona.contextLength.toString(), 10) : undefined,
        maxOutputTokens: persona.maxOutputTokens !== undefined ? parseInt(persona.maxOutputTokens.toString(), 10) : undefined
    };
};

// 数据迁移函数
const migratePersonaData = (data: any): Persona => {
    // 处理旧版本数据格式
    if (data.tools === undefined) {
        data.tools = {
            googleSearch: false,
            codeExecution: false,
            urlContext: false
        };
    }
    
    // 确保avatar字段存在
    if (!data.avatar) {
        data.avatar = {
            type: 'emoji',
            value: '🤖'
        };
    }
    
    // 确保新增的字段有默认值
    if (data.temperature === undefined) {
        data.temperature = undefined; // 保持undefined，将使用全局设置
    }
    
    if (data.contextLength === undefined) {
        data.contextLength = undefined; // 保持undefined，将使用全局设置
    }
    
    if (data.maxOutputTokens === undefined) {
        data.maxOutputTokens = undefined; // 保持undefined，将使用全局设置
    }
    
    return data;
};

export const loadRoles = (): Persona[] => {
    try {
        const saved = localStorage.getItem(ROLES_KEY);
        if (!saved) return [];
        
        const parsedData = JSON.parse(saved);
        
        // 处理数组数据
        if (Array.isArray(parsedData)) {
            // 检查是否是压缩格式
            const isCompressed = parsedData.length > 0 && parsedData[0].n !== undefined;
            
            let personas = parsedData;
            
            // 如果是压缩格式，先解压
            if (isCompressed) {
                personas = parsedData.map((item: any) => ({
                    id: item.id,
                    name: item.n,
                    bio: item.b,
                    systemPrompt: item.sp,
                    avatar: item.av,
                    tools: item.t,
                    temperature: item.temp,
                    contextLength: item.cl,
                    maxOutputTokens: item.mot,
                    isDefault: item.d
                }));
            }
            
            // 确保每个元素都是对象类型
            const validPersonas = personas.filter(item => item && typeof item === 'object');
            
            return validPersonas
                .map(migratePersonaData) // 数据迁移
                .map(sanitizePersona) // 数据清理
                .filter(persona => persona && validatePersona(persona).isValid); // 数据验证
        }
        
        return [];
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

export const loadPersonaMemories = (): Record<string, PersonaMemory[]> => {
    try {
        const saved = localStorage.getItem(PERSONA_MEMORIES_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error("Failed to load persona memories from localStorage", error);
        return {};
    }
};

export const loadActiveChatId = (): string | null => {
    try {
        const saved = localStorage.getItem(ACTIVE_CHAT_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Failed to load active chat id from localStorage", error);
        return null;
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
        // 首先过滤掉无效的角色
        const validRoles = roles.filter(role => role && typeof role === 'object');
        
        // 验证和清理数据
        const validatedRoles = validRoles
            .map(sanitizePersona)
            .filter(persona => {
                const validation = validatePersona(persona);
                if (!validation.isValid) {
                    console.warn('Invalid persona data:', validation.errors);
                }
                return validation.isValid;
            });
        
        // 压缩数据以节省空间
        const compressedData = validatedRoles.map(persona => ({
            id: persona.id,
            n: persona.name,
            b: persona.bio,
            sp: persona.systemPrompt,
            av: persona.avatar,
            t: persona.tools,
            temp: persona.temperature,
            cl: persona.contextLength,
            mot: persona.maxOutputTokens,
            d: persona.isDefault
        }));
        
        localStorage.setItem(ROLES_KEY, JSON.stringify(compressedData));
        
        // 更新数据版本
        localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
    } catch (error) {
        console.error("Failed to save roles to localStorage", error);
        
        // 尝试降级处理：只保存必要数据
        try {
            const minimalData = roles.filter(role => role && typeof role === 'object').map(persona => ({
                id: persona.id,
                name: persona.name,
                bio: persona.bio.substring(0, 100),
                systemPrompt: persona.systemPrompt.substring(0, 200),
                avatar: persona.avatar,
                tools: persona.tools,
                temperature: persona.temperature,
                contextLength: persona.contextLength,
                maxOutputTokens: persona.maxOutputTokens,
                isDefault: persona.isDefault
            }));
            
            localStorage.setItem(ROLES_KEY, JSON.stringify(minimalData));
        } catch (fallbackError) {
            console.error("Fallback save also failed:", fallbackError);
        }
    }
};

// 导出验证函数供其他模块使用
export { validatePersona, sanitizePersona };

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

export const savePersonaMemories = (memories: Record<string, PersonaMemory[]>) => {
    try {
        localStorage.setItem(PERSONA_MEMORIES_KEY, JSON.stringify(memories));
    } catch (error) {
        console.error("Failed to save persona memories to localStorage", error);
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

// --- Data Management ---
export const exportData = (data: { chats?: ChatSession[], folders?: Folder[], settings?: Settings, personas?: Persona[], memories?: Record<string, PersonaMemory[]> }) => {
    const isFullExport = !!data.chats;
    const dataToExport = { ...data };
    if (data.memories) {
        dataToExport.memories = data.memories;
    }
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

export const importData = (file: File): Promise<{ chats?: ChatSession[], folders?: Folder[], settings?: Settings, personas?: Persona[], memories?: Record<string, PersonaMemory[]> }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                // Basic validation
                if (typeof data === 'object' && data !== null && (data.settings || data.chats || data.folders || data.personas || data.memories)) {
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
    localStorage.removeItem(PERSONA_MEMORIES_KEY);
    localStorage.removeItem(ACTIVE_CHAT_KEY);
    // We don't clear privacy consent here, as it should persist
};

export const clearChatHistory = () => {
    localStorage.removeItem(CHATS_KEY);
    localStorage.removeItem(FOLDERS_KEY);
    localStorage.removeItem(ACTIVE_CHAT_KEY);
    // 保留设置、角色和其他数据
};

// --- Privacy Consent ---
export const loadPrivacyConsent = (): { consented: boolean; version: string } | null => {
    try {
        const saved = localStorage.getItem(PRIVACY_CONSENT_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (error) {
        console.error("Failed to load privacy consent from localStorage", error);
        return null;
    }
};

export const savePrivacyConsent = (version: string) => {
    try {
        const consent = {
            consented: true,
            version: version,
            timestamp: Date.now()
        };
        localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(consent));
    } catch (error) {
        console.error("Failed to save privacy consent to localStorage", error);
    }
};

// --- Update Notification ---
export const loadLastReadVersion = (): string | null => {
    try {
        return localStorage.getItem(LAST_READ_VERSION_KEY);
    } catch (error) {
        console.error("Failed to load last read version from localStorage", error);
        return null;
    }
};

export const saveLastReadVersion = (version: string) => {
    try {
        localStorage.setItem(LAST_READ_VERSION_KEY, version);
    } catch (error) {
        console.error("Failed to save last read version to localStorage", error);
    }
};