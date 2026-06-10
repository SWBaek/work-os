import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // Single-user environment: No complex authentication headers needed for now.
    // If auth is added later, token insertion logic goes here.
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Global Error Handling
    if (error.response) {
      // Server responded with a status code outside the 2xx range
      const status = error.response.status;
      const data = error.response.data as { error?: { message?: string } } | undefined;
      const errorMessage = data?.error?.message || 'Server Response Error';
      
      console.error(`[API Error ${status}]: ${errorMessage}`, data);
    } else if (error.request) {
      // Request was made but no response was received
      console.error('[API Connection Error]: No response received from server.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[API Setup Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
