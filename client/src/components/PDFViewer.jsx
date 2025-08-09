import React, { useState, useRef, useEffect } from 'react';
import '../styles/pdf-viewer.css';

const PDFViewer = ({ pdfData, fileId }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBox, setShowSearchBox] = useState(false);
  const iframeRef = useRef(null);

  // Get the PDF URL for embedding (using view endpoint, not download)
  const getPdfUrl = () => {
    const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
    // Append fragment params to request browsers (Chromium-based) to hide built-in PDF toolbar
    // Note: Some browsers (Firefox) may ignore these; for full control consider integrating PDF.js later.
    return `${apiUrl}/view/${fileId}#toolbar=0&navpanes=0&statusbar=0&scrollbar=0&view=FitH`;
  };

  // Attempt to extract page count from filename pattern (fallback 1) until full PDF.js integration.
  useEffect(() => {
    // Placeholder: if backend can send page count in pdfData.pages use it
    if (pdfData?.pages) {
      setTotalPages(pdfData.pages);
    }
  }, [pdfData]);

  const gotoPage = (delta) => {
    setCurrentPage(p => {
      const next = Math.min(Math.max(1, p + delta), totalPages);
      return next;
    });
    // Without PDF.js we cannot actually change the rendered page inside browser plugin reliably.
    // Implementation note: future enhancement will use react-pdf to control pages.
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Basic in-frame text search using built-in PDF plugin find (Chrome only) via execCommand is deprecated; placeholder only.
    if (iframeRef.current && searchQuery) {
      try {
        // Future: integrate PDF.js textLayer search.
        // Provide quick feedback now.
      } catch (err) {
        // silent
      }
    }
  };

  // Handle PDF load events
  const handlePdfLoad = () => {
    setIsLoading(false);
    setPdfError(false);
  };

  const handlePdfError = () => {
    setIsLoading(false);
    setPdfError(true);
  };

  const handleDownload = () => {
    if (fileId) {
      const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
      const downloadUrl = `${apiUrl}/download/${fileId}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = pdfData?.filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  if (!pdfData && !fileId) {
    return (
      <div className="pdf-viewer-container">
        <div className="pdf-viewer-error">
          <p>No PDF data available</p>
        </div>
      </div>
    );
  }

  if (pdfData?.error) {
    return (
      <div className="pdf-viewer-container">
        <div className="pdf-viewer-error">
          <h4>❌ {pdfData.error}</h4>
          {pdfData.needReupload && (
            <div className="error-details">
              <p><strong>Why did this happen?</strong><br/>
              PDF files are stored in server memory and are lost when the development server restarts.</p>
              <p><strong>Solution:</strong> Please go back to the home page and upload your PDF again.</p>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn-primary"
              >
                🏠 Go to Home Page
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`pdf-viewer-container ${isMaximized ? 'maximized' : ''}`}>
      {/* PDF Viewer Header */}
      <div className="pdf-viewer-header">
        <div className="pdf-info">
          <div className="pdf-icon large pdf-header-icon" aria-label="PDF document icon">
            <span className="pdf-corner" />
            <span className="pdf-label">PDF</span>
          </div>
          <div className="pdf-title-block">
            <h4>{pdfData?.filename || 'PDF Document'}</h4>
            <span className="pdf-details">
              {pdfData?.size && `${Math.round(pdfData.size / 1024)} KB`}
            </span>
          </div>
        </div>

        <div className="pdf-toolbar">
          <button
            onClick={() => setShowSearchBox(s => !s)}
            className="control-btn"
            title="Search text"
          >🔍</button>
          <div className="page-nav-group">
            <button onClick={() => gotoPage(-1)} disabled={currentPage===1} className="control-btn" title="Previous page">◀</button>
            <span className="page-indicator">{currentPage} / {totalPages}</span>
            <button onClick={() => gotoPage(1)} disabled={currentPage===totalPages} className="control-btn" title="Next page">▶</button>
          </div>
          <button onClick={handleDownload} className="control-btn" title="Download PDF">⬇</button>
          {/* Removed print & reload buttons as requested */}
          <button
            onClick={handleMaximize}
            className="control-btn"
            title={isMaximized ? 'Restore size' : 'Maximize viewer'}
          >{isMaximized ? '🗗' : '🗖'}</button>
        </div>
      </div>
      {showSearchBox && (
        <form className="pdf-search-bar" onSubmit={handleSearchSubmit}>
          <input
            type="text"
            placeholder="Search (placeholder)"
            value={searchQuery}
            onChange={e=>setSearchQuery(e.target.value)}
          />
          <button type="submit" className="control-btn small" title="Search">Go</button>
        </form>
      )}

      {/* PDF Viewer Content */}
      <div className="pdf-viewer-content">
        {isLoading && (
          <div className="pdf-loading">
            <div className="loading-spinner"></div>
            <p>Loading PDF...</p>
          </div>
        )}
        
        {pdfError && (
          <div className="pdf-error">
            <h4>❌ Failed to load PDF</h4>
            <p>The PDF file could not be displayed. You can still download it using the download button.</p>
            <button onClick={handleRefresh} className="btn-secondary">
              🔄 Try Again
            </button>
          </div>
        )}

        {/* PDF Iframe */}
        <iframe
          ref={iframeRef}
          src={getPdfUrl()}
          className="pdf-iframe"
          title="PDF Viewer"
          onLoad={handlePdfLoad}
          onError={handlePdfError}
          style={{ display: isLoading || pdfError ? 'none' : 'block' }}
        />
      </div>

      {/* Status Bar */}
      <div className="pdf-status-bar">
        <span>{pdfData?.filename && `File: ${pdfData.filename}`}{fileId && ` • ID: ${fileId}`}</span>
        <span>Page {currentPage} of {totalPages}</span>
      </div>
    </div>
  );
};

export default PDFViewer;
