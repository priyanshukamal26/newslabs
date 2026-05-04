const { pipeline } = require('@xenova/transformers');

// Mocking a simplified version of the current lexicon engine for comparison
const POSITIVE_WORDS = new Set(['good', 'great', 'excellent', 'success', 'breakthrough', 'improve', 'growth', 'positive']);
const NEGATIVE_WORDS = new Set(['bad', 'fail', 'failure', 'drop', 'decline', 'crisis', 'risk', 'negative', 'concern', 'criticism']);

function analyzeLexicon(text) {
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
    let pos = 0; let neg = 0;
    words.forEach(w => {
        if (POSITIVE_WORDS.has(w)) pos++;
        if (NEGATIVE_WORDS.has(w)) neg++;
    });
    const total = pos + neg;
    if (total === 0) return 'Neutral';
    const score = (pos - neg) / total;
    if (score > 0.1) return 'Positive';
    if (score < -0.1) return 'Negative';
    return 'Neutral';
}

async function runComparison() {
    console.log("Loading Transformer Model (DistilBERT SST-2)...");
    // This will download the model on the first run (~60MB quantized)
    const classifier = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');

    const testCases = [
        "Tech: Apple releases a revolutionary new chip that doubles performance.",
        "Science: Researchers find no evidence of life on Mars after new study.",
        "Politics: The government faces criticism after the latest tax reform fails to help families.",
        "Health: Breakthrough in Alzheimer's treatment shows promising results.",
        "General: The stock market remains stable despite minor fluctuations in tech stocks."
    ];

    console.log("\n" + "=".repeat(100));
    console.log(`${"TEST CASE".padEnd(60)} | ${"OLD (Lexicon)".padEnd(15)} | ${"NEW (Transformer)"}`);
    console.log("-".repeat(100));

    for (const text of testCases) {
        const oldResult = analyzeLexicon(text);
        
        // Transformer inference
        const start = Date.now();
        const [newResult] = await classifier(text);
        const latency = Date.now() - start;

        const label = newResult.label === 'POSITIVE' ? 'Positive' : 'Negative';
        const confidence = (newResult.score * 100).toFixed(1) + "%";

        console.log(`${text.substring(0, 58).padEnd(60)} | ${oldResult.padEnd(15)} | ${label} (${confidence}) [${latency}ms]`);
    }
    console.log("=".repeat(100) + "\n");
}

runComparison().catch(err => {
    console.error("Error during comparison:", err);
});
