import React, { useState, useEffect } from 'react';
import { generateQuiz as apiGenerateQuiz } from '../services/api';

const Quiz = ({ fileId, documentId, onClose }) => {
  const resolvedFileId = fileId || documentId;
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState({});
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Minimal fallback only if API unavailable; no hardcoded brand/device specifics
  const fallbackQuizData = [
    {
      id: 1,
      question: 'Fallback: Example question (AI unavailable). Please retry after confirming backend.',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctIndex: 0,
      explanation: 'Fallback data shown because the quiz API request failed.'
    }
  ];

  useEffect(() => {
    // Load quiz data from API
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        
  if (!resolvedFileId) {
          throw new Error('Missing fileId for quiz generation');
        }
  const data = await apiGenerateQuiz(resolvedFileId);
        if (!data.quiz || data.quiz.length === 0) {
          throw new Error('Empty quiz returned from API');
        }
        setQuestions(data.quiz.map((q, i) => ({ ...q, id: q.id || i + 1 })));
        setLoading(false);
      } catch (err) {
        console.error('[QUIZ-FRONTEND] Failed to load quiz from API:', err.message);
        setError('Quiz generation unavailable (AI or server issue). Showing minimal fallback.');
        setQuestions(fallbackQuizData);
        setLoading(false);
      }
    };

    loadQuiz();
  }, [fileId]);

  const handleAnswerSelect = (answerIndex) => {
    if (selectedAnswers[currentQuestion] !== undefined) return; // Already answered

    const newSelectedAnswers = { ...selectedAnswers, [currentQuestion]: answerIndex };
    setSelectedAnswers(newSelectedAnswers);
    
    // Show explanation after selection
    setShowExplanation({ ...showExplanation, [currentQuestion]: true });
    
    // Update score if correct
    if (answerIndex === questions[currentQuestion].correctIndex) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getAnsweredCount = () => {
    return Object.keys(selectedAnswers).length;
  };

  if (loading) {
    return (
      <div className="quiz-container">
        <div className="quiz-loading">
          <div className="loading-spinner"></div>
          <p>Generating quiz questions...</p>
        </div>
      </div>
    );
  }

  // Show error banner but still render fallback quiz if available

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="quiz-container">
        <div className="quiz-completion">
          <h2>🎉 Quiz Completed!</h2>
          <div className="score-summary">
            <div className="final-score">
              <span className="score-number">{score}</span>
              <span className="score-total">/ {questions.length}</span>
            </div>
            <div className="score-percentage">{percentage}%</div>
          </div>
          <div className="score-breakdown">
            <p><strong>Questions Answered:</strong> {getAnsweredCount()} / {questions.length}</p>
            <p><strong>Correct Answers:</strong> {score}</p>
            <p><strong>Accuracy:</strong> {percentage}%</p>
          </div>
          <div className="completion-actions">
            <button onClick={() => {
              setCurrentQuestion(0);
              setQuizCompleted(false);
              setSelectedAnswers({});
              setShowExplanation({});
              setScore(0);
            }} className="btn-primary">Retake Quiz</button>
            <button onClick={onClose} className="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const userAnswer = selectedAnswers[currentQuestion];
  const isAnswered = userAnswer !== undefined;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h2>Interactive Quiz</h2>
        {error && (
          <div className="quiz-error-banner">
            {error}
          </div>
        )}
        <div className="quiz-progress">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="quiz-score">
          Score: {score} / {getAnsweredCount()}
        </div>
      </div>

      <div className="quiz-content">
        <div className="question-section">
          <h3 className="question-text">{currentQ.question}</h3>
          
          <div className="options-container">
            {currentQ.options.map((option, index) => {
              let optionClass = "quiz-option";
              
              if (isAnswered) {
                if (index === currentQ.correctIndex) {
                  optionClass += " correct";
                }
                if (index === userAnswer && index !== currentQ.correctIndex) {
                  optionClass += " incorrect";
                }
                if (index === userAnswer) {
                  optionClass += " selected";
                }
              }

              return (
                <button
                  key={index}
                  className={optionClass}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered}
                >
                  <span className="option-letter">{String.fromCharCode(65 + index)}.</span>
                  <span className="option-text">{option}</span>
                  {isAnswered && index === currentQ.correctIndex && (
                    <span className="correct-icon">✓</span>
                  )}
                  {isAnswered && index === userAnswer && index !== currentQ.correctIndex && (
                    <span className="incorrect-icon">✗</span>
                  )}
                </button>
              );
            })}
          </div>

          {showExplanation[currentQuestion] && (
            <div className="explanation-section">
              <div className="explanation-header">
                <span className={`result-badge ${userAnswer === currentQ.correctIndex ? 'correct' : 'incorrect'}`}>
                  {userAnswer === currentQ.correctIndex ? '✓ Correct' : '✗ Incorrect'}
                </span>
                <span className="question-score">
                  {userAnswer === currentQ.correctIndex ? '1' : '0'} / 1
                </span>
              </div>
              <div className="explanation-content">
                <p><strong>Explanation:</strong></p>
                <p>{currentQ.explanation}</p>
              </div>
            </div>
          )}
        </div>

        <div className="quiz-navigation">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="nav-btn previous"
          >
            ← Previous
          </button>
          
          <div className="question-indicators">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`question-indicator ${
                  index === currentQuestion ? 'current' :
                  selectedAnswers[index] !== undefined ? 'answered' : 'unanswered'
                }`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={!isAnswered}
            className="nav-btn next"
          >
            {currentQuestion === questions.length - 1 ? 'Finish' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
