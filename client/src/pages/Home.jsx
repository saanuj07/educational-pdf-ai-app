
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,   // For Analyze PDF
  faBrain,             // For Generate Quiz
  faFileLines,         // For Summarize
  faClone,             // For Flashcards
  faFilePdf            // For recent PDF icons
} from '@fortawesome/free-solid-svg-icons';

const Home = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recentFiles, setRecentFiles] = useState([]);
  const [animateTitle, setAnimateTitle] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Animate title on component mount
    setAnimateTitle(true);
    
    // Load recent files from localStorage
    const stored = localStorage.getItem('recentPDFs');
    if (stored) {
      setRecentFiles(JSON.parse(stored));
    }
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  };

  const handleFileUpload = async (file) => {
    if (!file.type.includes('pdf')) {
      alert('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    const progressInterval = simulateProgress();

    try {
      const result = await uploadDocument(file);
      
      // Complete the progress bar
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Add to recent files
      const newFile = {
        id: result.fileId,
        filename: file.name,
        uploadDate: new Date().toISOString(),
        size: file.size,
        pages: result.numPages
      };
      
      const updatedFiles = [newFile, ...recentFiles.slice(0, 4)];
      setRecentFiles(updatedFiles);
      localStorage.setItem('recentPDFs', JSON.stringify(updatedFiles));
      
      // Navigate after a short delay for UX
      setTimeout(() => {
        navigate(`/document/${result.fileId}`, { 
          state: { 
            filename: file.name,
            pages: result.numPages,
            size: file.size
          } 
        });
      }, 500);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
      clearInterval(progressInterval);
    }
  };

  const openRecentFile = (file) => {
    navigate(`/document/${file.id}`, { 
      state: { 
        filename: file.filename,
        pages: file.pages,
        size: file.size
      } 
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="home-container">
      {/* Full-width Hero Section */}
      <div className={`hero-section ${animateTitle ? 'animate-in' : ''} full-width`}>        
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="hero-logo-block">
          <div className="brand-icon" aria-hidden="true">
            {/* Simplified inline SVG approximating book + PDF + AI bubble */}
            <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="pdfPaper" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f5f7ff" />
                  <stop offset="100%" stopColor="#eef2ff" />
                </linearGradient>
              </defs>
              {/* Open book */}
              <path d="M15 95V40c0-6 5-11 11-11h33c4 0 7 1 11 3v63c-4-2-7-3-11-3H26c-6 0-11 5-11 3Z" stroke="#0f2942" strokeWidth="4" fill="#ffffff" />
              <path d="M125 95V40c0-6-5-11-11-11H81c-4 0-7 1-11 3v63c4-2 7-3 11-3h33c6 0 11 5 11 3Z" stroke="#0f2942" strokeWidth="4" fill="#ffffff" />
              <path d="M57 35v63" stroke="#0f2942" strokeWidth="4" />
              {/* Page lines */}
              <path d="M88 55h18M88 67h18M88 79h14" stroke="#0f2942" strokeWidth="4" strokeLinecap="round" />
              {/* PDF sheet in front */}
              <rect x="54" y="55" width="54" height="64" rx="6" fill="url(#pdfPaper)" stroke="#0f2942" strokeWidth="4" />
              <path d="M108 55v16H92" stroke="#0f2942" strokeWidth="4" strokeLinejoin="round" fill="none" />
              {/* PDF badge */}
              <rect x="66" y="82" width="34" height="18" rx="4" fill="#ef4444" stroke="#0f2942" strokeWidth="3" />
              <text x="83" y="95" fontSize="10" fontWeight="700" textAnchor="middle" fill="#ffffff" fontFamily="'Segoe UI',sans-serif">PDF</text>
              {/* AI speech bubble */}
              <path d="M90 18h26c5.5 0 10 4.5 10 10v16c0 5.5-4.5 10-10 10h-11l-8 8-2-8H90c-5.5 0-10-4.5-10-10V28c0-5.5 4.5-10 10-10Z" fill="#4f93ff" stroke="#0f2942" strokeWidth="4" strokeLinejoin="round" />
              <text x="103" y="41" fontSize="14" fontWeight="700" textAnchor="middle" fill="#0f2942" fontFamily="'Segoe UI',sans-serif">AI</text>
            </svg>
          </div>
          <h1 className="brand-title">
            <span className="brand-line">Educational</span>
            <span className="brand-line">PDF <span className="ai-grey">AI</span></span>
          </h1>
          <p className="brand-tagline">Transform your PDFs into interactive learning experiences</p>
        </div>
        <div className="feature-pills">
          <span className="pill">AI-Powered</span>
          <span className="pill">Smart Analysis</span>
          <span className="pill">Interactive Learning</span>
        </div>
      </div>

      <div className="home-shell">
        {/* Sidebar Recent Documents */}
        <aside className="recent-sidebar">
          <div className="recent-sidebar-inner">
            <h3 className="recent-sidebar-title">Recent Documents</h3>
            {recentFiles.length === 0 && (
              <div className="recent-empty">No documents yet. Upload a PDF to get started.</div>
            )}
            {recentFiles.length > 0 && (
              <div className="recent-list">
                {recentFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className="file-card sidebar"
                    onClick={() => openRecentFile(file)}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="file-icon pdf-icon" aria-label="PDF document">
                      <span className="pdf-corner" />
                      <span className="pdf-label">PDF</span>
                      <span className="pdf-pages" title={`${file.pages} pages`}>{file.pages}</span>
                      <span className="sr-only">PDF file {file.filename} with {file.pages} pages</span>
                    </div>
                    <div className="file-info">
                      <h4 title={file.filename}>{file.filename}</h4>
                      <div className="file-meta">
                        <span>{file.pages}p</span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                      <div className="file-date">
                        {new Date(file.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
  <main className="main-area">
  {/* Upload Section */}
      <div className="upload-section">
        <div 
          className={`upload-area ${dragActive ? 'drag-active' : ''} ${isUploading ? 'uploading' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="upload-progress">
              <div className="upload-spinner"></div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p>Uploading and analyzing PDF... {Math.round(uploadProgress)}%</p>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">📄</div>
              <h3>Drop your PDF here or click to browse</h3>
              <p>Supports files up to 10MB • PDF format only</p>
              <div className="upload-features">
                <span>AI-powered analysis</span>
                <span>Instant insights</span>
                <span>Learning tools</span>
              </div>
            </div>
          )}
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {/* Development Note */}
        <div className="dev-note">
          <p><strong>Development Mode:</strong> Uploaded files are stored temporarily in memory. Files will be lost when the server restarts.</p>
        </div>
      </div>

  {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-grid">
          <button className="action-btn action-analyze" onClick={() => fileInputRef.current?.click()}>
            <span className="action-icon">
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </span>
            <span className="action-text">Analyze PDF</span>
            <span className="action-desc">Deep content analysis</span>
          </button>
          
          <button className="action-btn action-quiz" onClick={() => fileInputRef.current?.click()}>
            <span className="action-icon">
              <FontAwesomeIcon icon={faBrain} />
            </span>
            <span className="action-text">Generate Quiz</span>
            <span className="action-desc">Auto-create questions</span>
          </button>
          
          <button className="action-btn action-summary" onClick={() => fileInputRef.current?.click()}>
            <span className="action-icon">
              <FontAwesomeIcon icon={faFileLines} />
            </span>
            <span className="action-text">Summarize</span>
            <span className="action-desc">Key points extraction</span>
          </button>
          
          <button className="action-btn action-flashcards" onClick={() => fileInputRef.current?.click()}>
            <span className="action-icon">
              <FontAwesomeIcon icon={faClone} />
            </span>
            <span className="action-text">Flashcards</span>
            <span className="action-desc">Study cards generation</span>
          </button>
        </div>
      </div>

  {/* (Sidebar now handles recent documents) */}
        </main>
      </div>

      {/* Features Overview (moved outside shell for true centering) */}
      <div className="features-overview">
        <h3>🎯 What You Can Do</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h4>AI Chat</h4>
            <p>Ask questions about your PDF content and get intelligent responses</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4>Smart Summary</h4>
            <p>Get key insights and main points extracted automatically</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎴</div>
            <h4>Flashcards</h4>
            <p>Generate study flashcards from important concepts</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h4>Quiz Generation</h4>
            <p>Create interactive quizzes to test your knowledge</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎧</div>
            <h4>Podcast Script</h4>
            <p>Convert your PDF into engaging audio content</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧑‍💻</div>
            <h4>AI Assistant</h4>
            <p>Get contextual guidance and support while you study your PDFs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
