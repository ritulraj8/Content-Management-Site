import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ArticleCard from './components/ArticleCard';
import ArticleView from './components/ArticleView';
import AdminLogin from './components/AdminLogin';
import ArticleEditor from './components/ArticleEditor';
import FaqSection, { bustFaqCache } from './components/FaqSection';
import { Sparkles, X, Plus, Loader2, Edit2, Trash2, ArrowRight } from 'lucide-react';
import './App.css';

function App() {
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  
  const [view, setView] = useState('explore'); // 'explore' | 'article-detail' | 'admin-login' | 'admin-edit'
  const [activeArticle, setActiveArticle] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('artisite_dark_mode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Admin authentication state
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('artisite_admin_token') || null);
  const isAdmin = !!adminToken;

  // Sync dark mode class on HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('artisite_dark_mode', darkMode);
  }, [darkMode]);

  // Fetch articles from backend API
  const fetchArticles = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const res = await fetch('/api/articles');
      if (!res.ok) {
        throw new Error('Failed to retrieve essays from the database');
      }
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      console.error('Fetch articles failed:', err);
      setFetchError(err.message || 'Could not connect to the editorial database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleBackToExplore = () => {
    setView('explore');
    setActiveArticle(null);
    setEditingArticle(null);
  };

  const handleEditClick = (article) => {
    setEditingArticle(article);
    setView('admin-edit');
  };

  const handleDeleteArticle = async (article) => {
    if (!window.confirm(`Are you sure you want to delete "${article.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete article');
        return;
      }
      // If we were viewing the deleted article, go back to explore
      if (activeArticle && activeArticle.id === article.id) {
        setActiveArticle(null);
        setView('explore');
      }
      fetchArticles();
      bustFaqCache(); // Invalidate FAQs so they update on next view
    } catch (err) {
      alert('An error occurred while deleting the article.');
    }
  };

  const handleAdminLoginClick = () => {
    setView('admin-login');
    setActiveArticle(null);
    setEditingArticle(null);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('artisite_admin_token');
    localStorage.removeItem('artisite_admin_user');
    setAdminToken(null);
    setView('explore');
  };

  const handleLoginSuccess = (token) => {
    setAdminToken(token);
    setView('explore');
  };

  const handleSaveSuccess = (savedArticle) => {
    // Refresh the article collection
    fetchArticles();
    bustFaqCache(); // Invalidate FAQs so they update on next view

    if (savedArticle === null) {
      // Meaning article was deleted
      setActiveArticle(null);
      setView('explore');
    } else {
      // Navigate straight to the updated article details
      setActiveArticle(savedArticle);
      setView('article-detail');
    }
  };

  const handleArticleSelect = (article) => {
    setActiveArticle(article);
    setView('article-detail');
  };

  // Filter articles based on search query
  const filteredArticles = articles.filter((article) => {
    return (
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.author_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Separate featured article if we are on the default explore view with no search filters active
  const isDefaultView = searchQuery === '';
  
  // Choose article with index 0 as featured if default explore view is active
  const featuredArticle = isDefaultView && filteredArticles.length > 0 
    ? filteredArticles[0]
    : null;
    
  const standardArticles = featuredArticle 
    ? filteredArticles.filter(a => a.id !== featuredArticle.id) 
    : filteredArticles;

  return (
    <div className="min-h-screen bg-editorial-cream text-editorial-ink transition-colors duration-300 dark:bg-editorial-bg-dark dark:text-neutral-200">
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeArticle={view === 'article-detail'}
        setActiveArticle={handleBackToExplore}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        isAdmin={isAdmin}
        onAdminLoginClick={handleAdminLoginClick}
        onAdminLogout={handleAdminLogout}
      />

      <main className="mx-auto max-w-7xl px-6 py-8 md:px-12 md:py-12">
        {isLoading ? (
          // Loading State
          <div className="flex flex-col items-center justify-center py-40 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-editorial-gold" />
            <p className="font-serif italic text-sm text-neutral-400 dark:text-neutral-500">
              Retrieving the latest perspectives...
            </p>
          </div>
        ) : fetchError ? (
          // Fetch Error State
          <div className="text-center py-20 max-w-md mx-auto space-y-4">
            <div className="rounded-full bg-rose-50 p-4 inline-block text-rose-500 dark:bg-rose-950/20">
              <X className="h-8 w-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-neutral-800 dark:text-neutral-200">
              Database Connection Failed
            </h3>
            <p className="text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
              {fetchError}. Please verify that the database container is online and your environment variables are configured.
            </p>
            <button
              onClick={fetchArticles}
              className="rounded-xl bg-editorial-charcoal px-5 py-2.5 text-xs font-bold text-white hover:bg-editorial-gold dark:bg-neutral-800 dark:hover:bg-editorial-gold cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : view === 'admin-login' ? (
          // Admin Login Page
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onBack={handleBackToExplore}
          />
        ) : view === 'admin-edit' ? (
          // Admin Article Creator & Editor Page
          <ArticleEditor
            article={editingArticle}
            adminToken={adminToken}
            onSaveSuccess={handleSaveSuccess}
            onCancel={handleBackToExplore}
          />
        ) : view === 'article-detail' && activeArticle ? (
          // Immersive Reading Page
          <ArticleView
            article={activeArticle}
            allArticles={articles}
            onBack={handleBackToExplore}
            onArticleSelect={handleArticleSelect}
            isAdmin={isAdmin}
            onEditClick={handleEditClick}
            onDeleteClick={handleDeleteArticle}
          />
        ) : (
          // Explore View (Grid of articles from database)
          <div className="space-y-12 animate-fadeIn">
            {/* Header Jumbotron */}
            <div className="text-center py-6 md:py-10 space-y-4">
              <h2 className="font-serif text-4xl md:text-6xl font-bold tracking-tight text-editorial-ink dark:text-neutral-100">
                The Artisite Gazette
              </h2>
              <p className="text-neutral-500 max-w-lg mx-auto text-sm md:text-base dark:text-neutral-400 font-medium">
                Thoughtful analysis, design histories, and scientific queries written for digital curators.
              </p>
            </div>

            {/* Admin Controls Divider */}
            {isAdmin && (
              <div className="flex justify-end border-b border-neutral-200/50 pb-5 dark:border-neutral-800/80">
                <button
                  onClick={() => {
                    setEditingArticle(null);
                    setView('admin-edit');
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-editorial-charcoal px-5 py-2.5 text-xs font-bold text-white hover:bg-editorial-gold dark:bg-neutral-800 dark:hover:bg-editorial-gold dark:hover:text-neutral-900 cursor-pointer focus:outline-none transition-all shadow-sm shrink-0"
                >
                  <Plus className="h-4 w-4" /> Write New Essay
                </button>
              </div>
            )}

            {/* Empty State */}
            {filteredArticles.length === 0 && (
              <div className="text-center py-20 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 animate-fadeIn">
                <h3 className="font-serif text-lg font-bold text-neutral-800 dark:text-neutral-200">
                  No essays found
                </h3>
                <p className="text-neutral-400 text-sm max-w-xs mx-auto mt-1 dark:text-neutral-500">
                  Try adjusting your query to discover related topics.
                </p>
              </div>
            )}

            {/* Featured Post Card */}
            {featuredArticle && (
              <section 
                onClick={() => handleArticleSelect(featuredArticle)}
                className="group relative rounded-2xl border border-neutral-100 bg-white p-8 shadow-sm hover:shadow-md transition-all duration-300 hover:border-neutral-200 dark:border-neutral-800 dark:bg-editorial-card-dark cursor-pointer animate-fadeIn"
              >
                <div className="absolute top-8 left-8 z-10 flex items-center gap-1 bg-editorial-gold text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md shadow-sm">
                  <Sparkles className="h-3 w-3" /> Featured Essay
                </div>

                <div className="flex flex-col justify-between py-2 pt-8">
                  <div className="space-y-4">


                    <h3 className="font-serif text-2xl md:text-4xl font-bold leading-tight text-editorial-ink dark:text-neutral-100 group-hover:text-editorial-gold dark:group-hover:text-editorial-gold-light transition-colors duration-200">
                      {featuredArticle.title}
                    </h3>

                    <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed line-clamp-3">
                      {featuredArticle.content.slice(0, 300).trim() + '...'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 pt-6 mt-6 dark:border-neutral-800">
                    <div className="flex flex-col">
                      <div className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                        By {featuredArticle.author_name}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        {new Date(featuredArticle.created_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(featuredArticle);
                            }}
                            className="flex h-9 items-center gap-1 px-3.5 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-editorial-gold dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 cursor-pointer"
                            title="Edit essay"
                          >
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteArticle(featuredArticle);
                            }}
                            className="flex h-9 items-center gap-1 px-3.5 rounded-full border border-rose-200 text-xs font-semibold text-rose-500 hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white cursor-pointer transition-colors"
                            title="Delete essay"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
                          </button>
                        </div>
                      )}
                      <span className="flex items-center gap-1 text-xs font-bold text-editorial-gold dark:text-editorial-gold-light opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
                        Read Featured Essay <ArrowRight className="h-3 w-3 inline" />
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Standard Grid of remaining essays */}
            {standardArticles.length > 0 && (
              <section className="space-y-6">
                {isDefaultView && (
                  <h3 className="font-serif text-xl font-bold text-neutral-800 dark:text-neutral-200 border-l-2 border-editorial-gold pl-3">
                    Recent Perspectives
                  </h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {standardArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onClick={() => handleArticleSelect(article)}
                      isAdmin={isAdmin}
                      onEditClick={handleEditClick}
                      onDeleteClick={handleDeleteArticle}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* Render FAQ section only when viewing catalog home */}
      {view !== 'admin-login' && view !== 'admin-edit' && view !== 'article-detail' && (
        <FaqSection />
      )}
    </div>
  );
}

export default App;
