// get-session-cookie.js - Helper to get valid session cookie
const axios = require('axios');

async function getSessionCookie() {
    try {
        // This would require a valid Google ID token
        // You'd get this from your frontend after Google OAuth
        const response = await axios.post('http://localhost:5000/api/auth/google-verify', {
            id_token: 'your_actual_google_id_token_here'
        }, {
            withCredentials: true
        });

        // Extract session cookie from response headers
        const cookies = response.headers['set-cookie'];
        if (cookies) {
            const sessionCookie = cookies.find(cookie => cookie.startsWith('connect.sid'));
            console.log('Session Cookie:', sessionCookie);
            return sessionCookie;
        }
    } catch (error) {
        console.error('Error getting session cookie:', error.message);
    }
}

// Usage: node get-session-cookie.js
getSessionCookie();