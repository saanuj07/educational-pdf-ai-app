
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { generateSummary, generateFlashcards, chatWithDocument, generateQuiz } from '../services/api';
import Quiz from '../components/Quiz';
import Flashcard from '../components/Flashcard';
import PDFViewer from '../components/PDFViewer';
import PodcastPlayer from '../components/PodcastPlayer';
import AIAgent from '../components/AIAgent';
import '../styles/quiz.css';
import '../styles/flashcard.css';
import '../styles/pdf-viewer.css';
import '../styles/podcast.css';
import '../styles/document-view.css';
import '../styles/ai-agent.css';

const DocumentView = () => {
  const { id: fileId } = useParams();
  const [tab, setTab] = useState('chat');
  const [result, setResult] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showPodcast, setShowPodcast] = useState(false);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [aiAgentMinimized, setAiAgentMinimized] = useState(false);

  // Fetch PDF data when component mounts
  useEffect(() => {
    const fetchPdfData = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/document/${fileId}`);
        if (response.ok) {
          const data = await response.json();
          setPdfData(data);
        } else if (response.status === 404) {
          console.error('PDF document not found - may have been lost due to server restart');
          setPdfData({ error: 'Document not found', needReupload: true });
        } else {
          console.error('Failed to fetch PDF data');
          setPdfData({ error: 'Failed to load document' });
        }
      } catch (error) {
        console.error('Error fetching PDF:', error);
        setPdfData({ error: 'Network error - cannot connect to server' });
      } finally {
        setLoadingPdf(false);
      }
    };

    fetchPdfData();
  }, [fileId]);

  // Listen for AI agent actions
  useEffect(() => {
    const handleAIAgentAction = (event) => {
      const { action, documentId } = event.detail;
      if (documentId === fileId) {
        switch (action) {
          case 'summary':
            setTab('summary');
            handleGenerate();
            break;
          case 'flashcards':
            setTab('flashcards');
            setShowFlashcards(true);
            break;
          case 'quiz':
            setTab('quiz');
            setShowQuiz(true);
            break;
          case 'podcast':
            setTab('podcast');
            setShowPodcast(true);
            break;
        }
      }
    };

    window.addEventListener('ai-agent-action', handleAIAgentAction);
    return () => {
      window.removeEventListener('ai-agent-action', handleAIAgentAction);
    };
  }, [fileId]);

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    setResult('');

    try {
      let response;
      switch (tab) {
        case 'summary':
          response = await generateSummary(fileId);
          setResult(response.summary);
          break;
        case 'flashcards':
          try {
            setShowFlashcards(true);
            setResult('');
          } catch (error) {
            setResult(`Flashcard generation failed: ${error.message}`);
          }
          break;
        case 'chat':
          if (!input.trim()) {
            alert('Please enter a question');
            return;
          }
          response = await chatWithDocument(fileId, input);
          setResult(`Q: ${response.question}\nA: ${response.answer}`);
          break;
        case 'quiz':
          try {
            const quizResponse = await generateQuiz(fileId);
            setShowQuiz(true);
            setResult('');
          } catch (error) {
            setResult(`Quiz generation failed: ${error.message}`);
          }
          break;
        case 'podcast':
          try {
            setShowPodcast(true);
            setResult('');
          } catch (error) {
            setResult(`Podcast generation failed: ${error.message}`);
          }
          break;
        default:
          setResult('Feature not implemented yet');
      }
    } catch (error) {
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* PDF Section - Full Left Half */}
      <div className="w-1/2 flex flex-col border-r-2 border-gray-300">
        <PDFViewer pdfData={pdfData} fileId={fileId} />
      </div>
      
      {/* Activities Section - Full Right Half */}
      <div className="w-1/2 flex flex-col bg-white">
        {/* Header Section */}
        <div className="flex-none p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Educational Tools</h2>
          <div className="tab-buttons-container">
            {['chat', 'summary', 'flashcards', 'quiz', 'podcast'].map(t => (
              <button 
                key={t} 
                className={`${
                  tab === t 
                    ? 'active' 
                    : 'inactive'
                }`} 
                onClick={() => setTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
            
            {/* AI Agent Button */}
            <button 
              className="ai-agent-toggle-btn"
              onClick={() => setShowAIAgent(true)}
              title="Open AI Learning Assistant"
            >
              🤖 AI Assistant
            </button>
          </div>
        </div>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === 'quiz' && showQuiz ? (
            <div className="quiz-wrapper">
              <Quiz 
                fileId={fileId} 
                onClose={() => {
                  setShowQuiz(false);
                  setResult('Quiz completed successfully!');
                }}
              />
            </div>
          ) : tab === 'flashcards' && showFlashcards ? (
            <div className="flashcard-wrapper">
              <Flashcard 
                documentId={fileId} 
                onClose={() => {
                  setShowFlashcards(false);
                  setResult('Flashcard session completed successfully!');
                }}
              />
            </div>
          ) : tab === 'podcast' && showPodcast ? (
            <div className="podcast-wrapper">
              <PodcastPlayer 
                documentId={fileId} 
                onClose={() => {
                  setShowPodcast(false);
                  setResult('Podcast session completed successfully!');
                }}
              />
            </div>
          ) : (
            <>
              {tab === 'chat' && (
                <textarea 
                  className="chat-textarea" 
                  placeholder="Ask a question about the PDF content..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              )}
              
              {tab === 'flashcards' && !showFlashcards && (
                <div className="mb-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <h3 className="font-semibold text-blue-800 mb-2">📚 Flashcards</h3>
                  <p className="text-sm text-blue-700">
                    Click Generate to start an interactive flashcard session from your PDF content
                  </p>
                </div>
              )}

              {(tab === 'summary') && (
                <div className="mb-4 p-4 border border-green-200 rounded-lg bg-green-50">
                  <h3 className="font-semibold text-green-800 mb-2">📄 Summary</h3>
                  <p className="text-sm text-green-700">
                    Click Generate to create a comprehensive summary from your PDF content
                  </p>
                </div>
              )}

              {tab === 'quiz' && !showQuiz && (
                <div className="mb-4 p-4 border border-purple-200 rounded-lg bg-purple-50">
                  <h3 className="font-semibold text-purple-800 mb-2">🧠 Quiz</h3>
                  <p className="text-sm text-purple-700">
                    Click Generate to create an interactive quiz from your PDF content
                  </p>
                </div>
              )}

              {tab === 'podcast' && !showPodcast && (
                <div className="mb-4 p-4 border border-orange-200 rounded-lg bg-orange-50">
                  <h3 className="font-semibold text-orange-800 mb-2">🎧 Podcast</h3>
                  <p className="text-sm text-orange-700">
                    Click Generate to create an interactive podcast with synchronized PDF viewing from your document
                  </p>
                </div>
              )}
              
              <button 
                className={`generate-button ${loading ? 'loading' : 'active'}`}
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? 'Generating...' : `Generate ${tab.charAt(0).toUpperCase() + tab.slice(1)}`}
              </button>
              
              <div className="results-container">
                <h3 className="results-header">Results</h3>
                <div className="results-content">
                  {result || 'Results will appear here...'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Overlay Components */}
      {showQuiz && (
        <div className="overlay">
          <Quiz 
            documentId={fileId} 
            onClose={() => setShowQuiz(false)} 
          />
        </div>
      )}
      
      {showFlashcards && (
        <div className="overlay">
          <Flashcard 
            documentId={fileId} 
            onClose={() => setShowFlashcards(false)} 
          />
        </div>
      )}
      
      {showPodcast && (
        <div className="overlay">
          <PodcastPlayer 
            documentId={fileId} 
            onClose={() => setShowPodcast(false)} 
          />
        </div>
      )}
      
      {/* AI Agent */}
      {(showAIAgent || aiAgentMinimized) && (
        <div className={`ai-agent-overlay ${aiAgentMinimized ? 'minimized' : ''}`}>
          <AIAgent 
            documentId={fileId}
            pdfData={pdfData}
            onClose={() => {
              setShowAIAgent(false);
              setAiAgentMinimized(false);
            }}
            isMinimized={aiAgentMinimized}
            onToggleMinimize={() => {
              setAiAgentMinimized(!aiAgentMinimized);
              if (aiAgentMinimized) {
                setShowAIAgent(true);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DocumentView;