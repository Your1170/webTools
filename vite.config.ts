import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000, // 任意のポート番号
    host: true, // LAN からもアクセス可能にする場合
  }
})
