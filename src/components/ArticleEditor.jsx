import React, { useState } from 'react';
import { Eye, Edit3, Save, X, Sparkles, AlertCircle, FileText } from 'lucide-react';

export default function ArticleEditor({ article, onSaveSuccess, onCancel, adminToken }) {
  const isEditMode = !!article;
  const [title, setTitle] = useState(article ? article.title : '');
  const [authorName, setAuthorName] = useState(article ? article.author_name : '');
  const [content, setContent] = useState(article ? article.content : '');
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Markdown-like parser helper for live preview
  const parseContent = (text) => {
    if (!text) return [];
    const blocks = text.split(/\n\s*\n/);
    return blocks.map(block => {
      const trimmed = block.trim();
      if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
        return { type: 'heading', text: trimmed.replace(/^##?\s+/, '') };
      } else if (trimmed.startsWith('> ')) {
        return { type: 'quote', text: trimmed.replace(/^>\s+/, '') };
      } else {
        return { type: 'paragraph', text: trimmed };
      }
    });
  };

  const previewBlocks = parseContent(content);

  const handleDelete = async () => {
    if (!window.confirm('Are you absolute sure you want to delete this essay? This cannot be undone.')) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete article');
      }

      onSaveSuccess(null); // Pass null to signal deletion to App.jsx
    } catch (err) {
      setError(err.message || 'An error occurred during deletion.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !authorName.trim() || !content.trim()) {
      setError('Please fill in all fields before publishing.');
      return;
    }

    setError('');
    setIsLoading(true);

    const url = isEditMode ? `/api/articles/${article.id}` : '/api/articles';
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title,
          author_name: authorName,
          content
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save article');
      }

      onSaveSuccess(data);
    } catch (err) {
      setError(err.message || 'An error occurred while saving the article.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      {/* Editor Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-neutral-200/60 pb-6 mb-8 dark:border-neutral-800/80 gap-4">
        <div>
          <div className="flex items-center gap-2 text-editorial-gold text-xs font-bold uppercase tracking-widest mb-1.5">
            <Sparkles className="h-4 w-4" /> Editorial Desk
          </div>
          <h2 className="font-serif text-3xl font-bold text-editorial-ink dark:text-neutral-100">
            {isEditMode ? 'Modify Published Essay' : 'Draft New Essay'}
          </h2>
        </div>

        {/* Tab switchers & Close */}
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white text-editorial-ink shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" /> Edit Draft
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white text-editorial-ink shadow-sm dark:bg-neutral-700 dark:text-neutral-100'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5" /> Preview Layout
            </button>
          </div>

          <button
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-rose-500 dark:border-neutral-800 dark:hover:bg-neutral-900 cursor-pointer"
            title="Cancel editing"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2.5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {activeTab === 'edit' ? (
        /* Edit Form Tab */
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-1.5">
              <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Essay Title
              </label>
              <input
                id="title"
                type="text"
                required
                placeholder="e.g. The Architecture of Silence"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white py-3 px-4 text-sm text-editorial-ink transition-all focus:border-editorial-gold focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              />
            </div>

            {/* Author */}
            <div className="space-y-1.5">
              <label htmlFor="authorName" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Author Name
              </label>
              <input
                id="authorName"
                type="text"
                required
                placeholder="e.g. Clara Sterling"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white py-3 px-4 text-sm text-editorial-ink transition-all focus:border-editorial-gold focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              />
            </div>
          </div>

          {/* Content Block */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="content" className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Essay Content
              </label>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                <FileText className="h-3 w-3" />
                Formatting guidelines: Press Enter twice for paragraphs. Start lines with <code>## </code> for subheadings, or <code>&gt; </code> for pull quotes.
              </div>
            </div>
            <textarea
              id="content"
              required
              rows={15}
              placeholder="Start writing the story here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full font-serif text-base leading-relaxed rounded-xl border border-neutral-200 bg-white p-5 text-editorial-ink transition-all focus:border-editorial-gold focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            />
          </div>

          {/* Action trigger */}
          <div className="flex justify-between items-center border-t border-neutral-200/60 pt-6 dark:border-neutral-800/80">
            <div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="rounded-xl bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100/50 px-6 py-2.5 text-xs font-bold transition-colors cursor-pointer dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
                >
                  Delete Essay
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-neutral-200 px-6 py-2.5 text-xs font-bold text-neutral-500 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-1.5 rounded-xl bg-editorial-charcoal px-6 py-2.5 text-xs font-bold text-white transition-colors hover:bg-editorial-gold dark:bg-neutral-800 dark:hover:bg-editorial-gold dark:hover:text-neutral-900 cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Publish Essay'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        /* Layout Preview Tab */
        <div className="border border-neutral-100 rounded-2xl bg-white p-6 md:p-10 shadow-sm dark:border-neutral-800/80 dark:bg-editorial-bg-dark">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-3">
              <span className="inline-block rounded-full bg-editorial-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-editorial-gold-dark dark:bg-editorial-gold/20 dark:text-editorial-gold-light">
                Preview Mode
              </span>
              <h1 className="font-serif text-3xl md:text-4xl font-bold leading-tight text-editorial-ink dark:text-neutral-100">
                {title || 'Untitled Essay'}
              </h1>
              <div className="text-xs text-neutral-400 dark:text-neutral-500 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                By {authorName || 'Anonymous Writer'} · Just now
              </div>
            </div>

            {/* Render block contents */}
            <div className="pt-4">
              {previewBlocks.length === 0 ? (
                <p className="text-neutral-400 italic text-center text-sm py-10">
                  No content written yet.
                </p>
              ) : (
                previewBlocks.map((block, idx) => {
                  if (block.type === 'paragraph') {
                    return (
                      <p
                        key={idx}
                        className={`mb-6 font-serif text-lg leading-relaxed text-neutral-700 dark:text-neutral-300 antialiased ${idx === 0 ? 'dropcap' : ''}`}
                      >
                        {block.text}
                      </p>
                    );
                  } else if (block.type === 'heading') {
                    return (
                      <h2
                        key={idx}
                        className="font-serif text-xl md:text-2xl font-bold mt-8 mb-3 text-editorial-ink dark:text-neutral-100"
                      >
                        {block.text}
                      </h2>
                    );
                  } else if (block.type === 'quote') {
                    return (
                      <blockquote
                        key={idx}
                        className="border-l-4 border-editorial-gold pl-5 py-1.5 my-6 font-serif text-lg italic text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-900/40 rounded-r-lg"
                      >
                        "{block.text}"
                      </blockquote>
                    );
                  }
                  return null;
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
