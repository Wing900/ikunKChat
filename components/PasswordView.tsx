import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { Icon } from './Icon';
import { authService } from '../services/authService';

interface PasswordViewProps {
  onVerified: (rememberMe: boolean) => void;
}

const PasswordView: React.FC<PasswordViewProps> = ({ onVerified }) => {
  const { t } = useLocalization();
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Get password from environment variable
  const VITE_ACCESS_PASSWORD = (import.meta as any).env.VITE_ACCESS_PASSWORD;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 使用认证服务验证密码
    if (authService.verifyPassword(inputPassword)) {
      onVerified(rememberMe);
    } else {
      setError(t('incorrect_password'));
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
      <form onSubmit={handlePasswordSubmit} className="p-8 bg-white rounded-2xl shadow-lg dark:bg-gray-800 w-96">
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <span className="text-3xl">🏀</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            ikunKChat
          </h1>
        </div>
        
        <div className="relative mb-4">
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            className="w-full px-4 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 transition-all"
            placeholder="请输入真爱粉密码  谢绝小黑子"
          />
          <button
            type="submit"
            className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <Icon icon="arrow-right" className="w-5 h-5" />
          </button>
        </div>
        
        {error && <p className="mt-2 text-sm text-center text-red-500">{error}</p>}
        
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          ikunKChat是一个个人开发的web聊天项目, 用于学习和展示
        </div>
        
        <div className="flex items-center mt-4">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label htmlFor="rememberMe" className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300">
            记住我（30天内免登录）
          </label>
        </div>
        
        <button
          type="submit"
          className="w-full px-4 py-3 mt-4 font-medium text-white bg-blue-500 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {t('continue')}
        </button>
      </form>
    </div>
  );
};

export default PasswordView;