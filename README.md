# Node.js がインストールされているか確認
```
node -v
```
```
npm -v
```

# viteプロジェクトを作成(※小文字・英数字・ハイフン推奨)
```
npm create vite@latest 任意のプロジェクト名
```

# 以下、対話形式の選択ログ
## ① 一時的にcreate-vite パッケージを一時的にインストールしてプロジェクトを作成
```
Need to install the following packages:
create-vite@7.1.1
Ok to proceed? (y)

翻訳：
以下のパッケージをインストールする必要があります:
create-vite@7.1.1
```
`y`を選択

## ② プロジェクト名を決定。
```
> npx
> create-vite WebTool

|
*  Package name:
|  プロジェクト名
—
```
変更ないならそのままでOK。
プロジェクト名の変更方法は知らん。ESCキー押して①からやり直せば多分OK

# ③フレームワーク選択。
```
> npx
> create-vite webtool

|
*  Select a framework:
|    Vanilla
|  > Vue
|    React
|    Preact
|    Lit
|    Svelte
|    Solid
|    Qwik
|    Angular
|    Marko
|    Others
—
```
今回はVueを選択。細かい説明は以下。

<table>
  <tr>
    <th>1.Vanilla</th>
    <td>
    ・プレーンな HTML / JS / CSS プロジェクト用</br>
    ・特定のフレームワークなしで Vite の高速ビルドを体験できる</br>
    ・小規模ツールや試作に向く</br>
    </td>
  </tr>

  <tr>
    <th>2.Vue</th>
    <td>
    ・Vue.js（リアクティブUIフレームワーク）</br>
    ・シンプルで学習コストが低く、公式エコシステムが充実</br>
    ・小規模〜中規模アプリ、個人開発でも人気</br>
    </td>
  </tr>

  <tr>
    <th>3.React</th>
    <td>
    ・Facebook 発祥の UI ライブラリ</br>
    ・世界で最も利用されているフロントエンドライブラリ</br>
    ・コンポーネント指向で巨大なエコシステムがある</br>
    ・中〜大規模開発向け</br>
    </td>
  </tr>
  
  <tr>
    <th>4.Lit</th>
    <td>
    ・React の軽量版（互換 API あり</br>
    ・React より高速・小さいバンドルサイズ</br>
    ・バイルやパフォーマンス重視のプロジェクトに向く</br>
    </td>
  </tr>

  <tr>
    <th>5.Lit</th>
    <td>
    ・Web Components ベースの軽量ライブラリ（Google製）</br>
    ・ネイティブなブラウザ技術を活用</br>
    ・小規模なウィジェットや Web コンポーネント再利用に強い</br>
    </td>
  </tr>

  
  <tr>
    <th>6.Svelte</th>
    <td>
    ・新世代フレームワーク、コンパイル時に最適化される</br>
    ・ランタイムが軽い & コードが直感的で短く書ける</br>
    ・小規模〜中規模アプリ、学習コスト低めで人気急上昇</br>
    </td>
  </tr>
  
  <tr>
    <th>7. Solid</th>
    <td>
    ・React ライクだけど、リアクティブ性は Vue に近い</br>
    ・高速・小さい・宣言的で、パフォーマンスに強い</br>
    ・次世代の軽量フレームワークの一つ</br>
    </td>
  </tr>
  
  <tr>
    <th>8. Qwik</th>
    <td>
    ・SSR（サーバーサイドレンダリング）や遅延ロードに特化</br>
    ・初期表示が爆速</br>
    ・まだ新しめのフレームワーク</br>
    </td>
  </tr>

  <tr>
    <th>9. Angular</th>
    <td>
    ・Google 製のフルスタックフレームワーク</br>
    ・大規模開発や企業向けに人気</br>
    ・TypeScript が前提、学習コストは高め</br>
    </td>
  </tr>

  <tr>
    <th>10. Marko</th>
    <td>
    ・eBay 製のフレームワーク</br>
    ・SSR 特化型</br>
    ・国内利用例は少なめ</br>
    </td>
  </tr>

  <tr>
    <th>11. Others</th>
    <td>
    ・上記以外のテンプレートや、コミュニティが作ったスターターを使う場合</br>
    </td>
  </tr>

  <tr>
    <th>まとめ</th>
    <td>
    ・初学者・個人開発 → Vue / Svelte</br>
    ・世界で一番使われているものを学びたい → React</br>
    ・軽量・速さ重視 → Preact / Solid</br>
    ・企業や大規模システム志向 → Angular</br>
    ・新技術に挑戦 → Qwik / Lit</br>
    </td>
  </tr>
<table>

# ④言語選択

```
> npx
> create-vite webtool

|
o  Select a framework:
|  Vue
|
*  Select a variant:
|  > TypeScript
|    JavaScript
|    Official Vue Starter ↗
|    Nuxt ↗
—
```
もちろんTypeScriptを選択

以下みたいな感じのコマンドになっていればOK
```
C:\workspace\00_Vue>npm create vite@latest webtool

> npx
> create-vite webtool

|
o  Select a framework:
|  Vue
|
o  Select a variant:
|  TypeScript
|
o  Scaffolding project in C:\workspace\00_Vue\webtool...
|
—  Done. Now run:

  cd webtool
  npm install
  npm run dev
```
# ページ遷移を使うもの用
```
npm install vue-router
```
ルーターを設置
そのあとrouterフォルダとindex.tsを作成
```
import { createRouter, createWebHistory } from 'vue-router'
import Top from '../pages/Top.vue'
import Pass from '../pages/CreatePass.vue'
import Hash from '../pages/ChangeHash.vue'

const routes = [
  { path: '/', component: Top }, //ページを追加するたびにimportと一緒に追加する
  { path: '/create_pass', component: Pass },
  { path: '/change_hash', component: Hash },
]

const base = (import.meta.env.MODE === 'production') ? '/Githubのリポジトリ名/' : '/'
const router = createRouter({
  history: createWebHistory(base),
  routes,
})

export default router
```
main.tsで以下を追加
import router from './router/index.ts'

# SCSSが使いたい場合以下を実行
```
npm install -D sass-embedded
```

# ついでにページテンプレ
```
<script setup lang="ts">
</script>
<!-- SCSSのmainとtitleとpage-titleの中身はstyle.cssに入っている -->
<template>
  <div class="title">
    <h1 class="page-title">TOP</h1>
  </div>
  <div class="main">

    <div class="info">
      <h1>仕様</h1>
      <p></p>
    </br>
      <h3 class="info-h3"></h3>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  li {
    list-style: none;
  }
}

@media screen and (max-width: 768px) {

}
</style>
```
SCSSのmainとtitleの中身はstyle.cssに入っている
内容は以下
```
:root {
  font-family: system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: #ffffffde;
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.main {
  display: flex;
  justify-content: center;
  justify-content: flex-start;
  flex-direction: column;
  background-color: #141414;
  margin: 20px 10px;

  width: 96%;
  height: 100%;
}

.info {
  padding: 0px 25px 25px 25px;
  .info-h3 {
    display: inline-block;
    border-bottom: 1px solid #f6ca97;
    margin: 0px;
    padding-bottom: 5px;
  }
}

.title {
  border-bottom: 2px solid #f6ca97;
  color:#ff0051;
  display: inline-block;
  margin: 20px;
  height: 55px;

  .page-title {
    margin: 0px 15px;
  }
}
@media screen and (max-width: 768px) {
  .title {
    display: block;
    position: absolute;
    margin: 0px;
    top: 35px;
    left: 20px;

    border: none;
    color:#ff0051;

    .page-title {
      margin: 0px 15px;
    }
  }
}

#app {
  max-width: 1280px;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #ffffff;
    background-color: #333333;
  }
}
```

# 簡易デバッグテクニック
変数の中身を見たいときは以下をテンプレートタグで囲まれた範囲の中にいれておけばOK
```
  <section style="background-color: white; color: black;">
  変数名：{{ ここに見たい変数 }}
  </section>
```
