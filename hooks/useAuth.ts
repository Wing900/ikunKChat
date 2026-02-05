import { useState, useEffect } from 'react';
import { authService } from '../services/authService';

/**
 * 管理用户认证状态
 * 从 App.tsx 抽离出来，简化认证逻辑
 */
export const useAuth = () => {
  // 初始化认证状态
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // 检查是否设置了环境变量密码
    const envPassword = (import.meta as any).env.VITE_ACCESS_PASSWORD;
    
    // 检查是否有临时访问令牌
    const urlParams = new URLSearchParams(window.location.search);
    const tempToken = urlParams.get('temp_token');
    
    if (tempToken && authService.verifyTempAccessToken(tempToken)) {
      // 如果有有效的临时访问令牌，则允许访问
      authService.setTempAccessToken(tempToken);
      return true;
    }
    
    if (envPassword && envPassword.trim() !== '') {
      // 如果设置了环境变量密码，则必须验证密码
      return authService.isAuthenticated();
    }
    
    // 如果没有设置环境变量密码且没有有效的临时令牌，则允许访问
    return true;
  });

  // 当认证状态改变时，同步到 authService
  useEffect(() => {
    if (isAuthenticated) {
      authService.setAuthenticated(true, authService.isRememberMeSet());
    }
  }, [isAuthenticated]);

  // 检查 URL 中的临时访问令牌
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tempToken = urlParams.get('temp_token');
    
    if (tempToken) {
      // 验证临时访问令牌
      if (authService.verifyTempAccessToken(tempToken)) {
        authService.setTempAccessToken(tempToken);
        setIsAuthenticated(true);
        
        // 从 URL 中移除临时访问令牌参数
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]temp_token=[^&]*/, '');
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, []);

  // 检查是否设置了环境变量密码
  const hasPassword = (() => {
    const envPassword = (import.meta as any).env.VITE_ACCESS_PASSWORD;
    return envPassword && envPassword.trim() !== '';
  })();

  // 处理验证成功
  const handleVerified = (rememberMe: boolean) => {
    setIsAuthenticated(true);
    authService.setAuthenticated(true, rememberMe);
  };

  return {
    isAuthenticated,
    hasPassword,
    handleVerified,
  };
};