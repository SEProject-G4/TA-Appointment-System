import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';

const axiosInstance = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true
});

// Add response interceptor to debug cookie handling
axiosInstance.interceptors.response.use(
    (response) => {
        // Log cookie-related headers and browser behavior
        console.log('🍪 Response interceptor:', {
            url: response.config.url,
            status: response.status,
            setCookieHeader: response.headers['set-cookie'],
            allHeaders: response.headers,
            documentCookies: document.cookie,
            withCredentials: response.config.withCredentials
        });
        
        // Check if Set-Cookie header exists but no cookies in document
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader && !document.cookie.includes('connect.sid')) {
            console.warn('⚠️ Browser received Set-Cookie header but rejected the cookie!', {
                setCookieHeader,
                currentCookies: document.cookie,
                reason: 'Likely blocked by browser security policy'
            });
        }
        
        return response;
    },
    (error) => {
        console.error('❌ Request failed:', {
            url: error.config?.url,
            status: error.response?.status,
            headers: error.response?.headers,
            message: error.message
        });
        return Promise.reject(error);
    }
);

export default axiosInstance;