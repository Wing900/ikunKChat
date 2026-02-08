
/**
 * 存储服务 v2 - 统一使用 IndexedDB
 * 
 * 架构改进：
 * 1. 将所有聊天数据迁移到 IndexedDB（解决 localStorage 容量限制）
 * 2. 保留轻量级配置在 localStorage（快速访问）
 * 3. 添加事务支持保证数据一致性
 * 4. 提供数据迁移和回退机制
 */

import { ChatSession, Folder, Settings, Persona } from '../types';
import { 
  initDB, 
  saveAttachments as saveAttachmentsToIDB,
  getAttachments as getAttachmentsFromIDB,
  deleteAttachments as deleteAttachmentsFromIDB
} from './indexedDBService';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// ========== 数据库结构定义 ==========

interface KChatStorageDB extends DBSchema {
  chats: {
    key: string;
    value: ChatSession;
  };
  
  folders: {
    key: string;
    value: Folder;
  };
  
  personas: {
    key: string;
    value: Persona;
  };
}

const STORAGE_DB_NAME = 'kchat-storage-v2';
const STORAGE_DB_VERSION = 1;

// localStorage 只存储轻量配置
const SETTINGS_KEY = 'kchat-settings';
const ACTIVE_CHAT_KEY = 'kchat-active-chat';
const PRIVACY_CONSENT_KEY = 'kchat-privacy-consent';
const LAST_READ_VERSION_KEY = 'kchat-last-read-version';
const MIGRATION_STATUS_KEY = 'kchat-migration-status';

let storageDbInstance: IDBPDatabase<KChatStorageDB> | null = null;

// ========== 数据库初始化 ==========

export async function initStorageDB(): Promise<IDBPDatabase<KChatStorageDB>> {
  if (storageDbInstance) return storageDbInstance;

  try {
    storageDbInstance = await openDB<KChatStorageDB>(STORAGE_DB_NAME, STORAGE_DB_VERSION, {
      upgrade(db) {
        // 创建聊天存储
        if (!db.objectStoreNames.contains('chats')) {
          const chatStore = db.createObjectStore('chats', { keyPath: 'id' });
          console.log('[StorageV2] Created chats store');
        }

        // 创建文件夹存储
        if (!db.objectStoreNames.contains('folders')) {
          const folderStore = db.createObjectStore('folders', { keyPath: 'id' });
          console.log('[StorageV2] Created folders store');
        }

        // 创建角色存储
        if (!db.objectStoreNames.contains('personas')) {
          const personaStore = db.createObjectStore('personas', { keyPath: 'id' });
          console.log('[StorageV2] Created personas store');
        }
      },
    });

    console.log('[StorageV2] Storage database initialized');
    return storageDbInstance;
  } catch (error) {
    console.error('[StorageV2] Failed to initialize storage database:', error);
    throw error;
  }
}

// ========== 聊天数据操作 ==========

export async function loadChatsV2(): Promise<ChatSession[]> {
  try {
    const db = await initStorageDB();
    const chats = await db.getAll('chats');
    
    // 按创建时间倒序排序
    chats.sort((a, b) => b.createdAt - a.createdAt);
    
    console.log(`[StorageV2] 加载了 ${chats.length} 个聊天会话`);
    
    // 恢复附件数据
    const allAttachmentIds: string[] = [];
    chats.forEach(chat => {
      chat.messages?.forEach(message => {
        message.attachments?.forEach(att => {
          if (att.id && !att.data) {
            allAttachmentIds.push(att.id);
          }
        });
      });
    });

    if (allAttachmentIds.length > 0) {
      const attachmentDataMap = await getAttachmentsFromIDB(allAttachmentIds);
      chats.forEach(chat => {
        chat.messages?.forEach(message => {
          message.attachments?.forEach(att => {
            if (att.id && attachmentDataMap.has(att.id)) {
              att.data = attachmentDataMap.get(att.id);
            }
          });
        });
      });
      console.log(`[StorageV2] 恢复了 ${attachmentDataMap.size} 个附件数据`);
    }

    return chats;
  } catch (error) {
    console.error('[StorageV2] 加载聊天失败:', error);
    return [];
  }
}

export async function saveChatsV2(chats: ChatSession[]): Promise<void> {
  try {
    const db = await initStorageDB();
    await initDB(); // 确保附件数据库也已初始化
    
    const tx = db.transaction('chats', 'readwrite');
    
    // 收集需要保存的附件
    const attachmentsToSave: Array<{ id: string; data: string; mimeType: string; name: string }> = [];
    
    // 准备聊天数据（移除附件的 data 字段）
    const chatsToSave = chats.map(chat => ({
      ...chat,
      messages: chat.messages.map(msg => ({
        ...msg,
        attachments: msg.attachments?.map(att => {
          if (att.data && att.id) {
            attachmentsToSave.push({
              id: att.id,
              data: att.data,
              mimeType: att.mimeType,
              name: att.name
            });
          }
          return {
            id: att.id,
            name: att.name,
            mimeType: att.mimeType
          };
        })
      }))
    }));

    // 保存聊天数据到 IndexedDB
    await Promise.all([
      ...chatsToSave.map(chat => tx.store.put(chat)),
      tx.done
    ]);

    // 保存附件数据
    if (attachmentsToSave.length > 0) {
      await saveAttachmentsToIDB(attachmentsToSave);
    }

    console.log(`[StorageV2] 保存了 ${chats.length} 个聊天和 ${attachmentsToSave.length} 个附件`);
  } catch (error) {
    console.error('[StorageV2] 保存聊天失败:', error);
    throw error;
  }
}

export async function deleteChatV2(chatId: string): Promise<void> {
  try {
    const db = await initStorageDB();
    
    // 获取聊天数据以清理附件
    const chat = await db.get('chats', chatId);
    if (chat) {
      const attachmentIds: string[] = [];
      chat.messages?.forEach(msg => {
        msg.attachments?.forEach(att => {
          if (att.id) attachmentIds.push(att.id);
        });
      });
      
      // 删除附件
      if (attachmentIds.length > 0) {
        await deleteAttachmentsFromIDB(attachmentIds);
      }
    }
    
    // 删除聊天
    await db.delete('chats', chatId);
    console.log(`[StorageV2] 删除了聊天: ${chatId}`);
  } catch (error) {
    console.error('[StorageV2] 删除聊天失败:', error);
    throw error;
  }
}

// ========== 文件夹操作 ==========

export async function loadFoldersV2(): Promise<Folder[]> {
  try {
    const db = await initStorageDB();
    const folders = await db.getAll('folders');
    folders.sort((a, b) => a.createdAt - b.createdAt);
    return folders;
  } catch (error) {
    console.error('[StorageV2] 加载文件夹失败:', error);
    return [];
  }
}

export async function saveFoldersV2(folders: Folder[]): Promise<void> {
  try {
    const db = await initStorageDB();
    const tx = db.transaction('folders', 'readwrite');
    
    await Promise.all([
      ...folders.map(folder => tx.store.put(folder)),
      tx.done
    ]);
    
    console.log(`[StorageV2] 保存了 ${folders.length} 个文件夹`);
  } catch (error) {
    console.error('[StorageV2] 保存文件夹失败:', error);
    throw error;
  }
}

// ========== 角色操作 ==========

export async function loadPersonasV2(): Promise<Persona[]> {
  try {
    const db = await initStorageDB();
    const personas = await db.getAll('personas');
    return personas;
  } catch (error) {
    console.error('[StorageV2] 加载角色失败:', error);
    return [];
  }
}

export async function savePersonasV2(personas: Persona[]): Promise<void> {
  try {
    const db = await initStorageDB();
    const tx = db.transaction('personas', 'readwrite');
    
    await Promise.all([
      ...personas.map(persona => tx.store.put(persona)),
      tx.done
    ]);
    
    console.log(`[StorageV2] 保存了 ${personas.length} 个角色`);
  } catch (error) {
    console.error('[StorageV2] 保存角色失败:', error);
    throw error;
  }
}

// ========== 设置操作（保留在 localStorage） ==========

export function loadSettingsV2(): Partial<Settings> | null {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    
    // 数据迁移
    if (parsed.apiKey && typeof parsed.apiKey === 'string') {
      parsed.apiKey = [parsed.apiKey];
    } else if (!Array.isArray(parsed.apiKey)) {
      parsed.apiKey = [];
    }

    if (parsed.colorPalette === 'red') {
      parsed.colorPalette = 'neutral';
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch (error) {
    console.error('[StorageV2] 加载设置失败:', error);
    return null;
  }
}

export function saveSettingsV2(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('[StorageV2] 保存设置失败:', error);
  }
}

// ========== 其他轻量数据（保留在 localStorage） ==========

export function loadActiveChatIdV2(): string | null {
  try {
    const saved = localStorage.getItem(ACTIVE_CHAT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('[StorageV2] 加载活跃聊天失败:', error);
    return null;
  }
}

export function saveActiveChatIdV2(activeChatId: string | null): void {
  try {
    if (activeChatId) {
      localStorage.setItem(ACTIVE_CHAT_KEY, JSON.stringify(activeChatId));
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  } catch (error) {
    console.error('[StorageV2] 保存活跃聊天失败:', error);
  }
}

// ========== 数据迁移 ==========

export async function migrateToV2(): Promise<boolean> {
  try {
    console.log('[StorageV2] 开始数据迁移...');
    
    // 检查是否已迁移
    const migrationStatus = localStorage.getItem(MIGRATION_STATUS_KEY);
    if (migrationStatus === 'completed') {
      console.log('[StorageV2] 数据已经迁移过了');
      return true;
    }

    // 从旧的 localStorage 加载数据
    const { loadChats, loadFolders, loadRoles } = await import('./storageService');
    
    const oldChats = await loadChats();
    const oldFolders = loadFolders();
    const oldPersonas = loadRoles();

    console.log(`[StorageV2] 迁移 ${oldChats.length} 个聊天, ${oldFolders.length} 个文件夹, ${oldPersonas.length} 个角色`);

    // 保存到新的 IndexedDB
    await initStorageDB();
    await initDB();
    
    if (oldChats.length > 0) await saveChatsV2(oldChats);
    if (oldFolders.length > 0) await saveFoldersV2(oldFolders);
    if (oldPersonas.length > 0) await savePersonasV2(oldPersonas);

    // 标记迁移完成
    localStorage.setItem(MIGRATION_STATUS_KEY, 'completed');
    console.log('[StorageV2] ✅ 数据迁移完成');
    
    return true;
  } catch (error) {
    console.error('[StorageV2] ❌ 数据迁移失败:', error);
    return false;
  }
}

// ========== 清理操作 ==========

export async function clearAllDataV2(): Promise<void> {
  try {
    const db = await initStorageDB();
    
    // 清除 IndexedDB 数据
    await db.clear('chats');
    await db.clear('folders');
    await db.clear('personas');
    
    // 清除附件
    const { clearAllAttachments } = await import('./indexedDBService');
    await clearAllAttachments();
    
    // 清除 localStorage 配置
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(ACTIVE_CHAT_KEY);
    localStorage.removeItem('kchat-persona-memories');
    console.log('[StorageV2] 已清除所有数据');
  } catch (error) {
    console.error('[StorageV2] 清除数据失败:', error);
    throw error;
  }
}

export async function clearChatHistoryV2(): Promise<void> {
  try {
    const db = await initStorageDB();
    await db.clear('chats');
    
    const { clearAllAttachments } = await import('./indexedDBService');
    await clearAllAttachments();
    
    localStorage.removeItem(ACTIVE_CHAT_KEY);
    console.log('[StorageV2] 已清除聊天历史');
  } catch (error) {
    console.error('[StorageV2] 清除聊天历史失败:', error);
    throw error;
  }
}

// ========== 导出导入（保持兼容旧格式） ==========

export async function exportDataV2(data: {
  chats?: boolean,
  folders?: boolean,
  settings?: boolean,
  personas?: boolean
}) {
  const exportData: any = {};
  
  if (data.chats) exportData.chats = await loadChatsV2();
  if (data.folders) exportData.folders = await loadFoldersV2();
  if (data.settings) exportData.settings = loadSettingsV2();
  if (data.personas) exportData.personas = await loadPersonasV2();
  
  return exportData;
}

// ========== 隐私和版本管理（保留在 localStorage） ==========

export function loadPrivacyConsentV2(): { consented: boolean; version: string } | null {
  try {
    const saved = localStorage.getItem(PRIVACY_CONSENT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('[StorageV2] 加载隐私同意失败:', error);
    return null;
  }
}

export function savePrivacyConsentV2(version: string): void {
  try {
    const consent = {
      consented: true,
      version: version,
      timestamp: Date.now()
    };
    localStorage.setItem(PRIVACY_CONSENT_KEY, JSON.stringify(consent));
  } catch (error) {
    console.error('[StorageV2] 保存隐私同意失败:', error);
  }
}

export function loadLastReadVersionV2(): string | null {
  try {
    return localStorage.getItem(LAST_READ_VERSION_KEY);
  } catch (error) {
    console.error('[StorageV2] 加载最后阅读版本失败:', error);
    return null;
  }
}

export function saveLastReadVersionV2(version: string): void {
  try {
    localStorage.setItem(LAST_READ_VERSION_KEY, version);
  } catch (error) {
    console.error('[StorageV2] 保存最后阅读版本失败:', error);
  }
}
  