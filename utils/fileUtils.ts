import { FileAttachment } from '../types';
import imageCompression from 'browser-image-compression';

// 定义压缩选项
const compressionOptions = {
  maxSizeMB: 1,       // 限制最大文件大小为 1MB
  maxWidthOrHeight: 1920, // 限制最大宽度或高度
  useWebWorker: true,   // 使用Web Worker以避免UI阻塞
};

export const fileToData = async (file: File): Promise<FileAttachment> => {
  try {
    console.log(`Original file size: ${file.size / 1024 / 1024} MB`);

    // 检查是否为图片文件
    if (file.type.startsWith('image/')) {
      // 压缩图片
      const compressedFile = await imageCompression(file, compressionOptions);
      console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);

      // 使用压缩后的文件进行Base64转换
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          resolve({ name: compressedFile.name, mimeType: compressedFile.type, data: base64data });
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
    } else {
      // 非图片文件直接处理
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          resolve({ name: file.name, mimeType: file.type, data: base64data });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
  } catch (error) {
    console.error('File processing error:', error);
    throw error;
  }
};

const supportedMimeTypes = new Set([
  // Images
  'image/png', 'image/jpeg', 'image/webp',
  // Audio
  'audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/x-aiff', 'audio/aac', 'audio/ogg', 'audio/flac',
  // Video
  'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/mpg', 'video/webm', 'video/x-ms-wmv', 'video/3gpp',
  // Text/Docs
  'text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword',
  'application/rtf', 'text/csv', 'text/tab-separated-values', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel',
  // Code (common types)
  'text/x-c', 'text/x-c++', 'text/x-python', 'text/x-java-source', 'application/x-httpd-php', 'application/sql', 'text/html', 'text/css', 'text/javascript', 'application/json', 'text/x-typescript', 'text/markdown'
]);

export const getSupportedMimeTypes = (): string => {
  return Array.from(supportedMimeTypes).join(',');
};

export const isFileSupported = (file: File): boolean => {
  return supportedMimeTypes.has(file.type);
};
