export type Tone = 'formal' | 'casual';

export interface GenerationSettings {
  theme: string;
  manualOutline: string;
  tone: Tone;
  additionalInstructions: string;
}

export type PipelineStage =
  | 'idle'
  | 'analyzing'
  | 'planning'
  | 'writing'
  | 'done'
  | 'error';

export interface StageProgress {
  stage: PipelineStage;
  message: string;
  chunkIndex?: number;
  chunkTotal?: number;
}
