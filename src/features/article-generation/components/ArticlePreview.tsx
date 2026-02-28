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
    <section className="panel panel-preview">
      <div className="panel-header">
        <h2>4. 生成結果</h2>
        <span className="chip">Markdown</span>
      </div>

      {!article ? (
        <div className="empty-preview">
          <p>
            {isGenerating
              ? '記事を生成しています。完了まで少しお待ちください。'
              : 'ここに生成結果が表示されます。'}
          </p>
        </div>
      ) : (
        <>
          <div className="result-meta">
            <span>タイトル: {article.title}</span>
            <span>文字数: {formatNumber(article.charCount)}</span>
            <span>生成時刻: {new Date(article.generatedAt).toLocaleString('ja-JP')}</span>
          </div>

          <div className="button-row">
            <button type="button" className="btn btn-secondary" onClick={onCopy}>
              コピー
            </button>
            <button type="button" className="btn btn-secondary" onClick={onDownload}>
              Markdown保存
            </button>
            {copyMessage ? <span className="hint-text">{copyMessage}</span> : null}
          </div>

          <article className="markdown-preview">
            <ReactMarkdown>{article.markdown}</ReactMarkdown>
          </article>
        </>
      )}
    </section>
  );
}
