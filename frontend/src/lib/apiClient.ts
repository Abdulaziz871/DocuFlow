import axios from 'axios';
import Cookies from 'js-cookie';

// All requests go through the Next.js rewrite (/backend/*) which forwards to the Express API,
// so the browser never needs to know the backend's real origin (avoids CORS in production).
const apiClient = axios.create({
  baseURL: '/backend',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('df_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('df_token');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
