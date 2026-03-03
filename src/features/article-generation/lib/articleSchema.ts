import { z } from 'zod';

const MIN_OUTLINE_SECTIONS = 3;
const MAX_OUTLINE_SECTIONS = 5;

function countOutlineSections(raw: string): number {
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const structuredLines = lines.filter((line) => {
    return /^(#{1,6}\s+|[-*]\s+|\d+\.\s+)/.test(line);
  });

  return structuredLines.length > 0 ? structuredLines.length : lines.length;
}

export const generationSettingsSchema = z.object({
  theme: z.string().max(120, 'テーマは120文字以内で入力してください。'),
  manualOutline: z
    .string()
    .trim()
    .min(1, '目次を入力してください。')
    .max(2000, '目次は2000文字以内で入力してください。')
    .refine((value) => {
      const sectionCount = countOutlineSections(value);
      return sectionCount >= MIN_OUTLINE_SECTIONS && sectionCount <= MAX_OUTLINE_SECTIONS;
    }, `目次は${MIN_OUTLINE_SECTIONS}〜${MAX_OUTLINE_SECTIONS}項目で入力してください。`),
  tone: z.enum(['formal', 'casual']),
  additionalInstructions: z
    .string()
    .max(600, '追加指示は600文字以内で入力してください。'),
});

export const transcriptSchema = z
  .string()
  .trim()
  .min(200, '文字起こしは最低200文字以上を入力してください。');

export function validateGenerationInput(
  transcript: string,
  settings: unknown,
): { ok: true } | { ok: false; message: string } {
  const transcriptResult = transcriptSchema.safeParse(transcript);
  if (!transcriptResult.success) {
    return { ok: false, message: transcriptResult.error.issues[0]?.message ?? '入力を確認してください。' };
  }

  const settingsResult = generationSettingsSchema.safeParse(settings);
  if (!settingsResult.success) {
    return { ok: false, message: settingsResult.error.issues[0]?.message ?? '設定を確認してください。' };
  }

  return { ok: true };
}
