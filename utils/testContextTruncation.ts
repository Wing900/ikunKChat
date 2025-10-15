import { getMessageSize, analyzeMessageSize } from '../messageSize';

// 模拟测试数据
const createMockMessage = (content: string, hasImage: boolean = false, imageSizeKB: number = 100) => {
  const message: any = {
    id: Math.random().toString(36),
    role: 'user',
    content,
    timestamp: Date.now(),
  };

  if (hasImage) {
    // 模拟 Base64 图片数据
    const base64Data = 'A'.repeat(imageSizeKB * 1024); // 简单模拟
    message.attachments = [{
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      data: base64Data
    }];
  }

  return message;
};

// 测试函数
export function testContextTruncation() {
  console.log('🧪 Testing Context Truncation Logic');

  // 创建测试对话历史
  const testHistory = [
    createMockMessage('很久之前的第一条消息', false),
    createMockMessage('很久之前的第二条消息，包含一张小图片', true, 50),
    createMockMessage('第三条消息', false),
    createMockMessage('第四条消息，包含一张大图片', true, 500), // 500KB
    createMockMessage('第五条消息', false),
    createMockMessage('第六条消息，包含超大图片', true, 1200), // 1.2MB
    createMockMessage('最新的消息', false),
  ];

  console.log('📊 Original History Analysis:');
  testHistory.forEach((msg, index) => {
    const size = getMessageSize(msg);
    console.log(`Message ${index + 1}: ${(size / 1024).toFixed(1)}KB - ${msg.content.substring(0, 30)}...`);
  });

  const totalSize = testHistory.reduce((sum, msg) => sum + getMessageSize(msg), 0);
  console.log(`Total size: ${(totalSize / 1024).toFixed(1)}KB`);

  // 模拟截断逻辑
  const MAX_PAYLOAD_SIZE = 2 * 1024 * 1024; // 2MB
  let slicedHistory: any[] = [];
  let currentSize = 0;

  for (let i = testHistory.length - 1; i >= 0; i--) {
    const message = testHistory[i];
    const messageSize = getMessageSize(message);

    if (currentSize + messageSize > MAX_PAYLOAD_SIZE) {
      // 尝试降级处理
      const textOnlyMessage = { ...message, attachments: undefined };
      const textOnlySize = getMessageSize(textOnlyMessage);

      if (currentSize + textOnlySize <= MAX_PAYLOAD_SIZE) {
        console.log(`⚠️ Message ${i + 1} downgraded: ${(messageSize / 1024).toFixed(1)}KB -> ${(textOnlySize / 1024).toFixed(1)}KB`);
        slicedHistory.unshift(textOnlyMessage);
        currentSize += textOnlySize;
      } else {
        console.log(`🛑 Truncation stopped at message ${i + 1}`);
        break;
      }
    } else {
      slicedHistory.unshift(message);
      currentSize += messageSize;
    }
  }

  console.log('\n✅ Final Truncated History:');
  const finalSize = slicedHistory.reduce((sum, msg) => sum + getMessageSize(msg), 0);
  console.log(`Messages kept: ${slicedHistory.length}/${testHistory.length}`);
  console.log(`Final size: ${(finalSize / 1024).toFixed(1)}KB / ${(MAX_PAYLOAD_SIZE / 1024).toFixed(1)}KB`);

  // 详细分析保留的消息
  console.log('\n📋 Detailed Analysis of Kept Messages:');
  slicedHistory.forEach((msg, index) => {
    const analysis = analyzeMessageSize(msg);
    console.log(`Message ${index + 1}: ${(analysis.total / 1024).toFixed(1)}KB`);
    analysis.breakdown.forEach(part => {
      console.log(`  - ${part.type}: ${(part.size / 1024).toFixed(1)}KB`);
    });
  });

  return slicedHistory;
}

// 导出测试函数供开发环境使用
if (process.env.NODE_ENV === 'development') {
  (window as any).testContextTruncation = testContextTruncation;
  console.log('💡 To test context truncation, run: testContextTruncation() in console');
}