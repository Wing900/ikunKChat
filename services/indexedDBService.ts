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
  pdfDocuments: {
    key: string; // PDF document ID
    value: {
      id: string;
      fileName: string;
      fileSize: number;
      pageCount: number;
      extractedText: string;
      parsedAt: number;
      metadata?: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string;
        creationDate?: string;
      };
    };
    indexes: { 'parsedAt': number; 'fileName': string };
  };
}

const DB_NAME = 'kchat-storage';
const DB_VERSION = 2; // 升级版本以支持PDF存储
const STORE_ATTACHMENTS = 'attachments';
const STORE_PDF_DOCUMENTS = 'pdfDocuments';

let dbInstance: IDBPDatabase<KChatDB> | null = null;

// 初始化数据库
export async function initDB(): Promise<IDBPDatabase<KChatDB>> {
  if (dbInstance) return dbInstance;

  try {
    dbInstance = await openDB<KChatDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // 创建附件存储
        if (!db.objectStoreNames.contains(STORE_ATTACHMENTS)) {
          const store = db.createObjectStore(STORE_ATTACHMENTS, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
        }

        // 创建PDF文档存储（版本2新增）
        if (oldVersion < 2 && !db.objectStoreNames.contains(STORE_PDF_DOCUMENTS)) {
          const pdfStore = db.createObjectStore(STORE_PDF_DOCUMENTS, { keyPath: 'id' });
          pdfStore.createIndex('parsedAt', 'parsedAt');
          pdfStore.createIndex('fileName', 'fileName');
        }
      },
      blocked() {
        console.warn('Database upgrade blocked by another tab');
      },
      blocking() {
        console.warn('This connection is blocking a database upgrade');
      },
    });

    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize database:', error);
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
  } catch (error) {
    console.error('Failed to save attachment:', error);
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
  } catch (error) {
    console.error('Failed to save attachments:', error);
    throw error;
  }
}

// 获取附件
export async function getAttachment(id: string): Promise<string | null> {
  try {
    const db = await initDB();
    const attachment = await db.get(STORE_ATTACHMENTS, id);
    
    if (attachment) {
      return attachment.data;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get attachment:', error);
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

    return results;
  } catch (error) {
    console.error('Failed to get attachments:', error);
    return new Map();
  }
}

// 删除附件
export async function deleteAttachment(id: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete(STORE_ATTACHMENTS, id);
  } catch (error) {
    console.error('Failed to delete attachment:', error);
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
  } catch (error) {
    console.error('Failed to delete attachments:', error);
    throw error;
  }
}

// 获取所有附件ID
export async function getAllAttachmentIds(): Promise<string[]> {
  try {
    const db = await initDB();
    const keys = await db.getAllKeys(STORE_ATTACHMENTS);
    return keys;
  } catch (error) {
    console.error('Failed to get attachment IDs:', error);
    return [];
  }
}

// 清除所有附件
export async function clearAllAttachments(): Promise<void> {
  try {
    const db = await initDB();
    await db.clear(STORE_ATTACHMENTS);
  } catch (error) {
    console.error('Failed to clear attachments:', error);
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
    console.error('Failed to get storage estimate:', error);
    return null;
  }
}

// 数据迁移：从 localStorage 迁移旧的附件数据到 IndexedDB
export async function migrateAttachmentsFromLocalStorage(): Promise<number> {
  try {
    const chatsJson = localStorage.getItem('kchat-sessions');
    if (!chatsJson) {
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
    }

    return migratedCount;
  } catch (error) {
    console.error('Migration failed:', error);
    return 0;
  }
}

// ==================== PDF 文档操作 ====================

// 保存PDF文档
export async function savePDFDocument(pdfData: {
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  extractedText: string;
  parsedAt: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: string;
  };
}): Promise<void> {
  try {
    const db = await initDB();
    await db.put(STORE_PDF_DOCUMENTS, pdfData);
  } catch (error) {
    console.error('Failed to save PDF document:', error);
    throw error;
  }
}

// 获取PDF文档
export async function getPDFDocument(id: string): Promise<{
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  extractedText: string;
  parsedAt: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: string;
  };
} | null> {
  try {
    const db = await initDB();
    const pdfDoc = await db.get(STORE_PDF_DOCUMENTS, id);
    
    if (pdfDoc) {
      return pdfDoc;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get PDF document:', error);
    return null;
  }
}

// 批量获取PDF文档
export async function getPDFDocuments(ids: string[]): Promise<Map<string, any>> {
  try {
    const db = await initDB();
    const results = new Map<string, any>();
    
    await Promise.all(
      ids.map(async (id) => {
        const pdfDoc = await db.get(STORE_PDF_DOCUMENTS, id);
        if (pdfDoc) {
          results.set(id, pdfDoc);
        }
      })
    );

    return results;
  } catch (error) {
    console.error('Failed to get PDF documents:', error);
    return new Map();
  }
}

// 获取所有PDF文档列表（不含全文）
export async function getAllPDFDocumentsList(): Promise<Array<{
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  parsedAt: number;
}>> {
  try {
    const db = await initDB();
    const allDocs = await db.getAll(STORE_PDF_DOCUMENTS);
    
    // 只返回元数据，不含全文
    const list = allDocs.map(doc => ({
      id: doc.id,
      fileName: doc.fileName,
      fileSize: doc.fileSize,
      pageCount: doc.pageCount,
      parsedAt: doc.parsedAt,
    }));

    return list;
  } catch (error) {
    console.error('Failed to get PDF documents list:', error);
    return [];
  }
}

// 删除PDF文档
export async function deletePDFDocument(id: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete(STORE_PDF_DOCUMENTS, id);
  } catch (error) {
    console.error('Failed to delete PDF document:', error);
    throw error;
  }
}

// 批量删除PDF文档
export async function deletePDFDocuments(ids: string[]): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_PDF_DOCUMENTS, 'readwrite');
    
    await Promise.all([
      ...ids.map(id => tx.store.delete(id)),
      tx.done,
    ]);
  } catch (error) {
    console.error('Failed to delete PDF documents:', error);
    throw error;
  }
}

// 清除所有PDF文档
export async function clearAllPDFDocuments(): Promise<void> {
  try {
    const db = await initDB();
    await db.clear(STORE_PDF_DOCUMENTS);
  } catch (error) {
    console.error('Failed to clear PDF documents:', error);
    throw error;
  }
}

// 搜索PDF文档（按文件名）
export async function searchPDFDocuments(query: string): Promise<Array<{
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number;
  parsedAt: number;
}>> {
  try {
    const db = await initDB();
    const allDocs = await db.getAll(STORE_PDF_DOCUMENTS);
    
    const lowerQuery = query.toLowerCase();
    const results = allDocs
      .filter(doc => doc.fileName.toLowerCase().includes(lowerQuery))
      .map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        pageCount: doc.pageCount,
        parsedAt: doc.parsedAt,
      }));

    return results;
  } catch (error) {
    console.error('Failed to search PDF documents:', error);
    return [];
  }
}