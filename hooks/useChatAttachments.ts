import { useState, useEffect, useCallback } from 'react';
import { ChatSession } from '../types';
import { attachmentBatchLoader } from '../utils/attachmentBatchLoader';
import { performanceMonitor } from '../utils/performanceMonitor';

/**
 * 聊天附件管理Hook
 * 负责批量预加载聊天中的图片附件，避免MessageBubble组件重复请求
 */
export const useChatAttachments = (chatSession: ChatSession | null) => {
  // 附件缓存：key为attachment id，value为base64数据
  const [attachmentsCache, setAttachmentsCache] = useState<Map<string, string>>(new Map());

  /**
   * 批量加载附件
   * @param attachmentIds 附件ID数组
   */
  const loadAttachmentsBatch = useCallback(async (attachmentIds: string[]) => {
    performanceMonitor.startTimer('loadAttachmentsBatch');
    if (attachmentIds.length === 0) {
      performanceMonitor.endTimer('loadAttachmentsBatch');
      return attachmentsCache;
    }

    try {
      // 使用批量加载器，支持缓存和合并请求
      const loadedAttachments = await attachmentBatchLoader.loadAttachments(attachmentIds);

      // 合并新加载的数据到缓存
      setAttachmentsCache(prevCache => {
        const newCache = new Map(prevCache);
        loadedAttachments.forEach((data, id) => {
          if (data) {
            newCache.set(id, data);
          }
        });
        return newCache;
      });
      performanceMonitor.endTimer('loadAttachmentsBatch');
      return attachmentsCache;
    } catch (error) {
      console.error('[useChatAttachments] 批量加载附件失败:', error);
      performanceMonitor.endTimer('loadAttachmentsBatch');
      return attachmentsCache; // 失败时返回现有缓存
    }
  }, [attachmentsCache]);

  /**
   * 清空当前聊天的附件缓存
   */
  const clearCache = useCallback(() => {
    setAttachmentsCache(new Map());
    // 同时清理批量加载器的缓存
    attachmentBatchLoader.clearCache();
  }, []);

  /**
   * 预加载附件（不阻塞UI）
   * @param attachmentIds 附件ID数组
   */
  const preloadAttachments = useCallback(async (attachmentIds: string[]) => {
    if (attachmentIds.length > 0) {
      performanceMonitor.startTimer('preloadAttachments');
      // 使用异步预加载，不等待结果
      await attachmentBatchLoader.preloadAttachments(attachmentIds).catch(error => {
        console.warn('[useChatAttachments] 预加载失败:', error);
      });
      performanceMonitor.endTimer('preloadAttachments');
    }
  }, []);

  // 当聊天切换时，预加载新聊天的附件
  useEffect(() => {
    if (!chatSession?.messages) {
      performanceMonitor.startTimer('clearCache');
      clearCache();
      performanceMonitor.endTimer('clearCache');
      return;
    }

    // 提取所有需要加载的图片附件ID
    const attachmentIds = chatSession.messages
      .flatMap(msg => msg.attachments || [])
      .filter(att => att.id && att.mimeType?.startsWith('image/'))
      .map(att => att.id!)
      .filter(id => id);

    if (attachmentIds.length > 0) {
      performanceMonitor.startTimer('attachmentLoadingStrategy');
      // 如果附件数量较少，直接加载；否则使用预加载
      if (attachmentIds.length <= 20) {
        loadAttachmentsBatch(attachmentIds);
      } else {
        preloadAttachments(attachmentIds);
      }
      performanceMonitor.endTimer('attachmentLoadingStrategy');
    } else {
      performanceMonitor.startTimer('clearCache');
      clearCache();
      performanceMonitor.endTimer('clearCache');
    }
  }, [chatSession?.id, loadAttachmentsBatch, preloadAttachments]);

  return {
    attachmentsCache,
    loadAttachmentsBatch,
    clearCache,
    preloadAttachments
  };
};