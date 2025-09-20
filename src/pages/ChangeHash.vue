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
<!-- SCSSのmainとtitleの中身はstyle.cssに入っている -->
<template>
  <div class="title">
    <h1 class="page-title">ハッシュ化ツール</h1>
  </div>
  <div class="main">
    <div class="main-hash">
      <input class="main-input" v-model="hashInput" type="text" placeholder="Hash化したい文字を入力"></br>
    </div>

    <div class="button">
      <span class="button-span" @click="ChangeHash">ハッシュ化</span>
    </div>

    <div class="create-hash">
      <ul class="hash-ul" v-for="(value, key) in hashResult">
        <li class="hash-li">
          <p>{{ key }}</p>
          <textarea class="result-hash" :value="`${value}`" readonly></textarea>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  .main-hash {
    padding: 20px 0px 0px 0px;
    text-align: center;
    .main-input {
      padding: 10px 0px;
    }
  }

  .button {
    padding: 40px 0px;
    text-align: center;
    .button-span {
      padding: 10px;
      border: 1px solid #777;
      background-color: #0a0a44;
      transition: background-color 0.2s ease;
    }
    .button-span:hover {
      background-color: hsl(240, 74%, 40%);
    }
  }

  .create-hash {
    text-align: center;
    padding: 40px 0px;
    .hash-ul {
      list-style: none;
      display: inline-block;
      .hash-li {
        .result-hash {
          resize: none;
          width: 250px;
          height: 50px;
        }
      }
    }
  }
}

@media screen and (max-width: 768px) {

}
</style>