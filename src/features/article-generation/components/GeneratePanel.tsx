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
      <div className="panel-header">
        <h2>3. 生成実行</h2>
        <span className="chip">Gemini 2.5 Flash</span>
      </div>

      <label className="form-field">
        <span>Gemini API Key</span>
        <input
          type="password"
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
          placeholder="AIza..."
          disabled={isGenerating || isUsingEnvKey}
        />
      </label>

      <p className="hint-text">
        {isUsingEnvKey
          ? '環境変数 VITE_GEMINI_API_KEY を使用中です。'
          : 'APIキーは sessionStorage にのみ保存されます。'}
      </p>

      <div className="progress-box" data-stage={progress.stage}>
        <p className="progress-main">{progress.message || '待機中'}</p>
        {progress.chunkTotal ? (
          <p className="progress-sub">
            チャンク進捗: {progress.chunkIndex}/{progress.chunkTotal}
          </p>
        ) : null}
      </div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      <div className="button-row">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
        >
          {isGenerating ? '生成中...' : '記事を生成'}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={!isGenerating}
        >
          中断
        </button>
      </div>
    </section>
  );
}
