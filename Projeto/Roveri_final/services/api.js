import axios from "axios";

const DEFAULT_BASE = "http://localhost:8000/api/";
const apiBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || process.env.REACT_APP_API_URL || DEFAULT_BASE;

const api = axios.create({
  baseURL: apiBase,
  withCredentials: true, // ensures cookies are sent/received
});

// request interceptor (no-op, kept for extensibility)
api.interceptors.request.use((config) => {
  // attach Authorization header if access token is present in localStorage
  try {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("access_token") || localStorage.getItem("token");
    if (token) {
      if (!config.headers) config.headers = {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// response interceptor -> try refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response && error.response.status === 401 && !original._retry) {
      original._retry = true;
      try {
        // Ask the backend to refresh using cookie (backend reads refresh_token cookie)
        const resp = await axios.post("http://localhost:8000/api/token/refresh/", {}, { withCredentials: true });

        const newAccess = resp.data.access;
        if (newAccess) {
          // Do NOT persist refreshed access tokens in localStorage (prefer cookie-based auth).
          // Set Authorization header only for the retried request.
          if (original.headers) original.headers.Authorization = `Bearer ${newAccess}`;
        }

        // retry original request
        return api(original);
      } catch (e) {
        // refresh failed -> clear any stale tokens and reject; do not force a full-page redirect here.
        try {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        } catch (e) {
          /* ignore */
        }
        // Let the app's auth handling react to the rejected response (avoid reload loops)
        return Promise.reject(e);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
