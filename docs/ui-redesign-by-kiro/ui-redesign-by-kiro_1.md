
# Modern Developer Design Specification

## 1. Design Concept

### Design Direction

**Modern Developer Dashboard / Dark Theme / Blue Accent**

現代的なSaaSアプリケーションと開発者向けツールを組み合わせた、洗練されたダークテーマを採用する。

単純に背景を黒くするのではなく、複数のダークグレーを使い分け、視覚的な階層と奥行きを表現する。

### Design References

以下の製品・デザインの方向性を参考にする。

- Linear: 洗練されたレイアウト、余白、タイポグラフィ
- Visual Studio Code: 開発者向けツールとしての視認性
- Modern SaaS Dashboard: 情報整理、カード、ナビゲーション

既存製品のデザインをそのままコピーせず、WebToolに適した独自のデザインにすること。

## 2. Color System

### Base Colors

| Variable | Color | Usage |
|---|---|---|
| Background | #0D1117 | アプリ全体の背景 |
| Surface | #161B22 | サブ背景 |
| Panel | #1C2128 | カード・パネル |
| Elevated | #222A33 | モーダル・浮遊要素 |
| Border | #30363D | 境界線 |
| Text Primary | #E6EDF3 | メインテキスト |
| Text Secondary | #8B949E | 補助テキスト |
| Text Muted | #6E7681 | 控えめな情報 |

### Accent Colors

| Variable | Color | Usage |
|---|---|---|
| Primary | #58A6FF | メイン操作・リンク |
| Primary Hover | #388BFD | ホバー |
| Primary Active | #1F6FEB | アクティブ |
| Primary Light | #79C0FF | 強調表示 |
| Success | #3FB950 | 成功 |
| Warning | #D29922 | 警告 |
| Error | #F85149 | エラー |

カラーコードは初期案とし、実際のUIやコントラストを確認したうえで調整してよい。

## 3. Layout & Spacing

- 情報密度はBalancedを基本とする
- 要素間に適切な余白を確保する
- 不必要に大きな余白は避ける
- コンテンツの重要度に応じて視覚的な階層を設ける
- ページ全体で余白のルールを統一する
- 既存の画面構成や操作フローを維持する

## 4. Component Design

### Buttons

- Primary: ブルー背景、明るい文字色
- Secondary: ダークグレー背景
- Outline: 控えめなボーダー
- Danger: 赤系
- Hover / Active / Disabledを明確に区別する

### Cards & Panels

- 背景とパネルの明度に適切な差を設ける
- ボーダーは控えめにする
- シャドウは必要な場合のみ使用する
- 角丸は全体で統一する

### Forms

- 入力欄の背景は周囲より少し明るくする
- フォーカス時はブルーのボーダーやリングを使用する
- Placeholderと入力値のコントラストを確保する
- Disabled状態を明確に表現する

### Tables

- ヘッダーとデータ行を視覚的に区別する
- 行間と文字サイズを適切に設定する
- Hover時の背景変化を控えめに設ける
- 情報量と可読性のバランスを保つ

### Navigation

- 現在選択されているページを明確にする
- ブルーを選択状態のアクセントとして使用する
- アイコンとテキストの位置を統一する
- ナビゲーションの操作性を維持する

## 5. Typography

- 基本フォントはInterなどのモダンなサンセリフ体を検討する
- 日本語表示にはNoto Sans JPなどを検討する
- 見出し・本文・補助情報の階層を明確にする
- 数値や技術情報の可読性を重視する
- 極端に小さい文字サイズを避ける

## 6. Visual Effects

- アニメーションは必要最小限にする
- HoverやFocusには自然なトランジションを使用する
- 過度なグラデーションは避ける
- ネオンや強い光彩表現は避ける
- 強いシャドウよりも背景色の差とボーダーで階層を表現する
- 装飾よりも機能性と視認性を優先する

## 7. Design Consistency

- CSS Variablesを利用してカラー・余白・角丸などを共通管理する
- 共通コンポーネントのデザインを統一する
- 同じ役割の要素には同じスタイルを適用する
- ページごとに異なるデザインルールを増やさない
- 既存のCSS構成を尊重しながら保守性を向上させる

## 8. Final Design Goal

最終的に以下の特徴を持つWebToolを目指す。

- Modern
- Professional
- Clean
- Minimal
- Developer-friendly
- Consistent
- Comfortable for long-term use

単なるダークテーマではなく、現代的な開発者向けSaaSアプリケーションのような完成度を目指すこと。