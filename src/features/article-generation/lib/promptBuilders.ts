import type { GenerationSettings } from '../types/generation';
import styleProfileRaw from '../../../../style-profile.md?raw';

export const TARGET_CHARACTER_COUNT = 2000;
export const ARTICLE_END_MARKER = '[[ARTICLE_END]]';
export const MIN_ARTICLE_SECTIONS = 3;
export const MAX_ARTICLE_SECTIONS = 5;
const STYLE_PROFILE_TEXT = styleProfileRaw.trim();

function toneDescription(tone: GenerationSettings['tone']): string {
  return tone === 'formal'
    ? 'です・ます調を基本に、過度に硬くなりすぎない文体'
    : '親しみやすく自然な口語寄りの文体';
}

function styleProfileSection(useStyleProfile: boolean): string {
  if (!useStyleProfile || !STYLE_PROFILE_TEXT) {
    return '（文体プロファイル未指定）';
  }
  return STYLE_PROFILE_TEXT;
}

function stylePriorityRule(settings: GenerationSettings): string {
  if (!settings.useStyleProfile || !STYLE_PROFILE_TEXT) {
    return `- 文体は「${toneDescription(settings.tone)}」を基準にする`;
  }

  return `
- 文体は style-profile.md を最優先で厳守する
- 「${toneDescription(settings.tone)}」は補助指示として扱い、style-profile.md と矛盾する場合は無視する
`.trim();
}

function speakerDescription(settings: GenerationSettings): string {
  if (settings.interviewStyle === 'dash') {
    return `聞き手（──表記） / ${settings.speakerB}`;
  }
  return `${settings.speakerA} / ${settings.speakerB}`;
}

export function buildChunkOutlinePrompt(params: {
  chunkText: string;
  chunkId: string;
  settings: GenerationSettings;
}): string {
  const { chunkText, chunkId, settings } = params;
  const isInterview = settings.articleFormat === 'interview';

  return `
あなたは編集者です。以下は${isInterview ? 'インタビュー' : ''}文字起こしの一部（${chunkId}）です。
このチャンクから、記事構成の材料になる情報を抽出してください。

# 出力要件
- 箇条書きで出力
- 「主要トピック」「印象的な発言」「読者に価値がある観点」を中心にまとめる
- 250〜450文字程度
- 事実関係が曖昧なら「不明」と明記
- 余計な前置きは不要

# 記事条件
- 文体ルール:
${stylePriorityRule(settings)}
${isInterview ? `- 話者: ${speakerDescription(settings)}` : ''}
- 目的テーマ: ${settings.theme || '未指定'}

# 対象チャンク
${chunkText}
`.trim();
}

export function buildGlobalOutlinePrompt(params: {
  chunkSummaries: string[];
  settings: GenerationSettings;
}): string {
  const { chunkSummaries, settings } = params;
  const isInterview = settings.articleFormat === 'interview';

  return `
あなたはWebメディアの編集者です。
複数チャンクから抽出した要点を統合し、${isInterview ? '2人対話形式の' : ''}記事構成を作ってください。

# 出力形式
以下のフォーマットで日本語出力:

タイトル案: <1行>
導入:
- <要点>
本編:
- <見出し1>: <要点>
- <見出し2>: <要点>
- <見出し3>: <要点>
締め:
- <要点>

# 条件
- 重複を削り、流れを自然にする
${isInterview ? '- 2人対話形式へ展開しやすい構成にする' : '- 読み物記事として展開しやすい構成にする'}
- 大見出しは3〜5個
- 文体方針: ${toneDescription(settings.tone)}
${isInterview ? `- 話者: ${speakerDescription(settings)}` : ''}
- 目的テーマ: ${settings.theme || '未指定'}

# チャンク要約
${chunkSummaries.map((summary, index) => `## chunk-${index + 1}\n${summary}`).join('\n\n')}
`.trim();
}

export function buildArticlePrompt(params: {
  outline: string;
  chunkSummaries: string[];
  settings: GenerationSettings;
}): string {
  const { outline, chunkSummaries, settings } = params;
  const isInterview = settings.articleFormat === 'interview';

  if (isInterview) {
    const isDash = settings.interviewStyle === 'dash';
    const speakerFormatRule = isDash
      ? `- 聞き手の発言行は「──」（全角ダッシュ2つ）で始める。名前は付けない\n- 話し手の発言行は「${settings.speakerB}：」で始める（全角コロン）`
      : `- 話者行は \`**${settings.speakerA}:** ...\` / \`**${settings.speakerB}:** ...\` 形式`;
    const speakerFormatExample = isDash
      ? `\n\n例:\n──前回の記事から3か月が経過しました。現在の状況はいかがでしょうか。\n\n${settings.speakerB}：まず前提として…`
      : '';

    return `
あなたはプロの編集ライターです。以下の情報をもとに、2人対話形式の記事を執筆してください。

# ゴール
- 完成原稿をMarkdownで出力
- 本文は日本語で${TARGET_CHARACTER_COUNT}文字前後（目安: 1,900〜2,100文字）
- 見出し + 対話本文の構成
- 1本の記事として読みやすく仕上げる

# 必須条件
- 話者: ${speakerDescription(settings)}
- 冗長な相槌は減らし、情報密度を高める
- 文体ルール:
${stylePriorityRule(settings)}
- テーマ: ${settings.theme || '未指定'}
- 追加指示: ${settings.additionalInstructions || 'なし'}
- \`##\` 見出しは必ず${MIN_ARTICLE_SECTIONS}〜${MAX_ARTICLE_SECTIONS}個にする（1章のみは禁止）
- 各見出しで対話を十分に展開し、章ごとに話題を分ける

# 出力形式（厳守）
- 1行目を \`# タイトル\`
- その後に短い導入文
- \`## 見出し\` ごとに対話本文を記述
${speakerFormatRule}${speakerFormatExample}
- 最終行に \`${ARTICLE_END_MARKER}\` を単独行で必ず出力
- \`${ARTICLE_END_MARKER}\` の後ろには何も書かない

# 構成案
${outline}

# チャンク要約
${chunkSummaries.map((summary, index) => `### chunk-${index + 1}\n${summary}`).join('\n\n')}

# 文体プロファイル（style-profile.md）
${styleProfileSection(settings.useStyleProfile)}
`.trim();
  }

  return `
あなたはプロの編集ライターです。以下の情報をもとに、通常の読み物記事を執筆してください。

# ゴール
- 完成原稿をMarkdownで出力
- 本文は日本語で${TARGET_CHARACTER_COUNT}文字前後（目安: 1,900〜2,100文字）
- 見出し + 段落本文の構成
- 1本の記事として読みやすく仕上げる

# 必須条件
- 文体ルール:
${stylePriorityRule(settings)}
- テーマ: ${settings.theme || '未指定'}
- 追加指示: ${settings.additionalInstructions || 'なし'}
- \`##\` 見出しは必ず${MIN_ARTICLE_SECTIONS}〜${MAX_ARTICLE_SECTIONS}個にする（1章のみは禁止）
- 各見出しで論点を十分に展開し、章ごとに話題を分ける
- 根拠→主張の順で書き、断定しすぎない
- 箇条書きの多用は避け、本文は段落中心で書く

# 出力形式（厳守）
- 1行目を \`# タイトル\`
- その後に短い導入文
- \`## 見出し\` ごとに段落本文を記述
- 文章は通常の地の文で執筆し、Q&A形式・会話形式は使わない
- 最終行に \`${ARTICLE_END_MARKER}\` を単独行で必ず出力
- \`${ARTICLE_END_MARKER}\` の後ろには何も書かない

# 構成案
${outline}

# チャンク要約
${chunkSummaries.map((summary, index) => `### chunk-${index + 1}\n${summary}`).join('\n\n')}

# 文体プロファイル（style-profile.md）
${styleProfileSection(settings.useStyleProfile)}
`.trim();
}

export function buildArticleContinuationPrompt(params: {
  currentDraft: string;
  settings: GenerationSettings;
}): string {
  const { currentDraft, settings } = params;
  const isInterview = settings.articleFormat === 'interview';

  return `
あなたはプロの編集ライターです。
以下は執筆途中のMarkdown記事です。テキストが途中で切れたため、**続きだけ**を書いて完成させてください。

# 指示
- 既存テキストを繰り返さない
- 先頭から書き直さない
- 直前の文脈を受けて自然に続ける
${isInterview
    ? settings.interviewStyle === 'dash'
      ? `- 聞き手の発言行は「──」で始める（名前不要）\n- 話し手の発言行は「${settings.speakerB}：」で始める`
      : `- 話者は「${settings.speakerA}」「${settings.speakerB}」`
    : '- 通常の地の文で執筆し、Q&A形式・会話形式は使わない'}
- 文体ルール:
${stylePriorityRule(settings)}
- 本文は最終的に約${TARGET_CHARACTER_COUNT}文字（目安: 1,900〜2,100文字）に収める
- 最終行に \`${ARTICLE_END_MARKER}\` を単独行で必ず出力

# 文体プロファイル（style-profile.md）
${styleProfileSection(settings.useStyleProfile)}

# ここまでの原稿
${currentDraft}
`.trim();
}
