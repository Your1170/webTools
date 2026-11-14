<script setup lang="ts">
import { ref, computed, watch } from 'vue'
// @ts-ignore – imagetracerjs は型定義なし
import ImageTracer from 'imagetracerjs'
// @ts-ignore – gifuct-js は型定義なし
import { parseGIF, decompressFrames } from 'gifuct-js'

// ============================================================
// 型定義
// ============================================================

type OutputFormat = 'png' | 'jpeg' | 'webp' | 'gif' | 'svg'

interface ConversionResult {
  dataUrl: string        // 表示・ダウンロード用 Data URL（プレビュー兼単体DL）
  svgSource: string      // SVG 変換時のみ設定
  fileName: string
  format: OutputFormat
  mimeType: string
  sizeBytes: number
  // GIF 全フレーム個別ダウンロード用（設定されている場合のみ表示）
  gifFrames: GifFrameResult[]
}

interface GifFrameResult {
  dataUrl: string
  fileName: string  // 例: image_frame01.png
}

// ============================================================
// 定数
// ============================================================

const SUPPORTED_INPUT_MIME = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/bmp',
]

const ACCEPT_ATTR = '.png,.jpg,.jpeg,.webp,.gif,.svg,.bmp,image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/bmp'

/** 入力フォーマットごとに選択できる変換先 */
const OUTPUT_OPTIONS_MAP: Record<string, OutputFormat[]> = {
  'image/png':     ['png', 'jpeg', 'webp', 'svg'],
  'image/jpeg':    ['jpeg', 'png', 'webp', 'svg'],
  'image/webp':    ['webp', 'png', 'jpeg', 'svg'],
  'image/gif':     ['gif', 'png', 'jpeg', 'webp', 'svg'],
  'image/svg+xml': ['svg', 'png', 'jpeg', 'webp'],
  'image/bmp':     ['png', 'jpeg', 'webp', 'svg'],
}

const FORMAT_LABEL: Record<OutputFormat, string> = {
  png: 'PNG',
  jpeg: 'JPEG',
  webp: 'WebP',
  gif: 'GIF',
  svg: 'SVG',
}

const FORMAT_MIME: Record<OutputFormat, string> = {
  png:  'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif:  'image/gif',
  svg:  'image/svg+xml',
}

const FORMAT_EXT: Record<OutputFormat, string> = {
  png:  'png',
  jpeg: 'jpg',
  webp: 'webp',
  gif:  'gif',
  svg:  'svg',
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

// ============================================================
// リアクティブ状態
// ============================================================

const selectedFile     = ref<File | null>(null)
const selectedFileMime = ref<string>('')
const outputFormat     = ref<OutputFormat>('png')
const isConverting     = ref(false)
const errorMessage     = ref('')
const result           = ref<ConversionResult | null>(null)

// SVG 専用コピー状態
const copiedSvgSource  = ref(false)
const copiedFavicon    = ref(false)

// アニメーション警告フラグ
const hasAnimation     = ref(false)

// JPEG 背景色
const jpegBgColor      = ref('#ffffff')

// 変換前プレビュー URL
const originalPreviewUrl = ref('')

// GIF フレームのチェックボックス選択状態（インデックスの Set）
const selectedFrameIndices = ref<Set<number>>(new Set())

// ============================================================
// 算出プロパティ
// ============================================================

const availableOutputFormats = computed<OutputFormat[]>(() => {
  if (!selectedFileMime.value) return ['png', 'jpeg', 'webp', 'svg']
  return OUTPUT_OPTIONS_MAP[selectedFileMime.value] ?? ['png', 'jpeg', 'webp']
})

const isSameFormat = computed(() => {
  if (!selectedFileMime.value) return false
  return FORMAT_MIME[outputFormat.value] === selectedFileMime.value
})

const canConvert = computed(() =>
  selectedFile.value !== null && !isConverting.value
)

const isOutputSvg = computed(() => outputFormat.value === 'svg')
const isOutputJpeg = computed(() => outputFormat.value === 'jpeg')
const isInputRaster = computed(() => selectedFileMime.value !== 'image/svg+xml' && selectedFileMime.value !== '')

const originalSizeLabel = computed(() => {
  if (!selectedFile.value) return ''
  return formatBytes(selectedFile.value.size)
})

// SVG コピーボタン用サイズ表記
const svgSourceSizeLabel = computed(() => {
  if (!result.value?.svgSource) return ''
  const bytes = new TextEncoder().encode(result.value.svgSource).length
  return formatBytes(bytes)
})

// ファビコン用コードのサイズ表記（Base64 後の link タグ全体）
const faviconCodeSizeLabel = computed(() => {
  if (!result.value?.svgSource) return ''
  // Base64 後サイズ: UTF-8 バイト数 × 4/3（切り上げ）＋ link タグの固定部分
  const svgBytes = new TextEncoder().encode(result.value.svgSource).length
  const base64Len = Math.ceil(svgBytes / 3) * 4
  // `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,">` = 72 文字
  const total = base64Len + 72
  return formatBytes(total)
})

// ============================================================
// ファイル選択
// ============================================================

const fileInput = ref<HTMLInputElement | null>(null)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!SUPPORTED_INPUT_MIME.includes(file.type)) {
    errorMessage.value = '対応していないファイル形式です。'
    selectedFile.value = null
    selectedFileMime.value = ''
    originalPreviewUrl.value = ''
    result.value = null
    return
  }

  if (file.size > MAX_FILE_SIZE) {
    errorMessage.value = `ファイルサイズが大きすぎます（上限 ${formatBytes(MAX_FILE_SIZE)}）。`
    selectedFile.value = null
    selectedFileMime.value = ''
    originalPreviewUrl.value = ''
    result.value = null
    return
  }

  errorMessage.value = ''
  result.value = null
  selectedFile.value = file
  selectedFileMime.value = file.type

  // 変換前プレビュー
  if (originalPreviewUrl.value) URL.revokeObjectURL(originalPreviewUrl.value)
  originalPreviewUrl.value = URL.createObjectURL(file)

  // GIF アニメーション判定（簡易）
  hasAnimation.value = file.type === 'image/gif'

  // 変換先を利用可能なものにリセット
  const opts = OUTPUT_OPTIONS_MAP[file.type] ?? ['png']
  if (!opts.includes(outputFormat.value)) {
    outputFormat.value = opts[0]
  }
}

// outputFormat が変わったらエラーをクリア
watch(outputFormat, () => {
  errorMessage.value = ''
})

// ============================================================
// 変換処理
// ============================================================

async function convert() {
  if (!selectedFile.value) return
  if (isConverting.value) return

  errorMessage.value = ''
  result.value = null
  isConverting.value = true
  selectedFrameIndices.value = new Set()

  try {
    const file = selectedFile.value
    const fmt  = outputFormat.value

    // 同一フォーマットの場合はそのままダウンロード用に設定
    if (isSameFormat.value) {
      const dataUrl = await fileToDataUrl(file)
      // GIF 同一フォーマット → フレーム分解してそれぞれ PNG で返す
      if (file.type === 'image/gif') {
        const frames = await extractGifFrames(file)
        result.value = {
          dataUrl,
          svgSource: '',
          fileName: buildFileName(file.name, fmt),
          format: fmt,
          mimeType: FORMAT_MIME[fmt],
          sizeBytes: file.size,
          gifFrames: frames,
        }
        return
      }
      result.value = {
        dataUrl,
        svgSource: file.type === 'image/svg+xml' ? await file.text() : '',
        fileName: buildFileName(file.name, fmt),
        format: fmt,
        mimeType: FORMAT_MIME[fmt],
        sizeBytes: file.size,
        gifFrames: [],
      }
      return
    }

    // SVG → ラスター
    if (file.type === 'image/svg+xml') {
      result.value = await convertSvgToRaster(file, fmt)
      return
    }

    // ラスター → SVG（ベクター化）
    if (fmt === 'svg') {
      result.value = await convertRasterToSvg(file)
      return
    }

    // ラスター → ラスター（GIF 入力の場合はフレーム分解も行う）
    if (file.type === 'image/gif') {
      const base = await convertRasterToRaster(file, fmt)
      const frames = await extractGifFrames(file, fmt)
      result.value = { ...base, gifFrames: frames }
      return
    }

    // ラスター → ラスター
    result.value = await convertRasterToRaster(file, fmt)

  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : '変換中にエラーが発生しました。'
  } finally {
    isConverting.value = false
  }
}

// ============================================================
// 変換ロジック
// ============================================================

/** ラスター → ラスター（Canvas 経由） */
async function convertRasterToRaster(file: File, fmt: OutputFormat): Promise<ConversionResult> {
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width  = img.naturalWidth  || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')!

  if (fmt === 'jpeg') {
    // JPEG は透過非対応 → 背景を白（または指定色）で塗りつぶす
    ctx.fillStyle = jpegBgColor.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.drawImage(img, 0, 0)

  const mime = FORMAT_MIME[fmt]
  const dataUrl = canvas.toDataURL(mime, fmt === 'jpeg' ? 0.92 : undefined)
  const sizeBytes = dataUrlToBytes(dataUrl)

  return {
    dataUrl,
    svgSource: '',
    fileName: buildFileName(file.name, fmt),
    format: fmt,
    mimeType: mime,
    sizeBytes,
    gifFrames: [],
  }
}

/** SVG → ラスター（SVG を img タグで描画） */
async function convertSvgToRaster(file: File, fmt: OutputFormat): Promise<ConversionResult> {
  const svgText = await file.text()
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })
  const svgUrl  = URL.createObjectURL(svgBlob)

  try {
    const img = await loadImageFromUrl(svgUrl)
    const canvas = document.createElement('canvas')

    // SVG の intrinsic サイズを取得（指定なし時は 300×150）
    const w = img.naturalWidth  || img.width  || 300
    const h = img.naturalHeight || img.height || 150
    canvas.width  = w
    canvas.height = h

    const ctx = canvas.getContext('2d')!
    if (fmt === 'jpeg') {
      ctx.fillStyle = jpegBgColor.value
      ctx.fillRect(0, 0, w, h)
    }
    ctx.drawImage(img, 0, 0, w, h)

    const mime    = FORMAT_MIME[fmt]
    const dataUrl = canvas.toDataURL(mime, fmt === 'jpeg' ? 0.92 : undefined)
    const sizeBytes = dataUrlToBytes(dataUrl)

    return {
      dataUrl,
      svgSource: '',
      fileName: buildFileName(file.name, fmt),
      format: fmt,
      mimeType: mime,
      sizeBytes,
      gifFrames: [],
    }
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}

/** ラスター → SVG（imagetracerjs によるベクター化） */
async function convertRasterToSvg(file: File): Promise<ConversionResult> {
  // Canvas に描画して ImageData を取得
  const img = await loadImage(file)
  const canvas = document.createElement('canvas')
  canvas.width  = img.naturalWidth  || img.width
  canvas.height = img.naturalHeight || img.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

  // imagetracerjs に渡す形式に変換（{ width, height, data }）
  const imgd = {
    width:  imageData.width,
    height: imageData.height,
    data:   imageData.data,
  }

  // ベクター化オプション（輪郭重視の設定）
  const options = {
    numberofcolors: 16,
    colorsampling:  2,
    pathomit:       4,
    ltres:          1,
    qtres:          1,
    scale:          1,
    desc:           false,
  }

  const svgSource: string = ImageTracer.imagedataToSVG(imgd, options)

  if (!svgSource || svgSource.trim() === '') {
    throw new Error('SVG への変換に失敗しました。')
  }

  const svgBlob = new Blob([svgSource], { type: 'image/svg+xml' })
  const dataUrl = await blobToDataUrl(svgBlob)
  const sizeBytes = new TextEncoder().encode(svgSource).length

  return {
    dataUrl,
    svgSource,
    fileName: buildFileName(file.name, 'svg'),
    format: 'svg',
    mimeType: 'image/svg+xml',
    sizeBytes,
    gifFrames: [],
  }
}

// ============================================================
// ダウンロード
// ============================================================

function download() {
  if (!result.value) return
  const a = document.createElement('a')
  a.href = result.value.dataUrl
  a.download = result.value.fileName
  a.click()
}

function downloadGifFrame(frame: GifFrameResult) {
  const a = document.createElement('a')
  a.href = frame.dataUrl
  a.download = frame.fileName
  a.click()
}

function toggleFrameSelection(index: number) {
  const next = new Set(selectedFrameIndices.value)
  if (next.has(index)) {
    next.delete(index)
  } else {
    next.add(index)
  }
  selectedFrameIndices.value = next
}

function selectAllFrames() {
  if (!result.value) return
  selectedFrameIndices.value = new Set(result.value.gifFrames.map((_, i) => i))
}

function deselectAllFrames() {
  selectedFrameIndices.value = new Set()
}

async function downloadSelectedFrames() {
  if (!result.value) return
  const targets = result.value.gifFrames.filter((_, i) => selectedFrameIndices.value.has(i))
  for (const frame of targets) {
    downloadGifFrame(frame)
    // ブラウザのDL制限を避けるため少し間隔を空ける
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}

// ============================================================
// GIF フレーム分解
// ============================================================

/**
 * GIF ファイルから全フレームを PNG として取り出す。
 * gifuct-js で各フレームのピクセルパッチを取得し、
 * Canvas に合成して DataURL に変換する。
 */
async function extractGifFrames(file: File, fmt: OutputFormat = 'png'): Promise<GifFrameResult[]> {
  const arrayBuffer = await file.arrayBuffer()
  const gif = parseGIF(arrayBuffer)
  const frames = decompressFrames(gif, true)  // true = 全フレームのパッチを展開

  if (!frames || frames.length === 0) return []

  // GIF 論理スクリーンサイズ
  const screenWidth  = gif.lsd.width  as number
  const screenHeight = gif.lsd.height as number

  // 合成用キャンバス（前フレームの残像を保持する）
  const canvas = document.createElement('canvas')
  canvas.width  = screenWidth
  canvas.height = screenHeight
  const ctx = canvas.getContext('2d')!

  // 前フレームの disposalMethod 管理用
  let prevDisposal = 0
  let prevFrameCanvas: HTMLCanvasElement | null = null

  const baseName = file.name.replace(/\.[^.]+$/, '')
  const ext      = FORMAT_EXT[fmt]
  const mime     = FORMAT_MIME[fmt]
  const pad      = String(frames.length).length  // ゼロパディング桁数

  const results: GifFrameResult[] = []

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i]

    // --- disposalMethod による前フレーム処理 ---
    // 2: 背景色で消去、3: 前の状態に戻す
    if (prevDisposal === 2) {
      ctx.clearRect(0, 0, screenWidth, screenHeight)
    } else if (prevDisposal === 3 && prevFrameCanvas) {
      ctx.clearRect(0, 0, screenWidth, screenHeight)
      ctx.drawImage(prevFrameCanvas, 0, 0)
    }
    prevDisposal = frame.disposalType ?? 0

    // 次フレームの "前状態に戻す" 用にスナップショット
    if (prevDisposal === 3) {
      prevFrameCanvas = document.createElement('canvas')
      prevFrameCanvas.width  = screenWidth
      prevFrameCanvas.height = screenHeight
      prevFrameCanvas.getContext('2d')!.drawImage(canvas, 0, 0)
    } else {
      prevFrameCanvas = null
    }

    // フレームのピクセルパッチを ImageData に変換して描画
    const patchData = new Uint8ClampedArray(frame.patch)
    const imgData   = new ImageData(patchData, frame.dims.width, frame.dims.height)
    ctx.putImageData(imgData, frame.dims.left, frame.dims.top)

    // PNG / JPEG / WebP として DataURL に変換
    let dataUrl: string
    if (fmt === 'jpeg') {
      // JPEG は透過非対応 → 一時 canvas に白背景で合成
      const tmpCanvas = document.createElement('canvas')
      tmpCanvas.width  = screenWidth
      tmpCanvas.height = screenHeight
      const tmpCtx = tmpCanvas.getContext('2d')!
      tmpCtx.fillStyle = jpegBgColor.value
      tmpCtx.fillRect(0, 0, screenWidth, screenHeight)
      tmpCtx.drawImage(canvas, 0, 0)
      dataUrl = tmpCanvas.toDataURL(mime, 0.92)
    } else {
      dataUrl = canvas.toDataURL(mime)
    }

    const frameNum = String(i + 1).padStart(pad, '0')
    results.push({
      dataUrl,
      fileName: `${baseName}_frame${frameNum}.${ext}`,
    })
  }

  return results
}

// ============================================================
// SVG コピー機能
// ============================================================

async function copySvgSource() {
  if (!result.value?.svgSource) return
  await navigator.clipboard.writeText(result.value.svgSource)
  copiedSvgSource.value = true
  setTimeout(() => { copiedSvgSource.value = false }, 2000)
}

async function copyFaviconCode() {
  if (!result.value?.svgSource) return
  // UTF-8 バイト列を正確に Base64 エンコード（大サイズでもスタック安全）
  const encoder = new TextEncoder()
  const bytes   = encoder.encode(result.value.svgSource)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  const base64  = btoa(binary)
  const linkTag = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${base64}">`
  await navigator.clipboard.writeText(linkTag)
  copiedFavicon.value = true
  setTimeout(() => { copiedFavicon.value = false }, 2000)
}

// ============================================================
// ユーティリティ
// ============================================================

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('画像の読み込みに失敗しました。')) }
    img.src = url
  })
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error('SVG の読み込みに失敗しました。'))
    img.src = url
  })
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました。'))
    reader.readAsDataURL(file)
  })
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Blob の読み込みに失敗しました。'))
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? ''
  return Math.round((base64.length * 3) / 4)
}

function buildFileName(originalName: string, fmt: OutputFormat): string {
  const withoutExt = originalName.replace(/\.[^.]+$/, '')
  return `${withoutExt}.${FORMAT_EXT[fmt]}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="page-wrapper">
    <!-- タイトル -->
    <div class="page-title-block">
      <h1 class="page-title">画像変換</h1>
      <p class="page-subtitle">画像フォーマットを変換します。SVG 変換時はベクター化処理を行います。</p>
    </div>

    <!-- ① ファイル選択 -->
    <div class="card">
      <p class="section-label">変換元ファイル</p>

      <label class="file-drop-label" :class="{ 'has-file': selectedFile }">
        <input
          ref="fileInput"
          class="file-input-hidden"
          type="file"
          :accept="ACCEPT_ATTR"
          @change="onFileChange"
          aria-label="変換元の画像ファイルを選択"
        />
        <span class="file-drop-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="1.5"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </span>
        <span v-if="selectedFile" class="file-drop-name">{{ selectedFile.name }}</span>
        <span v-else class="file-drop-placeholder">クリックして画像を選択</span>
        <span v-if="selectedFile" class="file-drop-size">{{ originalSizeLabel }}</span>
      </label>

      <!-- 選択ファイルのプレビュー -->
      <div v-if="originalPreviewUrl" class="input-preview-frame">
        <img
          :src="originalPreviewUrl"
          class="input-preview-img"
          alt="選択した画像のプレビュー"
        />
      </div>
    </div>

    <!-- ② 変換先選択 -->
    <div class="card" style="margin-top: var(--space-4)">
      <p class="section-label">変換先フォーマット</p>

      <div class="format-row">
        <select
          class="form-input format-select"
          v-model="outputFormat"
          :disabled="!selectedFile"
          aria-label="変換先フォーマットを選択"
        >
          <option
            v-for="fmt in availableOutputFormats"
            :key="fmt"
            :value="fmt"
          >{{ FORMAT_LABEL[fmt] }}</option>
        </select>

        <span v-if="isSameFormat" class="same-format-note">
          変換元と同じフォーマットです（そのままダウンロードされます）
        </span>
      </div>

      <!-- アニメーション警告 -->
      <p v-if="hasAnimation && outputFormat !== 'gif'" class="warning-note">
        アニメーション GIF は静止画として変換されます（最初のフレームのみ）。
      </p>

      <!-- JPEG 背景色 -->
      <div v-if="isOutputJpeg" class="jpeg-bg-row">
        <label class="form-label jpeg-bg-label" for="jpeg-bg">透過部分の背景色</label>
        <input
          id="jpeg-bg"
          type="color"
          class="color-input"
          v-model="jpegBgColor"
          aria-label="JPEG 変換時の背景色"
        />
        <span class="jpeg-bg-hint">（JPEG は透過非対応のため、透過部分に背景色を適用します）</span>
      </div>

      <!-- SVG 変換注意 -->
      <p v-if="isOutputSvg && isInputRaster" class="svg-note">
        ラスター画像からSVGへの変換はベクター化処理を行います。写真など複雑な画像は完全な再現が難しい場合があります。
      </p>

      <!-- 変換ボタン -->
      <div class="action-row" style="margin-top: var(--space-5)">
        <button
          class="btn-primary"
          type="button"
          :disabled="!canConvert"
          @click="convert"
        >
          <svg v-if="isConverting" class="spin-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
               viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
          </svg>
          {{ isConverting ? '変換中...' : '変換' }}
        </button>
      </div>

      <!-- エラー表示 -->
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
    </div>

    <!-- ③ 変換結果 -->
    <div v-if="result" class="card result-card">
      <p class="section-label">変換結果</p>

      <!-- プレビュー比較 -->
      <div class="preview-compare">
        <!-- 変換前 -->
        <div class="preview-block">
          <p class="preview-label">変換前</p>
          <div class="preview-frame">
            <img
              :src="originalPreviewUrl"
              class="preview-img"
              alt="変換前の画像"
            />
          </div>
          <p class="preview-meta">{{ selectedFile?.name }}</p>
          <p class="preview-meta">{{ originalSizeLabel }}</p>
        </div>

        <!-- 矢印 -->
        <div class="preview-arrow" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>

        <!-- 変換後 -->
        <div class="preview-block">
          <p class="preview-label">変換後</p>
          <div class="preview-frame">
            <img
              :src="result.dataUrl"
              class="preview-img"
              :alt="`${FORMAT_LABEL[result.format]} に変換後の画像`"
            />
          </div>
          <p class="preview-meta">{{ result.fileName }}</p>
          <p class="preview-meta">{{ formatBytes(result.sizeBytes) }}</p>
        </div>
      </div>

      <!-- アクションボタン群 -->
      <div class="result-actions">
        <!-- ダウンロード -->
        <button class="btn-primary" type="button" @click="download">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          ダウンロード
        </button>

        <!-- SVG 専用ボタン -->
        <template v-if="result.format === 'svg'">
          <button
            class="btn-secondary"
            :class="{ copied: copiedSvgSource }"
            type="button"
            @click="copySvgSource"
          >
            <svg v-if="!copiedSvgSource" xmlns="http://www.w3.org/2000/svg" width="15" height="15"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ copiedSvgSource ? 'コピーしました' : `SVGコードをコピー (${svgSourceSizeLabel})` }}
          </button>

          <button
            class="btn-secondary"
            :class="{ copied: copiedFavicon }"
            type="button"
            @click="copyFaviconCode"
          >
            <svg v-if="!copiedFavicon" xmlns="http://www.w3.org/2000/svg" width="15" height="15"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15"
                 viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ copiedFavicon ? 'コピーしました' : `ファビコン用コードをコピー (${faviconCodeSizeLabel})` }}
          </button>
        </template>
      </div>

      <!-- SVG ソースプレビュー -->
      <div v-if="result.format === 'svg' && result.svgSource" class="svg-source-block">
        <p class="section-label" style="margin-bottom: var(--space-2)">SVG ソースコード</p>
        <textarea
          class="svg-source-textarea"
          :value="result.svgSource"
          readonly
          rows="8"
          aria-label="SVG ソースコード"
        ></textarea>
      </div>

      <!-- GIF フレーム一覧 -->
      <div v-if="result.gifFrames.length > 0" class="gif-frames-block">
        <!-- ヘッダー行：タイトル・全選択・一括DL -->
        <div class="gif-frames-header">
          <p class="section-label" style="margin-bottom: 0">
            全フレーム（{{ result.gifFrames.length }} フレーム）
          </p>
          <div class="gif-frames-controls">
            <button class="btn-secondary gif-ctrl-btn" type="button" @click="selectAllFrames">全選択</button>
            <button class="btn-secondary gif-ctrl-btn" type="button" @click="deselectAllFrames">全解除</button>
            <button
              class="btn-primary gif-ctrl-btn"
              type="button"
              :disabled="selectedFrameIndices.size === 0"
              @click="downloadSelectedFrames"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              選択した {{ selectedFrameIndices.size }} 枚をダウンロード
            </button>
          </div>
        </div>

        <!-- フレームグリッド -->
        <div class="gif-frames-grid">
          <label
            v-for="(frame, index) in result.gifFrames"
            :key="index"
            class="gif-frame-item"
            :class="{ selected: selectedFrameIndices.has(index) }"
          >
            <input
              type="checkbox"
              class="gif-frame-checkbox"
              :checked="selectedFrameIndices.has(index)"
              @change="toggleFrameSelection(index)"
              :aria-label="`フレーム ${index + 1} を選択`"
            />
            <div class="gif-frame-preview">
              <img :src="frame.dataUrl" :alt="`フレーム ${index + 1}`" class="gif-frame-img" />
            </div>
            <p class="gif-frame-name">{{ frame.fileName }}</p>
          </label>
        </div>
      </div>
    </div>

    <!-- 仕様セクション -->
    <div class="spec-section">
      <p class="spec-title">仕様・注意事項</p>
      <div class="spec-item">
        <span class="spec-item-label">変換処理</span>
        <p>すべての変換処理はブラウザ内で完結します。画像ファイルは外部サーバーへ送信されません。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">ラスター → SVG</span>
        <p>imagetracerjs によるベクター化処理を行います。ロゴやアイコンなど輪郭が明確な画像に適しています。写真など複雑な画像は元画像と見た目が異なる場合があります。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">GIF アニメーション</span>
        <p>アニメーション GIF の全フレームを個別に取り出してダウンロードできます。GIF 以外の形式への変換時は最初のフレームのみ静止画として変換されます。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">JPEG の透過</span>
        <p>JPEG は透過に対応しないため、透過部分は指定した背景色（初期値：白）で塗りつぶされます。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">ファビコン用コード</span>
        <p>SVGデータをBase64エンコードしたData URIをhref属性に直接埋め込んだlinkタグをコピーします。外部SVGファイルへのパス参照は行いません。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">ファイルサイズ上限</span>
        <p>{{ formatBytes(MAX_FILE_SIZE) }} を超えるファイルは処理できません。</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ============================================================
   ファイル選択エリア
   ============================================================ */
.file-drop-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  min-height: 120px;
  padding: var(--space-6);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  background-color: var(--color-surface);
  color: var(--color-text-secondary);
  cursor: pointer;
  text-align: center;
  transition: border-color var(--transition-fast), background-color var(--transition-fast), color var(--transition-fast);

  &:hover {
    border-color: var(--color-primary);
    background-color: rgba(88, 166, 255, 0.04);
    color: var(--color-text-primary);
  }

  &.has-file {
    border-style: solid;
    border-color: var(--color-primary);
    background-color: rgba(88, 166, 255, 0.06);
    color: var(--color-text-primary);
  }
}

/* 選択ファイルプレビュー */
.input-preview-frame {
  margin-top: var(--space-4);
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 240px;
  border-radius: var(--radius-md);
  overflow: hidden;
  /* チェッカーボード背景（透過確認用） */
  background-image:
    linear-gradient(45deg, #2a2f38 25%, transparent 25%),
    linear-gradient(-45deg, #2a2f38 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2a2f38 75%),
    linear-gradient(-45deg, transparent 75%, #2a2f38 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}

.input-preview-img {
  max-width: 100%;
  max-height: 240px;
  object-fit: contain;
  display: block;
}

.file-input-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.file-drop-icon {
  color: var(--color-text-muted);
  .has-file & {
    color: var(--color-primary);
  }
}

.file-drop-name {
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-text-primary);
  word-break: break-all;
}

.file-drop-placeholder {
  font-size: 0.9375rem;
  color: var(--color-text-muted);
}

.file-drop-size {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* ============================================================
   変換先選択
   ============================================================ */
.format-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.format-select {
  width: auto;
  min-width: 140px;
}

.same-format-note {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.warning-note {
  margin-top: var(--space-3);
  font-size: 0.8125rem;
  color: var(--color-warning);
}

.svg-note {
  margin-top: var(--space-3);
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* JPEG 背景色 */
.jpeg-bg-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.jpeg-bg-label {
  margin-bottom: 0;
  white-space: nowrap;
}

.color-input {
  width: 40px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  padding: 2px;
}

.jpeg-bg-hint {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

/* ============================================================
   アクションボタン行
   ============================================================ */
.action-row {
  display: flex;
  justify-content: flex-start;
}

/* ============================================================
   エラーメッセージ
   ============================================================ */
.error-message {
  margin-top: var(--space-3);
  font-size: 0.875rem;
  color: var(--color-error);
}

/* ============================================================
   結果カード
   ============================================================ */
.result-card {
  margin-top: var(--space-4);
}

/* プレビュー比較 */
.preview-compare {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-5);
}

.preview-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.preview-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.preview-frame {
  width: 100%;
  min-height: 120px;
  max-height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;

  /* チェッカーボード背景（透過確認用） */
  background-image:
    linear-gradient(45deg, #2a2f38 25%, transparent 25%),
    linear-gradient(-45deg, #2a2f38 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2a2f38 75%),
    linear-gradient(-45deg, transparent 75%, #2a2f38 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}

.preview-img {
  max-width: 100%;
  max-height: 280px;
  object-fit: contain;
  display: block;
}

.preview-meta {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  word-break: break-all;
}

.preview-arrow {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

/* アクションボタン群 */
.result-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-5);

  .btn-secondary.copied {
    background-color: rgba(63, 185, 80, 0.12);
    border-color: var(--color-success);
    color: var(--color-success);
  }
}

/* SVG ソースプレビュー */
.svg-source-block {
  margin-top: var(--space-2);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
}

.svg-source-textarea {
  display: block;
  width: 100%;
  padding: var(--space-3);
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  resize: vertical;
  outline: none;
  line-height: 1.5;
  word-break: break-all;
  transition: border-color var(--transition-fast);

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
  }
}

/* ============================================================
   GIF フレーム一覧
   ============================================================ */
/* ============================================================
   GIF フレーム一覧
   ============================================================ */
.gif-frames-block {
  margin-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-4);
}

.gif-frames-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.gif-frames-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-left: auto;
}

.gif-ctrl-btn {
  padding: var(--space-1) var(--space-3);
  font-size: 0.8125rem;
}

.gif-frames-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--space-3);
}

.gif-frame-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
  cursor: pointer;
  border-radius: var(--radius-md);
  padding: var(--space-1);
  border: 2px solid transparent;
  transition: border-color var(--transition-fast), background-color var(--transition-fast);

  &:hover {
    background-color: var(--color-elevated);
  }

  &.selected {
    border-color: var(--color-primary);
    background-color: rgba(88, 166, 255, 0.06);
  }
}

.gif-frame-checkbox {
  width: 15px;
  height: 15px;
  accent-color: var(--color-primary);
  cursor: pointer;
  align-self: flex-end;
  flex-shrink: 0;
}

.gif-frame-preview {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  /* チェッカーボード背景（透過確認用） */
  background-image:
    linear-gradient(45deg, #2a2f38 25%, transparent 25%),
    linear-gradient(-45deg, #2a2f38 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #2a2f38 75%),
    linear-gradient(-45deg, transparent 75%, #2a2f38 75%);
  background-size: 12px 12px;
  background-position: 0 0, 0 6px, 6px -6px, -6px 0px;
}

.gif-frame-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.gif-frame-name {
  font-size: 0.6875rem;
  color: var(--color-text-muted);
  text-align: center;
  word-break: break-all;
  line-height: 1.3;
}

@media screen and (max-width: 768px) {
  .gif-frames-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .gif-frames-controls {
    margin-left: 0;
    width: 100%;
  }
}

/* ============================================================
   スピンアニメーション（処理中）
   ============================================================ */
.spin-icon {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* ============================================================
   レスポンシブ
   ============================================================ */
@media screen and (max-width: 768px) {
  .preview-compare {
    grid-template-columns: 1fr;
  }

  .preview-arrow {
    display: flex;
    justify-content: center;

    svg {
      transform: rotate(90deg);
    }
  }

  .result-actions {
    flex-direction: column;

    .btn-primary,
    .btn-secondary {
      width: 100%;
      justify-content: center;
    }
  }
}
</style>
