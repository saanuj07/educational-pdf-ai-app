// Centralized API service with error handling and logging
export async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const error = new Error(`API Error: ${response.status} ${response.statusText}`);
      error.status = response.status;
      error.body = await response.text();
      throw error;
    }
    return await response.json();
  } catch (err) {
    // Log error to localStorage
    const logs = JSON.parse(localStorage.getItem('frontend-errors') || '[]');
    logs.push({
      type: 'API Error',
      error: err.toString(),
      url,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('frontend-errors', JSON.stringify(logs));
    // Optionally show toast or send to backend/Sentry
    throw err;
  }
}
