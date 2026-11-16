
import axios from "axios";

// Create Axios instance with Backend Base URL
const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Automatically attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("cityvoice_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("cityvoice_token");
      localStorage.removeItem("cityvoice_user");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
