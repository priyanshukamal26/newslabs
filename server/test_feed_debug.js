async function testFeed() {
    try {
        console.log("Fetching feed...");
        const response = await fetch('http://localhost:3000/api/content/feed');
        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log(`Articles count: ${data.length}`);
        if (data.length > 0) {
            console.log("First article:", data[0].title);
        } else {
            console.log("No articles found.");
        }
    } catch (error) {
        console.error("Error fetching feed:", error.message);
    }
}

async function testChat() {
    try {
        console.log("Testing chat...");
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Hello, are you Groq?" })
        });
        const data = await response.json();
        console.log("Chat response:", data);
    } catch (error) {
        console.error("Error testing chat:", error.message);
    }
}

testFeed().then(testChat);
