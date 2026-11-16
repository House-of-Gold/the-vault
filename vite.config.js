import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      // No runtimeCaching entries on purpose: Workbox's generateSW only
      // precaches the build output (app shell). All other requests —
      // including every Supabase call (items, profiles, app_settings,
      // storage) — fall through to the network uncached. Do not add a
      // runtimeCaching rule for the Supabase origin; stale inventory data
      // would be a bug.
      manifest: {
        name: 'The Vault',
        short_name: 'The Vault',
        description: 'Inventory management for House of Gold.',
        theme_color: '#ec3013',
        background_color: '#f3f2f2',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
