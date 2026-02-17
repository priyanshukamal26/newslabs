const Parser = require('rss-parser');
const { Olama } = require('ollama'); // Check if this import is correct for commonjs

const parser = new Parser();

async function main() {
    console.log('Testing RSS Service (JS)...');
    try {
        const feed = await parser.parseURL('https://feeds.feedburner.com/TechCrunch/');
        console.log(`Fetched ${feed.items.length} items from ${feed.title}`);

        if (feed.items.length > 0) {
            console.log('Sample Title:', feed.items[0].title);
        }
    } catch (e) {
        console.error('RSS Error:', e);
    }

    console.log('\nTesting Ollama (JS)...');
    try {
        // Dynamic import for ollama if it's ESM only, or require
        // ollama package might be ESM. Let's try dynamic import just in case
        const ollama = await import('ollama');
        // ollama.default.chat if it's a default export

        console.log('Ollama lib loaded.');
        // verification only - don't necessarily need to call it if it's slow
    } catch (e) {
        console.error('Ollama Error:', e);
    }
}

main();
