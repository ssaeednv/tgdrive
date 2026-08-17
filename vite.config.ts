import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// On GitHub Actions, GITHUB_REPOSITORY is "owner/repo-name"
// We extract just the repo name for the base path e.g. "/tgdrive/"
// Locally this is undefined so base stays "/"
const repoName = process.env.GITHUB_REPOSITORY
  ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`
  : '/'

export default defineConfig({
  base: repoName,
  resolve: {
    alias: {
      os: path.resolve(__dirname, 'src/stubs/os.ts'),
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'process', 'stream', 'util', 'events', 'path', 'crypto'],
      globals: { Buffer: true, global: true, process: true },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      base: repoName,
      manifest: {
        name: 'TG Drive',
        short_name: 'TGDrive',
        description: 'Your Telegram account as unlimited cloud storage',
        start_url: repoName,
        scope: repoName,
        display: 'standalone',
        background_color: '#0f1115',
        theme_color: '#0f1115',
        icons: [
          {
            src: 'favicon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'favicon-192.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
      },
    }),
  ],
})
