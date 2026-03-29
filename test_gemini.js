const fs = require('fs');
const dotenv = require('dotenv');
const env = dotenv.parse(fs.readFileSync('.env'));

const testPrompt = async () => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: 'Say bismillah as a test.' }] }],
                generationConfig: { temperature: 0.4, topK: 32, topP: 0.95, maxOutputTokens: 800 }
            })
        });
        const data = await response.json();
        console.log(data.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to parse");
    } catch(err) {
        console.error(err);
    }
}
testPrompt();
