# StudySpark

**StudySpark** is a full-stack multi-agent AI web application that enables users to upload documents, ask custom questions, and generate quizzes using Retrieval-Augmented Generation (RAG) powered by FAISS and OpenAI.

---

### Tech Stack

- **Frontend**: React + Vite  
- **Backend**: FastAPI  
- **LLM Integration**: OpenAI via LangChain  
- **Embeddings**: OpenAI Text Embeddings  
- **Vector Store**: FAISS  
- **PDF Parsing**: PyMuPDF (fitz)

---

### Prerequisites

- Node.js (for frontend)
- Python 3.10+ (for backend)
- OpenAI API key

---

### Clone the Repository

```bash
git clone https://github.com/your-username/StudySpark.git
cd StudySpark
```

---

### Setup Environment Variables

1. Create a `.env` file inside the `backend/` directory.
2. Add the following line:

```env
OPENAI_API_KEY=your_openai_api_key
```

3. Ensure `.env` is listed in `.gitignore`.

---

### Running the Application

#### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend (React)

```bash
cd frontend
npm install
npm run dev
```
