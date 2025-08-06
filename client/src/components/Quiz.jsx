import React, { useState, useEffect } from 'react';

const Quiz = ({ fileId, onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showExplanation, setShowExplanation] = useState({});
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sample quiz data - in real implementation, this would come from Watson AI
  const sampleQuizData = [
    {
      id: 1,
      question: "What is the significance of the MacBook Air being as light as 1.24 kg?",
      options: [
        "It makes the laptop easy to carry and portable",
        "It allows for faster processing speeds", 
        "It enhances the laptop's battery life",
        "It improves the screen resolution significantly"
      ],
      correctIndex: 0,
      explanation: "The MacBook Air's weight of as low as 1.24 kg emphasizes its thin and lightweight design, which directly contributes to its portability and user convenience. This weight supports the design goal of easy transport."
    },
    {
      id: 2,
      question: "The aluminum unibody contributes to both the premium feel and durability of the MacBook Air.",
      options: [
        "True",
        "False"
      ],
      correctIndex: 0,
      explanation: "The aluminum unibody design not only provides a premium, high-quality feel but also enhances the structural integrity and durability of the MacBook Air, making it more resistant to wear and damage."
    },
    {
      id: 3,
      question: "Which design philosophy best describes the MacBook Air's approach?",
      options: [
        "Maximum performance regardless of size",
        "Minimalist design with clean lines and few visible ports",
        "Colorful and customizable appearance",
        "Industrial and rugged construction"
      ],
      correctIndex: 1,
      explanation: "The MacBook Air follows Apple's minimalist design philosophy, featuring clean lines, a sleek profile, and strategically placed ports that maintain the device's aesthetic appeal while providing necessary functionality."
    },
    {
      id: 4,
      question: "What makes the MacBook Air thin and lightweight compared to traditional laptops?",
      options: [
        "Smaller screen size",
        "Reduced battery capacity",
        "Advanced engineering and premium materials",
        "Fewer internal components"
      ],
      correctIndex: 2,
      explanation: "The MacBook Air's thin and lightweight profile is achieved through advanced engineering techniques, the use of premium materials like aluminum, and innovative internal component arrangement, not by compromising on essential features."
    },
    {
      id: 5,
      question: "The MacBook Air's design prioritizes which aspect for users?",
      options: [
        "Gaming performance",
        "Portability and user convenience",
        "Maximum storage capacity",
        "Multimedia editing capabilities"
      ],
      correctIndex: 1,
      explanation: "The MacBook Air's design philosophy centers around portability and user convenience, making it ideal for users who need a reliable, lightweight laptop for everyday tasks, travel, and productivity on the go."
    }
  ];

  useEffect(() => {
    // Load quiz data from API
    const loadQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from API first
        const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/quiz/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileId })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.quiz && data.quiz.length > 0) {
            setQuestions(data.quiz);
            setLoading(false);
            return;
          }
        }
        
        // Fallback to sample data if API fails
        console.log('Using sample quiz data as fallback');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        setQuestions(sampleQuizData);
        setLoading(false);
        
      } catch (err) {
        console.error('Error loading quiz:', err);
        // Use sample data as fallback
        setQuestions(sampleQuizData);
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

  if (error) {
    return (
      <div className="quiz-container">
        <div className="quiz-error">
          <p>{error}</p>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    );
  }

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
