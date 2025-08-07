import React, { useState, useRef } from 'react';
import '../styles/pdf-viewer.css';

const PDFViewer = ({ pdfData, fileId }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const iframeRef = useRef(null);

  // Get the PDF URL for embedding (using view endpoint, not download)
  const getPdfUrl = () => {
    const apiUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';
    return `${apiUrl}/view/${fileId}`;
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

  const handlePrint = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.print();
    }
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
          <h4>📄 {pdfData?.filename || 'PDF Document'}</h4>
          <span className="pdf-details">
            {pdfData?.size && `${Math.round(pdfData.size / 1024)} KB`}
            {pdfData?.uploadDate && ` • Uploaded: ${new Date(pdfData.uploadDate).toLocaleDateString()}`}
          </span>
        </div>

        <div className="pdf-controls">
          {/* Print Control */}
          <button 
            onClick={handlePrint}
            className="control-btn"
            title="Print PDF"
          >
            🖨️
          </button>

          {/* Refresh Control */}
          <button 
            onClick={handleRefresh}
            className="control-btn"
            title="Refresh PDF"
          >
            🔄
          </button>

          {/* Download Control */}
          <button 
            onClick={handleDownload}
            className="control-btn"
            title="Download PDF"
          >
            ⬇️
          </button>

          {/* Maximize Control */}
          <button 
            onClick={handleMaximize}
            className="control-btn"
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? '🗗' : '🗖'}
          </button>
        </div>
      </div>

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
        <span>
          {pdfData?.filename && `File: ${pdfData.filename}`}
          {fileId && ` • ID: ${fileId}`}
        </span>
        <span>
          PDF Viewer • Right-click for more options
        </span>
      </div>
    </div>
  );
};

export default PDFViewer;
