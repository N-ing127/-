import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '食光機 TimeMachine',
        short_name: '食光機',
        description: '台大校園剩食分享平台',
        theme_color: '#10b981',
        background_color: '#fafaf9',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // 新 SW 立即接管，不等下次載入
        skipWaiting: true,
        clientsClaim: true,
        // HTML 走 NetworkFirst：確保永遠拿最新版，離線才用快取
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // App shell (HTML) — 網路優先
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 }
            }
          },
          {
            // JS/CSS build 產物 — 帶 hash 的檔名天然不衝突，快取優先
            urlPattern: /\/assets\/.*\.(js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/unpkg\.com\/leaflet@.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'leaflet-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            // Supabase API — 永遠走網路，不快取
            urlPattern: /\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          }
        ]
      }
    })
  ],
});