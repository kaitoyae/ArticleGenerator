import { useEffect, useRef, useState } from 'react';
import type { PipelineStage, StageProgress } from '../types/generation';

interface GenerationStatusProps {
  progress: StageProgress;
  isGenerating: boolean;
}

interface StepDef {
  stage: PipelineStage;
  label: string;
}

const STEPS: StepDef[] = [
  { stage: 'analyzing', label: '解析' },
  { stage: 'planning', label: '構成' },
  { stage: 'writing', label: '執筆' },
  { stage: 'done', label: '完了' },
];

const STAGE_ORDER: Record<PipelineStage, number> = {
  idle: -1,
  analyzing: 0,
  planning: 1,
  writing: 2,
  done: 3,
  error: -1,
};

function getStepState(
  stepStage: PipelineStage,
  currentStage: PipelineStage,
): 'completed' | 'active' | 'pending' {
  const stepIndex = STAGE_ORDER[stepStage];
  const currentIndex = STAGE_ORDER[currentStage];

  if (currentStage === 'done' && stepStage === 'done') return 'completed';
  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
  }
  return `${seconds}秒`;
}

export function GenerationStatus({ progress, isGenerating }: GenerationStatusProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isGenerating && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current!);
      }, 200);
    }

    if (!isGenerating) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (startTimeRef.current && progress.stage === 'done') {
        setElapsedMs(Date.now() - startTimeRef.current);
      }
      if (progress.stage === 'idle') {
        startTimeRef.current = null;
        setElapsedMs(0);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isGenerating, progress.stage]);

  const isActive = progress.stage !== 'idle';
  const isError = progress.stage === 'error';
  const chunkProgress =
    progress.chunkTotal && progress.chunkIndex
      ? (progress.chunkIndex / progress.chunkTotal) * 100
      : null;

  if (!isActive && elapsedMs === 0) {
    return null;
  }

  const activeStep = STEPS.find((s) => {
    const state = isError ? 'pending' : getStepState(s.stage, progress.stage);
    return state === 'active';
  });

  return (
    <div className={`gen-status ${isError ? 'gen-status--error' : ''}`}>
      <div className="gen-stepper">
        {STEPS.map((step) => {
          const state = isError ? 'pending' : getStepState(step.stage, progress.stage);
          return (
            <div
              key={step.stage}
              className={`gen-step-dot gen-step-dot--${state}`}
              title={step.label}
            />
          );
        })}
        {activeStep && (
          <span className="gen-step-label gen-step-label--active">
            {activeStep.label}
          </span>
        )}
        {progress.stage === 'done' && (
          <span className="gen-step-label">完了</span>
        )}
      </div>

      <p className="gen-status__message">{progress.message}</p>

      {chunkProgress !== null && progress.stage === 'planning' && (
        <div className="gen-progress-bar">
          <div
            className="gen-progress-bar__fill"
            style={{ width: `${chunkProgress}%` }}
          />
        </div>
      )}

      {(isGenerating || elapsedMs > 0) && (
        <p className="gen-status__elapsed">
          {isGenerating ? '経過' : '所要'}: {formatElapsed(elapsedMs)}
        </p>
      )}
    </div>
  );
}
