// Quick test to verify your session cookie works
const axios = require('axios');

async function testCookie() {
    const sessionCookie = "connect.sid=s%3AW4KOBbdRNRp2y5BgOiSZ_n9AR0o1tICo.REPLACE_WITH_ACTUAL_SIGNATURE";
    
    try {
        const response = await axios.get('http://localhost:5000/api/lecturer/modules', {
            headers: {
                'Cookie': sessionCookie,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ SUCCESS! Status:', response.status);
        console.log('Response:', response.data);
    } catch (error) {
        console.log('❌ FAILED! Status:', error.response?.status);
        console.log('Error:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n🔑 Your session cookie is invalid or expired.');
            console.log('📋 Steps to get a real cookie:');
            console.log('1. Open http://localhost:5000 in browser');
            console.log('2. Login as lecturer');
            console.log('3. F12 → Network → Find Cookie header');
            console.log('4. Replace sessionCookie in artillery-lecturer.yml');
        }
    }
}

testCookie();