export async function deepseekCritique(geminiAnalysis, context) {
    console.log('DeepSeek critique started...')

    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                {
                    role: 'system',
                    content: 'You are a critical analyst challenging AI-generated business intelligence. Find flaws, gaps, and alternative interpretations. Be constructive but rigorous.'
                },
                {
                    role: 'user',
                    content: `Company Context:
${context}

Gemini Analysis to Challenge:
${JSON.stringify(geminiAnalysis, null, 2)}

Find what might be wrong, missing perspectives, and alternative interpretations.

Return JSON only, no extra text:
{
  "challenges": [
    {
      "point": "what Gemini got wrong or overstated",
      "reasoning": "why this is questionable",
      "alternative": "alternative interpretation"
    }
  ],
  "blind_spots": ["missing perspective 1", "missing perspective 2"],
  "validation": {
    "agrees_with": ["point Gemini got right"],
    "disagrees_with": ["point that needs revision"]
  },
  "revised_confidence": "high/medium/low",
  "final_verdict": "overall assessment after critique"
}`
                }
            ],
            max_tokens: 1000,
            temperature: 0.3
        })
    })

    const data = await response.json()
    console.log('DeepSeek status:', response.status)
    console.log('DeepSeek response:', JSON.stringify(data).substring(0, 200))

    if (!data.choices?.[0]?.message?.content) {
        throw new Error('DeepSeek returned empty response')
    }

    const text = data.choices[0].message.content
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
}