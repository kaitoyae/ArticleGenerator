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

export const generationSettingsSchema = z
  .object({
    articleFormat: z.enum(['standard', 'interview']),
    interviewStyle: z.enum(['bold', 'dash']),
    theme: z.string().max(120, 'テーマは120文字以内で入力してください。'),
    manualOutline: z.string().max(2000, '目次は2000文字以内で入力してください。'),
    speakerA: z.string().max(30),
    speakerB: z.string().max(30),
    tone: z.enum(['formal', 'casual']),
    useStyleProfile: z.boolean(),
    additionalInstructions: z
      .string()
      .max(600, '追加指示は600文字以内で入力してください。'),
  })
  .superRefine((data, ctx) => {
    const outline = data.manualOutline.trim();
    if (outline) {
      const sectionCount = countOutlineSections(outline);
      if (sectionCount < MIN_OUTLINE_SECTIONS || sectionCount > MAX_OUTLINE_SECTIONS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['manualOutline'],
          message: `目次は${MIN_OUTLINE_SECTIONS}〜${MAX_OUTLINE_SECTIONS}項目で入力してください。`,
        });
      }
    }

    if (data.articleFormat === 'interview') {
      if (data.interviewStyle === 'bold' && !data.speakerA.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['speakerA'],
          message: '聞き手の名前を入力してください。',
        });
      }
      if (!data.speakerB.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['speakerB'],
          message: '話し手の名前を入力してください。',
        });
      }
    }
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
