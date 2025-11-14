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

// Request interceptor -> add CSRF token to headers
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie('csrftoken');
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
      try {
        // Ask the backend to refresh using cookie (backend reads refresh_token cookie)
        await axios.post("https://pata2.vercel.app/api/token/refresh/", {}, { withCredentials: true });
        
        // Backend sets new access_token cookie, retry original request
        return api(original);
      } catch (e) {
        // refresh failed -> let the app's auth handling react
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
