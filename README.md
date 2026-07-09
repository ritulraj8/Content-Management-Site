# Artisite 🖋️

**Artisite** is a modern, high-performance Content Management System (CMS) designed for publishers, writers, and editorial platforms. It combines an elegant reading experience with powerful, cutting-edge AI capabilities.

Readers can not only browse and read beautiful long-form essays, but also **chat directly with the publication's content** using an integrated AI assistant powered by Llama 3 and pgvector.

---

## ✨ Key Features

- **🤖 Intelligent Chatbot (RAG)**: Ask questions about any published article! The AI assistant fetches the most relevant paragraphs from the database and answers strictly using your publication's knowledge.
- **⚡ Semantic Vector Search**: Powered by Neon Serverless PostgreSQL and `pgvector`, articles are automatically chunked and embedded in real-time when edited.
- **📝 Distraction-Free CMS**: A beautifully crafted React frontend utilizing Tailwind CSS and a curated typography scale for the ultimate reading and writing experience.
- **🔒 Secure Admin Portal**: JWT-based authentication to manage, draft, and delete articles safely.
- **🌓 Adaptive Theming**: Fully responsive with seamless Light and Dark mode transitions.

## 🛠️ Technology Stack

**Frontend (Client)**
- **React 19** + **Vite** for blazing fast rendering.
- **Tailwind CSS v4** for modern, utility-first styling.
- **Lucide React** for crisp, scalable iconography.

**Node Backend (Data API)**
- **Express.js** handling authentication, CRUD operations, and proxying.
- **Bcrypt & JWT** for password hashing and secure token management.
- **Neon Serverless Driver** for low-latency Postgres queries.

**Python Backend (AI Engine)**
- **Django** running the backend logic for the chatbot.
- **Llama-cpp-python** running *Llama-3.2-3B-Instruct* with Apple Metal GPU acceleration for fast text generation.
- **Sentence-Transformers** (`BAAI/bge-small-en-v1.5`) for text chunking and vector embeddings.
- **Psycopg2** for executing high-speed cosine distance (`<=>`) SQL queries.

---

## 🚀 Local Development Setup

To run this repository locally, you need to set up both the Node environment and the Python virtual environment.

### 1. Prerequisites
- Node.js & npm
- Python 3.10+
- A [Neon PostgreSQL](https://neon.tech) Database (with pgvector support enabled)

### 2. Environment Variables
Create a `.env` file in the root of the project with your database and JWT secrets:
```env
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/dbname"
JWT_SECRET="your-super-secret-key"
```

### 3. Node Setup
Install the necessary JavaScript dependencies:
```bash
npm install
```

### 4. Python Setup
Create and activate a virtual environment, then install the required Python libraries:
```bash
# Create a virtual environment
python -m venv .venv

# Activate it (Mac/Linux)
source .venv/bin/activate
# Or on Windows:
# .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 5. Running the App
**IMPORTANT:** Ensure your Python virtual environment is activated in your terminal! 

```bash
npm run dev
```

The `npm run dev` script will dynamically use your activated virtual environment's `python` command to start the Django AI server, while simultaneously booting up Vite and Express. 

---

## 🌍 Production Deployment

If deploying to a single-server monolithic platform (like Render, Railway, or a VPS):

1. **Build Command:**
   ```bash
   npm install && pip install -r requirements.txt && npm run build
   ```
2. **Start Command:**
   ```bash
   npm start
   ```

*The `npm start` command uses `concurrently` to run both the Node Server and the Django AI Server simultaneously, serving the built React assets efficiently in production.*
