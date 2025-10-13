// get-google-token.js - Helper to extract Google ID token
// Add this to your frontend Google login success callback temporarily

// In your Google login success callback, add:
function onGoogleLoginSuccess(response) {
    console.log('🔑 GOOGLE ID TOKEN:', response.credential);
    // Copy this token from browser console
    
    // Your existing login code...
    // sendTokenToBackend(response.credential);
}

// Or if using Google Identity Services:
function handleCredentialResponse(response) {
    console.log('🔑 GOOGLE ID TOKEN:', response.credential);
    // Copy this token from browser console
    
    // Your existing code...
}

// INSTRUCTIONS:
// 1. Add the console.log line to your Google login callback
// 2. Login through your app
// 3. Check browser console for the token
// 4. Copy the token (starts with eyJ...)
// 5. Remove the console.log after getting the token