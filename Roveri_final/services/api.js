import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api/",
  withCredentials: true, // ensures cookies are sent/received
});

// request interceptor (no-op, kept for extensibility)
api.interceptors.request.use((config) => {
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
          // store temporarily so code that relies on header can use it
          localStorage.setItem("accessToken", newAccess);
          // set header for original request
          if (original.headers) original.headers.Authorization = `Bearer ${newAccess}`;
        }

        // retry original request
        return api(original);
      } catch (e) {
        // refresh failed -> clear storage and send to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
