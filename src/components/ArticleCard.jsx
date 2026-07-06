import React from 'react';
import { ArrowRight, Edit2, Trash2 } from 'lucide-react';

export default function ArticleCard({
  article,
  onClick,
  isAdmin,
  onEditClick,
  onDeleteClick
}) {
  const { title, content, author_name, created_date } = article;

  const description = content && content.length > 200 
    ? content.slice(0, 200).trim() + '...' 
    : content || 'No content written yet.';

  const formattedDate = created_date 
    ? new Date(created_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'Unknown Date';

  return (
    <article
      onClick={onClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-200/80 hover:shadow-md dark:border-neutral-800 dark:bg-editorial-card-dark dark:hover:border-neutral-700/80 cursor-pointer"
    >
      <div>
        {/* Admin Actions */}
        {isAdmin && (
          <div className="flex justify-end gap-2 mb-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditClick(article);
              }}
              className="flex items-center gap-1 rounded-full bg-neutral-50 hover:bg-editorial-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-editorial-ink dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-editorial-gold dark:hover:text-neutral-900 cursor-pointer focus:outline-none transition-colors border border-neutral-100 dark:border-neutral-700"
              title="Edit article"
            >
              <Edit2 className="h-3 w-3" /> Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick(article);
              }}
              className="flex items-center gap-1 rounded-full bg-rose-50 hover:bg-rose-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:text-white dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-500 dark:hover:text-white cursor-pointer focus:outline-none transition-colors border border-rose-100 dark:border-rose-900/30"
              title="Delete article"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        )}

        {/* Title & Description */}
        <div className={isAdmin ? "" : "mt-2"}>
          <h3 className="font-serif text-xl font-bold leading-snug text-editorial-ink transition-colors duration-200 group-hover:text-editorial-gold dark:text-neutral-100 dark:group-hover:text-editorial-gold-light">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-3">
            {description}
          </p>
        </div>
      </div>

      {/* Author & Footer */}
      <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4 dark:border-neutral-800/80">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
            By {author_name || 'Anonymous'}
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            {formattedDate}
          </span>
        </div>

        {/* Read Button */}
        <span className="flex items-center gap-1 text-xs font-bold text-editorial-gold dark:text-editorial-gold-light opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
          Read Essay <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </article>
  );
}
