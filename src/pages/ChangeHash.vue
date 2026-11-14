<script setup lang="ts">
import { ref, reactive } from 'vue'

const hashTypes = ["SHA-1", "SHA-256", "SHA-384", "SHA-512"] as const;

type HashTypeName = typeof hashTypes[number];

const hashResult = reactive<Record<HashTypeName, string>>({
  "SHA-1": "",
  "SHA-256": "",
  "SHA-384": "",
  "SHA-512": "",
});

const hashInput = ref<string>("");

const ChangeHash = async () => {
  const encoder = new TextEncoder();
  const data = encoder.encode(hashInput.value);

  // ※window.crypto.subtleはhttps または localhost）でのみ使える。
  for (const type of hashTypes) {
    const buffer = await window.crypto.subtle.digest(type, data);
    const hashArray = Array.from(new Uint8Array(buffer));
    hashResult[type] = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}
</script>

<template>
  <div class="page-wrapper">
    <div class="page-title-block">
      <h1 class="page-title">ハッシュ化ツール</h1>
      <p class="page-subtitle">入力した文字列を SHA ハッシュ値に変換します</p>
    </div>

    <!-- 入力カード -->
    <div class="card">
      <label class="form-label" for="hash-input">ハッシュ化したい文字列</label>
      <input
        id="hash-input"
        class="form-input"
        type="text"
        v-model="hashInput"
        placeholder="テキストを入力してください"
        autocomplete="off"
        @keydown.enter="ChangeHash"
      />
      <div class="action-row">
        <button class="btn-primary" type="button" @click="ChangeHash">ハッシュ化</button>
      </div>
    </div>

    <!-- 結果テーブル -->
    <div class="results-block" v-if="hashResult['SHA-256']">
      <p class="section-label" style="margin-top: var(--space-8);">結果</p>
      <div class="hash-table">
        <div class="hash-row" v-for="(value, key) in hashResult" :key="key">
          <span class="hash-type">{{ key }}</span>
          <textarea
            class="hash-value"
            :value="value"
            readonly
            rows="2"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 仕様 -->
    <div class="spec-section">
      <p class="spec-title">仕様</p>
      <div class="spec-item">
        <p>Web Crypto API（<code>window.crypto.subtle</code>）を使用してハッシュ値を計算します。</p>
        <p>HTTPS または localhost 環境でのみ動作します。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">対応アルゴリズム</span>
        <p>{{ hashTypes.join(' / ') }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* 実行ボタン */
.action-row {
  margin-top: var(--space-4);
}

/* 結果エリア */
.results-block {
  margin-top: var(--space-4);
}

.hash-table {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.hash-row {
  display: grid;
  grid-template-columns: 96px 1fr;
  align-items: start;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--color-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.hash-type {
  padding-top: var(--space-1);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-primary-light);
  letter-spacing: 0.03em;
  white-space: nowrap;
}

.hash-value {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  resize: none;
  outline: none;
  line-height: 1.6;
  word-break: break-all;
  transition: border-color var(--transition-fast);

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
  }
}

/* レスポンシブ */
@media screen and (max-width: 768px) {
  .hash-row {
    grid-template-columns: 1fr;
    gap: var(--space-2);
  }

  .hash-type {
    padding-top: 0;
  }
}
</style>
