require('dotenv').config();
const Groq = require('groq-sdk');

async function testGroqConnection() {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    console.log('Testing Groq Connection...');
    console.log('API Key present:', !!apiKey);
    console.log('Model:', model);

    if (!apiKey) {
        console.error('❌ Error: GROQ_API_KEY is missing in .env');
        return;
    }

    const groq = new Groq({ apiKey });

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Hello, are you working?' }],
            model: model,
        });

        console.log('✅ Connection Successful!');
        console.log('Response:', chatCompletion.choices[0]?.message?.content);
    } catch (error) {
        console.error('❌ Groq API Error:', error.message);
        if (error.error) {
            console.error('Full Error Details:', JSON.stringify(error.error, null, 2));
        }
    }
}

testGroqConnection();
