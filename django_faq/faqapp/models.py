# -*- coding: utf-8 -*-
"""
ArticleFAQCache — local SQLite table that caches LLM-generated FAQs.

Cache invalidation rules:
  - Article updated (content/title changed) : content_hash changes → row overwritten → LLM re-runs
  - Article deleted                          : row pruned on next /faqs/generate/ request
  - Article unchanged                        : cache HIT → FAQs returned instantly, no LLM call
"""

from django.db import models


class ArticleFAQCache(models.Model):
    """Caches LLM-generated FAQs for a single article."""

    article_id = models.IntegerField(
        unique=True,
        help_text="ID of the article in the Neon PostgreSQL articles table."
    )
    article_title = models.CharField(
        max_length=500,
        help_text="Stored so the frontend can display the title without hitting Neon again."
    )
    content_hash = models.CharField(
        max_length=64,
        help_text="MD5 hex digest of (title + content). Cache is invalidated when this changes."
    )
    faqs_json = models.TextField(
        help_text='JSON array: [{"question": "...", "answer": "..."}, ...]'
    )
    generated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp of the last LLM generation run for this article."
    )

    class Meta:
        db_table = 'article_faq_cache'
        ordering = ['article_id']

    def __str__(self):
        return f"FAQCache(article_id={self.article_id}, title={self.article_title!r})"
