import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';

const axiosInstance = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true
});

// Add response interceptor for error handling
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Log authentication errors for debugging
        if (error.response?.status === 401) {
            console.warn('Authentication required - redirecting to login');
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;