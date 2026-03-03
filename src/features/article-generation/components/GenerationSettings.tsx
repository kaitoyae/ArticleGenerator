import type { GenerationSettings as Settings, Tone } from '../types/generation';

interface GenerationSettingsProps {
  value: Settings;
  onChange: (next: Settings) => void;
  disabled?: boolean;
}

function updateField<T extends keyof Settings>(
  settings: Settings,
  key: T,
  nextValue: Settings[T],
): Settings {
  return { ...settings, [key]: nextValue };
}

export function GenerationSettings({
  value,
  onChange,
  disabled = false,
}: GenerationSettingsProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>2. 生成設定</h2>
        <span className="chip">約2000文字固定</span>
      </div>

      <div className="form-grid">
        <label className="form-field">
          <span>記事テーマ（任意）</span>
          <input
            type="text"
            value={value.theme}
            onChange={(event) =>
              onChange(updateField(value, 'theme', event.target.value))
            }
            placeholder="例: 地方スタートアップの採用戦略"
            disabled={disabled}
            maxLength={120}
          />
        </label>

        <label className="form-field field-full">
          <span>目次（必須 / 3〜5項目）</span>
          <textarea
            value={value.manualOutline}
            onChange={(event) =>
              onChange(updateField(value, 'manualOutline', event.target.value))
            }
            placeholder={'## 導入\n## 課題の背景\n## 実践アプローチ\n## まとめ'}
            disabled={disabled}
            maxLength={2000}
          />
        </label>

        <label className="form-field">
          <span>文体（補助）</span>
          <select
            value={value.tone}
            onChange={(event) =>
              onChange(updateField(value, 'tone', event.target.value as Tone))
            }
            disabled={disabled}
          >
            <option value="formal">フォーマル（です・ます調）</option>
            <option value="casual">カジュアル（親しみやすい）</option>
          </select>
        </label>

        <label className="form-field field-full">
          <span>追加指示（任意）</span>
          <textarea
            value={value.additionalInstructions}
            onChange={(event) =>
              onChange(updateField(value, 'additionalInstructions', event.target.value))
            }
            placeholder="例: 実践的なTipsを多めに。導入は短く。"
            disabled={disabled}
            maxLength={600}
          />
        </label>
      </div>
    </section>
  );
}
