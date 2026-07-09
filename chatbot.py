import os
import psycopg2
import urllib.request
import json
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer
from huggingface_hub import hf_hub_download
from llama_cpp import Llama
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ.get('DATABASE_URL')

# -------------------------------------------------
# Split articles into chunks
# -------------------------------------------------

def chunk_text(text, chunk_size=200):
    words = text.split()
    return [
        " ".join(words[i:i + chunk_size])
        for i in range(0, len(words), chunk_size)
    ]

# -------------------------------------------------
# Load Models
# -------------------------------------------------

def load_embedding_model():
    return SentenceTransformer("BAAI/bge-small-en-v1.5")

def load_llm():
    model_path = hf_hub_download(
        repo_id="bartowski/Llama-3.2-3B-Instruct-GGUF",
        filename="Llama-3.2-3B-Instruct-Q4_K_M.gguf"
    )
    llm = Llama(
        model_path=model_path,
        n_ctx=2048,
        n_threads=8,
        n_gpu_layers=-1,
        verbose=False
    )
    return llm

# -------------------------------------------------
# Database Operations
# -------------------------------------------------

def get_db_connection():
    if not DB_URL:
        raise ValueError("DATABASE_URL environment variable is not set")
    conn = psycopg2.connect(DB_URL)
    register_vector(conn)
    return conn

def sync_embeddings_to_db(embedding_model):
    """
    Checks Neon PostgreSQL for new or updated articles, deletes old embeddings if updated,
    chunks them, generates embeddings, and stores them.
    """
    conn = get_db_connection()
    cur = conn.cursor()

    # Find articles that are new or modified since their embeddings were created
    cur.execute("""
        SELECT a.id, a.content, a.title, a.author_name 
        FROM articles a
        LEFT JOIN (
            SELECT article_id, MAX(created_date) as max_embed_date 
            FROM article_embeddings 
            GROUP BY article_id
        ) e ON a.id = e.article_id
        WHERE e.article_id IS NULL OR a.modified_date > e.max_embed_date
    """)
    outdated_articles = cur.fetchall()

    if not outdated_articles:
        print("No new or updated articles to embed.")
        cur.close()
        conn.close()
        return

    # Delete old embeddings for updated articles
    outdated_ids = tuple(row[0] for row in outdated_articles)
    if outdated_ids:
        cur.execute("DELETE FROM article_embeddings WHERE article_id IN %s", (outdated_ids,))
        conn.commit()
        print(f"Deleted old embeddings for article IDs: {outdated_ids}")

    new_chunks = []
    
    for article_id, content, title, author in outdated_articles:
        if not content:
            continue
            
        chunks = chunk_text(content)
        
        for chunk in chunks:
            # Prepend context to every chunk so the LLM knows what article this is
            enriched_chunk = f"Article Title: {title}\nAuthor: {author}\n\nContent: {chunk}"
            new_chunks.append({
                'article_id': article_id,
                'chunk_text': enriched_chunk
            })

    if not new_chunks:
        print("No valid chunks to embed.")
        cur.close()
        conn.close()
        return

    print(f"Generating embeddings for {len(new_chunks)} new chunks...")
    texts = [c['chunk_text'] for c in new_chunks]
    
    embeddings = embedding_model.encode(
        texts,
        convert_to_numpy=True,
        normalize_embeddings=True
    )

    print("Inserting into Neon database...")
    for i, chunk_data in enumerate(new_chunks):
        embedding_list = embeddings[i].tolist()
        cur.execute(
            """
            INSERT INTO article_embeddings (article_id, chunk_text, embedding)
            VALUES (%s, %s, %s)
            """,
            (chunk_data['article_id'], chunk_data['chunk_text'], embedding_list)
        )
    
    conn.commit()
    cur.close()
    conn.close()
    print("Done syncing embeddings.")

# -------------------------------------------------
# Retrieve relevant chunks from Neon
# -------------------------------------------------

def retrieve_from_db(question, embedding_model, top_k=3):
    query_embedding = embedding_model.encode(
        [question],
        normalize_embeddings=True
    )[0].tolist()

    conn = get_db_connection()
    cur = conn.cursor()

    # Use cosine distance <=> operator supported by pgvector
    # Order by distance (smaller is more similar)
    cur.execute(
        """
        SELECT chunk_text, (embedding <=> %s::vector) AS distance
        FROM article_embeddings
        ORDER BY distance
        LIMIT %s
        """,
        (query_embedding, top_k)
    )
    
    results = cur.fetchall()
    cur.close()
    conn.close()

    retrieved_chunks = [row[0] for row in results]
    scores = [1.0 - row[1] for row in results] # Convert distance to similarity score
    
    return retrieved_chunks, scores

# -------------------------------------------------
# Generate answer
# -------------------------------------------------

def ask_llama(question, embedding_model, llm, threshold=0.3):
    retrieved_chunks, scores = retrieve_from_db(
        question,
        embedding_model
    )

    if not scores or scores[0] < threshold:
        return "I don't know based on the provided articles."

    context = "\n\n".join(retrieved_chunks)

    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are a precise retrieval-based assistant. Answer ONLY using the provided Context. 
If the answer is not explicitly stated in the Context, reply exactly: "I don't know based on the provided articles." 
Do not guess. Do not add conversational filler. Be extremely brief and direct.<|eot_id|><|start_header_id|>user<|end_header_id|>
Context:
{context}

Question: {question}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
"""

    output = llm(
        prompt,
        temperature=0.1,
        max_tokens=150,
        stop=["<|eot_id|>", "Question:", "user:", "User:"]
    )

    return output["choices"][0]["text"].strip()
