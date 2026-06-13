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
                    content: `You are a critical analyst challenging AI-generated business intelligence. 
Your job is to find flaws, gaps, and alternative interpretations in the analysis provided.
Be constructive but rigorous. Focus on what might be wrong or missing.`
                },
                {
                    role: 'user',
                    content: `Context about the company:
${context}

Gemini's Analysis:
${JSON.stringify(geminiAnalysis, null, 2)}

Challenge this analysis. Find:
1. What might be wrong or overstated
2. Missing perspectives or blind spots
3. Alternative interpretations
4. What needs more evidence

Return JSON only:
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
            temperature: 0.7
        })
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
}