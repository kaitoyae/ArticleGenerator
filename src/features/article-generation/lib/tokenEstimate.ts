const CJK_REGEX = /[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/g;

export function estimateTokens(text: string): number {
  if (!text.trim()) {
    return 0;
  }

  const cjkCount = text.match(CJK_REGEX)?.length ?? 0;
  const nonSpaceChars = text.replace(/\s+/g, '').length;
  const latinLikeCount = Math.max(nonSpaceChars - cjkCount, 0);

  const cjkTokens = cjkCount / 1.5;
  const latinTokens = latinLikeCount / 4;

  return Math.max(1, Math.ceil(cjkTokens + latinTokens));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ja-JP').format(value);
}
