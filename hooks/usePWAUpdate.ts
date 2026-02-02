import { useEffect, useState, useCallback, useRef } from 'react';

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
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const updateIntervalMs = 10 * 60 * 1000;

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let initialTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const triggerUpdate = (reg?: ServiceWorkerRegistration | null) => {
      const target = reg || registrationRef.current;
      if (!target) return;
      target.update().catch(err => {
        console.warn('[SW] Update check failed:', err);
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerUpdate();
      }
    };

    const handleFocus = () => triggerUpdate();
    const handleOnline = () => triggerUpdate();

    const registerServiceWorker = async () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.__SW_DISABLED__) {
        try {
          // @ts-ignore
          const { registerSW } = await import('virtual:pwa-register');

          const updateSWFunc = registerSW({
            immediate: true,
            onOfflineReady() {
              console.log('[SW] Offline ready');
              setOfflineReady(true);
            },
            onNeedRefresh() {
              console.log('[SW] New version available, refresh needed');
              setNeedRefresh(true);
              setUpdateStatus('available');
            },
            onRegisteredSW(swScriptUrl, reg) {
              console.log('[SW] Service Worker registered');
              const nextRegistration = reg || null;
              registrationRef.current = nextRegistration;
              setRegistration(nextRegistration);

              initialTimeoutId = setTimeout(() => {
                console.log('[SW] Checking for updates after 3s..');
                triggerUpdate(nextRegistration);
              }, 3 * 1000);

              intervalId = setInterval(() => {
                console.log('[SW] Scheduled update check..');
                triggerUpdate(nextRegistration);
              }, updateIntervalMs);

              window.addEventListener('focus', handleFocus);
              window.addEventListener('online', handleOnline);
              document.addEventListener('visibilitychange', handleVisibilityChange);
            },
            onRegisterError(error) {
              console.error('[SW] Service Worker registration failed:', error);
              setUpdateStatus('error');
            },
          });

          setUpdateSW(() => updateSWFunc);
        } catch (error) {
          console.error('[SW] Service Worker init failed:', error);
          setUpdateStatus('error');
        }
      }
    };

    registerServiceWorker();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (initialTimeoutId) clearTimeout(initialTimeoutId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const waitForSWUpdate = useCallback((reg: ServiceWorkerRegistration, timeoutMs = 8000) => {
    return new Promise<boolean>(resolve => {
      if (reg.waiting || reg.installing) {
        resolve(true);
        return;
      }

      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) resolve(false);
      }, timeoutMs);

      const clear = () => {
        resolved = true;
        clearTimeout(timeoutId);
      };

      const handleStateChange = (event: Event) => {
        const worker = event.target as ServiceWorker | null;
        if (worker?.state === 'installed') {
          clear();
          resolve(true);
        }
      };

      const handleUpdateFound = () => {
        if (reg.installing) {
          reg.installing.addEventListener('statechange', handleStateChange, { once: true });
        }
      };

      reg.addEventListener('updatefound', handleUpdateFound, { once: true });
    });
  }, []);

  // Manual update check
  const checkForUpdates = useCallback(async () => {
    setUpdateStatus('checking');

    try {
      if (!registration) {
        throw new Error('Service Worker not registered');
      }

      // Trigger Service Worker update check
      await registration.update();

      const hasUpdate = await waitForSWUpdate(registration);

      if (hasUpdate) {
        setNeedRefresh(true);
        setUpdateStatus('available');
      } else {
        setUpdateStatus('idle');
      }

      return { hasUpdate };
    } catch (error) {
      console.error('Failed to check for updates:', error);
      setUpdateStatus('error');
      return {
        hasUpdate: false,
        error: error instanceof Error ? error.message : 'Update check failed'
      };
    }
  }, [registration, waitForSWUpdate]);

  // Apply update
  const updateServiceWorker = useCallback(async (reloadPage = true) => {
    setNeedRefresh(false);
    setUpdateStatus('downloading');

    try {
      if (updateSW) {
        // Use vite-plugin-pwa update function
        await updateSW();
      } else {
        // Fallback: reload page
        if (reloadPage) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Failed to apply update:', error);
      // Fallback: reload page
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
