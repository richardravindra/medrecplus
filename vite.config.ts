import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    modulePreload: false,

    // Bundle size optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and performance
        manualChunks: {
          // Core React and vendor libraries
          vendor: ['react', 'react-dom', 'react-router-dom'],

          // Material-UI components
          mui: [
            '@mui/material',
            '@mui/icons-material',
            '@mui/joy',
            '@mui/x-date-pickers',
            '@mui/x-charts'
          ],

          // Charts and visualization
          charts: ['recharts'],

          // Date utilities
          date: ['dayjs', 'chrono'],

          // Security and utilities
          utils: ['bcryptjs', 'zod'],

          // Excel and data export
          export: ['xlsx', 'react-window', 'react-window-infinite-loader'],

          // Tables and data grid
          tables: ['@tanstack/react-table']
        }
      }
    },

    // Set chunk size warning limit higher for medical apps
    chunkSizeWarningLimit: 800,

    // Minify options
    minify: 'esbuild',

    // Enable source maps for debugging
    sourcemap: process.env.NODE_ENV === 'development',

    // Optimize assets - ensure fonts are not inlined for proper embedding
    assetsInlineLimit: 4096, // 4kb

    // CSS code splitting
    cssCodeSplit: true,

    // Copy additional assets
    copyPublicDir: true,
  },

  // Assets configuration
  assetsInclude: ['**/*.woff', '**/*.woff2', '**/*.ttf', '**/*.eot'],

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled'
    ],

    // Exclude large dependencies from bundling during development
    exclude: ['@tauri-apps/api']
  },

  // Resolve paths
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lazy': path.resolve(__dirname, './src/lazy')
    }
  }
})