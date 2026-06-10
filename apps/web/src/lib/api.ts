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

const showToast = (message: string) => {
  if (typeof document === 'undefined') return;
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-danger text-white px-4 py-2 rounded shadow-lg z-50 text-sm animate-in slide-in-from-bottom-5';
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

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
      showToast(`[Error] ${errorMessage}`);
    } else if (error.request) {
      // Request was made but no response was received
      console.error('[API Connection Error]: No response received from server.');
      showToast('[Error] Network connection failed');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('[API Setup Error]:', error.message);
      showToast(`[Error] ${error.message}`);
    }
    return Promise.reject(error);
  }
);

export default api;
