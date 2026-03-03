import { estimateTokens, formatNumber } from '../lib/tokenEstimate';

interface TranscriptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TranscriptInput({ value, onChange, disabled = false }: TranscriptInputProps) {
  const charCount = value.length;
  const tokenEstimate = estimateTokens(value);
  const estimatedChunkCount = Math.max(1, Math.ceil(tokenEstimate / 10000));

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>1. 文字起こし入力</h2>
        <span className="chip">TXT貼り付け</span>
      </div>

      <textarea
        className="transcript-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="文字起こしテキストを貼り付けてください。\n\n例: 2時間分の会話ログ、議事録、対談メモなど"
        disabled={disabled}
      />

      <div className="stats-row">
        <span>文字数: {formatNumber(charCount)}</span>
        <span>推定トークン: {formatNumber(tokenEstimate)}</span>
        <span>推定チャンク数: {formatNumber(estimatedChunkCount)}</span>
      </div>
    </section>
  );
}
