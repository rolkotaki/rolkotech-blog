import axios from "axios";
import type {
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

export const BACKEND_URL: string = import.meta.env.VITE_BACKEND_URL;
export const API_VERSION_STR: string = import.meta.env.API_VERSION_STR;
export const API_DOCS_URL: string = `${BACKEND_URL}/docs`;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: `${BACKEND_URL}${API_VERSION_STR}`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for auth tokens
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Send the token from localStorage in the Authorization header
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
