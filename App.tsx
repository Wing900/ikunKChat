import React from 'react';
import { AppProviders } from './components/app/AppProviders';
import { AppContainer } from './components/app/AppContainer';

// 静态资源加载诊断日志
console.group('🔍 [App] 静态资源诊断');
console.log('当前域名:', window.location.origin);
console.log('当前路径:', window.location.pathname);

// 检查关键静态资源
const criticalAssets = [
  '/webmaster-avatar.png',
  '/icon-192.png',
  '/icon-512.png',
  '/ikunchat.svg',
  '/ikunchat-v1.svg'
];

criticalAssets.forEach(asset => {
  fetch(asset)
    .then(res => {
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        const contentLength = res.headers.get('content-length');
        console.log(`✅ ${asset} - 存在 (${res.status})`);
        console.log(`   Content-Type: ${contentType}, Size: ${contentLength} bytes`);
      } else {
        console.error(`❌ ${asset} - 不存在 (${res.status})`);
      }
    })
    .catch(err => {
      console.error(`❌ ${asset} - 请求失败:`, err.message);
    });
});

console.groupEnd();

/**
 * App - Root component
 * Sets up providers and renders the main application
 */
export default function App() {
  return (
    <AppProviders>
      <AppContainer />
    </AppProviders>
  );
}
