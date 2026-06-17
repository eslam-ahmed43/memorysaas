export async function deepseekCritique(geminiAnalysis, context) {
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
                    content: 'You are a critical business analyst. Challenge AI-generated analysis to find blind spots and alternative interpretations. Be concise and evidence-based.'
                },
                {
                    role: 'user',
                    content: `Company Context:
${context}

Gemini's Analysis:
Risks: ${geminiAnalysis.risks?.map(r => r.title).join(', ')}
Opportunities: ${geminiAnalysis.opportunities?.map(o => o.title).join(', ')}
Summary: ${geminiAnalysis.summary}

Challenge this analysis. Find what might be wrong or missing.

Return JSON only:
{
  "challenges": [
    {"point": "...", "reasoning": "...", "alternative": "..."}
  ],
  "blind_spots": ["..."],
  "validation": {
    "agrees_with": ["..."],
    "disagrees_with": ["..."]
  },
  "revised_confidence": "high/medium/low",
  "final_verdict": "..."
}`
                }
            ],
            max_tokens: 800,
            temperature: 0.2
        })
    })

    if (!response.ok) {
        const err = await response.text()
        throw new Error(`DeepSeek API error: ${response.status} - ${err}`)
    }

    const data = await response.json()

    if (!data.choices?.[0]?.message?.content) {
        throw new Error('DeepSeek returned empty response')
    }

    const text = data.choices[0].message.content
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
}