/**
 * 激活码和使用配额管理服务
 * 
 * 功能：
 * 1. 激活码验证（从环境变量读取有效激活码列表）
 * 2. 使用次数限制（localStorage + IndexedDB 双存储）
 * 3. 每日配额检查和重置
 */

import { 
  LicenseInfo, 
  UsageQuota, 
  ActivationCodes, 
  ActivationType,
  LicenseCheckResult 
} from '../types';

// ==================== 常量定义 ====================

const LICENSE_KEY = 'kchat-license-info';
const USAGE_QUOTA_KEY = 'kchat-usage-quota';
const INDEXEDDB_NAME = 'kchat-license-db';
const INDEXEDDB_VERSION = 1;
const STORE_NAME = 'license-store';

// ==================== 环境变量读取 ====================

/**
 * 从环境变量读取激活码配置
 */
function getActivationCodesFromEnv(): ActivationCodes {
  const defaultCodes: ActivationCodes = { permanent: [], monthly: [] };
  
  try {
    const envCodes = import.meta.env.VITE_ACTIVATION_CODES;
    if (!envCodes) return defaultCodes;
    
    const parsed = JSON.parse(envCodes);
    return {
      permanent: Array.isArray(parsed.permanent) ? parsed.permanent : [],
      monthly: Array.isArray(parsed.monthly) ? parsed.monthly : []
    };
  } catch (error) {
    console.error('Failed to parse VITE_ACTIVATION_CODES:', error);
    return defaultCodes;
  }
}

/**
 * 获取免费用户每日限制次数
 */
function getFreeDailyLimit(): number {
  const limit = import.meta.env.VITE_FREE_DAILY_LIMIT;
  const parsed = parseInt(limit, 10);
  return isNaN(parsed) ? 10 : parsed;
}

/**
 * 获取月度用户每日限制次数
 */
function getMonthlyDailyLimit(): number {
  const limit = import.meta.env.VITE_MONTHLY_DAILY_LIMIT;
  const parsed = parseInt(limit, 10);
  return isNaN(parsed) ? 70 : parsed;
}

// ==================== IndexedDB 操作 ====================

/**
 * 打开 IndexedDB 连接
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(INDEXEDDB_NAME, INDEXEDDB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * 从 IndexedDB 读取数据
 */
async function getFromIndexedDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB read error:', error);
    return null;
  }
}

/**
 * 写入数据到 IndexedDB
 */
async function saveToIndexedDB<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(value, key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('IndexedDB write error:', error);
  }
}

// ==================== localStorage 操作（带 IndexedDB 备份）====================

/**
 * 保存许可证信息（双存储）
 */
export async function saveLicenseInfo(info: LicenseInfo): Promise<void> {
  try {
    // 1. 保存到 localStorage
    localStorage.setItem(LICENSE_KEY, JSON.stringify(info));
    
    // 2. 备份到 IndexedDB
    await saveToIndexedDB(LICENSE_KEY, info);
  } catch (error) {
    console.error('Failed to save license info:', error);
  }
}

/**
 * 读取许可证信息（优先 localStorage，降级到 IndexedDB）
 */
export async function loadLicenseInfo(): Promise<LicenseInfo> {
  const defaultInfo: LicenseInfo = {
    activationCode: null,
    activationType: 'free',
    activatedAt: null
  };
  
  try {
    // 1. 尝试从 localStorage 读取
    const localData = localStorage.getItem(LICENSE_KEY);
    if (localData) {
      return JSON.parse(localData);
    }
    
    // 2. 降级到 IndexedDB
    const indexedData = await getFromIndexedDB<LicenseInfo>(LICENSE_KEY);
    if (indexedData) {
      // 恢复到 localStorage
      localStorage.setItem(LICENSE_KEY, JSON.stringify(indexedData));
      return indexedData;
    }
    
    return defaultInfo;
  } catch (error) {
    console.error('Failed to load license info:', error);
    return defaultInfo;
  }
}

/**
 * 保存使用配额（双存储）
 */
async function saveUsageQuota(quota: UsageQuota): Promise<void> {
  try {
    localStorage.setItem(USAGE_QUOTA_KEY, JSON.stringify(quota));
    await saveToIndexedDB(USAGE_QUOTA_KEY, quota);
  } catch (error) {
    console.error('Failed to save usage quota:', error);
  }
}

/**
 * 读取使用配额（优先 localStorage，降级到 IndexedDB）
 */
async function loadUsageQuota(): Promise<UsageQuota> {
  const today = new Date().toISOString().split('T')[0];
  const defaultQuota: UsageQuota = { date: today, count: 0 };
  
  try {
    // 1. 尝试从 localStorage 读取
    const localData = localStorage.getItem(USAGE_QUOTA_KEY);
    if (localData) {
      const quota: UsageQuota = JSON.parse(localData);
      
      // 如果日期变了，重置计数
      if (quota.date !== today) {
        return defaultQuota;
      }
      return quota;
    }
    
    // 2. 降级到 IndexedDB
    const indexedData = await getFromIndexedDB<UsageQuota>(USAGE_QUOTA_KEY);
    if (indexedData) {
      // 检查日期
      if (indexedData.date !== today) {
        return defaultQuota;
      }
      // 恢复到 localStorage
      localStorage.setItem(USAGE_QUOTA_KEY, JSON.stringify(indexedData));
      return indexedData;
    }
    
    return defaultQuota;
  } catch (error) {
    console.error('Failed to load usage quota:', error);
    return defaultQuota;
  }
}

// ==================== 激活码验证 ====================

/**
 * 验证激活码是否有效
 * @returns { valid: boolean, type: ActivationType }
 */
export function validateActivationCode(code: string): { valid: boolean; type: ActivationType } {
  if (!code || code.trim() === '') {
    return { valid: false, type: 'free' };
  }
  
  const codes = getActivationCodesFromEnv();
  const normalizedCode = code.trim().toUpperCase();
  
  // 检查永久激活码
  if (codes.permanent.some(c => c.toUpperCase() === normalizedCode)) {
    return { valid: true, type: 'permanent' };
  }
  
  // 检查月度激活码
  if (codes.monthly.some(c => c.toUpperCase() === normalizedCode)) {
    return { valid: true, type: 'monthly' };
  }
  
  return { valid: false, type: 'free' };
}

/**
 * 激活许可证
 */
export async function activateLicense(code: string): Promise<{ success: boolean; message: string; type?: ActivationType }> {
  const validation = validateActivationCode(code);
  
  if (!validation.valid) {
    return { 
      success: false, 
      message: '激活码无效，请检查后重试' 
    };
  }
  
  const licenseInfo: LicenseInfo = {
    activationCode: code.trim(),
    activationType: validation.type,
    activatedAt: new Date().toISOString()
  };
  
  await saveLicenseInfo(licenseInfo);
  
  const typeText = validation.type === 'permanent' ? '永久' : '月度';
  return { 
    success: true, 
    message: `激活成功！您已获得${typeText}授权`,
    type: validation.type
  };
}

/**
 * 取消激活（重置为免费版）
 */
export async function deactivateLicense(): Promise<void> {
  const defaultInfo: LicenseInfo = {
    activationCode: null,
    activationType: 'free',
    activatedAt: null
  };
  await saveLicenseInfo(defaultInfo);
}

// ==================== 使用配额检查 ====================

/**
 * 检查是否可以发送消息
 */
export async function checkCanSendMessage(): Promise<LicenseCheckResult> {
  const license = await loadLicenseInfo();
  
  // Pro 用户无限制
  if (license.activationType === 'permanent') {
    // 再次验证激活码是否仍然有效（防止环境变量更新后失效）
    if (license.activationCode) {
      const validation = validateActivationCode(license.activationCode);
      if (!validation.valid) {
        // 激活码已失效，降级为免费用户
        await deactivateLicense();
        return checkCanSendMessage(); // 递归调用，按免费用户处理
      }
    }
    
    return { canSend: true };
  }

  // 月度用户：检查每日配额
  if (license.activationType === 'monthly') {
    // 再次验证激活码是否仍然有效
    if (license.activationCode) {
      const validation = validateActivationCode(license.activationCode);
      if (!validation.valid) {
        await deactivateLicense();
        return checkCanSendMessage();
      }
    }

    const quota = await loadUsageQuota();
    const limit = getMonthlyDailyLimit();

    if (quota.count >= limit) {
      return {
        canSend: false,
        reason: `✨ 感谢您对 ikunKchat 的支持！\n\n您已是月度用户，今日额度已用尽，请明天再来或联系站长获取更多支持。`,
        remainingCount: 0,
        usedCount: quota.count,
        totalLimit: limit
      };
    }
    return {
      canSend: true,
      remainingCount: limit - quota.count,
      usedCount: quota.count,
      totalLimit: limit
    };
  }
  
  // 免费用户：检查每日配额
  const quota = await loadUsageQuota();
  const limit = getFreeDailyLimit();
  
  if (quota.count >= limit) {
    return {
      canSend: false,
      reason: `🥰 谢谢你对 ikunKchat 的热情！

由于上游涨价，11月运营的成本站长仅仅靠公益的心已经维持不住了，每个月的零花过于超支了 

本着不做商业化的原则，我是想关掉本站的，但是有的朋友说很好用，就保留了一定的免费额度 ✨

足够问一些作业题了！！！

如果你现在还想用，可以：
• 🔄 换一个设备还能再有免费额度
• 💰 愿意分摊成本，联系站长进行付费使用

（如果真的觉得很离不开再这样吧，因为成本真的贵，bin无奈）`,
      remainingCount: 0,
      usedCount: quota.count,
      totalLimit: limit
    };
  }
  
  return {
    canSend: true,
    remainingCount: limit - quota.count,
    usedCount: quota.count,
    totalLimit: limit
  };
}

/**
 * 消费一次使用配额（仅对免费用户生效）
 */
export async function consumeUsageQuota(): Promise<void> {
  const license = await loadLicenseInfo();
  
  // Pro 用户不消耗配额
  if (license.activationType === 'permanent') {
    return;
  }
  
  // 免费和月度用户：增加计数
  const quota = await loadUsageQuota();
  quota.count += 1;
  await saveUsageQuota(quota);
}

/**
 * 获取当前使用情况统计
 */
export async function getUsageStats(): Promise<{
  licenseType: ActivationType;
  activationCode: string | null;
  usedToday: number;
  remainingToday: number;
  dailyLimit: number;
}> {
  const license = await loadLicenseInfo();
  const quota = await loadUsageQuota();
  
  let usedToday = 0;
  let remainingToday = -1; // -1 indicates unlimited or not applicable
  let dailyLimit = -1;

  if (license.activationType === 'free') {
    dailyLimit = getFreeDailyLimit();
    usedToday = quota.count;
    remainingToday = Math.max(0, dailyLimit - quota.count);
  } else if (license.activationType === 'monthly') {
    dailyLimit = getMonthlyDailyLimit();
    usedToday = quota.count;
    remainingToday = Math.max(0, dailyLimit - quota.count);
  }
  
  return {
    licenseType: license.activationType,
    activationCode: license.activationCode,
    usedToday: usedToday,
    remainingToday: remainingToday,
    dailyLimit: dailyLimit
  };
}