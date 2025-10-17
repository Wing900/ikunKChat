import { useEffect, useState, useCallback } from 'react';

// This type is provided by vite-plugin-pwa
declare global {
  interface Window {
    __SW_DISABLED__: boolean;
  }
}

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'error';

export type UsePWAUpdateReturn = {
  offlineReady: boolean;
  needRefresh: boolean;
  updateStatus: UpdateStatus;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
  checkForUpdates: () => Promise<{ hasUpdate: boolean; remoteVersion?: string; error?: string }>;
};

export const usePWAUpdate = (): UsePWAUpdateReturn => {
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const [updateSW, setUpdateSW] = useState<(() => Promise<void>) | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const registerServiceWorker = async () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.__SW_DISABLED__) {
        try {
          // @ts-ignore
          const { registerSW } = await import('virtual:pwa-register');
          
          const updateSWFunc = registerSW({
            immediate: true,
            onOfflineReady() {
              console.log('[SW] 离线可用');
              setOfflineReady(true);
            },
            onNeedRefresh() {
              console.log('[SW] 检测到新版本，需要刷新');
              setNeedRefresh(true);
              setUpdateStatus('available');
            },
            onRegisteredSW(swScriptUrl, reg) {
              console.log('[SW] Service Worker 已注册');
              setRegistration(reg || null);
              
              // 用户进入网站后 10 秒检查一次
              setTimeout(() => {
                console.log('[SW] 3秒后检查更新...');
                reg?.update().catch(err => {
                  console.warn('[SW] 首次更新检查失败:', err);
                });
              }, 3 * 1000);
              
              // 之后每小时检查一次
              setInterval(() => {
                console.log('[SW] 定时检查更新...');
                reg?.update().catch(err => {
                  console.warn('[SW] 定时更新检查失败:', err);
                });
              }, 60 * 60 * 1000); // 每小时检查一次
            },
            onRegisterError(error) {
              console.error('[SW] Service Worker 注册失败:', error);
              setUpdateStatus('error');
            },
          });

          setUpdateSW(() => updateSWFunc);
        } catch (error) {
          console.error('[SW] Service Worker 初始化失败:', error);
          setUpdateStatus('error');
        }
      }
    };

    registerServiceWorker();
  }, []);

  // 手动检查更新
  const checkForUpdates = useCallback(async () => {
    setUpdateStatus('checking');

    try {
      if (!registration) {
        throw new Error('Service Worker 未注册');
      }

      console.log('[Update] 手动触发更新检查...');
      
      // 触发 Service Worker 更新检查
      await registration.update();
      
      // 等待一小段时间让 SW 完成检查
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 检查是否有新版本在等待
      const reg = await navigator.serviceWorker.getRegistration();
      const hasUpdate = !!(reg?.waiting || reg?.installing);
      
      if (hasUpdate) {
        console.log('[Update] 发现新版本');
        setNeedRefresh(true);
        setUpdateStatus('available');
      } else {
        console.log('[Update] 已是最新版本');
        setUpdateStatus('idle');
      }

      return { hasUpdate };
    } catch (error) {
      console.error('[Update] 检查更新失败:', error);
      setUpdateStatus('error');
      return {
        hasUpdate: false,
        error: error instanceof Error ? error.message : '检查更新失败'
      };
    }
  }, [registration]);

  // 应用更新
  const updateServiceWorker = useCallback(async (reloadPage = true) => {
    console.log('[Update] 开始应用更新...');
    setNeedRefresh(false);
    setUpdateStatus('downloading');

    try {
      if (updateSW) {
        // 使用 vite-plugin-pwa 提供的更新函数
        await updateSW();
      } else {
        // 降级方案：直接刷新页面
        if (reloadPage) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('[Update] 应用更新失败:', error);
      // 即使出错也尝试刷新页面
      if (reloadPage) {
        window.location.reload();
      }
    }
  }, [updateSW]);

  return { 
    offlineReady, 
    needRefresh, 
    updateStatus, 
    updateServiceWorker, 
    checkForUpdates 
  };
};