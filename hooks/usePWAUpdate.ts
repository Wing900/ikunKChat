import { useEffect, useState, useCallback } from 'react';

// This type is provided by vite-plugin-pwa
declare global {
  interface Window {
    __SW_DISABLED__: boolean;
  }
}

export type UsePWAUpdateReturn = {
  offlineReady: boolean;
  needRefresh: boolean;
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>;
};

export const usePWAUpdate = (): UsePWAUpdateReturn => {
  const [offlineReady, setOfflineReady] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reloadPage?: boolean) => Promise<void>) | null>(null);

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

  useEffect(() => {
    const registerServiceWorker = async () => {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && !window.__SW_DISABLED__) {
        try {
          // @ts-ignore
          const { registerSW } = await import('virtual:pwa-register');
          
          registerSW({
            onOfflineReady() {
              setOfflineReady(true);
            },
            onNeedRefresh() {
              setNeedRefresh(true);
            },
            onRegisteredSW(swScriptUrl, registration) {
              // Optional: Implement periodic check for updates
              setInterval(() => {
                registration?.update().catch(err => {
                  // Silently fail on periodic update check
                });
              }, 60 * 60 * 1000); // Check every hour
            },
            onRegisterError(error) {
              // Silently fail on registration error
            },
          });
        } catch (error) {
          // Silently fail if SW registration fails
        }
      }
    };

    registerServiceWorker();
  }, []);

  const updateServiceWorker = useCallback(async (reloadPage = true) => {
    setNeedRefresh(false); // Hide the update prompt immediately

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

  return { offlineReady, needRefresh, updateServiceWorker };
};