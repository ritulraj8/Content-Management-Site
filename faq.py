# -*- coding: utf-8 -*-
"""
faq.py — LLM-powered FAQ generator.

Articles are fetched from the database by the Django view (faqapp/views.py)
and passed directly into generate_faqs() / generate_all_faqs().
This file contains only the LLM loading and FAQ generation logic.
"""

import json
from huggingface_hub import hf_hub_download
from llama_cpp import Llama


# ------------------------------------------------------------------
# Load Llama Model
# ------------------------------------------------------------------

def load_llm():
    model_path = hf_hub_download(
        repo_id="bartowski/Llama-3.2-3B-Instruct-GGUF",
        filename="Llama-3.2-3B-Instruct-Q4_K_M.gguf"
    )

    llm = Llama(
        model_path=model_path,
        n_ctx=2048,
        n_gpu_layers=-1,   # Offload ALL layers to Apple M2 Metal GPU (5–10x faster)
        n_batch=512,       # Larger batch = better GPU throughput
        n_threads=2,       # CPU only handles non-GPU work; 2 is plenty
        verbose=False
    )

    return llm


# ------------------------------------------------------------------
# Prompt Builder
# ------------------------------------------------------------------

# Max chars of article content sent to LLM to avoid context overflow
_MAX_CONTENT_CHARS = 1500


def build_prompt(article_content, num_faqs=5):
    # Truncate to avoid exceeding context window
    truncated = article_content.strip()[:_MAX_CONTENT_CHARS]
    return (
        f"Generate exactly {num_faqs} FAQs as a JSON array from the article below.\n"
        f"Return ONLY a valid JSON array with 'question' and 'answer' keys. No explanation.\n\n"
        f"Article: {truncated}\n\n"
        f"JSON:"
    )


# ------------------------------------------------------------------
# Generate FAQs for One Article
# ------------------------------------------------------------------

def generate_faqs(llm, article_content, num_faqs=5):
    """
    Generate FAQs for a single article.

    Args:
        llm           : Loaded Llama instance from load_llm().
        article_content (str): The body text of the article.
        num_faqs      (int): Number of FAQs to generate (default 5).

    Returns:
        list[dict]: [{"question": "...", "answer": "..."}, ...]
                    Returns an empty list on parse failure.
    """
    prompt = build_prompt(article_content, num_faqs)

    response = llm.create_completion(
        prompt=prompt,
        temperature=0,
        max_tokens=600,
        stop=["\n\n\n"],
    )

    content = response["choices"][0]["text"]

    try:
        parsed = json.loads(content)
        if isinstance(parsed, list):
            return parsed
        return []
    except json.JSONDecodeError:
        # Try to extract JSON array from raw LLM output
        try:
            start = content.index('[')
            end   = content.rindex(']') + 1
            return json.loads(content[start:end])
        except (ValueError, json.JSONDecodeError):
            return []


# ------------------------------------------------------------------
# Generate FAQs for All Articles
# ------------------------------------------------------------------

def generate_all_faqs(llm, articles, num_faqs=5):
    """
    Generate FAQs for a list of articles.

    Args:
        llm      : Loaded Llama instance from load_llm().
        articles : list of dicts — each must have 'id', 'title', and 'content' keys.
                   Articles are fetched from the database by the Django view.
        num_faqs : Number of FAQs per article (default 5).

    Returns:
        list[dict]: [
            {
                "article_id": <int>,
                "title": <str>,
                "faqs": [{"question": "...", "answer": "..."}, ...]
            },
            ...
        ]
    """
    all_faqs = []

    for article in articles:
        article_id = article.get('id', 0)
        title      = article.get('title', f'Article {article_id}')
        content    = article.get('content', '')

        print(f"Generating FAQs for: {title!r} (id={article_id})...")

        faqs = generate_faqs(llm, content, num_faqs)

        all_faqs.append({
            "article_id": article_id,
            "title": title,
            "faqs": faqs,
        })

    return all_faqs


# ------------------------------------------------------------------
# Display FAQs (CLI helper)
# ------------------------------------------------------------------

def display_faqs(all_faqs):
    for entry in all_faqs:
        print("=" * 70)
        print(f"Article {entry['article_id']}: {entry['title']}")
        print("=" * 70)

        faqs = entry.get("faqs", [])
        if isinstance(faqs, list) and faqs:
            for i, faq in enumerate(faqs, 1):
                print(f"\nQ{i}: {faq.get('question', '')}")
                print(f"A{i}: {faq.get('answer', '')}")
        else:
            print("No FAQs generated.")

        print()


# ------------------------------------------------------------------
# Main — for standalone CLI testing only.
# In production, articles come from the Django view via the database.
# ------------------------------------------------------------------

if __name__ == "__main__":
    # Example: pass a sample article dict for quick smoke-testing
    sample_articles = [
        {
            "id": 0,
            "title": "Test Article",
            "content": (
                "Artificial intelligence (AI) refers to the simulation of human intelligence "
                "in machines that are programmed to think and learn. AI is used in many fields "
                "including healthcare, finance, and transportation. Machine learning, a subset of AI, "
                "enables computers to learn from data without explicit programming."
            )
        }
    ]

    llm = load_llm()
    all_faqs = generate_all_faqs(llm, sample_articles, num_faqs=5)
    display_faqs(all_faqs)