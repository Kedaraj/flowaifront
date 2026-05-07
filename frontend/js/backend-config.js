// Backend Configuration
// This file contains the URL for the backend server

const BACKEND_API = {
  BASE_URL: 'https://flowai-zv77.onrender.com',
  
  // API Endpoints
  endpoints: {
    HEALTH: '/api/health',
    // Add more endpoints as needed
  },

  // Helper function to build full API URL
  getUrl(endpoint) {
    return this.BASE_URL + endpoint;
  },

  // Helper function for API calls
  async fetchAPI(endpoint, options = {}) {
    try {
      const url = this.getUrl(endpoint);
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[Backend API] Error calling ${endpoint}:`, error);
      throw error;
    }
  }
};

// Test connection to backend
window.addEventListener('load', async () => {
  try {
    const health = await BACKEND_API.fetchAPI(BACKEND_API.endpoints.HEALTH);
    console.log('[Backend] Server is healthy:', health);
  } catch (error) {
    console.warn('[Backend] Backend server is not available. Using client-side storage only.');
  }
});
