import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextResponse } from 'next/server'
import fetch from 'node-fetch'
import https from 'https'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

export async function DELETE(request, { params }) {
    const supabaseAdmin = getSupabaseAdmin()
    const { id } = await params

    try {
        const { data: memories } = await supabaseAdmin
            .from('memories')
            .select('qdrant_id')
            .eq('document_id', id)

        if (memories && memories.length > 0) {
            const qdrantIds = memories.map(m => parseInt(m.qdrant_id)).filter(Boolean)
            if (qdrantIds.length > 0) {
                await fetch(
                    `${process.env.QDRANT_URL}/collections/company_memories/points/delete`,
                    {
                        method: 'POST',
                        agent: httpsAgent,
                        headers: {
                            'Content-Type': 'application/json',
                            'api-key': process.env.QDRANT_API_KEY,
                        },
                        body: JSON.stringify({ points: qdrantIds }),
                    }
                )
            }
        }

        await supabaseAdmin.from('memories').delete().eq('document_id', id)
        await supabaseAdmin.from('documents').delete().eq('id', id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}