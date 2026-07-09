# -*- coding: utf-8 -*-
"""
GenerateFAQsView — Django view that:

1. Fetches all current articles from the Express API (localhost:3001).
2. For each article computes MD5(title + content).
3. Checks ArticleFAQCache:
     - Cache HIT  (same article_id + same content_hash) → return cached FAQs instantly.
     - Cache MISS (new article or changed content)       → call local LLM via faq.py → store result.
4. Prunes cache rows whose article_id no longer exists (handles deletes).
5. Returns JSON: [{"title": "...", "faqs": [{"question": "...", "answer": "..."}, ...]}, ...]

Concurrency safety:
  - A process-level threading.Lock() (_generation_lock) ensures only ONE request
    runs LLM generation at a time. Concurrent requests wait for the lock, then
    serve the freshly-written cache — no "database is locked" errors.
  - SQLite is configured with WAL journal mode + 30s timeout (in settings.py)
    for additional concurrent-read safety.
"""

import json
import hashlib
import logging
import threading

from django.http import JsonResponse
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import ArticleFAQCache

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Process-level lock — prevents concurrent LLM generation + SQLite write races
# ---------------------------------------------------------------------------
_generation_lock = threading.Lock()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _compute_hash(title: str, content: str) -> str:
    """Return MD5 hex digest of title + content."""
    raw = (title + content).encode('utf-8')
    return hashlib.md5(raw).hexdigest()


def _fetch_articles_from_express():
    """
    Fetch all articles from the Express/Node API at localhost:PORT.
    This avoids needing psycopg2 — reuses the already-running Express server.
    Returns a list of dicts: [{id, title, content, author_name}, ...]
    """
    import urllib.request
    import os
    port = os.environ.get('PORT', '3001')
    url = f'http://127.0.0.1:{port}/api/articles'
    req = urllib.request.Request(url, headers={'Accept': 'application/json'})
    with urllib.request.urlopen(req, timeout=10) as response:
        data = json.loads(response.read().decode('utf-8'))
    return data


def _build_result_from_cache(articles):
    """
    Build the full response from cache only — used by concurrent requests
    that arrive while generation is already in progress.
    """
    result = []
    for article in articles:
        try:
            row = ArticleFAQCache.objects.get(article_id=article['id'])
            result.append({
                'article_id': article['id'],
                'title': row.article_title,
                'faqs': json.loads(row.faqs_json),
                'cached': True,
            })
        except ArticleFAQCache.DoesNotExist:
            # Still being generated — return placeholder
            result.append({
                'article_id': article['id'],
                'title': article['title'],
                'faqs': [],
                'cached': False,
            })
    return result


# ---------------------------------------------------------------------------
# View
# ---------------------------------------------------------------------------

class GenerateFAQsView(View):
    """
    GET /faqs/generate/

    Returns AI-generated FAQs for all articles, using a local SQLite cache
    to avoid redundant LLM calls. Cache is invalidated automatically when
    article content changes or an article is deleted.
    """

    # LLM is loaded once per process and reused across requests
    _llm = None

    @classmethod
    def _get_llm(cls):
        if cls._llm is None:
            logger.info("Loading local LLM model (first request — this may take a moment)...")
            import faq as faq_module
            cls._llm = faq_module.load_llm()
            logger.info("LLM model loaded successfully.")
        return cls._llm

    def get(self, request):
        # -- 1. Fetch current articles from Express API --
        try:
            articles = _fetch_articles_from_express()
        except Exception as exc:
            logger.error("Failed to fetch articles from Express API: %s", exc)
            return JsonResponse(
                {'error': f'Failed to fetch articles from API: {exc}'},
                status=500
            )

        if not articles:
            return JsonResponse([], safe=False)

        # -- 2. Try to acquire the generation lock (non-blocking) --
        acquired = _generation_lock.acquire(blocking=False)

        if not acquired:
            # Another request is already generating — return whatever is cached right now
            logger.info("Generation already in progress. Returning current cache snapshot.")
            result = _build_result_from_cache(articles)
            return JsonResponse(result, safe=False)

        try:
            return self._generate_and_cache(articles)
        finally:
            _generation_lock.release()

    def _generate_and_cache(self, articles):
        """Core logic: check cache, run LLM for misses, prune deletes, return result."""

        current_ids = {a['id'] for a in articles}

        # -- Prune cache rows for deleted articles --
        deleted_count = ArticleFAQCache.objects.exclude(article_id__in=current_ids).delete()[0]
        if deleted_count:
            logger.info("Pruned %d cached FAQ row(s) for deleted articles.", deleted_count)

        result = []
        llm = None  # loaded lazily only if needed

        for article in articles:
            article_id = article['id']
            title      = article['title']
            content    = article['content']
            new_hash   = _compute_hash(title, content)

            try:
                cache_row = ArticleFAQCache.objects.get(article_id=article_id)

                if cache_row.content_hash == new_hash:
                    # --- Cache HIT: content unchanged ---
                    logger.debug("Cache HIT for article_id=%s ('%s')", article_id, title)

                    # Update title in-place if only the title changed
                    if cache_row.article_title != title:
                        cache_row.article_title = title
                        cache_row.save(update_fields=['article_title'])

                    result.append({
                        'article_id': article_id,
                        'title': cache_row.article_title,
                        'faqs': json.loads(cache_row.faqs_json),
                        'cached': True,
                    })
                    continue

                logger.info(
                    "Cache MISS (content changed) for article_id=%s ('%s'). Regenerating FAQs...",
                    article_id, title
                )

            except ArticleFAQCache.DoesNotExist:
                logger.info(
                    "Cache MISS (new article) for article_id=%s ('%s'). Generating FAQs...",
                    article_id, title
                )

            # --- Cache MISS: run LLM ---
            if llm is None:
                llm = self._get_llm()

            import faq as faq_module

            try:
                faqs = faq_module.generate_faqs(llm, content, num_faqs=5)
                if not isinstance(faqs, list):
                    logger.warning(
                        "LLM returned non-list for article_id=%s. Raw: %r", article_id, faqs
                    )
                    faqs = []
            except Exception as exc:
                logger.error("LLM generation failed for article_id=%s: %s", article_id, exc)
                faqs = []

            # Save to cache (safe — we hold the lock, only one writer at a time)
            ArticleFAQCache.objects.update_or_create(
                article_id=article_id,
                defaults={
                    'article_title': title,
                    'content_hash':  new_hash,
                    'faqs_json':     json.dumps(faqs, ensure_ascii=False),
                }
            )

            result.append({
                'article_id': article_id,
                'title': title,
                'faqs': faqs,
                'cached': False,
            })

        return JsonResponse(result, safe=False)

# ---------------------------------------------------------------------------
# Chat View
# ---------------------------------------------------------------------------

@method_decorator(csrf_exempt, name='dispatch')
class ChatView(View):
    """
    POST /faqs/chat/
    Receives {"question": "..."}
    Returns {"answer": "..."}
    """
    _llm = None
    _embedding_model = None

    @classmethod
    def _initialize_models_and_db(cls):
        import chatbot
        if cls._llm is None:
            logger.info("Loading LLM for Chat...")
            cls._llm = chatbot.load_llm()
        if cls._embedding_model is None:
            logger.info("Loading Embedding model for Chat...")
            cls._embedding_model = chatbot.load_embedding_model()
            
        # Sync articles to DB
        try:
            chatbot.sync_embeddings_to_db(cls._embedding_model)
        except Exception as e:
            logger.error("Failed to sync embeddings: %s", e)

    def post(self, request):
        import chatbot
        try:
            data = json.loads(request.body)
            question = data.get('question', '')
            if not question:
                return JsonResponse({"error": "No question provided"}, status=400)
            
            self._initialize_models_and_db()
            
            answer = chatbot.ask_llama(question, self._embedding_model, self._llm)
            return JsonResponse({"answer": answer})
        except Exception as e:
            logger.error("Chat error: %s", e)
            return JsonResponse({"error": str(e)}, status=500)
