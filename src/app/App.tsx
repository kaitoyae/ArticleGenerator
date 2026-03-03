import { useMemo, useRef, useState } from 'react';
import { TranscriptInput } from '../features/article-generation/components/TranscriptInput';
import { GenerationSettings } from '../features/article-generation/components/GenerationSettings';
import { GeneratePanel } from '../features/article-generation/components/GeneratePanel';
import { ArticlePreview } from '../features/article-generation/components/ArticlePreview';
import type { GeneratedArticle } from '../features/article-generation/types/article';
import type { GenerationSettings as GenerationSettingsType, StageProgress } from '../features/article-generation/types/generation';
import { validateGenerationInput } from '../features/article-generation/lib/articleSchema';
import { downloadTextFile } from '../shared/utils/file';
import './App.css';

const SESSION_API_KEY = 'article-generator.gemini-api-key';

const envApiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? '';

const defaultSettings: GenerationSettingsType = {
  theme: '',
  manualOutline: '',
  tone: 'formal',
  additionalInstructions: '',
};

const defaultProgress: StageProgress = {
  stage: 'idle',
  message: '待機中',
};

function sanitizeFileName(title: string): string {
  return title
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function getStoredApiKey(): string {
  if (envApiKey) {
    return '';
  }

  return sessionStorage.getItem(SESSION_API_KEY) ?? '';
}

export default function App() {
  const [transcript, setTranscript] = useState('');
  const [settings, setSettings] = useState<GenerationSettingsType>(defaultSettings);
  const [apiKey, setApiKey] = useState(getStoredApiKey);
  const [progress, setProgress] = useState<StageProgress>(defaultProgress);
  const [article, setArticle] = useState<GeneratedArticle | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const effectiveApiKey = envApiKey || apiKey;
  const isUsingEnvKey = Boolean(envApiKey);

  const validationResult = useMemo(
    () => validateGenerationInput(transcript, settings),
    [transcript, settings],
  );

  const canGenerate = validationResult.ok && Boolean(effectiveApiKey.trim());

  function handleApiKeyChange(nextKey: string): void {
    setApiKey(nextKey);
    sessionStorage.setItem(SESSION_API_KEY, nextKey);
  }

  async function handleGenerate(): Promise<void> {
    if (isGenerating) {
      return;
    }

    setErrorMessage('');
    setCopyMessage('');
    setArticle(null);
    setIsGenerating(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const { runGenerationPipeline } = await import(
        '../features/article-generation/lib/generationPipeline'
      );
      const result = await runGenerationPipeline({
        apiKey: effectiveApiKey,
        transcript,
        settings,
        onProgress: setProgress,
        abortSignal: controller.signal,
      });
      setArticle(result);
    } catch (error) {
      setProgress({ stage: 'error', message: '処理が失敗しました。' });
      if (error instanceof Error && !error.message) {
        setErrorMessage('生成中に不明なエラーが発生しました。');
      } else {
        try {
          const { getPipelineErrorMessage } = await import(
            '../features/article-generation/lib/generationPipeline'
          );
          setErrorMessage(getPipelineErrorMessage(error));
        } catch {
          setErrorMessage(error instanceof Error ? error.message : '生成中に不明なエラーが発生しました。');
        }
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }

  function handleCancel(): void {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
    setProgress({ stage: 'idle', message: '中断しました。' });
  }

  async function handleCopy(): Promise<void> {
    if (!article) {
      return;
    }

    try {
      await copyText(article.markdown);
      setCopyMessage('コピーしました。');
    } catch {
      setCopyMessage('コピーに失敗しました。');
    }
  }

  function handleDownload(): void {
    if (!article) {
      return;
    }

    const date = new Date().toISOString().slice(0, 10);
    const title = sanitizeFileName(article.title || 'generated-article');
    downloadTextFile(article.markdown, `${date}_${title}.md`);
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="eyebrow">React + Gemini 2.5 Flash</p>
        <h1>記事ジェネレータ</h1>
        <p>
          長文の文字起こしを入力すると、約2000文字の通常記事を生成します。
        </p>
      </header>

      <main className="app-grid">
        <div className="stack">
          <TranscriptInput
            value={transcript}
            onChange={setTranscript}
            disabled={isGenerating}
          />
        </div>

        <div className="stack">
          <GenerationSettings
            value={settings}
            onChange={setSettings}
            disabled={isGenerating}
          />

          <GeneratePanel
            apiKey={apiKey}
            onApiKeyChange={handleApiKeyChange}
            isUsingEnvKey={isUsingEnvKey}
            progress={progress}
            isGenerating={isGenerating}
            canGenerate={canGenerate}
            errorMessage={!validationResult.ok ? validationResult.message : errorMessage}
            onGenerate={handleGenerate}
            onCancel={handleCancel}
          />
        </div>

        <div className="stack">
          <ArticlePreview
            article={article}
            isGenerating={isGenerating}
            onCopy={handleCopy}
            onDownload={handleDownload}
            copyMessage={copyMessage}
          />
        </div>
      </main>
    </div>
  );
}
