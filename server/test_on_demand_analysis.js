const axios = require('axios');

const API_URL = 'http://127.0.0.1:3000/api/content';

async function testOnDemandAnalysis() {
    try {
        console.log('1. Triggering Feed Refresh (Should be fast)...');
        const start = Date.now();
        await axios.post(`${API_URL}/refresh`, {});
        const duration = Date.now() - start;
        console.log(`✅ Refresh complete in ${duration}ms`);

        console.log('2. Fetching Articles...');
        const feedRes = await axios.get(`${API_URL}/feed`);
        const articles = feedRes.data;

        if (articles.length > 0) {
            const article = articles[0];
            console.log(`\nSelected Article: ${article.title}`);
            console.log(`Current Summary: ${article.summary}`);

            if (article.summary === "Click to analyze") {
                console.log('\n3. Triggering Analysis (Lazy Load)...');
                const analyzeStart = Date.now();
                const analyzeRes = await axios.post(`${API_URL}/analyze`, { id: article.id });
                const analyzeDuration = Date.now() - analyzeStart;

                const analyzed = analyzeRes.data;
                console.log(`✅ Analysis complete in ${analyzeDuration}ms`);
                console.log(`New Summary: ${analyzed.summary}`);
                console.log(`Topic: ${analyzed.topic}`);
            } else {
                console.log('⚠️ Article already analyzed. Skipping analysis test.');
            }
        } else {
            console.log('❌ No articles found to test.');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
    }
}

testOnDemandAnalysis();
