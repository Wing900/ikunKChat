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
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');

  useEffect(() => {
    const handleControllerChange = () => {
      window.location.reload();
    };

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SKIP_WAITING') {
        setNeedRefresh(true);
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // 获取当前版本号
  useEffect(() => {
    const fetchCurrentVersion = async () => {
      try {
        const res = await fetch('/version.json');
        const data = await res.json();
        setCurrentVersion(data.version);
      } catch (error) {
        console.error('[Version] Failed to fetch current version:', error);
      }
    };
    fetchCurrentVersion();
  }, []);

  useEffect(() => {
    const registerServiceWorker = async () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.__SW_DISABLED__) {
        try {
          // @ts-ignore
          const { registerSW } = await import('virtual:pwa-register');
          
          const updateSWFunc = registerSW({
            onOfflineReady() {
              setOfflineReady(true);
            },
            onNeedRefresh() {
              setNeedRefresh(true);
              setUpdateStatus('ready');
            },
            onRegisteredSW(swScriptUrl, registration) {
              // 每 30 分钟检查一次更新（降低频率但保持活跃）
              setInterval(() => {
                registration?.update().catch(err => {
                  console.warn('[SW] Periodic update check failed:', err);
                });
              }, 30 * 60 * 1000); // Check every 30 minutes
            },
            onRegisterError(error) {
              console.error('[SW] Registration error:', error);
              setUpdateStatus('error');
            },
          });

          setUpdateSW(() => updateSWFunc);
        } catch (error) {
          console.error('[SW] Registration failed:', error);
          setUpdateStatus('error');
        }
      }
    };

    registerServiceWorker();
  }, []);

  // 真实的版本检测函数
  const checkForUpdates = useCallback(async () => {
    if (!currentVersion) {
      return { hasUpdate: false, error: '当前版本未加载' };
    }

    setUpdateStatus('checking');

    try {
      // 强制绕过缓存获取最新版本信息
      const timestamp = Date.now();
      const res = await fetch(`/version.json?t=${timestamp}`, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const remoteVersionData = await res.json();
      const remoteVersion = remoteVersionData.version;

      // 真实的版本号比对
      const hasUpdate = remoteVersion !== currentVersion;

      if (hasUpdate) {
        setUpdateStatus('available');
        setNeedRefresh(true);
        
        // 触发 Service Worker 更新
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.update();
          }
        }
      } else {
        setUpdateStatus('idle');
      }

      return { hasUpdate, remoteVersion };
    } catch (error) {
      console.error('[Update] Check failed:', error);
      setUpdateStatus('error');
      return {
        hasUpdate: false,
        error: error instanceof Error ? error.message : '检查更新失败'
      };
    }
  }, [currentVersion]);

  const updateServiceWorker = useCallback(async (reloadPage = true) => {
    setNeedRefresh(false);
    setUpdateStatus('downloading');

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      } else {
        if (reloadPage) {
          window.location.reload();
        }
      }
    } else {
      if (reloadPage) {
        window.location.reload();
      }
    }
  }, []);

  return { offlineReady, needRefresh, updateStatus, updateServiceWorker, checkForUpdates };
};