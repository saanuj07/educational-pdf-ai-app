
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { generateSummary, generateFlashcards, chatWithPDF } from '../services/api';

const DocumentView = () => {
  const { id: fileId } = useParams();
  const [tab, setTab] = useState('chat');
  const [result, setResult] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(true);

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
          response = await generateFlashcards(fileId);
          setResult(response.flashcards.map((card, idx) => 
            `${idx + 1}. Q: ${card.question}\nA: ${card.answer}`
          ).join('\n\n'));
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
          setResult('Quiz generation coming soon...');
          break;
        case 'podcast':
          setResult('Podcast generation coming soon...');
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
      <div className="w-1/2 border-r p-4 overflow-auto">
        <div className="text-center p-4 border rounded bg-gray-50">
          <h3 className="text-xl mb-4">PDF Viewer</h3>
          {loadingPdf ? (
            <p className="text-gray-500">Loading PDF content...</p>
          ) : pdfData?.error ? (
            <div className="text-center p-6">
              <div className="text-red-500 mb-4">
                <h4 className="text-lg font-semibold">❌ {pdfData.error}</h4>
                {pdfData.needReupload && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-sm">
                      <strong>Why did this happen?</strong><br/>
                      PDF files are stored in server memory and are lost when the development server restarts.
                    </p>
                    <p className="text-yellow-800 text-sm mt-2">
                      <strong>Solution:</strong> Please go back to the home page and upload your PDF again.
                    </p>
                    <button 
                      onClick={() => window.location.href = '/'}
                      className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      🏠 Go to Home Page
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : pdfData ? (
            <div className="text-left">
              <div className="mb-4 p-3 bg-blue-50 border rounded">
                <h4 className="font-semibold text-blue-800">📄 {pdfData.filename}</h4>
                <p className="text-sm text-blue-600">
                  {pdfData.numPages} page{pdfData.numPages > 1 ? 's' : ''} • 
                  {pdfData.text?.length || 0} characters
                </p>
                <p className="text-xs text-gray-500">Uploaded: {new Date(pdfData.uploadDate).toLocaleDateString()}</p>
              </div>
              
              <div className="max-h-96 overflow-y-auto p-4 border rounded bg-white text-sm">
                <h5 className="font-semibold mb-2">PDF Content:</h5>
                <div className="whitespace-pre-wrap text-gray-700">
                  {pdfData.text || 'No text content extracted from PDF'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-red-500">
              <p>❌ Failed to load PDF content</p>
              <p className="text-xs text-gray-400 mt-2">File ID: {fileId}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="w-1/2 p-4">
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
          {tab === 'chat' && (
            <textarea 
              className="w-full h-32 border mb-2" 
              placeholder="Ask a question about the PDF content..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          )}
          
          {(tab === 'summary' || tab === 'flashcards') && (
            <div className="mb-2 p-2 border rounded bg-gray-50">
              <p className="text-sm text-gray-600">
                Click Generate to create {tab} from your PDF content
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
        </div>
      </div>
    </div>
  );
};

export default DocumentView;
