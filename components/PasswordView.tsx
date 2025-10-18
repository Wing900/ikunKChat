import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { Icon } from './Icon';
import { authService } from '../services/authService';
import './PasswordView.css';

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
    <div className="password-view-container">
      {/* Rain drops background */}
      <div className="rain-container" aria-hidden="true">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="rain-drop"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
              height: `${15 + Math.random() * 10}px`
            }}
          />
        ))}
      </div>

      {/* Vertical poetry background */}
      <div className="poetry-container" aria-hidden="true">
        {/* Right side poetry - 天街小雨润如酥，头梳中分背带裤 */}
        <div className="poetry-column" style={{ right: '15%', transform: `translateY(${-20 + Math.random() * 60}px)` }}>
          天<br />街<br />小<br />雨<br />润<br />如<br />酥<br />，
        </div>
        <div className="poetry-column" style={{ right: '10%', transform: `translateY(${-20 + Math.random() * 60}px)` }}>
          头<br />梳<br />中<br />分<br />背<br />带<br />裤<br />。
        </div>
        
        {/* Left side poetry - 十万ikun聚一处，唱跳rap停不住 */}
        <div className="poetry-column" style={{ left: '10%', transform: `translateY(${-20 + Math.random() * 60}px)` }}>
          十<br />万<br />i<br />k<br />u<br />n<br />聚<br />一<br />处<br />，
        </div>
        <div className="poetry-column" style={{ left: '15%', transform: `translateY(${-20 + Math.random() * 60}px)` }}>
          唱<br />跳<br />r<br />a<br />p<br />停<br />不<br />住<br />。
        </div>
      </div>

      {/* Login card */}
      <form onSubmit={handlePasswordSubmit} className="login-card">
        <div className="login-header">
          <img 
            src="/ikunchat.svg" 
            alt="ikunKChat" 
            className="login-logo"
          />
          <h1 className="login-title">
            ikunKChat
          </h1>
        </div>
        
        <div className="input-group">
          <input
            type="password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            className="login-input"
            placeholder="请输入真爱粉密码  谢绝小黑子"
            autoFocus
          />
          <button
            type="submit"
            className="input-submit-icon"
            aria-label="Submit password"
          >
            <Icon icon="arrow-right" className="w-5 h-5" />
          </button>
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <div className="remember-me-group">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="remember-checkbox"
          />
          <label htmlFor="rememberMe" className="remember-label">
            记住我（30天内免登录）
          </label>
        </div>
        
        <button
          type="submit"
          className="login-button"
        >
          {t('continue')}
        </button>
      </form>
    </div>
  );
};

export default PasswordView;
