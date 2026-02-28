import {
  ARTICLE_END_MARKER,
  MAX_ARTICLE_SECTIONS,
  MIN_ARTICLE_SECTIONS,
  buildArticleContinuationPrompt,
  buildArticlePrompt,
  buildChunkOutlinePrompt,
  buildGlobalOutlinePrompt,
} from './promptBuilders';
import { chunkTranscript } from './chunkTranscript';
import { createGeminiClient } from './geminiClient';
import { validateGenerationInput } from './articleSchema';
import type { GeneratedArticle } from '../types/article';
import type { GenerationSettings, StageProgress } from '../types/generation';

const RETRY_LIMIT = 2;
const RETRY_BASE_DELAY_MS = 1200;
const ARTICLE_MAX_OUTPUT_TOKENS = 4096;
const ARTICLE_CONTINUATION_LIMIT = 3;
const SECTION_RETRY_LIMIT = 2;

interface RunGenerationPipelineInput {
  apiKey: string;
  transcript: string;
  settings: GenerationSettings;
  onProgress?: (progress: StageProgress) => void;
  abortSignal?: AbortSignal;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function toErrorMessage(error: unknown): string {
  if (isAbortError(error)) {
    return '処理を中断しました。';
  }

  if (error && typeof error === 'object') {
    const anyError = error as Record<string, unknown>;
    const status = anyError.status;
    const message = typeof anyError.message === 'string' ? anyError.message : null;

    if (status === 401 || status === 403) {
      return 'APIキーを確認してください（認証エラー）。';
    }

    if (status === 429) {
      return 'リクエスト上限に達しました。時間をおいて再試行してください。';
    }

    if (typeof status === 'number' && status >= 500) {
      return 'Gemini API側で一時的なエラーが発生しています。';
    }

    if (message) {
      return message;
    }
  }

  return '生成中に不明なエラーが発生しました。';
}

async function withRetry<T>(
  operation: () => Promise<T>,
  abortSignal?: AbortSignal,
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= RETRY_LIMIT) {
    if (abortSignal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === RETRY_LIMIT || isAbortError(error)) {
        break;
      }
      const waitMs = RETRY_BASE_DELAY_MS * 2 ** attempt;
      await sleep(waitMs);
      attempt += 1;
    }
  }

  throw lastError;
}

function extractTitle(markdown: string): string {
  const firstLine = markdown.split('\n').map((line) => line.trim()).find(Boolean) ?? '';
  if (firstLine.startsWith('#')) {
    return firstLine.replace(/^#+\s*/, '').trim() || '無題の記事';
  }
  return '無題の記事';
}

function hasArticleEndMarker(text: string): boolean {
  return text.includes(ARTICLE_END_MARKER);
}

function stripArticleEndMarker(text: string): string {
  const markerIndex = text.indexOf(ARTICLE_END_MARKER);
  if (markerIndex === -1) {
    return text.trim();
  }
  return text.slice(0, markerIndex).trim();
}

function mergeDraft(currentDraft: string, nextChunk: string): string {
  if (!currentDraft) {
    return nextChunk.trim();
  }

  const next = nextChunk.trim();
  if (!next) {
    return currentDraft;
  }

  const overlapLimit = Math.min(600, currentDraft.length, next.length);
  for (let overlap = overlapLimit; overlap >= 40; overlap -= 1) {
    if (currentDraft.endsWith(next.slice(0, overlap))) {
      const remaining = next.slice(overlap).trim();
      return remaining ? `${currentDraft}\n${remaining}` : currentDraft;
    }
  }

  return `${currentDraft}\n${next}`;
}

function countH2Sections(markdown: string): number {
  const matches = markdown.match(/^##\s+\S+/gm);
  return matches?.length ?? 0;
}

function createSectionEnforcedSettings(settings: GenerationSettings): GenerationSettings {
  const enforcedInstruction = `必ず##見出しを${MIN_ARTICLE_SECTIONS}〜${MAX_ARTICLE_SECTIONS}個で構成し、1章のみの出力は禁止。`;
  const mergedAdditionalInstructions = settings.additionalInstructions
    ? `${settings.additionalInstructions}\n${enforcedInstruction}`
    : enforcedInstruction;

  return {
    ...settings,
    additionalInstructions: mergedAdditionalInstructions,
  };
}

async function generateArticleMarkdown(params: {
  client: ReturnType<typeof createGeminiClient>;
  settings: GenerationSettings;
  outline: string;
  chunkSummaries: string[];
  onProgress?: (progress: StageProgress) => void;
  abortSignal?: AbortSignal;
}): Promise<string> {
  const { client, settings, outline, chunkSummaries, onProgress, abortSignal } = params;
  let draft = '';

  for (let round = 0; round < ARTICLE_CONTINUATION_LIMIT; round += 1) {
    if (abortSignal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    onProgress?.({
      stage: 'writing',
      message:
        round === 0
          ? '本文を執筆しています...'
          : `本文が長いため続きを執筆しています... (${round}/${ARTICLE_CONTINUATION_LIMIT - 1})`,
    });

    const prompt =
      round === 0
        ? buildArticlePrompt({
            outline,
            chunkSummaries,
            settings,
          })
        : buildArticleContinuationPrompt({
            currentDraft: draft,
            settings,
          });

    const result = await withRetry(
      () =>
        client.generateTextResult(prompt, {
          maxOutputTokens: ARTICLE_MAX_OUTPUT_TOKENS,
        }),
      abortSignal,
    );

    draft = mergeDraft(draft, result.text);
    if (hasArticleEndMarker(draft)) {
      return stripArticleEndMarker(draft);
    }
  }

  throw new Error('本文生成が途中で終了しました。再度生成をお試しください。');
}

export async function runGenerationPipeline({
  apiKey,
  transcript,
  settings,
  onProgress,
  abortSignal,
}: RunGenerationPipelineInput): Promise<GeneratedArticle> {
  const validation = validateGenerationInput(transcript, settings);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  if (!apiKey.trim()) {
    throw new Error('APIキーを入力してください。');
  }

  onProgress?.({ stage: 'analyzing', message: '入力を解析しています...' });

  const chunks = chunkTranscript(transcript);
  if (!chunks.length) {
    throw new Error('文字起こしの解析に失敗しました。入力形式を確認してください。');
  }

  const client = createGeminiClient(apiKey);

  onProgress?.({ stage: 'planning', message: '記事構成を設計しています...' });

  const chunkSummaries: string[] = [];
  for (let index = 0; index < chunks.length; index += 1) {
    if (abortSignal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const chunk = chunks[index];
    onProgress?.({
      stage: 'planning',
      message: `構成素材を抽出中 (${index + 1}/${chunks.length})`,
      chunkIndex: index + 1,
      chunkTotal: chunks.length,
    });

    const summary = await withRetry(
      () =>
        client.generateText(
          buildChunkOutlinePrompt({
            chunkText: chunk.text,
            chunkId: chunk.id,
            settings,
          }),
          { maxOutputTokens: 1400 },
        ),
      abortSignal,
    );

    chunkSummaries.push(summary);
  }

  onProgress?.({ stage: 'planning', message: '構成案を統合しています...' });
  const outline = await withRetry(
    () =>
      client.generateText(
        buildGlobalOutlinePrompt({
          chunkSummaries,
          settings,
        }),
        { maxOutputTokens: 2000 },
      ),
    abortSignal,
  );

  let markdown = '';
  for (let sectionAttempt = 0; sectionAttempt <= SECTION_RETRY_LIMIT; sectionAttempt += 1) {
    const effectiveSettings =
      sectionAttempt === 0 ? settings : createSectionEnforcedSettings(settings);

    markdown = await generateArticleMarkdown({
      client,
      settings: effectiveSettings,
      outline,
      chunkSummaries,
      onProgress,
      abortSignal,
    });

    const sectionCount = countH2Sections(markdown);
    if (sectionCount >= MIN_ARTICLE_SECTIONS) {
      break;
    }

    if (sectionAttempt === SECTION_RETRY_LIMIT) {
      throw new Error(
        `章立ての生成に失敗しました（現在${sectionCount}章）。再度生成してください。`,
      );
    }

    onProgress?.({
      stage: 'writing',
      message: `章立てが不足したため再生成しています...（現在${sectionCount}章）`,
    });
  }

  onProgress?.({ stage: 'done', message: '記事生成が完了しました。' });

  return {
    title: extractTitle(markdown),
    markdown,
    generatedAt: new Date().toISOString(),
    charCount: markdown.length,
  };
}

export function getPipelineErrorMessage(error: unknown): string {
  return toErrorMessage(error);
}
