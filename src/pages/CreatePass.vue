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
  <div class="title">
    <h1 class="page-title">パスワード作成</h1>
  </div>
  <div class="main">

    <div class="option">
      <ul class="option-ul">
        <li class="option-li">
          <input class="input-number"
          type="number"
          inputmode="numeric"
          name=""
          v-model="isUse.numericChar"
          min="1"
          max="30"
          autocomplete="off"
          />
          <span class="option-span">文字数</span>
        </li>

        <li class="option-li">
          <input class="input-checkbox" type="checkbox" v-model="isUse.useLower">
          <span class="option-span">英小文字</span>
        </li>

        <li class="option-li">
          <input class="input-checkbox" type="checkbox" v-model="isUse.useUpper">
          <span class="option-span">英大文字</span>
        </li>

        <li class="option-li">
          <input class="input-checkbox" type="checkbox" v-model="isUse.useNumber">
          <span class="option-span">数字</span>
        </li>

        <li class="option-li">
          <input class="input-checkbox" type="checkbox" v-model="isUse.useSymbol">
          <span class="option-span">記号</span>
        </li>
      </ul>
    </div>

    <div class="create-button">
      <span class="create-span" @click="createPassWords">生成</span>
    </div>

    <div class="passwords">
      <ul class="passwords-ul">
        <li class="passwords-li">
          <textarea class="passwords-textarea" v-for="values in passwords" :value="`${values}`"></textarea>
        </li>
      </ul>
    </div>

    <div class="info">
      <h1>仕様</h1>
      <p>最大で{{SETTING.MAX_LENGTH}}文字、最小で{{ SETTING.MIN_LENGHT }}文字のパスワードを作成します。</p>
      <p>英大文字、英子文字、記号のいずれかにチェックを入れると必ず1文字は含めたパスワードを{{ SETTING.MAX_CREATE }}個作成します。</p>
    </br>
      <h3 class="info-h3">英小文字</h3>
      <p>{{ SETTING_STRING.LOWER }}</p>
      <h3 class="info-h3">英大文字</h3>
      <p>{{ SETTING_STRING.UPPER }}</p>
      <h3 class="info-h3">数字</h3>
      <p>{{ SETTING_STRING.NUMBER }}</p>
      <h3 class="info-h3">記号</h3>
      <p>{{ SETTING_STRING.SYMBOL }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  ul {
    list-style: none; 
  }

  .option {
    display: flex;
    justify-content: center;
    padding: 15px 0px;

    width: auto;
    height: auto;

    .option-ul {
      display: flex;

      .option-li {
        display: flex;
        padding: 0px 15px 0px 0px;
         .option-span {
          font-size: 1.2em;
         }
      }
    }

    .input-number {
      text-align: center;
      margin: 0px 5px 0px 0px;
    }

    .input-checkbox {
      width: 20px;
      height: auto;

      padding: 14px;
    }
  }

  .create-button {
    display: flex;
    justify-content: center;
    padding: 10px 0px;
    .create-span {
      padding: 10px 25px;
      border: 1px solid #777;
      background-color: #0a0a44;
      transition: background-color 0.2s ease;
    }
    .create-span:hover {
      background-color: hsl(240, 74%, 40%);
    }

  }

  .passwords {
    display: flex;
    justify-content: center;

    .passwords-ul {
      padding: 0px 0px 0px 25px;
        .passwords-li {
          .passwords-textarea {
            resize: none;
        }
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .main {
    .option {
      .option-ul {
        flex-direction: column;
        .option-span {
          padding-left: 10px;
        }
      }
    }
  }
}
</style>
