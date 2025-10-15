import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';

const axiosInstance = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true
});

export default axiosInstance;