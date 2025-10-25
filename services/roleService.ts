import { Persona } from '../types';

const ROLES_KEY = 'kchat-roles';
const CURRENT_DATA_VERSION = '1.2.0'; // 数据版本号，用于数据迁移
const DATA_VERSION_KEY = 'kchat-data-version';

// 角色数据验证接口
export interface PersonaValidationResult {
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
        temperature: persona.temperature !== undefined ? parseFloat(persona.temperature.toFixed(1)) : undefined,
        contextLength: persona.contextLength !== undefined ? parseInt(persona.contextLength.toString(), 10) : undefined,
        maxOutputTokens: persona.maxOutputTokens !== undefined ? parseInt(persona.maxOutputTokens.toString(), 10) : undefined
    };
};

// 数据迁移函数
const migratePersonaData = (data: any): Persona => {
    // 删除旧的 tools 字段（如果存在）
    if (data.tools !== undefined) {
        delete data.tools;
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