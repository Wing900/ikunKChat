/**
 * 认证服务 - 处理用户认证状态的多重存储策略
 * 解决手机设备上localStorage被清除导致需要重新输入密码的问题
 */

interface AuthStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class AuthService {
  private static instance: AuthService;
  private readonly AUTH_KEY = 'kchat-auth';
  private readonly REMEMBER_ME_KEY = 'kchat-remember-me';
  private readonly AUTH_TIMESTAMP_KEY = 'kchat-auth-timestamp';
  private readonly AUTH_EXPIRY_DAYS = 30; // 认证状态有效期30天
  
  // 存储策略列表，按优先级排序
  private storageStrategies: AuthStorage[] = [
    {
      getItem: (key: string) => localStorage.getItem(key),
      setItem: (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: (key: string) => localStorage.removeItem(key)
    },
    {
      getItem: (key: string) => sessionStorage.getItem(key),
      setItem: (key: string, value: string) => sessionStorage.setItem(key, value),
      removeItem: (key: string) => sessionStorage.removeItem(key)
    }
  ];

  // 单例模式
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * 检查认证状态
   * 使用多重存储策略，确保在任何情况下都能正确获取认证状态
   */
  isAuthenticated(): boolean {
    // 检查所有存储策略
    for (const storage of this.storageStrategies) {
      try {
        const authValue = storage.getItem(this.AUTH_KEY);
        if (authValue === 'true') {
          // 检查认证状态是否过期
          const timestamp = storage.getItem(this.AUTH_TIMESTAMP_KEY);
          if (timestamp) {
            const authTime = parseInt(timestamp, 10);
            const now = Date.now();
            const expiryTime = this.AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
            
            if (now - authTime <= expiryTime) {
              return true;
            } else {
              // 认证已过期，清除过期状态
              this.clearAuthenticationForStorage(storage);
            }
          } else {
            // 没有时间戳，假设认证有效
            return true;
          }
        }
      } catch (error) {
        console.error('Failed to check authentication status:', error);
        continue;
      }
    }
    
    return false;
  }

  /**
   * 设置认证状态
   * @param isAuthenticated 是否已认证
   * @param rememberMe 是否记住登录状态
   */
  setAuthenticated(isAuthenticated: boolean, rememberMe: boolean = false): void {
    const authValue = isAuthenticated ? 'true' : 'false';
    const timestamp = isAuthenticated ? Date.now().toString() : '';
    
    // 设置所有存储策略
    for (const storage of this.storageStrategies) {
      try {
        if (isAuthenticated) {
          storage.setItem(this.AUTH_KEY, authValue);
          storage.setItem(this.AUTH_TIMESTAMP_KEY, timestamp);
          
          // 只有在记住我时才设置localStorage的rememberMe标志
          if (storage === this.storageStrategies[0] && rememberMe) {
            storage.setItem(this.REMEMBER_ME_KEY, 'true');
          }
        } else {
          this.clearAuthenticationForStorage(storage);
        }
      } catch (error) {
        console.error('Failed to set authentication state:', error);
        // 继续尝试其他存储策略
      }
    }
    
    // 如果不记住我，清除localStorage中的rememberMe标志
    if (!rememberMe) {
      try {
        localStorage.removeItem(this.REMEMBER_ME_KEY);
      } catch (error) {
        console.error('Failed to clear remember me flag:', error);
      }
    }
  }

  /**
   * 清除认证状态
   */
  clearAuthentication(): void {
    for (const storage of this.storageStrategies) {
      try {
        this.clearAuthenticationForStorage(storage);
      } catch (error) {
        console.error('Failed to clear authentication state:', error);
      }
    }
    
    try {
      localStorage.removeItem(this.REMEMBER_ME_KEY);
    } catch (error) {
      console.error('Failed to clear remember me flag:', error);
    }
  }

  /**
   * 验证密码
   * @param password 用户输入的密码
   * @returns 密码是否正确
   */
  verifyPassword(password: string): boolean {
    // 不再使用环境变量，密码由用户在设置中配置
    const settings = JSON.parse(localStorage.getItem('kchat-settings') || '{}');
    return password === (settings.password || '');
  }

  /**
   * 检查是否设置了记住我
   */
  isRememberMeSet(): boolean {
    try {
      return localStorage.getItem(this.REMEMBER_ME_KEY) === 'true';
    } catch (error) {
      console.error('Failed to check remember me status:', error);
      return false;
    }
  }

  /**
   * 获取认证状态剩余时间（小时）
   */
  getAuthRemainingTime(): number {
    try {
      const timestamp = localStorage.getItem(this.AUTH_TIMESTAMP_KEY);
      if (timestamp) {
        const authTime = parseInt(timestamp, 10);
        const now = Date.now();
        const elapsed = now - authTime;
        const expiryTime = this.AUTH_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        const remaining = expiryTime - elapsed;
        
        return Math.max(0, Math.floor(remaining / (60 * 60 * 1000)));
      }
    } catch (error) {
      console.error('Failed to get auth remaining time:', error);
    }
    
    return 0;
  }

  /**
   * 为特定存储清除认证状态
   */
  private clearAuthenticationForStorage(storage: AuthStorage): void {
    storage.removeItem(this.AUTH_KEY);
    storage.removeItem(this.AUTH_TIMESTAMP_KEY);
  }

  /**
   * 同步所有存储策略中的认证状态
   * 确保所有存储中的认证状态一致
   */
  syncAuthenticationStates(): void {
    try {
      // 以localStorage为基准
      const localAuth = localStorage.getItem(this.AUTH_KEY);
      const localTimestamp = localStorage.getItem(this.AUTH_TIMESTAMP_KEY);
      
      // 同步到其他存储策略
      for (let i = 1; i < this.storageStrategies.length; i++) {
        const storage = this.storageStrategies[i];
        if (localAuth) {
          storage.setItem(this.AUTH_KEY, localAuth);
        } else {
          storage.removeItem(this.AUTH_KEY);
        }
        
        if (localTimestamp) {
          storage.setItem(this.AUTH_TIMESTAMP_KEY, localTimestamp);
        } else {
          storage.removeItem(this.AUTH_TIMESTAMP_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to sync authentication states:', error);
    }
  }
}

// 导出单例实例
export const authService = AuthService.getInstance();

// 导出类型定义
export type { AuthStorage };