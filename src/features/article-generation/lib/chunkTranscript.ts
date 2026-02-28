import { estimateTokens } from './tokenEstimate';

export interface TranscriptChunk {
  id: string;
  text: string;
  tokenEstimate: number;
  charCount: number;
}

interface ChunkOptions {
  targetTokens?: number;
  maxTokens?: number;
  maxChunks?: number;
}

const DEFAULT_TARGET_TOKENS = 10000;
const DEFAULT_MAX_TOKENS = 12000;
const DEFAULT_MAX_CHUNKS = 24;

function splitBySentence(text: string): string[] {
  return text
    .split(/(?<=[。．！？!?\n])/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function hardSplit(text: string, maxChars = 12000): string[] {
  if (text.length <= maxChars) {
    return [text];
  }

  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += maxChars) {
    chunks.push(text.slice(index, index + maxChars));
  }
  return chunks;
}

function splitOversizedParagraph(paragraph: string, maxTokens: number): string[] {
  if (estimateTokens(paragraph) <= maxTokens) {
    return [paragraph];
  }

  const sentences = splitBySentence(paragraph);
  if (sentences.length <= 1) {
    return hardSplit(paragraph);
  }

  const pieces: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (estimateTokens(candidate) <= maxTokens) {
      current = candidate;
      continue;
    }

    if (current) {
      pieces.push(current);
    }

    if (estimateTokens(sentence) > maxTokens) {
      pieces.push(...hardSplit(sentence));
      current = '';
    } else {
      current = sentence;
    }
  }

  if (current) {
    pieces.push(current);
  }

  return pieces;
}

function squashIntoMaxChunks(chunks: TranscriptChunk[], maxChunks: number): TranscriptChunk[] {
  if (chunks.length <= maxChunks) {
    return chunks;
  }

  const allowed = chunks.slice(0, maxChunks - 1);
  const rest = chunks.slice(maxChunks - 1);
  const mergedText = rest.map((chunk) => chunk.text).join('\n\n');

  allowed.push({
    id: `chunk-${maxChunks}`,
    text: mergedText,
    tokenEstimate: estimateTokens(mergedText),
    charCount: mergedText.length,
  });

  return allowed;
}

export function chunkTranscript(
  transcript: string,
  options: ChunkOptions = {},
): TranscriptChunk[] {
  const targetTokens = options.targetTokens ?? DEFAULT_TARGET_TOKENS;
  const maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
  const maxChunks = options.maxChunks ?? DEFAULT_MAX_CHUNKS;

  const paragraphs = transcript
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) => splitOversizedParagraph(paragraph, maxTokens));

  if (!paragraphs.length) {
    return [];
  }

  const chunks: TranscriptChunk[] = [];
  let currentParts: string[] = [];
  let currentText = '';

  for (const paragraph of paragraphs) {
    const candidateText = currentText ? `${currentText}\n\n${paragraph}` : paragraph;
    const candidateTokens = estimateTokens(candidateText);

    if (candidateTokens <= targetTokens || !currentText) {
      currentParts.push(paragraph);
      currentText = candidateText;
      continue;
    }

    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      text: currentParts.join('\n\n'),
      tokenEstimate: estimateTokens(currentParts.join('\n\n')),
      charCount: currentParts.join('\n\n').length,
    });

    currentParts = [paragraph];
    currentText = paragraph;
  }

  if (currentParts.length) {
    const joined = currentParts.join('\n\n');
    chunks.push({
      id: `chunk-${chunks.length + 1}`,
      text: joined,
      tokenEstimate: estimateTokens(joined),
      charCount: joined.length,
    });
  }

  return squashIntoMaxChunks(chunks, maxChunks);
}
