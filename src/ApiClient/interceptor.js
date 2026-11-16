import axios from "axios";

// 1. Create Axios instance with Backend Base URL
const apiClient = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: Automatically attach JWT Token if it exists
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

// 3. Response Interceptor: Handle global errors (e.g. token expired)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem("cityvoice_token");
      localStorage.removeItem("cityvoice_user");
    }
    return Promise.reject(error);
  }
);

export default apiClient;