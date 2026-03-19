export type Tone = 'formal' | 'casual';
export type ArticleFormat = 'standard' | 'interview';
export type InterviewStyle = 'bold' | 'dash';

export interface GenerationSettings {
  articleFormat: ArticleFormat;
  interviewStyle: InterviewStyle;
  theme: string;
  manualOutline: string;
  speakerA: string;
  speakerB: string;
  tone: Tone;
  useStyleProfile: boolean;
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
