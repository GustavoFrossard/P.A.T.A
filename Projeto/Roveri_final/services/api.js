import axios from "axios";

const DEFAULT_BASE = "https://pata2.vercel.app/api/";
const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.REACT_APP_API_URL || DEFAULT_BASE;

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true, // ensures cookies are sent/received cross-origin
});

// Helper to get CSRF token from cookie
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Debug helper - log all cookies
function logAllCookies() {
  console.log('🍪 Todos os cookies:', document.cookie || 'Nenhum cookie encontrado');
  console.log('🍪 access_token:', getCookie('access_token') || 'Ausente');
  console.log('🍪 refresh_token:', getCookie('refresh_token') || 'Ausente');
  console.log('🍪 csrftoken:', getCookie('csrftoken') || 'Ausente');
}

// Export debug helper
window.debugCookies = logAllCookies;

// Request interceptor -> add CSRF token to headers
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie('csrftoken');
    const accessToken = getCookie('access_token');
    
    console.log(`📤 Request para: ${config.baseURL}${config.url}`);
    console.log('🍪 CSRF Token:', csrfToken ? 'Presente' : 'Ausente');
    console.log('🍪 Access Token:', accessToken ? 'Presente' : 'Ausente');
    
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// response interceptor -> try refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response && error.response.status === 401 && !original._retry) {
      original._retry = true;
      
      console.log('🔄 Token expirado, tentando refresh...');
      console.log('🍪 Cookies atuais:', document.cookie);
      
      try {
        // Ask the backend to refresh using cookie (backend reads refresh_token cookie)
        // Use the configured baseURL instead of hardcoded URL
        const refreshResponse = await api.post("token/refresh/", {}, { 
          withCredentials: true,
          headers: {
            'X-CSRFToken': getCookie('csrftoken') || ''
          }
        });
        
        console.log('✅ Refresh bem-sucedido:', refreshResponse.data);
        console.log('🍪 Cookies após refresh:', document.cookie);
        
        // Backend sets new access_token cookie, retry original request
        return api(original);
      } catch (refreshError) {
        // refresh failed -> let the app's auth handling react
        console.error('❌ Falha no refresh:', refreshError);
        console.log('🍪 Cookies após falha:', document.cookie);
        
        // Clear any invalid cookies
        document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
