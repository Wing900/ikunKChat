import { openDB, DBSchema, IDBPDatabase } from 'idb';

// 定义数据库结构
interface KChatDB extends DBSchema {
  attachments: {
    key: string; // attachment ID
    value: {
      id: string;
      data: string; // base64 encoded data
      mimeType: string;
      name: string;
      createdAt: number;
    };
    indexes: { 'createdAt': number };
  };
}

const DB_NAME = 'kchat-storage';
const DB_VERSION = 1;
const STORE_ATTACHMENTS = 'attachments';

let dbInstance: IDBPDatabase<KChatDB> | null = null;

// 初始化数据库
export async function initDB(): Promise<IDBPDatabase<KChatDB>> {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<KChatDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 创建附件存储
        if (!db.objectStoreNames.contains(STORE_ATTACHMENTS)) {
          const store = db.createObjectStore(STORE_ATTACHMENTS, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          console.log('[IndexedDB] Created attachments store');
        }
      },
      blocked() {
        console.warn('[IndexedDB] Database upgrade blocked by another tab');
      },
      blocking() {
        console.warn('[IndexedDB] This connection is blocking a database upgrade');
      },
    });

    console.log('[IndexedDB] Database initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('[IndexedDB] Failed to initialize database:', error);
    throw error;
  }
}

// 保存附件
export async function saveAttachment(
  id: string,
  data: string,
  mimeType: string,
  name: string
): Promise<void> {
  try {
    const db = await initDB();
    await db.put(STORE_ATTACHMENTS, {
      id,
      data,
      mimeType,
      name,
      createdAt: Date.now(),
    });
    console.log(`[IndexedDB] Saved attachment: ${id} (${name})`);
  } catch (error) {
    console.error('[IndexedDB] Failed to save attachment:', error);
    throw error;
  }
}

// 批量保存附件
export async function saveAttachments(
  attachments: Array<{ id: string; data: string; mimeType: string; name: string }>
): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_ATTACHMENTS, 'readwrite');
    
    await Promise.all([
      ...attachments.map(att =>
        tx.store.put({
          id: att.id,
          data: att.data,
          mimeType: att.mimeType,
          name: att.name,
          createdAt: Date.now(),
        })
      ),
      tx.done,
    ]);

    console.log(`[IndexedDB] Saved ${attachments.length} attachments`);
  } catch (error) {
    console.error('[IndexedDB] Failed to save attachments:', error);
    throw error;
  }
}

// 获取附件
export async function getAttachment(id: string): Promise<string | null> {
  try {
    const db = await initDB();
    const attachment = await db.get(STORE_ATTACHMENTS, id);
    
    if (attachment) {
      console.log(`[IndexedDB] Retrieved attachment: ${id}`);
      return attachment.data;
    }
    
    console.warn(`[IndexedDB] Attachment not found: ${id}`);
    return null;
  } catch (error) {
    console.error('[IndexedDB] Failed to get attachment:', error);
    return null;
  }
}

// 批量获取附件
export async function getAttachments(ids: string[]): Promise<Map<string, string>> {
  try {
    const db = await initDB();
    const results = new Map<string, string>();
    
    await Promise.all(
      ids.map(async (id) => {
        const attachment = await db.get(STORE_ATTACHMENTS, id);
        if (attachment) {
          results.set(id, attachment.data);
        }
      })
    );

    console.log(`[IndexedDB] Retrieved ${results.size}/${ids.length} attachments`);
    return results;
  } catch (error) {
    console.error('[IndexedDB] Failed to get attachments:', error);
    return new Map();
  }
}

// 删除附件
export async function deleteAttachment(id: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete(STORE_ATTACHMENTS, id);
    console.log(`[IndexedDB] Deleted attachment: ${id}`);
  } catch (error) {
    console.error('[IndexedDB] Failed to delete attachment:', error);
    throw error;
  }
}

// 批量删除附件
export async function deleteAttachments(ids: string[]): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_ATTACHMENTS, 'readwrite');
    
    await Promise.all([
      ...ids.map(id => tx.store.delete(id)),
      tx.done,
    ]);

    console.log(`[IndexedDB] Deleted ${ids.length} attachments`);
  } catch (error) {
    console.error('[IndexedDB] Failed to delete attachments:', error);
    throw error;
  }
}

// 获取所有附件ID
export async function getAllAttachmentIds(): Promise<string[]> {
  try {
    const db = await initDB();
    const keys = await db.getAllKeys(STORE_ATTACHMENTS);
    console.log(`[IndexedDB] Found ${keys.length} attachments`);
    return keys;
  } catch (error) {
    console.error('[IndexedDB] Failed to get attachment IDs:', error);
    return [];
  }
}

// 清除所有附件
export async function clearAllAttachments(): Promise<void> {
  try {
    const db = await initDB();
    await db.clear(STORE_ATTACHMENTS);
    console.log('[IndexedDB] Cleared all attachments');
  } catch (error) {
    console.error('[IndexedDB] Failed to clear attachments:', error);
    throw error;
  }
}

// 获取存储使用情况（估算）
export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('[IndexedDB] Failed to get storage estimate:', error);
    return null;
  }
}

// 数据迁移：从 localStorage 迁移旧的附件数据到 IndexedDB
export async function migrateAttachmentsFromLocalStorage(): Promise<number> {
  try {
    console.log('[IndexedDB] Starting migration from localStorage...');
    
    const chatsJson = localStorage.getItem('kchat-sessions');
    if (!chatsJson) {
      console.log('[IndexedDB] No chats found in localStorage');
      return 0;
    }

    const chats = JSON.parse(chatsJson);
    let migratedCount = 0;
    const attachmentsToSave: Array<{ id: string; data: string; mimeType: string; name: string }> = [];

    // 遍历所有聊天和消息，收集附件
    for (const chat of chats) {
      for (const message of chat.messages || []) {
        if (message.attachments) {
          for (const att of message.attachments) {
            if (att.data && typeof att.data === 'string') {
              // 生成唯一ID
              const attId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              attachmentsToSave.push({
                id: attId,
                data: att.data,
                mimeType: att.mimeType,
                name: att.name,
              });
              
              // 更新消息中的附件，只保留ID引用
              att.id = attId;
              delete att.data; // 移除 data，只保留 ID
              
              migratedCount++;
            }
          }
        }
      }
    }

    // 批量保存到 IndexedDB
    if (attachmentsToSave.length > 0) {
      await saveAttachments(attachmentsToSave);
      
      // 更新 localStorage 中的聊天记录（移除 data 字段）
      localStorage.setItem('kchat-sessions', JSON.stringify(chats));
      console.log(`[IndexedDB] Migrated ${migratedCount} attachments from localStorage`);
    }

    return migratedCount;
  } catch (error) {
    console.error('[IndexedDB] Migration failed:', error);
    return 0;
  }
}