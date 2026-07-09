import os
import psycopg2
from dotenv import load_dotenv
from pgvector.psycopg2 import register_vector

load_dotenv()
db_url = os.environ.get('DATABASE_URL')

if not db_url:
    print("No DATABASE_URL found in .env")
    exit(1)

conn = psycopg2.connect(db_url)
conn.autocommit = True
cur = conn.cursor()

print("Enabling pgvector extension...")
cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")

register_vector(conn)

print("Dropping existing article_embeddings table (if exists)...")
cur.execute("DROP TABLE IF EXISTS article_embeddings;")

print("Creating article_embeddings table with chunking support...")
cur.execute("""
CREATE TABLE article_embeddings (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(384) NOT NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_article
        FOREIGN KEY (article_id)
        REFERENCES articles(id)
        ON DELETE CASCADE
);
""")

print("Done setting up the database table!")
cur.close()
conn.close()
