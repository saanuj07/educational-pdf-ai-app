import React, { useState, useEffect } from 'react';
import '../styles/flashcard.css';

const Flashcard = ({ documentId, onClose }) => {
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    reviewed: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0
  });

  // Sample flashcards as fallback
  const sampleFlashcards = [
    {
      id: 1,
      front: "What are the main design principles mentioned in this document?",
      back: "Lightweight, premium materials with aluminum unibody construction for better portability and durability."
    },
    {
      id: 2,
      front: "What is the weight specification mentioned for portability?",
      back: "As low as 1.24 kg for MacBook Air, making it easy to carry around."
    },
    {
      id: 3,
      front: "How is the design aesthetic described?",
      back: "Minimalist look with clean design and few visible ports, emphasizing simplicity and elegance."
    },
    {
      id: 4,
      front: "What material is primarily used in construction?",
      back: "Aluminum unibody construction as a key design feature for premium quality."
    },
    {
      id: 5,
      front: "What are the key benefits of the design approach?",
      back: "Lightweight, premium, and durable construction that enhances user experience."
    },
    {
      id: 6,
      front: "What does the thin and lightweight feature emphasize?",
      back: "Easy portability and user convenience for mobile professionals and students."
    },
    {
      id: 7,
      front: "How does the minimalist design benefit users?",
      back: "Reduces visual clutter and complexity, creating a more focused and elegant user experience."
    },
    {
      id: 8,
      front: "What type of user experience does the design prioritize?",
      back: "Premium, professional experience with emphasis on quality and attention to detail."
    },
    {
      id: 9,
      front: "Why is aluminum chosen as the primary material?",
      back: "Aluminum provides optimal balance of strength, lightness, and premium appearance for professional devices."
    },
    {
      id: 10,
      front: "What is the overall design philosophy demonstrated?",
      back: "Form follows function with emphasis on user-centric design, quality materials, and thoughtful engineering."
    }
  ];

  useEffect(() => {
    generateFlashcards();
  }, [documentId]);

  const generateFlashcards = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For now, use sample flashcards with random order
      const shuffledCards = [...sampleFlashcards].sort(() => Math.random() - 0.5);
      
      setFlashcards(shuffledCards);
      setSessionStats(prev => ({ ...prev, total: shuffledCards.length }));
      setIsLoading(false);
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setError('Failed to generate flashcards. Please try again.');
      setIsLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleSpacedRepetition = (difficulty) => {
    const difficultyMap = {
      again: { days: 1, color: 'red' },
      hard: { days: 3, color: 'yellow' },
      good: { days: 5, color: 'green' },
      easy: { days: 16, color: 'blue' }
    };

    // Update stats
    setSessionStats(prev => ({
      ...prev,
      reviewed: prev.reviewed + 1,
      [difficulty]: prev[difficulty] + 1
    }));

    // Move to next card or complete session
    if (currentIndex < flashcards.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      }, 300);
    } else {
      // Session complete
      setTimeout(() => {
        setCurrentIndex(-1); // Show completion screen
      }, 300);
    }
  };

  const resetSession = () => {
    const shuffledCards = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffledCards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({
      total: shuffledCards.length,
      reviewed: 0,
      again: 0,
      hard: 0,
      good: 0,
      easy: 0
    });
  };

  const goToNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-header">
          <h2>🃏 Flashcard Session</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="flashcard-loading">
          <div className="loading-spinner"></div>
          <p>Generating flashcards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-header">
          <h2>🃏 Flashcard Session</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="flashcard-error">
          <p>{error}</p>
          <button onClick={generateFlashcards} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  // Session completion screen
  if (currentIndex === -1) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-header">
          <h2>🃏 Session Complete!</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        <div className="session-complete">
          <div className="completion-stats">
            <h3>📊 Session Summary</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{sessionStats.reviewed}</span>
                <span className="stat-label">Cards Reviewed</span>
              </div>
              <div className="stat-item again">
                <span className="stat-number">{sessionStats.again}</span>
                <span className="stat-label">Again (1 day)</span>
              </div>
              <div className="stat-item hard">
                <span className="stat-number">{sessionStats.hard}</span>
                <span className="stat-label">Hard (3 days)</span>
              </div>
              <div className="stat-item good">
                <span className="stat-number">{sessionStats.good}</span>
                <span className="stat-label">Good (5 days)</span>
              </div>
              <div className="stat-item easy">
                <span className="stat-number">{sessionStats.easy}</span>
                <span className="stat-label">Easy (16 days)</span>
              </div>
            </div>
          </div>
          <div className="completion-actions">
            <button onClick={resetSession} className="btn-primary">
              🔄 New Session
            </button>
            <button onClick={onClose} className="btn-secondary">
              ✅ Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="flashcard-container">
      <div className="flashcard-header">
        <h2>🃏 Flashcard Session</h2>
        <div className="session-progress">
          <span>{currentIndex + 1} / {flashcards.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            ></div>
          </div>
        </div>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="flashcard-main">
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <div className="card-content">
                <div className="card-label">Question</div>
                <p>{currentCard?.front}</p>
                <div className="tap-hint">
                  {!isFlipped && "👆 Tap to reveal answer"}
                </div>
              </div>
            </div>
            <div className="flashcard-back">
              <div className="card-content">
                <div className="card-label">Answer</div>
                <p>{currentCard?.back}</p>
              </div>
            </div>
          </div>
        </div>

        {isFlipped && (
          <div className="spaced-repetition">
            <h3>How well did you know this?</h3>
            <div className="repetition-buttons">
              <button 
                onClick={() => handleSpacedRepetition('again')}
                className="rep-btn again"
              >
                <span className="rep-label">Again</span>
                <span className="rep-days">1 day</span>
              </button>
              <button 
                onClick={() => handleSpacedRepetition('hard')}
                className="rep-btn hard"
              >
                <span className="rep-label">Hard</span>
                <span className="rep-days">3 days</span>
              </button>
              <button 
                onClick={() => handleSpacedRepetition('good')}
                className="rep-btn good"
              >
                <span className="rep-label">Good</span>
                <span className="rep-days">5 days</span>
              </button>
              <button 
                onClick={() => handleSpacedRepetition('easy')}
                className="rep-btn easy"
              >
                <span className="rep-label">Easy</span>
                <span className="rep-days">16 days</span>
              </button>
            </div>
          </div>
        )}

        <div className="flashcard-navigation">
          <button 
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="nav-btn previous"
          >
            ← Previous
          </button>
          
          <div className="card-indicators">
            {flashcards.map((_, index) => (
              <div 
                key={index}
                className={`indicator ${index === currentIndex ? 'current' : ''} ${index < currentIndex ? 'completed' : ''}`}
              />
            ))}
          </div>

          <button 
            onClick={goToNext}
            disabled={currentIndex === flashcards.length - 1}
            className="nav-btn next"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;
