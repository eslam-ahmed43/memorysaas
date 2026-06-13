export async function generateEmbedding(text) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'models/gemini-embedding-001',
                content: { parts: [{ text }] }
            })
        }
    )
    const data = await response.json()
    return data.embedding?.values || []
}

export async function generateAnswer(prompt) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.1,
                    topP: 0.8,
                }
            })
        }
    )
    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}