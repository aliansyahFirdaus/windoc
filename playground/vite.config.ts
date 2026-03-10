import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@windoc/core/style.css',
        replacement: path.resolve(__dirname, '../core/dist/index.css'),
      },
      {
        find: '@windoc/react/style.css',
        replacement: path.resolve(__dirname, '../react/src/styles/editor.css'),
      },
      {
        find: '@windoc/core',
        replacement: path.resolve(__dirname, '../core/dist/index.mjs'),
      },
      {
        find: '@windoc/react',
        replacement: path.resolve(__dirname, '../react/dist/index.mjs'),
      },
    ],
  },
  optimizeDeps: {
    exclude: ['@windoc/core', '@windoc/react'],
  },
  server: {
    watch: {
      ignored: ['!**/core/dist/**', '!**/react/dist/**'],
    },
  },
})
