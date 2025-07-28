import { FileAttachment } from '../types';

export const fileToData = (file: File): Promise<FileAttachment> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1];
      resolve({ name: file.name, mimeType: file.type, data: base64data });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
