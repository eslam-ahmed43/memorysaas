import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateEmbedding } from '@/lib/gemini'
import { NextResponse } from 'next/server'

const QDRANT_URL = process.env.QDRANT_URL
const QDRANT_API_KEY = process.env.QDRANT_API_KEY

async function qdrantRequest(path, method, body) {
    const res = await fetch(`${QDRANT_URL}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'api-key': QDRANT_API_KEY,
        },
        body: body ? JSON.stringify(body) : undefined,
    })
    const text = await res.text()
    try { return JSON.parse(text) } catch { return { error: text } }
}

function uuidToInt(uuid) {
    const hex = uuid.replace(/-/g, '')
    return parseInt(hex.substring(0, 15), 16)
}

export async function POST(request) {
    const supabase = getSupabaseAdmin()
    try {
        // Delete and recreate collection
        await qdrantRequest('/collections/memories', 'DELETE')
        const createResult = await qdrantRequest('/collections/memories', 'PUT', {
            vectors: { size: 3072, distance: 'Cosine' }
        })
        console.log('Collection created:', JSON.stringify(createResult))

        const { data: memories, error } = await supabase
            .from('memories')
            .select('*')
            .limit(500)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        if (!memories || memories.length === 0) {
            return NextResponse.json({ success: true, message: 'Collection created. Upload documents now.' })
        }

        console.log(`Reindexing ${memories.length} memories...`)

        let indexed = 0
        let failed = 0

        for (let i = 0; i < memories.length; i += 5) {
            const batch = memories.slice(i, i + 5)
            const points = []

            for (const m of batch) {
                try {
                    const embedding = await generateEmbedding(m.content || '')
                    if (embedding && embedding.length > 0) {
                        points.push({
                            id: uuidToInt(m.id),
                            vector: embedding,
                            payload: {
                                memory_id: m.id,
                                company_id: m.company_id,
                                content: m.content,
                                document_id: m.document_id,
                                document_name: m.document_name,
                            }
                        })
                    }
                } catch (e) {
                    failed++
                    console.error('Error embedding:', e.message)
                }
            }

            if (points.length > 0) {
                const result = await qdrantRequest('/collections/memories/points', 'PUT', { points })
                console.log(`Batch ${i}-${i + 5}:`, JSON.stringify(result).substring(0, 100))
            }

            indexed += batch.length
        }

        return NextResponse.json({ success: true, indexed, failed, total: memories.length })
    } catch (err) {
        console.error('Reindex error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}