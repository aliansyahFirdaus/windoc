import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@windoc/core/style.css': path.resolve(__dirname, '../core/dist/index.css'),
      '@windoc/react/style.css': path.resolve(__dirname, '../react/dist/index.css'),
      '@windoc/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@windoc/react': path.resolve(__dirname, '../react/src/index.ts'),
    },
  },
})
