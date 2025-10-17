import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
//
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL),
        'import.meta.env.VITE_ACCESS_PASSWORD': JSON.stringify(env.VITE_ACCESS_PASSWORD)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist'
      },
      plugins: [
        VitePWA({
          registerType: 'autoUpdate',
          devOptions: {
            enabled: true
          },
          workbox: {
            cleanupOutdatedCaches: true,
            skipWaiting: true,
            clientsClaim: true,
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'gemini-api-cache',
                  networkTimeoutSeconds: 10,
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 // 1 hour
                  }
                }
              }
            ]
          },
          manifest: {
            name: 'ikunKChat',
            short_name: 'KChat',
            description: 'A chat application powered by Gemini',
            theme_color: '#F8F9FA',
            background_color: '#FFFFFF',
            display: 'standalone',
            start_url: '/',
            icons: [
              {
                src: 'favicon.svg',
                sizes: 'any',
                type: 'image/svg+xml',
              },
              {
                src: 'icon-192.png',
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
              }
            ]
          }
        })
      ]
    };
});
