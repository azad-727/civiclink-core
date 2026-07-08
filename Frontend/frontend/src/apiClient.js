// src/apiClient.js

// 🌍 DEPLOYMENT SWITCH: 
// Change this single string to your production URL when you deploy.
// Alternatively, use import.meta.env.VITE_API_URL for environment variables.
const BASE_URL = 'http://localhost:8080/api/v1';

async function fetchClient(endpoint, { method = 'GET', body, ...customConfig } = {}) {
  const token = localStorage.getItem('civiclink_token');
  
  const headers = { 
    'Content-Type': 'application/json' 
  };

  // Automatically attach the JWT if it exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: { ...headers, ...customConfig.headers },
  };

  // Stringify the body if it's a POST or PUT request
  if (body) {
    config.body = JSON.stringify(body);
  }

try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);
    
    // Check the Content-Type header to see if the server actually sent JSON
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If the server sent plain text (like an error message), read it as text
      const text = await response.text();
      // Wrap it in an object so our app logic still works
      data = { message: text }; 
    }

    if (!response.ok) {
      // This will now catch the text error message gracefully
      throw new Error(data.message || `HTTP Error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Client Error:', error);
    throw error;
  }
}

// Export a clean object that mimics Axios syntax for easy use across your app
const apiClient = {
  get: (endpoint, config) => fetchClient(endpoint, { ...config, method: 'GET' }),
  post: (endpoint, body, config) => fetchClient(endpoint, { ...config, method: 'POST', body }),
  put: (endpoint, body, config) => fetchClient(endpoint, { ...config, method: 'PUT', body }),
  patch: (endpoint, body, config) => fetchClient(endpoint, { ...config, method: 'PATCH', body }),
  delete: (endpoint, config) => fetchClient(endpoint, { ...config, method: 'DELETE' }),
};


export default apiClient;