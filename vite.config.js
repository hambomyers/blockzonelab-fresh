import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.', // Changed from 'src' to match actual project structure
  base: '/', // Ensure proper base URL for Cloudflare Pages
  build: {
    outDir: 'dist', // Changed from '../dist' since root is now '.'
    emptyOutDir: true, // Clear dist folder before build
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        games: resolve(__dirname, 'games/index.html'),
        academy: resolve(__dirname, 'academy/index.html'),
        userProfile: resolve(__dirname, 'pages/user-profile.html'),
      }
    },
    // Ensure assets are properly handled
    assetsDir: 'assets',
    // Optimize for production
    minify: 'terser',
    sourcemap: false,
    // Copy static assets
    copyPublicDir: true
  },
  server: {
    port: 3001,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './shared'),
      '@games': resolve(__dirname, './games'),
      '@academy': resolve(__dirname, './academy')
    }
  },
  optimizeDeps: {
    exclude: ['@shared/platform/core/GameRegistry.js']
  },
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    // Define environment variables for client-side use
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.SONIC_LABS_API_URL': JSON.stringify(process.env.VITE_SONIC_LABS_API_URL || 'https://api.soniclabs.xyz'),
    'process.env.BLOCKCHAIN_NETWORK': JSON.stringify(process.env.VITE_BLOCKCHAIN_NETWORK || 'sonic-testnet'),
    'process.env.API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'https://api.blockzonelab.com'),
    'process.env.LEADERBOARD_SCOPE': JSON.stringify(process.env.VITE_LEADERBOARD_SCOPE || 'global'),
    'process.env.KV_NAMESPACE': JSON.stringify(process.env.VITE_KV_NAMESPACE || 'LEADERBOARD_KV')
  },
  // Handle static assets properly
  publicDir: 'public',
  // Ensure CSS is properly processed
  css: {
    devSourcemap: false
  }
}); 
