import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import monacoEditorPluginModule from 'vite-plugin-monaco-editor'

// CJS モジュールを ESM 環境でインポートした際に .default に関数が入る
const monacoEditorPlugin = (monacoEditorPluginModule as unknown as { default: typeof monacoEditorPluginModule }).default

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // Monaco Editor の worker ファイルをローカルバンドルに組み込む
    // languageWorkers: HTML ハイライトに必要な html / css / json / ts worker を含める
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'html', 'css', 'json', 'typescript'],
    }),
  ],
  base: mode === 'production' ? '/webTools/' : '/',
  build: {
    rollupOptions: {
      output: {
        // Monaco Editor を独立チャンクに分離してアプリ本体のバンドルサイズを抑える
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
        },
      },
    },
  },
  server: {
    port: 3000, // 任意のポート番号
    host: true, // LAN からもアクセス可能にする場合
  }
}));
