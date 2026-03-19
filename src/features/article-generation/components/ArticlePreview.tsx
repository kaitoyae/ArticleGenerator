import ReactMarkdown from 'react-markdown';
import type { GeneratedArticle } from '../types/article';
import { formatNumber } from '../lib/tokenEstimate';

interface ArticlePreviewProps {
  article: GeneratedArticle | null;
  isGenerating: boolean;
  onCopy: () => void;
  onDownload: () => void;
  copyMessage: string;
}

export function ArticlePreview({
  article,
  isGenerating,
  onCopy,
  onDownload,
  copyMessage,
}: ArticlePreviewProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>生成結果</h2>
        {article && <span className="chip">{formatNumber(article.charCount)}文字</span>}
      </div>

      {!article ? (
        <div className="empty-preview">
          <svg className="empty-preview__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p>
            {isGenerating
              ? '記事を生成しています...'
              : 'ここに生成結果が表示されます'}
          </p>
        </div>
      ) : (
        <>
          <div className="result-toolbar">
            <div className="result-meta">
              <span>{article.title}</span>
              <span>{new Date(article.generatedAt).toLocaleString('ja-JP')}</span>
            </div>
            {copyMessage && <span className="copy-feedback">{copyMessage}</span>}
            <button
              type="button"
              className="btn-icon"
              onClick={onCopy}
              title="コピー"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={onDownload}
              title="Markdown保存"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          </div>

          <article className="markdown-preview">
            <ReactMarkdown>{article.markdown}</ReactMarkdown>
          </article>
        </>
      )}
    </section>
  );
}
