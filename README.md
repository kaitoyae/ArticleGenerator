# Dialogue Article Generator

長文の文字起こし（インタビュー・対談ログなど）から、2人対話形式の記事を生成する React アプリです。

- フロントエンドのみ（バックエンドなし）
- Gemini `gemini-2.5-flash` を使用
- 2段階生成: `構成設計 -> 本文執筆`
- 出力は約2000文字固定

## 1. セットアップ

```bash
npm install
```

## 2. APIキー設定

どちらか一方で設定します。

### A. 環境変数で設定（推奨）

`.env.local` を作成して以下を設定:

```bash
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### B. 画面入力で設定

アプリ画面の API Key 欄に入力します。キーは `sessionStorage` にのみ保持されます。

## 3. 開発起動

```bash
npm run dev
```

## 4. ビルド

```bash
npm run build
```

## 5. 使い方

1. 文字起こしTXTを貼り付け
2. 話者名・文体などを設定
3. 「記事を生成」を実行
4. 生成結果をコピーまたは `.md` 保存

## 注意事項

- ブラウザ直叩き構成のため、公開運用でのAPIキー秘匿はできません。
- 本番公開時は、最小バックエンド（BFF）経由に切り替えてください。

## 参照

- 計画書: `docs/project-plan-ja.md`
- Gemini API docs: https://ai.google.dev/gemini-api/docs
