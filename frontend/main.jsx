// React Frontend with Fixed Card Overflow and Clean Layout
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';

function App() {
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("chat");
  const [currentQ, setCurrentQ] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [quizSettings, setQuizSettings] = useState({ count: 5, type: 'mcq', difficulty: 'medium' });

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("http://localhost:8000/upload_pdf/", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.filename) {
      setUploadedDocs(prev => [...prev, data.filename]);
    }
  };

  const handleQuestion = async (e) => {
    e.preventDefault();
    if (!uploadedDocs.length) {
      setAnswer("Please upload a document first.");
      return;
    }

    setLoading(true);
    setAnswer("");
    setQuiz([]);

    const res = await fetch("http://localhost:8000/ask_question/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ question }),
    });

    const data = await res.json();
    setAnswer(data.answer || `Error: ${data.error || 'Unexpected error'}`);
    setQuestion("");
    setLoading(false);
  };

  const startQuizGeneration = () => {
    setShowModal(true);
  };

  const handleQuizGeneration = async () => {
    setShowModal(false);
    setLoading(true);
    setAnswer("");
    setQuiz([]);
    setMode("test");

    const res = await fetch("http://localhost:8000/generate_quiz/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        count: quizSettings.count.toString(),
        type: quizSettings.type,
        difficulty: quizSettings.difficulty
      }),
    });

    const data = await res.json();

    try {
      const questions = data.quiz.split(/\n(?=\d+\.)/).filter(Boolean);
      setQuiz(questions);
      setCurrentQ(0);
      setShowAnswer(false);
    } catch (e) {
      setQuiz([`Error parsing quiz: ${data.quiz || data.error}`]);
    }

    setLoading(false);
  };

  const renderQuestionText = () => {
    const raw = quiz[currentQ].split('\n');
    let q = raw[0];
    if (quizSettings.type === 'short') {
      q = q.replace(/^[^#]*#\s*/, '').replace(/^#+/, '').trim();
    }
    return q;
  };

  const renderOptions = () => {
    const lines = quiz[currentQ].split('\n');
    const optionLines = lines.filter(line => /^[A-D]\./.test(line.trim()));
    return optionLines.length ? optionLines.map((opt, idx) => <li key={idx}>{opt}</li>) : null;
  };

const renderAnswer = () => {
  const lines = quiz[currentQ].split('\n');

  const mcqAnswer = lines.find(line =>
    line.toLowerCase().startsWith("correct answer") || line.toLowerCase().startsWith("answer:")
  );

  if (quizSettings.type === 'mcq' && mcqAnswer) {
    const cleaned = mcqAnswer.split(":").slice(1).join(":").trim();
    return cleaned || "Not provided.";
  }

  if (quizSettings.type === 'short') {
    const answerIndex = lines.findIndex(line =>
      line.toLowerCase().trim() === "answer:" || line.toLowerCase().startsWith("answer:")
    );

    if (answerIndex !== -1) {
      const currentLine = lines[answerIndex].trim();

      // Case 1: "Answer: <inline content>"
      if (currentLine.toLowerCase().startsWith("answer:") && currentLine.length > 7) {
        const inlineAnswer = currentLine.split(":").slice(1).join(":").trim();
        return inlineAnswer || "Not provided.";
      }

      // Case 2: "Answer:" on one line, actual answer on next line(s)
      const answerLines = lines.slice(answerIndex + 1).join("\n").trim();
      return answerLines || "Not provided.";
    }
  }

  return "Not provided.";
};




  return (
    <div className="app">
      <div className="sidebar">
        <h3>Uploaded Notes</h3>
        <button className="upload-btn">
          Upload Notes
          <input type="file" onChange={handleUpload} multiple />
        </button>
        <ul>
          {uploadedDocs.map((name, idx) => (
            <li key={idx}>{name}</li>
          ))}
        </ul>
        <button onClick={startQuizGeneration} disabled={loading}>
          {loading ? "Generating..." : "Test Mode"}
        </button>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <h2>Study Spark</h2>
          <button className="mode-toggle" onClick={() => setMode(mode === "chat" ? "test" : "chat")}>
            {mode === "chat" ? "Switch to Test" : "Switch to Chat"} Mode
          </button>
        </div>

        {mode === "chat" && (
          <form onSubmit={handleQuestion} className="chat-form">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask something from your uploaded notes..."
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Ask"}
            </button>
          </form>
        )}

        {mode === "chat" && answer && (
          <div className="response-block">
            <strong>Answer:</strong>
            <p>{answer}</p>
          </div>
        )}

        {mode === "test" && quiz.length > 0 && (
          <>
            <div className={`quiz-card ${showAnswer ? 'flip' : ''}`}>
              <div className="quiz-front">
                <div className="question-block">
                  <h3 className="wrapped-question">{renderQuestionText()}</h3>
                  {quizSettings.type === 'mcq' && <ul className="options">{renderOptions()}</ul>}
                </div>
                <button className="flip-btn" onClick={() => setShowAnswer(true)}>Show Answer</button>
              </div>
              <div className="quiz-back">
                <div className="answer-block">
                  <p><strong>Answer:</strong> {renderAnswer()}</p>
                </div>
                <button className="flip-btn" onClick={() => setShowAnswer(false)}>Back to Question</button>
              </div>
            </div>
            <div className="quiz-controls">
              <button disabled={currentQ <= 0} onClick={() => { setCurrentQ(currentQ - 1); setShowAnswer(false); }}>Prev</button>
              <span>Q{currentQ + 1} / {quiz.length}</span>
              <button disabled={currentQ >= quiz.length - 1} onClick={() => { setCurrentQ(currentQ + 1); setShowAnswer(false); }}>Next</button>
            </div>
          </>
        )}

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Customize Your Quiz</h3>
              <label>
                Number of Questions:
                <input
                  type="number"
                  value={quizSettings.count}
                  onChange={e => setQuizSettings({ ...quizSettings, count: parseInt(e.target.value) })}
                  min="1"
                  max="20"
                />
              </label>
              <label>
                Type:
                <select
                  value={quizSettings.type}
                  onChange={e => setQuizSettings({ ...quizSettings, type: e.target.value })}
                >
                  <option value="mcq">Multiple Choice</option>
                  <option value="short">Short Answer</option>
                </select>
              </label>
              <label>
                Difficulty:
                <select
                  value={quizSettings.difficulty}
                  onChange={e => setQuizSettings({ ...quizSettings, difficulty: e.target.value })}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              <div className="modal-buttons">
                <button onClick={handleQuizGeneration}>Generate</button>
                <button onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
