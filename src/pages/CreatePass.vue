<script setup lang="ts">
import { ref, reactive } from 'vue'


interface UseType {
  numericChar?: number;
  useLower: boolean;
  useUpper: boolean;
  useNumber: boolean;
  useSymbol: boolean;
}


const isUse = reactive<UseType>({
  useLower: true,
  useUpper: true,
  useNumber: true,
  useSymbol: true,
});
const passwords = ref<string[]>([]);
const copiedIndex = ref<number | null>(null);

const copyPassword = async (value: string, index: number) => {
  await navigator.clipboard.writeText(value);
  copiedIndex.value = index;
  setTimeout(() => { copiedIndex.value = null; }, 2000);
};


const SETTING = {
  MIN_LENGHT: 6,
  MAX_CREATE: 14,
  MAX_LENGTH: 30,
 } as const;

const SETTING_STRING = {
  LOWER: 'abcdefghijklmnopqrstuvwxyz',
  UPPER: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  NUMBER: '0123456789',
  SYMBOL: '!@#$%^&*',
} as const;


const createpassWordArry = () :string => {
  let howlength: number = SETTING.MIN_LENGHT;
  let stringPool = "";
  let passWordArry: string[] = [];

  if(isUse.numericChar !== undefined) howlength = isUse.numericChar;

  if(isUse.useLower) {
    const lowerString = SETTING_STRING.LOWER;
    passWordArry.push(lowerString[Math.floor(Math.random() * lowerString.length)]);
    stringPool += lowerString;
  }
  if(isUse.useUpper) {
    const upperString = SETTING_STRING.UPPER;
    passWordArry.push(upperString[Math.floor(Math.random() * upperString.length)]);
    stringPool += upperString;
  }
  if(isUse.useNumber) {
    const numberString = SETTING_STRING.NUMBER;
    passWordArry.push(numberString[Math.floor(Math.random() * numberString.length)]);
    stringPool += numberString;
  }
  if(isUse.useSymbol) {
    const symbolString = SETTING_STRING.SYMBOL;
    passWordArry.push(symbolString[Math.floor(Math.random() * symbolString.length)]);
    stringPool += symbolString;
  }

  while(howlength > passWordArry.length) {
    passWordArry.push(stringPool[Math.floor(Math.random() *stringPool.length)]);
  }

  // 配列シャッフル
  for (let i = passWordArry.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passWordArry[i], passWordArry[j]] = [passWordArry[j], passWordArry[i]];
  }
  return passWordArry.join('');
}

const createPassWords = () => {
  if(isUse.useLower === false
  && isUse.useUpper === false
  && isUse.useNumber === false
  && isUse.useSymbol === false) {
    alert("一つ以上チェックを入れてください");
    return;
  }

  if(isUse.numericChar === undefined || isUse.numericChar <= SETTING.MIN_LENGHT) {
    isUse.numericChar = SETTING.MIN_LENGHT;
  }

  if(isUse.numericChar >= SETTING.MAX_LENGTH) {
    isUse.numericChar = SETTING.MAX_LENGTH;
  }

  passwords.value = [];
  for(let i = 0; i < SETTING.MAX_CREATE; i++) {
    passwords.value.push(createpassWordArry());
  }
}
</script>

<template>
  <div class="page-wrapper">
    <div class="page-title-block">
      <h1 class="page-title">パスワード作成</h1>
      <p class="page-subtitle">オプションを選んでランダムなパスワードを生成します</p>
    </div>

    <!-- 設定カード -->
    <div class="card">
      <p class="section-label">オプション</p>

      <div class="options">
        <!-- 文字数 -->
        <div class="option-row">
          <label class="form-label option-label" for="pass-length">文字数</label>
          <input
            id="pass-length"
            class="form-input-number"
            type="number"
            inputmode="numeric"
            v-model="isUse.numericChar"
            min="1"
            max="30"
            autocomplete="off"
          />
        </div>

        <!-- チェックボックス群 -->
        <div class="checkboxes">
          <label class="checkbox-label">
            <input class="form-checkbox" type="checkbox" v-model="isUse.useLower">
            <span>英小文字</span>
          </label>
          <label class="checkbox-label">
            <input class="form-checkbox" type="checkbox" v-model="isUse.useUpper">
            <span>英大文字</span>
          </label>
          <label class="checkbox-label">
            <input class="form-checkbox" type="checkbox" v-model="isUse.useNumber">
            <span>数字</span>
          </label>
          <label class="checkbox-label">
            <input class="form-checkbox" type="checkbox" v-model="isUse.useSymbol">
            <span>記号</span>
          </label>
        </div>
      </div>

      <div class="action-row">
        <button class="btn-primary" type="button" @click="createPassWords">生成する</button>
      </div>
    </div>

    <!-- 結果 -->
    <div class="results-block" v-if="passwords.length > 0">
      <p class="section-label" style="margin-top: var(--space-8);">生成結果 — {{ passwords.length }} 件</p>
      <div class="passwords-grid">
        <div class="password-item" v-for="(value, index) in passwords" :key="index">
          <textarea
            class="password-textarea"
            :value="value"
            rows="1"
          ></textarea>
          <button
            class="copy-btn"
            :class="{ copied: copiedIndex === index }"
            type="button"
            :aria-label="`パスワードをコピー: ${value}`"
            @click="copyPassword(value, index)"
          >
            <span class="copy-icon" aria-hidden="true">
              <!-- コピー前: クリップボードアイコン -->
              <svg v-if="copiedIndex !== index" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <!-- コピー後: チェックアイコン -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- 仕様 -->
    <div class="spec-section">
      <p class="spec-title">仕様</p>
      <div class="spec-item">
        <p>最大 {{ SETTING.MAX_LENGTH }} 文字、最小 {{ SETTING.MIN_LENGHT }} 文字のパスワードを {{ SETTING.MAX_CREATE }} 個生成します。</p>
        <p>チェックしたカテゴリからそれぞれ最低 1 文字が必ず含まれます。</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">英小文字</span>
        <p class="spec-code">{{ SETTING_STRING.LOWER }}</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">英大文字</span>
        <p class="spec-code">{{ SETTING_STRING.UPPER }}</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">数字</span>
        <p class="spec-code">{{ SETTING_STRING.NUMBER }}</p>
      </div>
      <div class="spec-item">
        <span class="spec-item-label">記号</span>
        <p class="spec-code">{{ SETTING_STRING.SYMBOL }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* オプション行 */
.options {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.option-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);

  .option-label {
    margin-bottom: 0;
    white-space: nowrap;
  }
}

/* チェックボックス群 */
.checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: 0.9375rem;
  color: var(--color-text-primary);
  cursor: pointer;
  user-select: none;

  &:hover span {
    color: var(--color-primary-light);
  }
}

/* 生成ボタン */
.action-row {
  margin-top: var(--space-6);
  display: flex;
  justify-content: flex-start;
}

/* 結果グリッド */
.results-block {
  margin-top: var(--space-4);
}

.passwords-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
}

.password-item {
  display: flex;
  gap: var(--space-2);
  align-items: stretch;
}

.password-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  resize: none;
  outline: none;
  line-height: 1.5;
  transition: border-color var(--transition-fast);

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.15);
  }
}

/* コピーボタン */
.copy-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  background-color: var(--color-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background-color var(--transition-fast),
              border-color var(--transition-fast),
              color var(--transition-fast);

  &:hover {
    background-color: var(--color-panel);
    border-color: var(--color-primary);
    color: var(--color-primary-light);
  }

  &.copied {
    background-color: rgba(63, 185, 80, 0.12);
    border-color: var(--color-success);
    color: var(--color-success);
  }
}

/* レスポンシブ */
@media screen and (max-width: 768px) {
  .checkboxes {
    gap: var(--space-3);
  }

  .passwords-grid {
    grid-template-columns: 1fr;
  }
}
</style>
