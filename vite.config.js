import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // This helps the app stay available offline
      devOptions: {
    enabled: true
      },
      manifest: {
        name: 'EduBridge Offline',
        short_name: 'EduBridge',
        description: 'Offline-first E-Learning Platform',
        theme_color: '#000000',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'  
          },
          {
            src: 'logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
           {
            src: 'logo512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})