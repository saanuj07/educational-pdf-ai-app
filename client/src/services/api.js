const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Enhanced error handling with detailed logging
const handleApiError = async (response, endpoint) => {
  const error = {
    status: response.status,
    statusText: response.statusText,
    endpoint,
    timestamp: new Date().toISOString()
  };
  
  try {
    const errorData = await response.json();
    error.details = errorData;
  } catch (e) {
    error.details = { message: 'Unable to parse error response' };
  }
  
  console.error('🚨 API Error:', error);
  throw new Error(`API Error (${response.status}): ${error.details.message || response.statusText}`);
};

export const uploadPDF = async (file) => {
  try {
    const formData = new FormData();
    formData.append('pdf', file);
    
    console.log('📤 Uploading PDF:', { 
      filename: file.name, 
      size: file.size,
      apiUrl: `${API_BASE_URL}/upload`
    });
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type header for FormData - let browser set it with boundary
      },
      // Add timeout and retry logic
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      await handleApiError(response, '/upload');
    }
    
    const result = await response.json();
    console.log('✅ Upload successful:', result);
    return result;
  } catch (error) {
    console.error('💥 Upload failed:', error);
    
    // Provide more specific error messages
    if (error.name === 'TimeoutError') {
      throw new Error('Upload timed out. Please try again.');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('Cannot connect to server. Please check if the backend is running.');
    }
    
    throw error;
  }
};

export const generateSummary = async (fileId) => {
  const response = await fetch(`${API_BASE_URL}/generate-summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId })
  });
  
  if (!response.ok) {
    throw new Error('Summary generation failed');
  }
  
  return response.json();
};

export const generateFlashcards = async (fileId) => {
  const response = await fetch(`${API_BASE_URL}/generate-flashcards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId })
  });
  
  if (!response.ok) {
    throw new Error('Flashcard generation failed');
  }
  
  return response.json();
};

export const chatWithPDF = async (fileId, question) => {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileId, question })
  });
  
  if (!response.ok) {
    throw new Error('Chat failed');
  }
  
  return response.json();
};
