import { estimateTokens, formatNumber } from '../lib/tokenEstimate';

interface TranscriptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TranscriptInput({ value, onChange, disabled = false }: TranscriptInputProps) {
  const charCount = value.length;
  const tokenEstimate = estimateTokens(value);

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>文字起こし</h2>
        <span className="chip">{charCount > 0 ? `${formatNumber(charCount)}文字` : 'テキスト入力'}</span>
      </div>

      <textarea
        className="transcript-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={'文字起こしテキストを貼り付けてください。\n\n例: 会話ログ、議事録、対談メモなど'}
        disabled={disabled}
      />

      <div className="stats-row">
        <span>文字数: {formatNumber(charCount)}</span>
        <span>推定トークン: {formatNumber(tokenEstimate)}</span>
      </div>
    </section>
  );
}
