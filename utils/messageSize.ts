// 估算单个文本部分的体积
const getTextPartSize = (part: { text: string }): number => {
  return new TextEncoder().encode(part.text).length; // 使用UTF-8字节长度，比 length 更准
};

// 估算单个图片部分的体积 (Base64字符串长度就是很好的近似)
const getImagePartSize = (part: { inlineData: { data: string } }): number => {
  return part.inlineData.data.length;
};

// 估算单条Message的体积
export const getMessageSize = (message: any): number => {
  let totalSize = 0;

  // 处理新的消息格式
  if (Array.isArray(message.parts)) {
    for (const part of message.parts) {
      if ('text' in part && part.text) {
        totalSize += getTextPartSize(part);
      } else if ('inlineData' in part && part.inlineData?.data) {
        totalSize += getImagePartSize(part);
      }
    }
  }
  // 兼容旧的消息格式
  else {
    if (message.content) {
      totalSize += new TextEncoder().encode(message.content).length;
    }
    if (message.attachments) {
      for (const attachment of message.attachments) {
        if (attachment.data) {
          totalSize += attachment.data.length;
        }
      }
    }
  }

  return totalSize;
};

// 估算格式化后的消息体积（包含API包装开销）
export const getFormattedMessageSize = (formattedMessage: any): number => {
  let size = getMessageSize(formattedMessage);
  // **修复** 更准确的JSON格式化开销估算（实际测试发现需要50-100%）
  // 原因：role字段、parts数组结构、API包装等都会显著增加体积
  size = Math.floor(size * 1.8); // 从20%提升到80%，更接近实际情况
  return size;
};

// 调试工具：详细分析消息体积
export const analyzeMessageSize = (message: any): { total: number; breakdown: any[] } => {
  const breakdown: any[] = [];
  let total = 0;

  if (Array.isArray(message.parts)) {
    for (let i = 0; i < message.parts.length; i++) {
      const part = message.parts[i];
      let partSize = 0;
      let partType = '';
      let partContent = '';

      if ('text' in part && part.text) {
        partSize = getTextPartSize(part);
        partType = 'text';
        partContent = part.text.substring(0, 50) + (part.text.length > 50 ? '...' : '');
      } else if ('inlineData' in part && part.inlineData?.data) {
        partSize = getImagePartSize(part);
        partType = 'image';
        partContent = `${part.inlineData.mimeType} (${(partSize / 1024).toFixed(1)}KB)`;
      }

      breakdown.push({
        index: i,
        type: partType,
        size: partSize,
        content: partContent
      });
      total += partSize;
    }
  }

  return { total, breakdown };
};