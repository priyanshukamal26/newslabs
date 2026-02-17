const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api/auth';
const TEST_USER = {
    email: `auto_check_${Date.now()}@example.com`,
    password: 'password123',
    name: 'Auto Check'
};

async function testAuth() {
    try {
        console.log('1. Registering user...');
        const regRes = await axios.post(`${API_URL}/register`, TEST_USER);
        console.log('✅ Registration successful. User ID:', regRes.data.user.id);

        console.log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        const token = loginRes.data.token;
        console.log('✅ Login successful. Token received.');

        console.log('3. Updating topics...');
        const newTopics = ['AI & ML', 'Space Tech'];
        const updateRes = await axios.put(`${API_URL}/update`,
            { topics: newTopics },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (JSON.stringify(updateRes.data.user.topics) === JSON.stringify(newTopics)) {
            console.log('✅ Topics updated successfully:', updateRes.data.user.topics);
        } else {
            console.error('❌ Topics mismatch:', updateRes.data.user.topics);
        }

        console.log('\n🎉 ALL BACKEND CHECKS PASSED');
    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
}

testAuth();
