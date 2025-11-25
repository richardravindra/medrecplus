import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
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
          tables: ['@tanstack/react-table'],

          // Tauri specific
          tauri: ['@tauri-apps/api']
        },

        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^.]*$/, '')
            : 'chunk';

          if (facadeModuleId === 'index') {
            return 'assets/[name]-[hash].js';
          }

          return 'assets/[name]-[hash].js';
        },

        // Separate vendor chunks for better caching
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'vendor') {
            return 'assets/vendor-[hash].js';
          }
          if (chunkInfo.name === 'mui') {
            return 'assets/mui-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        }
      },

      // Optimize dependencies
      external: [],

      // Minify options
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.debug']
        },
        mangle: {
          safari10: true
        }
      }
    },

    // Set chunk size warning limit higher for medical apps (more functionality)
    chunkSizeWarningLimit: 800,

    // Enable source maps for debugging
    sourcemap: process.env.NODE_ENV === 'development',

    // Optimize assets
    assetsInlineLimit: 4096, // 4kb

    // CSS code splitting
    cssCodeSplit: true
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material'
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
  },

  // Development server optimizations
  server: {
    fs: {
      // Allow serving files from parent directories
      allow: ['..']
    }
  },

  // Preview server optimizations
  preview: {
    port: 4173,
    strictPort: true,
    open: false
  }
});
