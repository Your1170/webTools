<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type * as MonacoType from 'monaco-editor'

// ============================================================
// 型定義
// ============================================================

type TabType = 'editor' | 'preview'

// ============================================================
// 定数
// ============================================================

const INITIAL_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Game</title>
  <style>
    body {
      margin: 0;
      background: #111;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #fff;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <p>ここにゲームのコードを貼り付けてください</p>
  <script>
    // JavaScript はここに記述します
  <\/script>
</body>
</html>`

// ============================================================
// 状態管理
// ============================================================

/** 現在表示中のタブ */
const activeTab = ref<TabType>('editor')

/** エディタに表示している HTML ソース */
const htmlSource = ref<string>(INITIAL_HTML)

/** iframe に流し込む HTML（実行ボタンを押したタイミングで更新） */
const previewSrcdoc = ref<string>('')

/** ファイル読み込み用 input 要素の参照 */
const fileInputRef = ref<HTMLInputElement | null>(null)

/** Monaco Editor のコンテナ要素 */
const editorContainerRef = ref<HTMLDivElement | null>(null)

/** Monaco Editor インスタンス */
let editorInstance: MonacoType.editor.IStandaloneCodeEditor | null = null

// ============================================================
// Monaco Editor の初期化・破棄
// ============================================================

onMounted(async () => {
  if (!editorContainerRef.value) return

  // Monaco Editor を動的インポートして独立チャンクに分離
  const monaco = await import('monaco-editor')

  editorInstance = monaco.editor.create(editorContainerRef.value, {
    value: htmlSource.value,
    language: 'html',
    theme: 'vs-dark',
    fontSize: 14,
    lineNumbers: 'on',
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    automaticLayout: true,  // コンテナのリサイズに追従
    tabSize: 2,
    renderLineHighlight: 'all',
    scrollbar: {
      verticalScrollbarSize: 8,
      horizontalScrollbarSize: 8,
    },
  })

  // エディタの変更を htmlSource に同期
  editorInstance.onDidChangeModelContent(() => {
    htmlSource.value = editorInstance?.getValue() ?? ''
  })
})

onBeforeUnmount(() => {
  editorInstance?.dispose()
  editorInstance = null
})

// ============================================================
// タブ切り替え
// ============================================================

const switchTab = (tab: TabType) => {
  activeTab.value = tab
  if (tab === 'editor') {
    // エディタタブに戻ったとき Monaco の表示を再調整
    nextTick(() => {
      editorInstance?.layout()
    })
  }
}

// ============================================================
// プレビュー実行
// ============================================================

const runPreview = () => {
  previewSrcdoc.value = htmlSource.value
  activeTab.value = 'preview'
}

// ============================================================
// ファイル読み込み
// ============================================================

/** input[type=file] を開く */
const openFilePicker = () => {
  fileInputRef.value?.click()
}

/** ファイル選択後の処理 */
const onFileSelected = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  loadFile(file)
  // 同じファイルを再選択できるよう値をリセット
  input.value = ''
}

/** File オブジェクトを読み込んでエディタに反映 */
const loadFile = (file: File) => {
  const confirmed =
    htmlSource.value === INITIAL_HTML ||
    window.confirm('現在の編集内容が上書きされます。続けますか？')
  if (!confirmed) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    htmlSource.value = text
    editorInstance?.setValue(text)
  }
  reader.readAsText(file, 'UTF-8')
}

// ============================================================
// ドラッグ＆ドロップ（PC のみ）
// ============================================================

const isDragging = ref<boolean>(false)

const onDragover = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

const onDragleave = () => {
  isDragging.value = false
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  if (!file.name.match(/\.html?$/i)) {
    alert('.html または .htm ファイルをドロップしてください')
    return
  }
  loadFile(file)
}

// ============================================================
// ダウンロード
// ============================================================

const downloadHtml = () => {
  const input = window.prompt('ファイル名を入力してください', 'index.html')
  // キャンセル時は何もしない
  if (input === null) return
  // 空文字の場合は index.html にフォールバック
  const rawName = input.trim() || 'index.html'
  // .html / .htm 拡張子がなければ付与する
  const fileName = /\.html?$/i.test(rawName) ? rawName : `${rawName}.html`
  const blob = new Blob([htmlSource.value], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}

// ============================================================
// リセット
// ============================================================

const resetEditor = () => {
  const confirmed = window.confirm('編集内容をリセットします。この操作は元に戻せません。続けますか？')
  if (!confirmed) return
  htmlSource.value = INITIAL_HTML
  editorInstance?.setValue(INITIAL_HTML)
  previewSrcdoc.value = ''
  activeTab.value = 'editor'
}
</script>

<template>
  <div
    class="studio-wrapper"
    @dragover="onDragover"
    @dragleave="onDragleave"
    @drop="onDrop"
  >
    <!-- ドラッグオーバーレイ -->
    <div v-if="isDragging" class="drop-overlay" aria-hidden="true">
      <div class="drop-overlay-inner">
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="1.5"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span>HTMLファイルをドロップ</span>
      </div>
    </div>

    <!-- ページヘッダー -->
    <div class="page-title-block studio-header">
      <h1 class="page-title">HTML GAME STUDIO</h1>
      <p class="page-subtitle">HTMLゲームのコードを貼り付けて、ブラウザ上で実行・確認できます</p>
    </div>

    <!-- タブ + 操作ボタン行 -->
    <div class="toolbar">
      <!-- タブ切り替え -->
      <div class="tab-group" role="tablist" aria-label="エディタ / プレビュー切り替え">
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'editor' }"
          role="tab"
          :aria-selected="activeTab === 'editor'"
          @click="switchTab('editor')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          エディタ
        </button>
        <button
          class="tab-btn"
          :class="{ active: activeTab === 'preview' }"
          role="tab"
          :aria-selected="activeTab === 'preview'"
          @click="switchTab('preview')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          プレビュー
        </button>
      </div>

      <!-- 操作ボタン群 -->
      <div class="action-group">
        <!-- ファイル読み込み -->
        <button class="btn-secondary btn-sm" type="button" @click="openFilePicker"
          title="HTMLファイルを読み込む" aria-label="HTMLファイルを読み込む">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span class="btn-label">読み込み</span>
        </button>

        <!-- 実行 -->
        <button class="btn-primary btn-sm" type="button" @click="runPreview"
          title="プレビューを実行する" aria-label="プレビューを実行する">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span class="btn-label">実行</span>
        </button>

        <!-- ダウンロード -->
        <button class="btn-secondary btn-sm" type="button" @click="downloadHtml"
          title="HTMLファイルをダウンロードする" aria-label="HTMLファイルをダウンロードする">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span class="btn-label">DL</span>
        </button>

        <!-- リセット -->
        <button class="btn-secondary btn-sm btn-danger" type="button" @click="resetEditor"
          title="エディタをリセットする" aria-label="エディタをリセットする">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.1"/>
          </svg>
          <span class="btn-label">リセット</span>
        </button>
      </div>
    </div>

    <!-- メインパネル -->
    <div class="studio-panel">
      <!-- エディタペイン -->
      <div
        class="pane editor-pane"
        :class="{ hidden: activeTab !== 'editor' }"
        role="tabpanel"
        aria-label="HTMLエディタ"
      >
        <div ref="editorContainerRef" class="monaco-container" />
      </div>

      <!-- プレビューペイン -->
      <div
        class="pane preview-pane"
        :class="{ hidden: activeTab !== 'preview' }"
        role="tabpanel"
        aria-label="プレビュー"
      >
        <!-- 未実行状態 -->
        <div v-if="!previewSrcdoc" class="preview-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <p>「実行」ボタンを押すとここにプレビューが表示されます</p>
        </div>

        <!-- iframe プレビュー（sandbox: allow-scripts のみ） -->
        <iframe
          v-else
          class="preview-iframe"
          :srcdoc="previewSrcdoc"
          sandbox="allow-scripts"
          title="HTMLプレビュー"
          aria-label="HTMLプレビュー"
        />
      </div>
    </div>

    <!-- ヒントテキスト（PC のみ表示） -->
    <p class="drop-hint" aria-hidden="true">
      HTMLファイルをここにドラッグ＆ドロップして読み込むこともできます
    </p>

    <!-- 非表示ファイル入力 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".html,.htm"
      class="hidden-input"
      aria-hidden="true"
      tabindex="-1"
      @change="onFileSelected"
    />
  </div>
</template>

<style lang="scss" scoped>
/* ============================================================
   ページラッパー（page-wrapper を上書き）
   ============================================================ */
.studio-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: none;        // page-wrapper の 860px 制限を解除
  width: 100%;
  padding: var(--space-6) var(--space-6) var(--space-4);
  position: relative;     // ドロップオーバーレイの基準

  @media screen and (max-width: 768px) {
    padding: var(--space-4) var(--space-4) var(--space-3);
  }
}

/* ============================================================
   ページヘッダー
   ============================================================ */
.studio-header {
  margin-bottom: var(--space-4);
}

/* ============================================================
   ツールバー（タブ + ボタン群）
   ============================================================ */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
  flex-wrap: wrap;
}

/* タブグループ */
.tab-group {
  display: flex;
  gap: var(--space-1);
  background-color: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 3px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: calc(var(--radius-md) - 2px);
  cursor: pointer;
  transition: background-color var(--transition-fast),
              color var(--transition-fast),
              border-color var(--transition-fast);
  white-space: nowrap;

  &:hover:not(.active) {
    background-color: var(--color-elevated);
    color: var(--color-text-primary);
  }

  &.active {
    background-color: var(--color-elevated);
    border-color: var(--color-border);
    color: var(--color-primary-light);
  }
}

/* 操作ボタン群 */
.action-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

/* ボタン小サイズ上書き */
.btn-sm {
  padding: var(--space-2) var(--space-3);
  font-size: 0.8125rem;
  gap: var(--space-1);
}

/* 危険ボタン（リセット）ホバー時 */
.btn-danger {
  &:hover:not(:disabled) {
    border-color: var(--color-error);
    color: var(--color-error);
  }
}

/* ============================================================
   メインパネル
   ============================================================ */
.studio-panel {
  flex: 1;
  position: relative;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background-color: var(--color-panel);
  // 高さはビューポートから逆算
  // PC: ヘッダー(56px想定なし) + padding上下 + ページタイトルブロック + ツールバー + ヒント + 余白
  height: calc(100vh - 240px);
  min-height: 320px;

  @media screen and (max-width: 768px) {
    // モバイル: 固定ヘッダー(56px) + padding上下 + タイトル + ツールバー + 余白
    height: calc(100vh - 56px - 220px);
    min-height: 280px;
  }
}

/* ============================================================
   ペイン共通
   ============================================================ */
.pane {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  transition: opacity var(--transition-fast);

  &.hidden {
    // display:none にすると Monaco が layout を失うため visibility で隠す
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }
}

/* ============================================================
   Monaco Editor コンテナ
   ============================================================ */
.monaco-container {
  flex: 1;
  width: 100%;
  height: 100%;
}

/* ============================================================
   プレビューペイン
   ============================================================ */
.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  background: #fff;
}

/* 未実行状態のプレースホルダー */
.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  height: 100%;
  color: var(--color-text-muted);

  svg {
    opacity: 0.4;
  }

  p {
    font-size: 0.875rem;
  }
}

/* ============================================================
   ドロップオーバーレイ
   ============================================================ */
.drop-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  background-color: rgba(13, 17, 23, 0.85);
  backdrop-filter: blur(4px);
  border: 2px dashed var(--color-primary);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.drop-overlay-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  color: var(--color-primary-light);
  font-size: 1rem;
  font-weight: 500;
}

/* ============================================================
   ヒントテキスト
   ============================================================ */
.drop-hint {
  margin-top: var(--space-3);
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-align: center;

  @media screen and (max-width: 768px) {
    display: none;
  }
}

/* ============================================================
   非表示ファイル入力
   ============================================================ */
.hidden-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

/* ============================================================
   アクセシビリティ：動作軽減
   ============================================================ */
@media (prefers-reduced-motion: reduce) {
  .tab-btn,
  .pane {
    transition: none;
  }
}
</style>
