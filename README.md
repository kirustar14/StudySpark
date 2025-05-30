StudySpark is a full-stack multi-agent AI web app that allows users to upload documents, ask custom
questions, and generate quizzes using Retrieval-Augmented Generation (RAG) powered by FAISS and
OpenAI.

Tech Stack: 
- Frontend: React + Vite
- Backend: FastAPI
- LLM Integration: OpenAI via LangChain
- Embeddings: OpenAI Text Embeddings
- Vector Store: FAISS
- PDF Parsing: PyMuPDF (fitz)

Prerequisites
- Node.js (for frontend)
- Python 3.10+ (for backend)
- OpenAI API key

Clone the Repository

git clone https://github.com/your-username/StudySpark.git
cd StudySpark

Setup Environment Variables
- Create a .env file in the root of the backend directory:
- OPENAI_API_KEY=your_openai_api_key
- Make sure .env is included in your .gitignore.

Running the Application

Backend (FastAPI)

cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

Frontend (React)

cd frontend
npm install
npm run dev
