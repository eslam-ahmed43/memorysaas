import https from 'https'

const QDRANT_URL = process.env.QDRANT_URL
const QDRANT_KEY = process.env.QDRANT_API_KEY
export const COLLECTION_NAME = 'company_memories'

const headers = {
    'Content-Type': 'application/json',
    'api-key': QDRANT_KEY,
}

async function qdrantFetch(path, options = {}) {
    const isVercel = process.env.VERCEL === '1'
    const fetchOptions = { ...options, headers: { ...headers, ...options.headers } }

    if (!isVercel) {
        const { default: fetch } = await import('node-fetch')
        const { Agent } = await import('https')
        const agent = new Agent({ rejectUnauthorized: false })
        return fetch(`${QDRANT_URL}${path}`, { ...fetchOptions, agent })
    }

    return fetch(`${QDRANT_URL}${path}`, fetchOptions)
}

export async function ensureCollection() {
    const res = await qdrantFetch(`/collections/${COLLECTION_NAME}`)
    const text = await res.text()
    if (res.status === 404) {
        await qdrantFetch(`/collections/${COLLECTION_NAME}`, {
            method: 'PUT',
            body: JSON.stringify({ vectors: { size: 3072, distance: 'Cosine' } }),
        })
    }
}

export async function upsertMemory(id, vector, payload) {
    await qdrantFetch(`/collections/${COLLECTION_NAME}/points`, {
        method: 'PUT',
        body: JSON.stringify({ points: [{ id, vector, payload }] }),
    })
}

export async function searchMemories(vector, companyId, limit = 5) {
    try {
        const res = await qdrantFetch(`/collections/${COLLECTION_NAME}/points/search`, {
            method: 'POST',
            body: JSON.stringify({
                vector,
                limit,
                filter: { must: [{ key: 'company_id', match: { value: companyId } }] },
                with_payload: true,
            }),
        })
        const text = await res.text()
        const data = JSON.parse(text)
        return data.result || []
    } catch (err) {
        console.error('Qdrant search error:', err)
        return []
    }
}