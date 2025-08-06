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
    
    // Enhanced error logging for quiz errors with error codes
    if (errorData.code && errorData.code.startsWith('QUIZ_')) {
      console.error(`🚨 QUIZ ERROR [${errorData.code}]:`, {
        message: errorData.error,
        location: errorData.location,
        details: errorData.details,
        resolution: errorData.resolution,
        timestamp: errorData.timestamp
      });
      
      // Create user-friendly error message
      const userMessage = `Quiz Error ${errorData.code}: ${errorData.details}. ${errorData.resolution}`;
      throw new Error(userMessage);
    }
  } catch (e) {
    if (e.message.includes('Quiz Error')) {
      throw e; // Re-throw quiz errors with detailed messages
    }
    error.details = { message: 'Unable to parse error response' };
  }
  
  console.error('🚨 API Error:', JSON.stringify(error, null, 2));
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

export const generateQuiz = async (fileId) => {
  try {
    console.log('📊 Generating quiz for file:', fileId);
    
    if (!fileId) {
      throw new Error('QUIZ_001: Missing fileId parameter. Please ensure a document is selected.');
    }
    
    const response = await fetch(`${API_BASE_URL}/quiz/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      await handleApiError(response, '/quiz/generate');
    }
    
    const result = await response.json();
    
    // Enhanced success logging
    console.log('✅ Quiz generated successfully:', {
      questionsCount: result.quiz?.length || 0,
      source: result.source,
      fileId: fileId,
      controller: result.metadata?.controller,
      timestamp: result.metadata?.generatedAt
    });
    
    return result;
    
  } catch (error) {
    console.error('🚨 Quiz generation failed:', error);
    
    // Provide more specific error messages based on error type
    if (error.name === 'TimeoutError') {
      throw new Error('QUIZ_TIMEOUT: Quiz generation timed out. The document might be too large or the server is busy. Please try again.');
    } else if (error.message.includes('Failed to fetch')) {
      throw new Error('QUIZ_CONNECTION: Cannot connect to quiz service. Please check if the backend server is running on port 5001.');
    } else if (error.message.includes('QUIZ_')) {
      throw error; // Re-throw quiz-specific errors with error codes
    }
    
    throw new Error(`QUIZ_UNKNOWN: Unexpected error during quiz generation: ${error.message}`);
  }
};
