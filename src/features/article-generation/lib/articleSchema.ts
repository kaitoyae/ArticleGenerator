import { z } from 'zod';

export const generationSettingsSchema = z.object({
  theme: z.string().max(120, 'テーマは120文字以内で入力してください。'),
  speakerA: z.string().trim().min(1, '話者A名を入力してください。').max(30),
  speakerB: z.string().trim().min(1, '話者B名を入力してください。').max(30),
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
