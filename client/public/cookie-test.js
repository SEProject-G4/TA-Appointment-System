// Cookie Testing Script
// Run this in browser console to test cookie behavior

async function testCookies() {
    console.log('🧪 Starting cookie tests...');
    console.log('📋 Initial cookies:', document.cookie);
    
    try {
        // Test 1: Basic API connection
        console.log('\n📡 Test 1: Basic API connection...');
        const testResponse = await fetch('https://ta-appointment-system.onrender.com/api/test', {
            credentials: 'include'
        });
        const testData = await testResponse.json();
        console.log('✅ API connection:', testData);
        
        // Test 2: Test cookie setting
        console.log('\n🍪 Test 2: Cookie setting test...');
        const cookieResponse = await fetch('https://ta-appointment-system.onrender.com/api/test-cookie', {
            credentials: 'include'
        });
        const cookieData = await cookieResponse.json();
        console.log('📤 Server response:', cookieData);
        console.log('📋 Set-Cookie headers:', cookieResponse.headers.get('set-cookie'));
        console.log('📋 All response headers:', [...cookieResponse.headers.entries()]);
        
        // Wait a moment for browser to process
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('📋 Cookies after server set:', document.cookie);
        
        // Test 3: Check if cookies are sent back
        console.log('\n🔄 Test 3: Cookie round-trip test...');
        const checkResponse = await fetch('https://ta-appointment-system.onrender.com/api/test-cookie-check', {
            credentials: 'include'
        });
        const checkData = await checkResponse.json();
        console.log('📨 Server received cookies:', checkData);
        
        // Test 4: Manual cookie setting
        console.log('\n✋ Test 4: Manual cookie test...');
        console.log('📋 Before manual set:', document.cookie);
        document.cookie = 'manual-test=works; path=/; secure; samesite=none';
        console.log('📋 After manual set:', document.cookie);
        
        // Test 5: Session debug
        console.log('\n🔍 Test 5: Session debug...');
        const sessionResponse = await fetch('https://ta-appointment-system.onrender.com/api/debug/session', {
            credentials: 'include'
        });
        const sessionData = await sessionResponse.json();
        console.log('🔐 Session info:', sessionData);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
console.log('🚀 Cookie test function loaded. Run testCookies() to start testing.');

// Auto-run for convenience
testCookies();