import { getAttachments } from '../services/indexedDBService';
import { FileAttachment } from '../types';
import { performanceMonitor } from './performanceMonitor';

/**
 * 批量加载工具类
 * 提供批量操作附件的功能，减少IndexedDB的频繁访问
 */
export class AttachmentBatchLoader {
  private static instance: AttachmentBatchLoader;
  private pendingIds: string[] = [];
  private pendingPromise: Promise<Map<string, string>> | null = null;
  private cache: Map<string, string> = new Map();
  private readonly BATCH_SIZE = 50; // 批量大小
  private readonly DEBOUNCE_DELAY = 100; // 防抖延迟

  private constructor() {}

  public static getInstance(): AttachmentBatchLoader {
    if (!AttachmentBatchLoader.instance) {
      AttachmentBatchLoader.instance = new AttachmentBatchLoader();
    }
    return AttachmentBatchLoader.instance;
  }

  /**
   * 批量获取附件数据
   * @param attachmentIds 附件ID数组
   * @returns Promise<Map<string, string>> 附件ID到base64数据的映射
   */
  public async loadAttachments(attachmentIds: string[]): Promise<Map<string, string>> {
    performanceMonitor.startTimer('loadAttachments');

    if (!attachmentIds || attachmentIds.length === 0) {
      performanceMonitor.endTimer('loadAttachments');
      return new Map();
    }

    // 去重并过滤已缓存的ID
    const uniqueIds = [...new Set(attachmentIds)];
    const needToLoad = uniqueIds.filter(id => !this.cache.has(id));

    if (needToLoad.length === 0) {
      performanceMonitor.endTimer('loadAttachments');
      return this.getFromCache(uniqueIds);
    }

    // 如果存在待处理的请求，合并到现有请求中
    if (this.pendingPromise && this.pendingIds.length < this.BATCH_SIZE) {
      this.pendingIds.push(...needToLoad);
      return this.pendingPromise;
    }

    // 否则创建新的批处理
    return this.createBatchRequest(needToLoad);
  }

  /**
   * 创建批处理请求
   * @param attachmentIds 附件ID数组
   * @returns Promise<Map<string, string>>
   */
  private async createBatchRequest(attachmentIds: string[]): Promise<Map<string, string>> {
    this.pendingIds = [...attachmentIds];

    // 使用防抖机制，等待更多请求合并
    this.pendingPromise = new Promise(async (resolve) => {
      setTimeout(async () => {
        try {
          performanceMonitor.startTimer('executeBatch');
          const result = await this.executeBatch(this.pendingIds);
          performanceMonitor.endTimer('executeBatch');
          this.pendingPromise = null;
          this.pendingIds = [];
          resolve(result);
        } catch (error) {
          console.error('[AttachmentBatchLoader] 批处理执行失败:', error);
          resolve(new Map());
        }
      }, this.DEBOUNCE_DELAY);
    });

    return this.pendingPromise;
  }

  /**
   * 执行实际的批处理操作
   * @param attachmentIds 附件ID数组
   * @returns Promise<Map<string, string>>
   */
  private async executeBatch(attachmentIds: string[]): Promise<Map<string, string>> {
    const result = await getAttachments(attachmentIds);

    // 更新缓存
    result.forEach((data, id) => {
      if (data) {
        this.cache.set(id, data);
      }
    });

    return result;
  }

  /**
   * 从缓存中获取数据
   * @param attachmentIds 附件ID数组
   * @returns Map<string, string>
   */
  private getFromCache(attachmentIds: string[]): Map<string, string>> {
    performanceMonitor.startTimer('getFromCache');
    const result = new Map<string, string>();
    attachmentIds.forEach(id => {
      const data = this.cache.get(id);
      if (data) {
        result.set(id, data);
      }
    });
    performanceMonitor.endTimer('getFromCache');
    return result;
  }

  /**
   * 清空缓存
   */
  public clearCache(): void {
    this.cache.clear();
    this.pendingIds = [];
    if (this.pendingPromise) {
      this.pendingPromise = Promise.resolve(new Map());
    }
  }

  /**
   * 预加载指定附件
   * @param attachmentIds 附件ID数组
   * 用于在聊天加载前预先加载可能需要的附件
   */
  public async preloadAttachments(attachmentIds: string[]): Promise<void> {
    await this.loadAttachments(attachmentIds);
  }
}

/**
 * 全局附件批加载器实例
 */
export const attachmentBatchLoader = AttachmentBatchLoader.getInstance();