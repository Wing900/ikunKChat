/**
 * PDF解析服务
 * 使用 pdf.js 进行前端PDF文本提取
 */

import * as pdfjsLib from 'pdfjs-dist';

// PDF.js worker CDN 源列表 (按优先级排序)
const WORKER_CDN_URLS = [
  'https://unpkg.com/pdfjs-dist@VERSION/build/pdf.worker.min.js',
  'https://cdn.jsdelivr.net/npm/pdfjs-dist@VERSION/build/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/VERSION/pdf.worker.min.js',
  'https://esm.sh/pdfjs-dist@VERSION/build/pdf.worker.min.js'
];

// 配置 PDF.js worker - 使用多 CDN 自动回退
async function setupPdfWorker(): Promise<void> {
  const version = pdfjsLib.version;

  for (const urlTemplate of WORKER_CDN_URLS) {
    const url = urlTemplate.replace('VERSION', version);
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = url;
        console.log('[PDF.js] Worker loaded from:', url);
        return;
      }
    } catch {
      // 尝试下一个 CDN
      console.warn(`[PDF.js] CDN failed: ${url}`);
    }
  }

  // 所有 CDN 都失败，使用 unpkg 作为默认
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  console.warn('[PDF.js] All CDNs failed, using default worker');
}

setupPdfWorker();

export interface PDFParseResult {
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
}

export interface PDFParseProgress {
  current: number;
  total: number;
  percentage: number;
  status: 'parsing' | 'completed' | 'error';
  message?: string;
}

/**
 * 解析PDF文件并提取文本
 */
export async function parsePDFFile(
  file: File,
  onProgress?: (progress: PDFParseProgress) => void
): Promise<PDFParseResult> {
  try {
    // 读取文件为ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 加载PDF文档
    onProgress?.({
      current: 0,
      total: 100,
      percentage: 0,
      status: 'parsing',
      message: '正在加载PDF文档...'
    });

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    const pageCount = pdf.numPages;
    let extractedText = '';
    
    // 获取元数据
    const metadata = await pdf.getMetadata().catch(() => ({ info: {} as any, metadata: null }));
    
    // 逐页提取文本
    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // 合并文本项
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      extractedText += pageText + '\n\n';
      
      // 更新进度
      const percentage = Math.round((pageNum / pageCount) * 100);
      onProgress?.({
        current: pageNum,
        total: pageCount,
        percentage,
        status: 'parsing',
        message: `正在解析第 ${pageNum}/${pageCount} 页...`
      });
    }

    // 清理文本（去除多余空白）
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    const info = metadata.info as any;
    const result: PDFParseResult = {
      id: generatePDFId(file.name),
      fileName: file.name,
      fileSize: file.size,
      pageCount,
      extractedText,
      parsedAt: Date.now(),
      metadata: {
        title: info?.Title || undefined,
        author: info?.Author || undefined,
        subject: info?.Subject || undefined,
        keywords: info?.Keywords || undefined,
        creationDate: info?.CreationDate || undefined,
      }
    };

    // 完成
    onProgress?.({
      current: pageCount,
      total: pageCount,
      percentage: 100,
      status: 'completed',
      message: '解析完成！'
    });

    return result;
  } catch (error) {
    onProgress?.({
      current: 0,
      total: 0,
      percentage: 0,
      status: 'error',
      message: `解析失败: ${error instanceof Error ? error.message : '未知错误'}`
    });
    throw error;
  }
}

/**
 * 生成PDF唯一ID
 */
function generatePDFId(fileName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  const safeName = fileName.replace(/[^a-zA-Z0-9]/g, '_');
  return `pdf_${safeName}_${timestamp}_${random}`;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 验证PDF文件
 */
export function validatePDFFile(file: File): { valid: boolean; error?: string } {
  // 检查文件类型
  if (file.type !== 'application/pdf') {
    return { valid: false, error: '只支持PDF格式文件' };
  }

  // 检查文件大小（限制为50MB）
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return { valid: false, error: `文件过大，最大支持 ${formatFileSize(maxSize)}` };
  }

  // 检查文件大小不为0
  if (file.size === 0) {
    return { valid: false, error: '文件为空' };
  }

  return { valid: true };
}

/**
 * 截断长文本以适应上下文限制
 */
export function truncatePDFText(
  text: string,
  maxLength: number = 30000,
  strategy: 'start' | 'end' | 'middle' = 'start'
): string {
  if (text.length <= maxLength) {
    return text;
  }

  switch (strategy) {
    case 'start':
      return text.substring(0, maxLength) + '\n\n[... 内容过长，已截断 ...]';
    
    case 'end':
      return '[... 内容过长，已截断 ...]\n\n' + text.substring(text.length - maxLength);
    
    case 'middle':
      const halfLength = Math.floor(maxLength / 2);
      return (
        text.substring(0, halfLength) +
        '\n\n[... 中间部分已截断 ...]\n\n' +
        text.substring(text.length - halfLength)
      );
    
    default:
      return text.substring(0, maxLength);
  }
}