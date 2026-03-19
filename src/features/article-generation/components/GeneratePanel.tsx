import { GenerationStatus } from './GenerationStatus';
import type { StageProgress } from '../types/generation';

interface GeneratePanelProps {
  apiKey: string;
  onApiKeyChange: (value: string) => void;
  isUsingEnvKey: boolean;
  progress: StageProgress;
  isGenerating: boolean;
  canGenerate: boolean;
  errorMessage: string;
  onGenerate: () => void;
  onCancel: () => void;
}

export function GeneratePanel({
  apiKey,
  onApiKeyChange,
  isUsingEnvKey,
  progress,
  isGenerating,
  canGenerate,
  errorMessage,
  onGenerate,
  onCancel,
}: GeneratePanelProps) {
  return (
    <section className="panel">
      <div className="generate-panel-body">
        {!isUsingEnvKey && (
          <div className="api-key-row">
            <label>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(event) => onApiKeyChange(event.target.value)}
              placeholder="AIza..."
              disabled={isGenerating}
            />
          </div>
        )}

        {isUsingEnvKey && (
          <p className="hint-text">環境変数のAPIキーを使用中</p>
        )}

        <div className="generate-actions">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
          >
            {isGenerating ? '生成中...' : '記事を生成'}
          </button>

          {isGenerating && (
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onCancel}
            >
              中断
            </button>
          )}
        </div>

        <GenerationStatus progress={progress} isGenerating={isGenerating} />

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </div>
    </section>
  );
}
