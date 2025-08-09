import axios from 'axios';

// In production, use the same domain. In development, use localhost:5000
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Use relative path in production
  : process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🔗 Environment:', process.env.NODE_ENV);

// This function now correctly handles file uploads using FormData.
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('pdf', file);

  try {
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error in uploadDocument API call:', error);
    if (error.response) {
      throw new Error(`Server responded with status: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response from server. Check network connection or server status.');
    } else {
      throw new Error('Error setting up the request.');
    }
  }
};

// This function is new and handles the podcast generation request.
export const generatePodcast = async (fileId) => {
  const response = await axios.post(`${API_BASE_URL}/generate-podcast`, { fileId });
  return response.data;
};

// All other API functions
export const generateSummary = async (fileId) => {
  const response = await axios.post(`${API_BASE_URL}/generate-summary`, { fileId });
  return response.data;
};

export const generateQuiz = async (fileId) => {
  const response = await axios.post(`${API_BASE_URL}/quiz/generate`, { fileId });
  return response.data;
};

export const generateFlashcards = async (fileId) => {
  const response = await axios.post(`${API_BASE_URL}/generate-flashcards`, { fileId });
  return response.data;
};

export const chatWithDocument = async (fileId, question) => {
  const response = await axios.post(`${API_BASE_URL}/chat`, { fileId, question });
  return response.data;
};
