// test-google-auth.js - Manual test to get Google token
const axios = require('axios');

// STEP 1: Get this token from browser (Method 1 above)
const GOOGLE_ID_TOKEN = 'PASTE_YOUR_GOOGLE_ID_TOKEN_HERE';

async function testGoogleAuth() {
    try {
        console.log('🔍 Testing Google authentication...');
        
        const response = await axios.post('http://localhost:5000/api/auth/google-verify', {
            id_token: GOOGLE_ID_TOKEN
        }, {
            withCredentials: true
        });

        console.log('✅ Authentication successful!');
        console.log('📊 Response:', response.data);
        console.log('🍪 Cookies:', response.headers['set-cookie']);
        
        return response.headers['set-cookie'];
    } catch (error) {
        console.error('❌ Authentication failed:', error.response?.data || error.message);
    }
}

// Usage: 
// 1. Get Google ID token from browser
// 2. Replace GOOGLE_ID_TOKEN above
// 3. Run: node test-google-auth.js
testGoogleAuth();