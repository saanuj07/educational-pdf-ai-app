
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { generateSummary, generateFlashcards, chatWithPDF, generateQuiz } from '../services/api';
import Quiz from '../components/Quiz';
import Flashcard from '../components/Flashcard';
import PDFViewer from '../components/PDFViewer';
import PodcastPlayer from '../components/PodcastPlayer';
import '../styles/quiz.css';
import '../styles/flashcard.css';
import '../styles/pdf-viewer.css';
import '../styles/podcast.css';

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

  // Fetch PDF data when component mounts
  useEffect(() => {
    const fetchPdfData = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';
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
          response = await chatWithPDF(fileId, input);
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
    <div className="flex h-screen">
      <div className="w-4/5 border-r overflow-hidden">
        <PDFViewer pdfData={pdfData} fileId={fileId} />
      </div>
      
      <div className="w-1/5 p-4">
        <div className="flex space-x-2 mb-4">
          {['chat', 'summary', 'flashcards', 'quiz', 'podcast'].map(t => (
            <button 
              key={t} 
              className={`px-4 py-2 rounded ${tab === t ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} 
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        
        <div>
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
                  className="w-full h-32 border mb-2" 
                  placeholder="Ask a question about the PDF content..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              )}
              
              {tab === 'flashcards' && !showFlashcards && (
                <div className="mb-2 p-2 border rounded bg-gray-50">
                  <p className="text-xs text-gray-600">
                    Click Generate to start an interactive flashcard session from your PDF content
                  </p>
                </div>
              )}

              {(tab === 'summary') && (
                <div className="mb-2 p-2 border rounded bg-gray-50">
                  <p className="text-xs text-gray-600">
                    Click Generate to create {tab} from your PDF content
                  </p>
                </div>
              )}

              {tab === 'quiz' && !showQuiz && (
                <div className="mb-2 p-2 border rounded bg-gray-50">
                  <p className="text-xs text-gray-600">
                    Click Generate to create an interactive quiz from your PDF content
                  </p>
                </div>
              )}

              {tab === 'podcast' && !showPodcast && (
                <div className="mb-2 p-2 border rounded bg-gray-50">
                  <p className="text-xs text-gray-600">
                    Click Generate to create an interactive podcast with synchronized PDF viewing from your document
                  </p>
                </div>
              )}
              
              <button 
                className={`px-4 py-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
              
              <div className="mt-4 p-2 border rounded bg-gray-50 min-h-[200px] whitespace-pre-wrap">
                {result || 'Results will appear here...'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentView;
