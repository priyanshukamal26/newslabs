const axios = require('axios');

async function testAuth() {
    const API_URL = 'http://127.0.0.1:3000/api';

    try {
        // 1. Signup
        const signupEmail = `testuser_${Date.now()}@example.com`;
        console.log(`Trying signup with ${signupEmail}...`);

        await axios.post(`${API_URL}/auth/register`, {
            email: signupEmail,
            password: 'password123',
            name: 'Test User'
        });
        console.log('✅ Signup successful');

        // 2. Login
        console.log('Trying login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: signupEmail,
            password: 'password123'
        });

        if (loginRes.data.token) {
            console.log('✅ Login successful, token received');
        } else {
            console.log('❌ Login failed: No token received');
        }

    } catch (error) {
        console.error('❌ Auth test failed:', error.response ? error.response.data : error.message);
    }
}

testAuth();
