<script setup lang="ts">
import { ref, computed, watch } from 'vue'

// ============================================================
// 型定義
// ============================================================

type OutputFormat = 'favicon' | 'svg' | 'png' | 'jpeg' | 'webp'

type PreviewBg = 'white' | 'black' | 'checker'

interface OutputSize {
  width: number
  height: number
}

// ============================================================
// 定数
// ============================================================

const FORMAT_LABEL: Record<OutputFormat, string> = {
  favicon: 'ファビコン用HTML',
  svg:     'SVG',
  png:     'PNG',
  jpeg:    'JPEG',
  webp:    'WebP',
}

const PRESET_SIZES: { label: string; width: number; height: number }[] = [
  { label: '16 × 16',   width: 16,  height: 16  },
  { label: '32 × 32',   width: 32,  height: 32  },
  { label: '48 × 48',   width: 48,  height: 48  },
  { label: '64 × 64',   width: 64,  height: 64  },
  { label: '128 × 128', width: 128, height: 128 },
  { label: '256 × 256', width: 256, height: 256 },
  { label: '512 × 512', width: 512, height: 512 },
  { label: '元のSVGサイズ', width: 0, height: 0 },
  { label: 'カスタム', width: -1, height: -1 },
]

// ============================================================
// リアクティブ状態
// ============================================================

// 入力
const svgSource       = ref<string>('')
const uploadFileName  = ref<string>('converted-image')
const fileInput       = ref<HTMLInputElement | null>(null)
const isDragOver      = ref(false)

// プレビュー
const previewBg       = ref<PreviewBg>('checker')
const previewError    = ref<string>('')
const svgNaturalSize  = ref<{ width: number; height: number } | null>(null)

// 出力
const outputFormat    = ref<OutputFormat>('favicon')
const selectedPreset  = ref(0)   // PRESET_SIZES インデックス
const customWidth     = ref<number>(256)
const customHeight    = ref<number>(256)

// コピー
const copiedFavicon   = ref(false)
const faviconCopyError = ref(false)

// ダウンロード
const isConverting    = ref(false)
const errorMessage    = ref('')

// ============================================================
// 算出プロパティ
// ============================================================

/** サニタイズ済みの安全な SVG（script 要素と on* 属性を除去） */
const sanitizedSvg = computed<string>(() => {
  const src = svgSource.value.trim()
  if (!src) return ''
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(src, 'image/svg+xml')
    const parseError = doc.querySelector('parsererror')
    if (parseError) return ''
    // script タグ除去
    doc.querySelectorAll('script').forEach(el => el.remove())
    // on* イベント属性除去
    doc.querySelectorAll('*').forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.toLowerCase().startsWith('on')) el.removeAttribute(attr.name)
      })
    })
    // javascript: href 除去
    doc.querySelectorAll('[href],[xlink\\:href]').forEach(el => {
      const href = el.getAttribute('href') || el.getAttribute('xlink:href') || ''
      if (/^javascript:/i.test(href.trim())) {
        el.removeAttribute('href')
        el.removeAttribute('xlink:href')
      }
    })
    return new XMLSerializer().serializeToString(doc.documentElement)
  } catch {
    return ''
  }
})

/** SVG として有効かどうか */
const isSvgValid = computed<boolean>(() => {
  const src = svgSource.value.trim()
  if (!src) return false
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(src, 'image/svg+xml')
    return !doc.querySelector('parsererror')
  } catch {
    return false
  }
})

/** ファビコン用の HTML コード（URL エンコード版 Data URI） */
const faviconCode = computed<string>(() => {
  if (!isSvgValid.value || !sanitizedSvg.value) return ''
  const encoded = svgToUrlEncoded(sanitizedSvg.value)
  return `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encoded}">`
})

/** ファビコンコードのバイト数表示 */
const faviconCodeSizeLabel = computed<string>(() => {
  if (!faviconCode.value) return ''
  const bytes = new TextEncoder().encode(faviconCode.value).length
  return formatBytes(bytes)
})

/** 出力サイズ（raster 変換用） */
const outputSize = computed<OutputSize>(() => {
  const preset = PRESET_SIZES[selectedPreset.value]
  if (!preset) return { width: 256, height: 256 }
  if (preset.width === -1) return { width: customWidth.value, height: customHeight.value }
  if (preset.width === 0) return svgNaturalSize.value ?? { width: 256, height: 256 }
  return { width: preset.width, height: preset.height }
})

const isCustomSize = computed(() => PRESET_SIZES[selectedPreset.value]?.width === -1)
const isRasterFormat = computed(() => ['png', 'jpeg', 'webp'].includes(outputFormat.value))

const canDownload = computed(() =>
  isSvgValid.value && !isConverting.value && outputFormat.value !== 'favicon'
)

/** プレビュー用の data URL（iframe src に使用） */
const previewSrcDoc = computed<string>(() => {
  if (!sanitizedSvg.value) return ''
  // チェッカーボード背景を CSS で実現した HTML ドキュメントとして返す
  const bgStyle = previewBg.value === 'white'
    ? 'background: #ffffff;'
    : previewBg.value === 'black'
      ? 'background: #000000;'
      : `background-image: linear-gradient(45deg, #ccc 25%, transparent 25%),
           linear-gradient(-45deg, #ccc 25%, transparent 25%),
           linear-gradient(45deg, transparent 75%, #ccc 75%),
           linear-gradient(-45deg, transparent 75%, #ccc 75%);
         background-size: 16px 16px;
         background-position: 0 0, 0 8px, 8px -8px, -8px 0;
         background-color: #fff;`
  return `<!DOCTYPE html><html><head><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; ${bgStyle} }
    body { display: flex; align-items: center; justify-content: center; }
    svg { max-width: 100%; max-height: 100%; display: block; }
  </style></head><body>${sanitizedSvg.value}</body></html>`
})

// ============================================================
// SVG 入力処理
// ============================================================

function clearSource() {
  svgSource.value = ''
  uploadFileName.value = 'converted-image'
  previewError.value = ''
  errorMessage.value = ''
  svgNaturalSize.value = null
  if (fileInput.value) fileInput.value.value = ''
}

function onSourceInput() {
  errorMessage.value = ''
  if (svgSource.value.trim() && !isSvgValid.value) {
    previewError.value = 'SVGの構文が不正です。正しいSVGソースコードを入力してください。'
  } else {
    previewError.value = ''
  }
}

// ============================================================
// ファイルアップロード
// ============================================================

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  handleFile(file)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  const file = event.dataTransfer?.files[0]
  if (!file) return
  handleFile(file)
}

function handleFile(file: File) {
  if (file.type !== 'image/svg+xml' && !file.name.toLowerCase().endsWith('.svg')) {
    errorMessage.value = 'SVGファイルを選択してください。SVG以外のファイルは対応していません。'
    return
  }
  errorMessage.value = ''
  const reader = new FileReader()
  reader.onload = () => {
    svgSource.value = reader.result as string
    uploadFileName.value = file.name.replace(/\.svg$/i, '')
    onSourceInput()
  }
  reader.onerror = () => {
    errorMessage.value = 'ファイルの読み込みに失敗しました。'
  }
  reader.readAsText(file)
}

// ============================================================
// SVG サイズ取得（自然サイズの測定）
// ============================================================

watch(sanitizedSvg, (svg) => {
  if (!svg) { svgNaturalSize.value = null; return }
  measureSvgSize(svg).then(size => { svgNaturalSize.value = size })
})

function measureSvgSize(svgStr: string): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    const blob = new Blob([svgStr], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth || 256, height: img.naturalHeight || 256 })
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve({ width: 256, height: 256 }) }
    img.src = url
  })
}

// ============================================================
// カスタムサイズの縦横比維持
// ============================================================

function onCustomWidthChange() {
  if (!svgNaturalSize.value || customWidth.value <= 0) return
  const ratio = svgNaturalSize.value.height / svgNaturalSize.value.width
  customHeight.value = Math.round(customWidth.value * ratio)
}

function onCustomHeightChange() {
  if (!svgNaturalSize.value || customHeight.value <= 0) return
  const ratio = svgNaturalSize.value.width / svgNaturalSize.value.height
  customWidth.value = Math.round(customHeight.value * ratio)
}

// ============================================================
// コピー
// ============================================================

async function copyFaviconCode() {
  if (!faviconCode.value) return
  try {
    await navigator.clipboard.writeText(faviconCode.value)
    faviconCopyError.value = false
    copiedFavicon.value = true
    setTimeout(() => { copiedFavicon.value = false }, 2000)
  } catch {
    faviconCopyError.value = true
    setTimeout(() => { faviconCopyError.value = false }, 3000)
  }
}

// ============================================================
// ダウンロード
// ============================================================

async function download() {
  if (!isSvgValid.value || isConverting.value) return
  errorMessage.value = ''
  isConverting.value = true

  try {
    const fmt = outputFormat.value
    if (fmt === 'svg') {
      downloadSvg()
    } else if (fmt === 'png' || fmt === 'jpeg' || fmt === 'webp') {
      await downloadRaster(fmt)
    }
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : '変換中にエラーが発生しました。'
  } finally {
    isConverting.value = false
  }
}

function downloadSvg() {
  const content = sanitizedSvg.value
  if (!content) throw new Error('SVGの生成に失敗しました。')
  const blob = new Blob([content], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  triggerDownload(url, `${uploadFileName.value}.svg`)
  URL.revokeObjectURL(url)
}

async function downloadRaster(fmt: 'png' | 'jpeg' | 'webp') {
  const size = outputSize.value
  if (size.width <= 0 || size.height <= 0) {
    throw new Error('出力サイズが不正です。正の整数を入力してください。')
  }

  const svg = sanitizedSvg.value
  if (!svg) throw new Error('SVGの変換に失敗しました。')

  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)

  try {
    const img = await loadImageFromUrl(url)
    const canvas = document.createElement('canvas')
    canvas.width  = size.width
    canvas.height = size.height
    const ctx = canvas.getContext('2d')!

    if (fmt === 'jpeg') {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size.width, size.height)
    }

    ctx.drawImage(img, 0, 0, size.width, size.height)

    const mime = fmt === 'jpeg' ? 'image/jpeg' : fmt === 'webp' ? 'image/webp' : 'image/png'
    const ext  = fmt === 'jpeg' ? 'jpg' : fmt
    const dataUrl = canvas.toDataURL(mime, fmt === 'jpeg' ? 0.92 : undefined)

    if (!dataUrl || dataUrl === 'data:,') throw new Error('画像の変換に失敗しました。')

    triggerDownload(dataUrl, `${uploadFileName.value}.${ext}`)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('SVGの読み込みに失敗しました。'))
    img.src = url
  })
}

// ============================================================
// ユーティリティ
// ============================================================

/** SVG 文字列を href 内で安全に使える URL エンコード形式に変換 */
function svgToUrlEncoded(svg: string): string {
  // 要件：URLエンコード方式、UTF-8対応
  return svg
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .replace(/%/g, '%25')
    .replace(/#/g, '%23')
    .replace(/</g, '%3C')
    .replace(/>/g, '%3E')
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)             return `${bytes} bytes`
  if (bytes < 1024 * 1024)      return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// ============================================================
// formatBytes の要件確認：1024未満はそのまま整数表示 → 上の実装で対応済み
// ============================================================

// outputFormat 変更時にエラーをクリア
watch(outputFormat, () => { errorMessage.value = '' })
</script>

<template>
  <div class="page-wrapper">
    <!-- タイトル -->
    <div class="page-title-block">
      <h1 class="page-title">SVG変換</h1>
      <p class="page-subtitle">SVGをファビコン用HTMLコードやPNG・JPEG・WebP画像に変換します。変換処理はブラウザ内で完結します。</p>
    </div>

    <!-- ① 入力エリア -->
    <div class="card">
      <div class="input-header">
        <p class="section-label">SVGソースコード / ファイル</p>
        <button
          class="btn-secondary btn-sm"
          type="button"
          :disabled="!svgSource"
          @click="clearSource"
          aria-label="入力内容を全消去"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
          消去
        </button>
      </div>

      <!-- テキストエリア -->
      <textarea
        class="form-input svg-textarea"
        v-model="svgSource"
        @input="onSourceInput"
        placeholder="SVGソースコードをここに貼り付けてください。&#10;例: <svg xmlns=&quot;http://www.w3.org/2000/svg&quot; ...>...</svg>"
        rows="8"
        aria-label="SVGソースコード入力"
        spellcheck="false"
        autocomplete="off"
      ></textarea>

      <!-- ファイルアップロード -->
      <div
        class="drop-zone"
        :class="{ 'drag-over': isDragOver }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="fileInput?.click()"
        role="button"
        tabindex="0"
        aria-label="SVGファイルをドラッグ&ドロップ、またはクリックして選択"
        @keydown.enter="fileInput?.click()"
        @keydown.space.prevent="fileInput?.click()"
      >
        <input
          ref="fileInput"
          class="file-input-hidden"
          type="file"
          accept=".svg,image/svg+xml"
          @change="onFileChange"
          aria-hidden="true"
          tabindex="-1"
        />
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1.5"
             stroke-linecap="round" stroke-linejoin="round"
             class="drop-zone-icon" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <span class="drop-zone-text">
          クリックまたはドラッグ&ドロップでSVGファイルを選択
        </span>
      </div>

      <!-- 入力エラー -->
      <p v-if="errorMessage && outputFormat === 'favicon'" class="error-message" role="alert">
        {{ errorMessage }}
      </p>
    </div>

    <!-- ② プレビュー -->
    <div class="card" style="margin-top: var(--space-4)">
      <div class="preview-header">
        <p class="section-label">プレビュー</p>
        <div class="bg-selector" role="group" aria-label="プレビュー背景色">
          <button
            class="bg-btn"
            :class="{ active: previewBg === 'checker' }"
            type="button"
            @click="previewBg = 'checker'"
            title="チェッカーボード（透過確認）"
            aria-label="チェッカーボード背景"
          >
            <span class="bg-swatch bg-checker" aria-hidden="true"></span>
          </button>
          <button
            class="bg-btn"
            :class="{ active: previewBg === 'white' }"
            type="button"
            @click="previewBg = 'white'"
            title="白背景"
            aria-label="白背景"
          >
            <span class="bg-swatch bg-white" aria-hidden="true"></span>
          </button>
          <button
            class="bg-btn"
            :class="{ active: previewBg === 'black' }"
            type="button"
            @click="previewBg = 'black'"
            title="黒背景"
            aria-label="黒背景"
          >
            <span class="bg-swatch bg-black" aria-hidden="true"></span>
          </button>
        </div>
      </div>

      <div v-if="isSvgValid && !previewError" class="preview-frame">
        <iframe
          class="preview-iframe"
          :srcdoc="previewSrcDoc"
          sandbox="allow-same-origin"
          title="SVGプレビュー"
          aria-label="SVGプレビュー"
        ></iframe>
        <p v-if="svgNaturalSize" class="preview-size-label">
          元のサイズ: {{ svgNaturalSize.width }} × {{ svgNaturalSize.height }} px
        </p>
      </div>

      <div v-else-if="previewError" class="preview-error" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ previewError }}
      </div>

      <div v-else class="preview-empty">
        SVGを入力するとプレビューが表示されます
      </div>
    </div>

    <!-- ③ 出力設定 -->
    <div class="card" style="margin-top: var(--space-4)">
      <p class="section-label">出力設定</p>

      <!-- フォーマット選択 -->
      <div class="output-format-row">
        <label class="form-label" for="output-format">出力形式</label>
        <select
          id="output-format"
          class="form-input format-select"
          v-model="outputFormat"
          aria-label="出力形式を選択"
        >
          <option v-for="(label, fmt) in FORMAT_LABEL" :key="fmt" :value="fmt">
            {{ label }}
          </option>
        </select>
      </div>

      <!-- ファビコン用HTML -->
      <div v-if="outputFormat === 'favicon'" class="favicon-section">
        <div v-if="faviconCode" class="favicon-output">
          <!-- バイト数 -->
          <p class="favicon-size-label">HTMLコードサイズ：{{ faviconCodeSizeLabel }}</p>

          <!-- コードプレビュー -->
          <div class="favicon-code-block">
            <pre class="favicon-code"><code>{{ faviconCode }}</code></pre>
          </div>

          <!-- コピーボタン -->
          <button
            class="btn-primary copy-btn"
            type="button"
            @click="copyFaviconCode"
          >
            <svg v-if="!copiedFavicon && !faviconCopyError"
                 xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <svg v-else-if="copiedFavicon"
                 xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <svg v-else
                 xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span v-if="copiedFavicon">コピーしました</span>
            <span v-else-if="faviconCopyError">コピーに失敗しました</span>
            <span v-else>HTMLコードをコピー</span>
          </button>
        </div>

        <div v-else class="favicon-empty">
          有効なSVGを入力するとファビコン用HTMLコードが生成されます
        </div>
      </div>

      <!-- ラスター出力設定 -->
      <div v-if="isRasterFormat" class="raster-section">
        <label class="form-label" style="margin-top: var(--space-4)">出力サイズ</label>
        <div class="size-selector">
          <select
            class="form-input size-select"
            v-model.number="selectedPreset"
            aria-label="出力サイズを選択"
          >
            <option
              v-for="(preset, index) in PRESET_SIZES"
              :key="index"
              :value="index"
            >{{ preset.label }}</option>
          </select>
        </div>

        <!-- カスタムサイズ入力 -->
        <div v-if="isCustomSize" class="custom-size-row">
          <label class="form-label sr-only" for="custom-width">幅</label>
          <div class="custom-size-input-group">
            <span class="size-input-label">幅</span>
            <input
              id="custom-width"
              type="number"
              class="form-input form-input-number"
              v-model.number="customWidth"
              min="1"
              max="4096"
              @change="onCustomWidthChange"
              aria-label="幅（px）"
            />
            <span class="size-unit">px</span>
            <span class="size-separator" aria-hidden="true">×</span>
            <span class="size-input-label">高さ</span>
            <input
              id="custom-height"
              type="number"
              class="form-input form-input-number"
              v-model.number="customHeight"
              min="1"
              max="4096"
              @change="onCustomHeightChange"
              aria-label="高さ（px）"
            />
            <span class="size-unit">px</span>
          </div>
          <p class="size-hint">SVGの縦横比を参照して自動補正できます</p>
        </div>

        <!-- ダウンロードボタン -->
        <div class="action-row" style="margin-top: var(--space-5)">
          <button
            class="btn-primary"
            type="button"
            :disabled="!canDownload"
            @click="download"
          >
            <svg v-if="isConverting" class="spin-icon"
                 xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {{ isConverting ? '変換中...' : 'ダウンロード' }}
          </button>
        </div>
      </div>

      <!-- SVG ダウンロードボタン -->
      <div v-if="outputFormat === 'svg'" class="action-row" style="margin-top: var(--space-5)">
        <button
          class="btn-primary"
          type="button"
          :disabled="!canDownload"
          @click="download"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          SVGをダウンロード
        </button>
      </div>

      <!-- エラー表示 -->
      <p v-if="errorMessage" class="error-message" role="alert" style="margin-top: var(--space-4)">
        {{ errorMessage }}
      </p>
    </div>

    <!-- 仕様セクション -->
    <div class="spec-section">
      <p class="spec-title">仕様・注意事項</p>
      <div class="spec-item">
        <span class="spec-item-label">変換処理</span>
        <p>すべての変換処理はブラウザ内で完結します。入力されたSVGは外部サーバーへ送信されません。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">ファビコン用HTML</span>
        <p>SVGをURLエンコードしたData URI形式で埋め込んだ link タグを生成します。Base64より小さいサイズになる場合が多く、UTF-8文字（日本語など）も正しく変換されます。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">セキュリティ</span>
        <p>プレビュー表示時にSVG内のスクリプトは実行されません。script要素とonイベント属性は変換前に除去されます。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">JPEGの透過</span>
        <p>JPEGは透過に対応しないため、SVGの透過部分は白で塗りつぶされます。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">出力サイズ</span>
        <p>「元のSVGサイズ」を選択すると、SVGのwidth/height属性またはviewBoxから取得したサイズで出力します。サイズが取得できない場合は256×256で出力します。</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ============================================================
   入力エリア
   ============================================================ */

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);

  .section-label {
    margin-bottom: 0;
  }
}

.svg-textarea {
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
  font-size: 0.8125rem;
  line-height: 1.6;
  resize: vertical;
  min-height: 160px;
}

/* ============================================================
   ドロップゾーン
   ============================================================ */

.drop-zone {
  margin-top: var(--space-3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);
  color: var(--color-text-secondary);

  &:hover, &:focus-visible {
    border-color: var(--color-primary);
    background-color: rgba(88, 166, 255, 0.05);
    color: var(--color-text-primary);
    outline: none;
  }

  &.drag-over {
    border-color: var(--color-primary);
    background-color: rgba(88, 166, 255, 0.08);
    color: var(--color-primary-light);
  }
}

.drop-zone-icon {
  flex-shrink: 0;
  color: inherit;
}

.drop-zone-text {
  font-size: 0.875rem;
}

.file-input-hidden {
  display: none;
}

/* ============================================================
   プレビュー
   ============================================================ */

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);

  .section-label {
    margin-bottom: 0;
  }
}

.bg-selector {
  display: flex;
  gap: var(--space-1);
}

.bg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 2px;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color var(--transition-fast);

  &:hover {
    border-color: var(--color-text-secondary);
  }

  &.active {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.25);
  }
}

.bg-swatch {
  display: block;
  width: 18px;
  height: 18px;
  border-radius: 2px;

  &.bg-white {
    background: #ffffff;
    border: 1px solid #ccc;
  }

  &.bg-black {
    background: #000000;
  }

  &.bg-checker {
    background-image:
      linear-gradient(45deg, #999 25%, transparent 25%),
      linear-gradient(-45deg, #999 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #999 75%),
      linear-gradient(-45deg, transparent 75%, #999 75%);
    background-size: 6px 6px;
    background-position: 0 0, 0 3px, 3px -3px, -3px 0;
    background-color: #fff;
  }
}

.preview-frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}

.preview-iframe {
  width: 100%;
  height: 240px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
}

.preview-size-label {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.preview-error {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: rgba(248, 81, 73, 0.1);
  border: 1px solid rgba(248, 81, 73, 0.3);
  border-radius: var(--radius-md);
  color: var(--color-error);
  font-size: 0.875rem;
}

.preview-empty {
  padding: var(--space-6) var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

/* ============================================================
   出力設定
   ============================================================ */

.output-format-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;

  .form-label {
    margin-bottom: 0;
    white-space: nowrap;
  }
}

.format-select {
  max-width: 220px;
}

/* ============================================================
   ファビコンセクション
   ============================================================ */

.favicon-section {
  margin-top: var(--space-5);
}

.favicon-output {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.favicon-size-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.favicon-code-block {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  overflow-x: auto;
}

.favicon-code {
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.copy-btn {
  align-self: flex-start;
}

.favicon-empty {
  padding: var(--space-5) var(--space-4);
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.875rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

/* ============================================================
   ラスター出力設定
   ============================================================ */

.raster-section {
  .form-label {
    display: block;
  }
}

.size-selector {
  margin-top: var(--space-2);
}

.size-select {
  max-width: 200px;
}

.custom-size-row {
  margin-top: var(--space-3);
}

.custom-size-input-group {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.size-input-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.size-unit {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.size-separator {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  padding: 0 var(--space-1);
}

.size-hint {
  margin-top: var(--space-2);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* ============================================================
   アクション・エラー
   ============================================================ */

.action-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.error-message {
  font-size: 0.875rem;
  color: var(--color-error);
  display: flex;
  align-items: center;
  gap: var(--space-2);

  &::before {
    content: '⚠';
    font-size: 0.875rem;
  }
}

/* ============================================================
   小ボタン
   ============================================================ */

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: 0.8125rem;
}

/* ============================================================
   スピンアニメーション
   ============================================================ */

.spin-icon {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ============================================================
   アクセシビリティ
   ============================================================ */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* ============================================================
   レスポンシブ
   ============================================================ */

@media screen and (max-width: 768px) {
  .output-format-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .format-select,
  .size-select {
    max-width: 100%;
    width: 100%;
  }

  .custom-size-input-group {
    gap: var(--space-2);
  }

  .drop-zone {
    padding: var(--space-3) var(--space-4);
    flex-direction: column;
    gap: var(--space-2);
    text-align: center;
  }

  .preview-iframe {
    height: 200px;
  }

  .copy-btn {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spin-icon {
    animation: none;
  }
}
</style>
