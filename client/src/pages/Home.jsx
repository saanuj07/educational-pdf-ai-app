
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadDocument } from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,   // For Analyze PDF
  faBrain,             // For Generate Quiz
  faFileLines,         // For Summarize
  faClone              // For Flashcards
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
      {/* Animated Header */}
      <div className={`hero-section ${animateTitle ? 'animate-in' : ''}`}>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        
        <h1 className="main-title">
          Educational PDF AI
          <span className="subtitle">Transform your PDFs into interactive learning experiences</span>
        </h1>
        
        <div className="feature-pills">
          <span className="pill">AI-Powered</span>
          <span className="pill">Smart Analysis</span>
          <span className="pill">Interactive Learning</span>
        </div>
      </div>

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

      {/* Recent Files */}
      {recentFiles.length > 0 && (
        <div className="recent-files">
          <h3>Recent Documents</h3>
          <div className="files-grid">
            {recentFiles.map((file, index) => (
              <div 
                key={file.id} 
                className="file-card"
                onClick={() => openRecentFile(file)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="file-icon">📄</div>
                <div className="file-info">
                  <h4>{file.filename}</h4>
                  <div className="file-meta">
                    <span>{file.pages} pages</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="file-date">
                    {new Date(file.uploadDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="file-actions">
                  <button className="action-quick">🔍</button>
                  <button className="action-quick">📊</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Overview */}
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
            <div className="feature-icon">📈</div>
            <h4>Progress Tracking</h4>
            <p>Monitor your learning progress and achievements</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
