const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api/ai';

async function testAIChat() {
    try {
        console.log('1. Testing AI Chat...');
        console.log('Sending message: "Hello, who are you?"');

        const start = Date.now();
        const res = await axios.post(`${API_URL}/chat`, {
            message: 'Hello, who are you?'
        });
        const duration = (Date.now() - start) / 1000;

        console.log(`✅ AI Replied in ${duration}s:`, res.data.reply);
        console.log('\n🎉 AI CHAT CHECK PASSED');
    } catch (error) {
        console.error('❌ AI Chat Test Failed:', error.response ? error.response.data : error.message);
    }
}

testAIChat();
