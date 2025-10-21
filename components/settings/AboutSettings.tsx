import React from 'react';
import { useLocalization } from '../../contexts/LocalizationContext';
import { Icon } from '../Icon';

interface AboutSettingsProps {
  versionInfo: { version: string } | null;
}

export const AboutSettings: React.FC<AboutSettingsProps> = ({ versionInfo }) => {
  const { t } = useLocalization();

  return (
    <div className="space-y-6 text-sm text-[var(--text-color-secondary)]">
      
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-[var(--text-color)]">隐私声明</h3>
        <p className="text-base">本网站不会收集任何个人隐私,所有数据均存储在本地。</p>
      </div>

      <div className="border-t border-[var(--glass-border)] pt-6 space-y-4">
        <h3 className="font-bold text-lg text-[var(--text-color)]">{t('webmaster')}</h3>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold overflow-hidden">
            <img
              src="/webmaster-avatar.png"
              alt="Webmaster Avatar"
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                console.log('[AboutSettings] ✅ 站长头像加载成功');
                console.log('[AboutSettings] 图片实际尺寸:', target.naturalWidth, 'x', target.naturalHeight);
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                console.error('[AboutSettings] ❌ 站长头像加载失败');
                console.error('[AboutSettings] 图片路径:', target.src);
                console.error('[AboutSettings] 当前URL:', window.location.href);
                console.error('[AboutSettings] BASE_URL:', document.baseURI);
                
                // 尝试直接fetch检查响应
                fetch(target.src)
                  .then(res => {
                    console.error('[AboutSettings] Fetch状态:', res.status, res.statusText);
                    console.error('[AboutSettings] Content-Type:', res.headers.get('content-type'));
                    console.error('[AboutSettings] Content-Length:', res.headers.get('content-length'));
                    return res.blob();
                  })
                  .then(blob => {
                    console.error('[AboutSettings] Blob类型:', blob.type, '大小:', blob.size);
                  })
                  .catch(err => console.error('[AboutSettings] Fetch错误:', err));
                
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-white font-bold">bin</span>';
                }
              }}
            />
          </div>
          <div>
            <p className="font-medium text-[var(--text-color)]">{t('webmasterName')}: bin</p>
            <p className="text-[var(--text-color-secondary)]">{t('webmasterDesc')}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--glass-border)] pt-6 space-y-4">
        <h3 className="font-bold text-lg text-[var(--text-color)]">设计演变</h3>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <img
              src="/ikunchat-v1.svg"
              alt="KChat 初代图标"
              className="w-16 h-16 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
              onLoad={() => console.log('[AboutSettings] ✅ 初代图标加载成功')}
              onError={() => console.error('[AboutSettings] ❌ 初代图标加载失败: /ikunchat-v1.svg')}
            />
            <span className="text-xs text-[var(--text-color-secondary)]">初代图标 (v1)</span>
          </div>
          <div className="text-2xl text-[var(--text-color-secondary)]">→</div>
          <div className="flex flex-col items-center gap-2">
            <img
              src="/ikunchat.svg"
              alt="KChat 当前图标"
              className="w-16 h-16 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
              onLoad={() => console.log('[AboutSettings] ✅ 当前图标加载成功')}
              onError={() => console.error('[AboutSettings] ❌ 当前图标加载失败: /ikunchat.svg')}
            />
            <span className="text-xs text-[var(--text-color-secondary)]">当前图标 (v2)</span>
          </div>
        </div>
        <p className="text-xs text-[var(--text-color-secondary)] italic">初代图标由站长亲手设计,承载着项目鸽鸽的梦想 ✨</p>
      </div>

      <div className="border-t border-[var(--glass-border)] pt-6 space-y-4">
        <h3 className="font-bold text-lg text-[var(--text-color)]">{t('usefulLinks')}</h3>
        <div className="flex flex-wrap gap-4">
          <a href="https://github.com/Wing900/KChat" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--accent-color)] hover:underline">
            <Icon icon="github" className="w-4 h-4" />
            <span>{t('sourceCode')}</span>
          </a>
          <a href="https://github.com/Wing900/KChat/issues" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--accent-color)] hover:underline">
            <Icon icon="bug" className="w-4 h-4" />
            <span>{t('reportBug')}</span>
          </a>
          <a href="https://github.com/Wing900/KChat/discussions" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--accent-color)] hover:underline">
            <Icon icon="message-square" className="w-4 h-4" />
            <span>{t('discussions')}</span>
          </a>
          <a href="https://iambin.qzz.io" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[var(--accent-color)] hover:underline">
            <Icon icon="chicken" className="w-4 h-4" />
            <span>iambin.qzz.io</span>
          </a>
        </div>
      </div>
    </div>
  );
};