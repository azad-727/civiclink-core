// src/apiClient.js

// Production: set VITE_API_URL in Vercel dashboard → your Render gateway URL
// Development: falls back to localhost automatically
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// ─── 401 Auto-Logout Handler ─────────────────────────────────────────────────
// Called whenever any API request gets a 401 Unauthorized response.
// This happens when the JWT has expired server-side.
// We clear localStorage and redirect to /login so the user gets a fresh token.
function handleUnauthorized() {
  console.warn('Session expired (401). Clearing auth and redirecting to login.');
  localStorage.removeItem('civiclink_user');
  localStorage.removeItem('civiclink_token');
  // Use window.location so it works outside of React's Router context
  if (!window.location.pathname.includes('/login')) {
    window.location.href = '/login';
  }
}

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

  // Stringify the body for write requests
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // ✅ Key fix: intercept 401 before anything else
    if (response.status === 401) {
      handleUnauthorized();
      throw new Error('Session expired. Please log in again.');
    }

    // Check the Content-Type to parse correctly
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const err = new Error(data.message || `HTTP Error: ${response.status}`);
      err.status = response.status;
      throw err;
    }

    return data;
  } catch (error) {
    console.error('API Client Error:', error);
    throw error;
  }
}

// Export a clean object that mimics Axios syntax
const apiClient = {
  get:    (endpoint, config)        => fetchClient(endpoint, { ...config, method: 'GET' }),
  post:   (endpoint, body, config)  => fetchClient(endpoint, { ...config, method: 'POST', body }),
  put:    (endpoint, body, config)  => fetchClient(endpoint, { ...config, method: 'PUT', body }),
  patch:  (endpoint, body, config)  => fetchClient(endpoint, { ...config, method: 'PATCH', body }),
  delete: (endpoint, config)        => fetchClient(endpoint, { ...config, method: 'DELETE' }),
};

export default apiClient;