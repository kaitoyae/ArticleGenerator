import { useState } from 'react';
import type { GenerationSettings as Settings, Tone, ArticleFormat, InterviewStyle } from '../types/generation';

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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isInterview = value.articleFormat === 'interview';

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>生成設定</h2>
      </div>

      <div className="panel-body">
        <div className="form-grid">
          <label className="form-field">
            <span>記事形式</span>
            <select
              value={value.articleFormat}
              onChange={(event) =>
                onChange(updateField(value, 'articleFormat', event.target.value as ArticleFormat))
              }
              disabled={disabled}
            >
              <option value="standard">通常記事</option>
              <option value="interview">インタビュー記事</option>
            </select>
          </label>

          <label className="form-field">
            <span>文体</span>
            <select
              value={value.tone}
              onChange={(event) =>
                onChange(updateField(value, 'tone', event.target.value as Tone))
              }
              disabled={disabled}
            >
              <option value="formal">フォーマル（です・ます調）</option>
              <option value="casual">カジュアル</option>
            </select>
          </label>

          <label className="form-field field-full">
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

          {isInterview && (
            <>
              <label className="form-field">
                <span>対話スタイル</span>
                <select
                  value={value.interviewStyle}
                  onChange={(event) =>
                    onChange(updateField(value, 'interviewStyle', event.target.value as InterviewStyle))
                  }
                  disabled={disabled}
                >
                  <option value="bold">名前表記</option>
                  <option value="dash">ダッシュ表記</option>
                </select>
              </label>

              <label className="form-field">
                <span>話し手</span>
                <input
                  type="text"
                  value={value.speakerB}
                  onChange={(event) =>
                    onChange(updateField(value, 'speakerB', event.target.value))
                  }
                  placeholder="例: 平井"
                  disabled={disabled}
                  maxLength={30}
                />
              </label>

              {value.interviewStyle === 'bold' && (
                <label className="form-field">
                  <span>聞き手</span>
                  <input
                    type="text"
                    value={value.speakerA}
                    onChange={(event) =>
                      onChange(updateField(value, 'speakerA', event.target.value))
                    }
                    placeholder="聞き手"
                    disabled={disabled}
                    maxLength={30}
                  />
                </label>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          className={`advanced-toggle ${showAdvanced ? 'advanced-toggle--open' : ''}`}
          onClick={() => setShowAdvanced((prev) => !prev)}
        >
          <svg className="advanced-toggle__icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 4l4 4-4 4" />
          </svg>
          詳細設定
        </button>

        {showAdvanced && (
          <div className="advanced-section">
            <label className="form-field field-full">
              <span>目次（任意 / 3〜5項目）</span>
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
              <span>style-profile</span>
              <select
                value={value.useStyleProfile ? 'on' : 'off'}
                onChange={(event) =>
                  onChange(updateField(value, 'useStyleProfile', event.target.value === 'on'))
                }
                disabled={disabled}
              >
                <option value="on">適用する</option>
                <option value="off">適用しない</option>
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
        )}
      </div>
    </section>
  );
}
