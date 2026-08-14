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

export async function POST(request) {
    const supabase = getSupabaseAdmin()

    try {
        // 1. Create collection
        console.log('Creating Qdrant collection...')
        const createResult = await qdrantRequest('/collections/memories', 'PUT', {
            vectors: { size: 3072, distance: 'Cosine' }
        })
        console.log('Collection result:', JSON.stringify(createResult))

        // 2. Get all memories from Supabase
        const { data: memories, error } = await supabase
            .from('memories')
            .select('*')
            .limit(500)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })

        console.log(`Found ${memories?.length || 0} memories to reindex`)

        if (!memories || memories.length === 0) {
            return NextResponse.json({ success: true, message: 'Collection created. No memories to reindex yet. Upload documents now.' })
        }

        // 3. Reindex in batches of 10
        let indexed = 0
        for (let i = 0; i < memories.length; i += 10) {
            const batch = memories.slice(i, i + 10)
            const points = await Promise.all(batch.map(async (m) => {
                const embedding = await generateEmbedding(m.content || '')
                return {
                    id: m.id.replace(/-/g, '').substring(0, 16),
                    vector: embedding,
                    payload: {
                        memory_id: m.id,
                        company_id: m.company_id,
                        content: m.content,
                        document_id: m.document_id,
                        document_name: m.document_name,
                    }
                }
            }))

            await qdrantRequest('/collections/memories/points', 'PUT', { points })
            indexed += batch.length
            console.log(`Indexed ${indexed}/${memories.length}`)
        }

        return NextResponse.json({ success: true, indexed, total: memories.length })
    } catch (err) {
        console.error('Reindex error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function GET() {
    // Just create the collection
    const result = await qdrantRequest('/collections/memories', 'PUT', {
        vectors: { size: 3072, distance: 'Cosine' }
    })
    return NextResponse.json({ result })
}