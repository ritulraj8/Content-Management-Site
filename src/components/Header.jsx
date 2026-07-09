import React from 'react';
import { Search, Moon, Sun, Compass, BookOpen, MessageCircle } from 'lucide-react';

export default function Header({
  searchQuery,
  setSearchQuery,
  activeArticle,
  setActiveArticle,
  darkMode,
  toggleDarkMode,
  isAdmin,
  onAdminLoginClick,
  onAdminLogout,
  onChatPageClick
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200/50 bg-editorial-cream/80 backdrop-blur-md transition-colors duration-300 dark:border-neutral-800/50 dark:bg-editorial-bg-dark/80">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-12">
        {/* Brand Logo */}
        <button
          onClick={() => {
            setActiveArticle(null);
          }}
          className="group flex items-center gap-2 cursor-pointer focus:outline-none"
        >
          <BookOpen className="h-6 w-6 text-editorial-gold group-hover:scale-105 transition-transform" />
          <span className="font-serif text-2xl font-bold tracking-tight text-editorial-ink dark:text-neutral-100">
            Artisite
          </span>
        </button>

        {/* Action bar */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Search bar - only show when on catalog home */}
          {!activeArticle && (
            <div className="relative hidden sm:block">
              <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search essays..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 md:w-64 rounded-full border border-neutral-200 bg-neutral-50 py-1.5 pl-9 pr-4 text-sm text-editorial-ink transition-all placeholder:text-neutral-400 focus:border-editorial-gold focus:bg-white focus:outline-none focus:ring-1 focus:ring-editorial-gold dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:border-editorial-gold dark:focus:bg-neutral-900"
              />
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex items-center gap-4">
            {/* Explore */}
            <button
              onClick={() => {
                setActiveArticle(null);
              }}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors focus:outline-none cursor-pointer ${
                !activeArticle
                  ? 'text-editorial-gold'
                  : 'text-neutral-500 hover:text-editorial-ink dark:text-neutral-400 dark:hover:text-neutral-200'
              }`}
            >
              <Compass className="h-4 w-4" />
              <span className="hidden md:inline">Explore</span>
            </button>

            <a
              href="#faq"
              onClick={(e) => {
                if (activeArticle) {
                  // Go home first then scroll
                  setActiveArticle(null);
                  setTimeout(() => {
                    const faqEl = document.getElementById('faq');
                    if (faqEl) faqEl.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                } else {
                  e.preventDefault();
                  const faqEl = document.getElementById('faq');
                  if (faqEl) faqEl.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-sm font-medium text-neutral-500 hover:text-editorial-ink dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
            >
              FAQ
            </a>

            <button
              onClick={onChatPageClick}
              className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-editorial-ink dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors focus:outline-none cursor-pointer"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden md:inline">Chat</span>
            </button>
          </nav>

          <span className="h-5 w-px bg-neutral-200 dark:bg-neutral-800"></span>

          {/* Admin Login / Sign Out Button */}
          {isAdmin ? (
            <button
              onClick={onAdminLogout}
              className="text-xs font-bold rounded-full bg-rose-50 px-4 py-2 text-rose-600 border border-rose-100 hover:bg-rose-100/50 cursor-pointer focus:outline-none dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={onAdminLoginClick}
              className="text-xs font-bold rounded-full border border-neutral-200 px-4 py-2 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 cursor-pointer focus:outline-none transition-colors"
            >
              Admin Login
            </button>
          )}

          <span className="h-5 w-px bg-neutral-200 dark:bg-neutral-800"></span>

          {/* Dark Mode Switch */}
          <button
            onClick={toggleDarkMode}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-900 cursor-pointer focus:outline-none"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="h-4.5 w-4.5 text-editorial-gold" /> : <Moon className="h-4.5 w-4.5 text-neutral-600" />}
          </button>
        </div>
      </div>

      {/* Mobile search bar dropdown */}
      {!activeArticle && (
        <div className="border-t border-neutral-200/50 px-6 py-3 sm:hidden dark:border-neutral-800/50">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-neutral-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search essays..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-1.5 pl-9 pr-4 text-sm text-editorial-ink transition-all placeholder:text-neutral-400 focus:border-editorial-gold focus:bg-white focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:focus:border-editorial-gold dark:focus:bg-neutral-900"
            />
          </div>
        </div>
      )}
    </header>
  );
}
