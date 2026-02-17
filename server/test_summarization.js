const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api/content';

async function testSummarization() {
    try {
        console.log('1. Triggering Feed Refresh (Analysis)...');
        // Note: Analysis might take time for many items.
        // For this test, we hope at least one gets processed quickly or we check existing.
        const refreshRes = await axios.post(`${API_URL}/refresh`, {});
        console.log(`✅ Refresh triggered. Count: ${refreshRes.data.count}`);

        console.log('2. Fetching Articles to check for Summaries...');
        const feedRes = await axios.get(`${API_URL}/feed`);
        const articles = feedRes.data;

        if (articles.length > 0) {
            const first = articles[0];
            console.log('\n--- Latest Article ---');
            console.log(`Title: ${first.title}`);
            console.log(`Topic: ${first.topic}`);
            console.log(`Summary: ${first.summary}`);
            console.log(`Why: ${first.why}`);

            if (first.summary !== "To be summarized" && first.topic !== "Uncategorized") {
                console.log('\n🎉 SUCCESS: AI Summary detected!');
            } else {
                console.log('\n⚠️ WARNING: Summary appears to be default/placeholder. AI might be slow or failing.');
            }
        } else {
            console.log('No articles found.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
}

testSummarization();
