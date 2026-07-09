import React, { useState, useEffect } from 'react';
import { ChevronDown, HelpCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Module-level singleton — ensures EXACTLY ONE HTTP request per page session.
// Persists across component remounts, React StrictMode double-invocations,
// and Vite HMR updates (within the same browser tab).
// ---------------------------------------------------------------------------
let _cache = null;   // null = not fetched yet; [] or [...] = fetched result
let _promise = null;   // deduplicates concurrent mount calls

export function bustFaqCache() {
  _cache = null;
  _promise = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bust-faq-cache'));
  }
}

function loadFaqs(force = false) {
  if (!force && _cache !== null) return Promise.resolve(_cache);
  if (!force && _promise) return _promise;

  // Clear stale state before fresh fetch
  _cache = null;
  _promise = fetch('/python-api/faqs/generate/')
    .then(res => {
      if (!res.ok) {
        return res.json()
          .catch(() => ({}))
          .then(b => { throw new Error(b.error || `Server error ${res.status}`); });
      }
      return res.json();
    })
    .then(data => {
      _cache = Array.isArray(data) ? data : [];
      _promise = null;
      return _cache;
    })
    .catch(err => {
      _promise = null;   // allow retry on next call
      throw err;
    });

  return _promise;
}

// ---------------------------------------------------------------------------
// FaqSection
// ---------------------------------------------------------------------------
export default function FaqSection() {
  // Initialise from cache so there's no flicker on re-mount
  const [faqData, setFaqData] = useState(_cache || []);
  const [loading, setLoading] = useState(_cache === null);
  const [error, setError] = useState('');
  const [openKey, setOpenKey] = useState(null);
  const [openArticle, setOpenArticle] = useState(0);

  // -------------------------------------------------------------------------
  // Load FAQs on mount (skips network if already cached)
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Already have data — nothing to do
    if (_cache !== null) {
      setFaqData(_cache);
      setLoading(false);
      return;
    }

    let cancelled = false;

    loadFaqs()
      .then(data => {
        if (cancelled) return;
        setFaqData(data);
        if (data.length > 0) setOpenArticle(0);
        setLoading(false);
      })
      .catch(err => {
        if (cancelled) return;
        console.error('FAQ fetch failed:', err);
        setError(err.message || 'Could not load FAQs. Make sure the Django FAQ server is running on port 8000.');
        setLoading(false);
      });

    // Cleanup: mark cancelled so stale setState calls are no-ops
    // (Does NOT abort the fetch — the singleton promise keeps it alive
    //  so the next mount can still use it from _promise.)
    return () => {
      cancelled = true;
    };
  }, []); // runs once per mount; module cache prevents duplicate network requests

  // -------------------------------------------------------------------------
  // Manual retry — clears module cache and re-fetches
  // -------------------------------------------------------------------------
  const handleRetry = () => {
    _cache = null;
    _promise = null;
    setError('');
    setLoading(true);

    loadFaqs(true)
      .then(data => {
        setFaqData(data);
        if (data.length > 0) setOpenArticle(0);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Could not load FAQs.');
        setLoading(false);
      });
  };

  // -------------------------------------------------------------------------
  // Listen for programmatic cache busting (e.g. from Admin save/delete)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const onBust = () => handleRetry();
    window.addEventListener('bust-faq-cache', onBust);
    return () => window.removeEventListener('bust-faq-cache', onBust);
  }, []); // empty deps because handleRetry doesn't depend on stale local state

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const toggleArticle = (idx) => setOpenArticle(openArticle === idx ? null : idx);
  const toggleFaq = (key) => setOpenKey(openKey === key ? null : key);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <section
      id="faq"
      className="w-full bg-editorial-paper border-t border-neutral-200/50 py-20 px-6 md:px-12 dark:bg-neutral-900/40 dark:border-neutral-800/80 transition-colors duration-300"
    >
      <div className="mx-auto max-w-3xl">

        {/* ---------- Section Header ---------- */}
        <div className="text-center mb-12">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-editorial-gold/10 text-editorial-gold-dark mb-4 dark:bg-editorial-gold/20 dark:text-editorial-gold-light">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-editorial-ink dark:text-neutral-100">
            Frequently Asked Questions
          </h2>
        </div>

        {/* ---------- Loading State ---------- */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-editorial-gold/20 flex items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-editorial-gold" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="font-serif text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Generating FAQs …
              </p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-xs">
                This may take a moment on first load.
              </p>
            </div>
          </div>
        )}

        {/* ---------- Error State ---------- */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200/60 bg-rose-50/50 dark:bg-rose-950/10 dark:border-rose-900/30 p-8 text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
            <div>
              <p className="font-serif text-base font-bold text-rose-700 dark:text-rose-400">
                Could not load FAQs
              </p>
              <p className="text-xs text-rose-500 dark:text-rose-500 mt-1 max-w-xs mx-auto">
                {error}
              </p>
            </div>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        )}

        {/* ---------- Empty State ---------- */}
        {!loading && !error && faqData.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
            <HelpCircle className="h-8 w-8 text-neutral-300 dark:text-neutral-600 mx-auto mb-3" />
            <p className="font-serif text-base font-bold text-neutral-500 dark:text-neutral-400">
              No articles found
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Publish some articles and FAQs will appear here automatically.
            </p>
          </div>
        )}

        {/* ---------- FAQ Groups (one per article) ---------- */}
        {!loading && !error && faqData.length > 0 && (
          <div className="space-y-5">
            {faqData.map((articleGroup, articleIdx) => {
              const isArticleOpen = openArticle === articleIdx;
              const faqs = Array.isArray(articleGroup.faqs) ? articleGroup.faqs : [];

              return (
                <div
                  key={articleGroup.article_id}
                  className="rounded-2xl border border-neutral-200/70 bg-white overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-md dark:border-neutral-800/60 dark:bg-editorial-card-dark"
                >
                  {/* Article Title Header — acts as accordion toggle */}
                  <button
                    id={`faq-article-${articleGroup.article_id}`}
                    onClick={() => toggleArticle(articleIdx)}
                    className="flex w-full items-center justify-between px-6 py-5 text-left cursor-pointer focus:outline-none group"
                    aria-expanded={isArticleOpen}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full bg-editorial-gold text-white text-[10px] font-bold">
                        {articleIdx + 1}
                      </span>
                      <span className="font-serif text-base md:text-lg font-bold text-editorial-ink dark:text-neutral-100 group-hover:text-editorial-gold dark:group-hover:text-editorial-gold-light transition-colors duration-200 truncate">
                        {articleGroup.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <ChevronDown
                        className={`h-4 w-4 text-neutral-400 dark:text-neutral-500 transition-transform duration-300 ${isArticleOpen ? 'rotate-180 text-editorial-gold' : ''
                          }`}
                      />
                    </div>
                  </button>

                  {/* Expandable FAQ list for this article */}
                  <div className={`faq-content ${isArticleOpen ? 'open' : ''}`}>
                    <div className="border-t border-neutral-100 dark:border-neutral-800/50 divide-y divide-neutral-100/60 dark:divide-neutral-800/40">
                      {faqs.length === 0 ? (
                        <p className="px-6 py-4 text-xs text-neutral-400 dark:text-neutral-500 italic">
                          No FAQs could be generated for this article.
                        </p>
                      ) : (
                        faqs.map((faq, faqIdx) => {
                          const key = `${articleIdx}-${faqIdx}`;
                          const isOpen = openKey === key;
                          return (
                            <div key={faqIdx}>
                              <button
                                id={`faq-item-${articleGroup.article_id}-${faqIdx}`}
                                onClick={() => toggleFaq(key)}
                                className="flex w-full items-center justify-between px-6 py-4 text-left cursor-pointer focus:outline-none hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors duration-150"
                                aria-expanded={isOpen}
                              >
                                <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 pr-4">
                                  {faq.question}
                                </span>
                                <ChevronDown
                                  className={`h-3.5 w-3.5 flex-shrink-0 text-neutral-400 dark:text-neutral-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-editorial-gold' : ''
                                    }`}
                                />
                              </button>
                              <div className={`faq-content ${isOpen ? 'open border-t border-neutral-100/60 dark:border-neutral-800/40' : ''}`}>
                                <p className="px-6 py-4 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-800/20">
                                  {faq.answer}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
