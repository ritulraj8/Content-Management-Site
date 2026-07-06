import React, { useState, useEffect } from 'react';
import { ChevronLeft, Edit2, Trash2 } from 'lucide-react';

export default function ArticleView({
  article,
  allArticles,
  onBack,
  onArticleSelect,
  isAdmin,
  onEditClick,
  onDeleteClick
}) {
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scrolling to update reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const currentProgress = (window.scrollY / totalScroll) * 100;
        setScrollProgress(currentProgress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset scroll position on article change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [article.id]);

  // Helper parser for database article content (splits by double linebreaks, parses Markdown style)
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

  const formattedDate = article.created_date
    ? new Date(article.created_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown Date';

  const author = {
    name: article.author_name || 'Anonymous',
    bio: `${article.author_name || 'Anonymous'} is a leading thinker and contributor to Artisite Gazette, specializing in long-form structural critiques.`
  };

  const contentBlocks = parseContent(article.content);

  // Recommended articles (exclude current, take top 2)
  const recommendedArticles = allArticles
    .filter(a => a.id !== article.id)
    .slice(0, 2);

  return (
    <div className="relative w-full bg-editorial-cream text-editorial-ink transition-colors duration-300 dark:bg-editorial-bg-dark dark:text-neutral-100 animate-fadeIn">
      {/* Scroll Progress Bar */}
      <div
        className="fixed top-20 left-0 z-50 h-1 bg-editorial-gold transition-all duration-100 dark:bg-editorial-gold-light"
        style={{ width: `${scrollProgress}%` }}
      ></div>

      <div className="mx-auto max-w-3xl px-6 py-8 md:px-12 md:py-12">
        {/* Navigation Action Bar */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 hover:text-editorial-gold dark:text-neutral-400 dark:hover:text-editorial-gold-light transition-colors duration-200 cursor-pointer focus:outline-none"
          >
            <ChevronLeft className="h-4.5 w-4.5" />
            Back to Explore
          </button>

          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditClick(article)}
                className="flex items-center gap-1.5 rounded-full border border-editorial-gold px-4 py-1.5 text-xs font-semibold text-editorial-gold hover:bg-editorial-gold hover:text-white transition-all cursor-pointer focus:outline-none dark:hover:text-neutral-900"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit Essay</span>
              </button>
              <button
                onClick={() => onDeleteClick(article)}
                className="flex items-center gap-1.5 rounded-full border border-rose-300 px-4 py-1.5 text-xs font-semibold text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all cursor-pointer focus:outline-none dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Essay</span>
              </button>
            </div>
          )}
        </div>

        {/* Article Header */}
        <header className="space-y-4 text-center md:text-left">
          <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight text-editorial-ink dark:text-neutral-100 sm:text-4xl md:text-5xl lg:text-6xl">
            {article.title}
          </h1>

          {/* Author info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 py-6 border-y border-neutral-100 dark:border-neutral-800/80">
            <div className="flex items-center gap-3">
              <div>
                <div className="font-semibold text-neutral-855 dark:text-neutral-200">By {author.name}</div>
                <div className="text-xs text-neutral-400 dark:text-neutral-500">{formattedDate}</div>
              </div>
            </div>
            <div className="sm:ml-auto text-xs text-neutral-500 dark:text-neutral-400 max-w-md italic text-left sm:text-right">
              "{author.bio}"
            </div>
          </div>
        </header>

        {/* Article Core Layout (Centered Content Column) */}
        <div className="max-w-2xl mx-auto mt-8">
          {/* Main Body Column */}
          <article className="min-w-0">
            {contentBlocks.map((block, idx) => {
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
                    className="font-serif text-2xl font-bold mt-10 mb-4 text-editorial-ink dark:text-neutral-100"
                  >
                    {block.text}
                  </h2>
                );
              } else if (block.type === 'quote') {
                return (
                  <blockquote
                    key={idx}
                    className="border-l-4 border-editorial-gold pl-6 py-2 my-8 font-serif text-xl italic text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-900/40 rounded-r-lg"
                  >
                    "{block.text}"
                  </blockquote>
                );
              }
              return null;
            })}
          </article>
        </div>

        {/* Recommended Reading Section */}
        {recommendedArticles.length > 0 && (
          <section className="mt-16 border-t border-neutral-100 pt-16 dark:border-neutral-800/80">
            <h3 className="font-serif text-2xl font-bold mb-8 text-center md:text-left text-neutral-800 dark:text-neutral-200">
              Recommended Reading
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recommendedArticles.map(rec => {
                return (
                  <div
                    key={rec.id}
                    onClick={() => onArticleSelect(rec)}
                    className="group flex flex-col gap-4 p-5 rounded-xl border border-neutral-100 bg-white shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 dark:border-neutral-800 dark:bg-editorial-card-dark cursor-pointer"
                  >
                    <div className="flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-base leading-snug mt-1 group-hover:text-editorial-gold dark:text-neutral-100 transition-colors">
                          {rec.title}
                        </h4>
                      </div>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-3 block">
                        By {rec.author_name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
