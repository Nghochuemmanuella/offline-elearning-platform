import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Offline E-Learning Portal',
        short_name: 'EduOffline',
        description: 'Learning management system for low-bandwidth areas.',
        theme_color: '#ffffff',
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
        // This caches all your JS, CSS, and HTML automatically
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        // Increase the limit for offline caching (important for lessons/images)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 
      }
    })
  ]
})