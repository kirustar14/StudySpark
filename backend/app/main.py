from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import uuid, os, fitz

from langchain.vectorstores import FAISS
from langchain.embeddings import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.text_splitter import CharacterTextSplitter
from langchain.schema import HumanMessage

from dotenv import load_dotenv
load_dotenv()


api_key = os.getenv("OPENAI_API_KEY")


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

embedding_model = OpenAIEmbeddings(openai_api_key=api_key)
llm = ChatOpenAI(openai_api_key=api_key, model_name="gpt-3.5-turbo", temperature=0.3)

# Store state
raw_text = ""
chunks = []

# Agents
class DocumentAgent:
    @staticmethod
    def parse_pdf(file_path):
        doc = fitz.open(file_path)
        return "\n".join([page.get_text() for page in doc])

    @staticmethod
    def split_text(text):
        splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        return splitter.split_text(text)

class KnowledgeAgent:
    def __init__(self):
        self.vector_store = None

    def index_chunks(self, chunks):
        self.vector_store = FAISS.from_texts(chunks, embedding_model)

    def retrieve_chunks(self, query, k=6):
        if not self.vector_store:
            return []
        retriever = self.vector_store.as_retriever(search_kwargs={"k": k})
        docs = retriever.invoke(query)
        return "\n".join([doc.page_content for doc in docs])

class ChatAgent:
    def __init__(self, llm):
        self.llm = llm

    def generate(self, prompt):
        return self.llm.invoke([HumanMessage(content=prompt)]).content.strip()

# Instantiate agents
doc_agent = DocumentAgent()
knowledge_agent = KnowledgeAgent()
chat_agent = ChatAgent(llm)

@app.post("/upload_pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    global raw_text, chunks

    contents = await file.read()
    filename = f"/tmp/{uuid.uuid4()}.pdf"
    with open(filename, "wb") as f:
        f.write(contents)

    raw_text = doc_agent.parse_pdf(filename)
    chunks = doc_agent.split_text(raw_text)  # Split text into 500-char chunks
    knowledge_agent.index_chunks(chunks)     # Index these chunks into FAISS

    os.remove(filename)
    return {"message": "PDF uploaded and indexed successfully", "filename": file.filename}

@app.post("/ask_question/")
async def ask_question(question: str = Form(...)):
    if not chunks:
        return {"answer": "Please upload a PDF first."}

    try:
        context = knowledge_agent.retrieve_chunks(question)
        prompt = f"""Use the following context to answer the question:

Context:
{context}

Question: {question}
Answer:
"""
        result = chat_agent.generate(prompt)
        return {"answer": result}
    except Exception as e:
        return {"error": str(e)}

@app.post("/generate_quiz/")
async def generate_quiz(
    count: int = Form(10),
    type: str = Form("mcq"),
    difficulty: str = Form("medium")
):
    if not chunks:
        return {"error": "Please upload a PDF first."}

    try:
        context = knowledge_agent.retrieve_chunks("generate quiz")
        prompt = f"""
You are an AI tutor.
Generate {count} quiz questions from the following document context.
Each question should be of type: {type}.
Use these formatting rules:

- For MCQ:
  1. <Question>
  A. Option A
  B. Option B
  C. Option C
  D. Option D
  Correct Answer: <One of A/B/C/D>

- For Short Answer:
  1. <Question>
  Answer: <Direct answer on the same line>

Ensure:
- Every question is numbered (e.g., 1. 2. 3. ...)
- Format is exactly followed with no extra explanation
- Include a topic tag if possible (e.g., Topic: Biology)
- Difficulty level: {difficulty}

Context:
{context}
"""
        quiz = chat_agent.generate(prompt)
        return {"quiz": quiz}
    except Exception as e:
        return {"error": str(e)}
