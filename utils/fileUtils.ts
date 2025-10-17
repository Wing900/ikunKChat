import { FileAttachment } from '../types';
import imageCompression from 'browser-image-compression';

// 定义压缩选项
const compressionOptions = {
  maxSizeMB: 1,       // 限制最大文件大小为 1MB
  maxWidthOrHeight: 1920, // 限制最大宽度或高度
  useWebWorker: true,   // 使用Web Worker以避免UI阻塞
};

export const fileToData = async (file: File): Promise<FileAttachment> => {
  console.log(`[文件处理] 📂 开始处理文件: "${file.name}"`);
  console.log(`[文件处理] 📊 文件信息 - 类型: ${file.type}, 原始大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

  try {
    // 检查是否为图片文件
    if (file.type.startsWith('image/')) {
      console.log(`[图片处理] 🖼️ 检测到图片文件，开始压缩...`);
      
      // 压缩图片
      let compressedFile;
      try {
        compressedFile = await imageCompression(file, compressionOptions);
        console.log(`[图片处理] ✅ 压缩成功 - 压缩后大小: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB, 压缩率: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`);
      } catch (compressionError) {
        console.error(`[图片处理] ❌ 压缩失败:`, compressionError);
        throw new Error(`图片压缩失败: ${compressionError instanceof Error ? compressionError.message : String(compressionError)}`);
      }

      // 使用压缩后的文件进行Base64转换
      console.log(`[图片处理] 🔄 开始Base64编码...`);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadstart = () => {
          console.log(`[图片处理] 📖 FileReader开始读取文件...`);
        };
        
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = ((e.loaded / e.total) * 100).toFixed(1);
            console.log(`[图片处理] 📊 读取进度: ${progress}%`);
          }
        };
        
        reader.onloadend = () => {
          console.log(`[图片处理] ✅ FileReader读取完成`);
          
          if (!reader.result || typeof reader.result !== 'string') {
            console.error(`[图片处理] ❌ FileReader结果无效 - 结果类型: ${typeof reader.result}, 是否为null: ${reader.result === null}`);
            reject(new Error('FileReader返回无效结果'));
            return;
          }
          
          const resultString = reader.result as string;
          console.log(`[图片处理] 📏 Base64原始长度: ${resultString.length} 字符`);
          
          // 分割data URL，提取base64数据部分
          const parts = resultString.split(',');
          if (parts.length !== 2) {
            console.error(`[图片处理] ❌ Base64格式错误 - 分割后部分数: ${parts.length}`);
            reject(new Error('Base64数据格式错误'));
            return;
          }
          
          const base64data = parts[1];
          console.log(`[图片处理] ✅ Base64数据提取成功 - 数据长度: ${base64data.length} 字符`);
          console.log(`[图片处理] 🎉 图片处理完成 - 文件名: "${compressedFile.name}"`);
          
          resolve({
            name: compressedFile.name,
            mimeType: compressedFile.type,
            data: base64data
          });
        };
        
        reader.onerror = (error) => {
          console.error(`[图片处理] ❌ FileReader读取错误:`, error);
          console.error(`[图片处理] ❌ 错误详情 - readyState: ${reader.readyState}, error: ${reader.error?.message || '未知错误'}`);
          reject(new Error(`文件读取失败: ${reader.error?.message || '未知错误'}`));
        };
        
        reader.readAsDataURL(compressedFile);
      });
    } else {
      // 非图片文件直接处理
      console.log(`[文件处理] 📄 非图片文件，直接转换为Base64...`);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onloadstart = () => {
          console.log(`[文件处理] 📖 FileReader开始读取文件...`);
        };
        
        reader.onloadend = () => {
          console.log(`[文件处理] ✅ FileReader读取完成`);
          
          if (!reader.result || typeof reader.result !== 'string') {
            console.error(`[文件处理] ❌ FileReader结果无效`);
            reject(new Error('FileReader返回无效结果'));
            return;
          }
          
          const base64data = (reader.result as string).split(',')[1];
          console.log(`[文件处理] ✅ Base64转换成功 - 数据长度: ${base64data.length} 字符`);
          console.log(`[文件处理] 🎉 文件处理完成 - 文件名: "${file.name}"`);
          
          resolve({
            name: file.name,
            mimeType: file.type,
            data: base64data
          });
        };
        
        reader.onerror = (error) => {
          console.error(`[文件处理] ❌ FileReader读取错误:`, error);
          reject(new Error(`文件读取失败: ${reader.error?.message || '未知错误'}`));
        };
        
        reader.readAsDataURL(file);
      });
    }
  } catch (error) {
    console.error(`[文件处理] ❌ 处理失败 - 文件: "${file.name}"`, error);
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
