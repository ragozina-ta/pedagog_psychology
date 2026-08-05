import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const base = '/pedagog_psychology/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons/*.png', 'push-handler.js', 'achievements/*.svg', 'pics/*.jpg'],
      manifest: {
        id: `${base}`,
        name: 'Ресурс педагога',
        short_name: 'Ресурс',
        description: 'Баланс, дневник, сад и психологическая поддержка педагогов',
        theme_color: '#31464f',
        background_color: '#cdc1ad',
        display: 'standalone',
        orientation: 'portrait-primary',
        lang: 'ru',
        start_url: base,
        scope: base,
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: `${base}index.html`,
        importScripts: ['push-handler.js'],
      },
    }),
  ],
})
