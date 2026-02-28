# 記事ジェネレータ実装計画（React + Gemini 2.5 Flash）

最終更新: 2026-02-28

## 1. 目的
インタビュー等の長文文字起こし（約2時間分のTXT）を入力し、**2人の対話形式で読みやすい1本の記事**を生成するWebアプリを作る。

## 2. スコープ
### MVPで実装すること
- TXTの貼り付け入力（長文対応）
- 記事生成設定（トーン、話者名）
- Gemini 2.5 Flash を使った記事生成
- 生成結果の表示・コピー・Markdownダウンロード
- エラー表示（入力不足、API失敗、レート制限）

### MVPで実装しないこと
- ユーザー認証
- DB保存
- チーム共有機能
- バックエンドAPI（MVPでは作らない）

## 3. 前提と制約
- フロントエンドのみ運用のため、**APIキー秘匿はできない**。
- 本番公開する場合は、フロント直叩きは非推奨。後続フェーズで最小バックエンド（BFF）を追加する。
- モデルは `gemini-2.5-flash`（安定版）を使用。
- 公式モデル仕様（確認日 2026-02-28）:
  - 入力上限: 1,048,576 tokens
  - 出力上限: 65,536 tokens

## 4. 技術選定
- React 18+
- TypeScript
- Vite
- 状態管理: React hooks（必要に応じて Zustand）
- API SDK: `@google/genai`
- バリデーション: `zod`
- UI: まずは素のCSS + CSS Variables（後からUIライブラリ導入可）

## 5. 画面仕様（MVP）
### 5.1 入力エリア
- `TranscriptInput`（textarea）
- 文字数カウント
- 想定トークン目安表示（簡易推定）

### 5.2 設定エリア
- 記事タイトル/テーマ（任意）
- 話者A名、話者B名
- 文体（フォーマル / カジュアル）
- 出力文字量: 約2000文字（固定）
- 追加指示（任意）

### 5.3 生成エリア
- `Generate` ボタン
- 進捗表示（段階: 解析中 / 構成設計中 / 本文執筆中）
- 生成結果プレビュー（Markdown）
- `Copy` / `Download .md`

### 5.4 APIキー入力
- APIキー入力欄（`sessionStorage`保持、永続保存しない）
- キー未入力時は生成不可

## 6. 長文対応アーキテクチャ
2時間分テキストを安定して扱うため、単発生成ではなく**2段階パイプライン**で実装する。

### Stage 1: 構成設計（Outline Planning）
1. 入力TXTを段落/改行で分割
2. トークン推定でチャンク化（例: 8,000〜12,000 tokens目安）
3. 各チャンクの要点を短く要約し、全体の論点リストを作成
4. 論点リストから、記事の見出し構成（導入・本編・締め）を設計

### Stage 2: 本文執筆（Dialogue Writing）
1. Stage 1で作成した見出し構成を入力として渡す
2. 文字起こし内容を反映しながら、2人対話形式の記事本文を執筆
3. 読みやすさを優先して、会話の流れと情報密度を調整

この方式により、入力が非常に長くても破綻しにくく、出力品質を安定化できる。

## 7. プロンプト設計
### 7.1 構成設計プロンプト
- 目的: 文字起こしから記事の骨子を作る
- 出力形式: 見出し案 + セクションごとの要点（テキスト）
- 要件:
  - 論点の重複を避ける
  - 流れが自然になる順序にする
  - 2人対話化しやすい構成にする

### 7.2 最終記事プロンプト
- 目的: 2人対話形式の記事に再構成
- 生成パラメータ: temperature は標準設定（デフォルト）
- 制約:
  - 冗長な相槌を抑える
  - 見出し + 本文（会話形式）
  - 本文は約2000文字で出力する

### 7.3 失敗時リカバリ
- API失敗時: 指数バックオフでリトライ（上限あり）
- 出力不足時: 「不足セクションのみ」再生成

## 8. モジュール構成（予定）
```
src/
  app/
    App.tsx
  features/article-generation/
    components/
      TranscriptInput.tsx
      GenerationSettings.tsx
      GeneratePanel.tsx
      ArticlePreview.tsx
    lib/
      tokenEstimate.ts
      chunkTranscript.ts
      promptBuilders.ts
      articleSchema.ts
      geminiClient.ts
      generationPipeline.ts
    types/
      article.ts
      generation.ts
  shared/
    ui/
    utils/
```

## 9. エラーハンドリング設計
- 入力関連: 空入力、文字数不足、極端な長文
- API関連: 400/401/429/5xx
- モデル出力関連: 構成不足、内容不十分
- UX方針: 「原因」「対処」を必ずセットで表示

## 10. セキュリティ方針（MVP）
- APIキーは `sessionStorage` のみ
- Git管理対象には絶対に含めない
- READMEに「公開サイトでの直埋め込み非推奨」を明記

## 11. 実装ロードマップ
### Phase 0: 初期セットアップ（0.5日）
- Vite + React + TS 初期化
- ESLint/Prettier導入
- ディレクトリ雛形作成

### Phase 1: UI骨組み（1日）
- 入力/設定/結果の3カラム（モバイルは縦並び）
- 入力バリデーション

### Phase 2: Gemini接続（1日）
- `@google/genai` 導入
- 単発生成をまず動作確認
- APIエラー表示

### Phase 3: 長文パイプライン（2日）
- チャンク分割
- Stage 1 構成設計
- Stage 2 本文執筆

### Phase 4: 品質改善（1日）
- プロンプト調整
- 再生成・リトライ制御
- Markdown出力整形

### Phase 5: 仕上げ（0.5日）
- 例文でE2E手動確認
- README整備

## 12. 受け入れ基準（Definition of Done）
- 2時間相当の文字起こしを入力し、タイムアウトせず記事を生成できる
- 出力が「2人対話形式」になっている
- 出力文字量が約2000文字で安定している
- 主要エラー（401/429/生成失敗）でUIに復帰導線がある
- 生成結果をコピー/Markdown保存できる

## 13. リスクと対策
- APIキー漏洩リスク:
  - 対策: MVPはローカル利用前提を明示。本番前にBFF化。
- 長文で品質がぶれる:
  - 対策: 2段階生成（構成→本文）、プロンプト調整、リトライ。
- レート制限:
  - 対策: チャンク数上限、待機リトライ、進捗表示。

## 14. 次に着手する実装順（この計画に沿う）
1. React + TSプロジェクト初期化
2. 画面3ブロック（入力/設定/結果）作成
3. Gemini接続の最小動作
4. チャンク分割 + 2段階生成
5. 出力整形とダウンロード機能
6. ドキュメントと最終確認

## 参考（公式ドキュメント）
- Gemini Models: https://ai.google.dev/gemini-api/docs/models/gemini-v2
- API Keys: https://ai.google.dev/gemini-api/docs/api-key
- API Reference: https://ai.google.dev/api
- Rate limits: https://ai.google.dev/gemini-api/docs/quota
