import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { generateEmbedding, generateAnswer } from '@/lib/gemini'
import { upsertMemory, ensureCollection } from '@/lib/qdrant'
import { NextResponse } from 'next/server'
import mammoth from 'mammoth'
import PDFParser from 'pdf2json'
import * as XLSX from 'xlsx'

const uploadRequests = new Map()

function rateLimit(ip, limit = 10, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs
    if (!uploadRequests.has(ip)) uploadRequests.set(ip, [])
    const reqs = uploadRequests.get(ip).filter(t => t > windowStart)
    reqs.push(now)
    uploadRequests.set(ip, reqs)
    return reqs.length <= limit
}

const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv',
]

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.txt', '.xlsx', '.xls', '.csv', '.py', '.js', '.ts', '.tsx', '.jsx', '.cpp', '.c', '.java', '.html', '.css', '.json', '.md']

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

async function extractTextFromPDF(buffer) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser()
        pdfParser.on('pdfParser_dataReady', (pdfData) => {
            const text = pdfData.Pages.map(page =>
                page.Texts.map(t => { try { return decodeURIComponent(t.R[0].T) } catch { return t.R[0].T } }).join(' ')
            ).join('\n')
            resolve(text)
        })
        pdfParser.on('pdfParser_dataError', reject)
        pdfParser.parseBuffer(buffer)
    })
}

async function extractText(buffer, fileType, fileName) {
    if (fileType === 'application/pdf') return await extractTextFromPDF(buffer)
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ buffer })
        return result.value
    }
    if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'application/vnd.ms-excel' ||
        fileName?.endsWith('.xlsx') || fileName?.endsWith('.xls')) {
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        let text = ''
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName]
            text += `Sheet: ${sheetName}\n`
            text += XLSX.utils.sheet_to_csv(sheet) + '\n\n'
        })
        return text
    }
    if (fileType === 'text/csv' || fileName?.endsWith('.csv')) return buffer.toString('utf-8')
    const codeExtensions = ['.py', '.js', '.ts', '.tsx', '.jsx', '.cpp', '.c', '.java', '.html', '.css', '.json', '.md']
    const isCode = codeExtensions.some(ext => fileName?.endsWith(ext))
    if (isCode || fileType === 'text/plain') return `File: ${fileName}\n\n${buffer.toString('utf-8')}`
    return buffer.toString('utf-8')
}

function chunkText(text, chunkSize = 500, overlap = 50) {
    const words = text.split(' ')
    const chunks = []
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
        const chunk = words.slice(i, i + chunkSize).join(' ')
        if (chunk.trim()) chunks.push(chunk)
    }
    return chunks
}

export async function POST(request) {
    const supabaseAdmin = getSupabaseAdmin()
    try {
        const ip = request.headers.get('x-forwarded-for') || 'unknown'
        if (!rateLimit(ip)) {
            return NextResponse.json({ error: 'طلبات كثيرة جداً، انتظر دقيقة' }, { status: 429 })
        }

        const formData = await request.formData()
        const file = formData.get('file')
        const companyId = formData.get('company_id')
        const userId = formData.get('user_id')

        if (!file || !companyId) {
            return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
        }

        if (!companyId.match(/^[0-9a-f-]{36}$/)) {
            return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
        }

        const fileName = file.name
        const fileType = file.type
        const fileExt = '.' + fileName.split('.').pop()?.toLowerCase()

        const isAllowedType = ALLOWED_TYPES.includes(fileType) || ALLOWED_EXTENSIONS.includes(fileExt)
        if (!isAllowedType) {
            return NextResponse.json({ error: 'نوع الملف غير مدعوم' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())

        if (buffer.length > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'حجم الملف كبير جداً (الحد الأقصى 10MB)' }, { status: 400 })
        }

        const { data: document, error: docError } = await supabaseAdmin
            .from('documents')
            .insert({
                company_id: companyId,
                name: fileName.substring(0, 255),
                file_type: fileType,
                file_size: buffer.length,
                status: 'processing',
                uploaded_by: userId,
            })
            .select()
            .single()

        if (docError) return NextResponse.json({ error: 'خطأ في حفظ الملف' }, { status: 400 })

        const text = await extractText(buffer, fileType, fileName)
        const chunks = chunkText(text)

        await ensureCollection()

        for (let i = 0; i < chunks.length; i++) {
            const embedding = await generateEmbedding(chunks[i])
            const numericId = Math.abs(
                chunks[i].split('').reduce((a, c) => (a << 5) - a + c.charCodeAt(0), i * 1000) >>> 0
            )
            await upsertMemory(numericId, embedding, {
                company_id: companyId,
                document_id: document.id,
                document_name: fileName,
                content: chunks[i],
                chunk_index: i,
            })
            await supabaseAdmin.from('memories').insert({
                company_id: companyId,
                document_id: document.id,
                content: chunks[i],
                chunk_index: i,
                qdrant_id: String(numericId),
            })
        }

        await supabaseAdmin.from('documents').update({ status: 'completed' }).eq('id', document.id)

        try {
            const timelinePrompt = `اقرأ النص التالي واستخرج الأحداث المهمة مع تواريخها.
أرجع JSON array فقط بهذا الشكل بدون أي نص إضافي:
[{"title": "عنوان الحدث", "description": "وصف مختصر", "date": "YYYY-MM-DD"}]
لو مفيش تواريخ واضحة، استخدم تاريخ اليوم.
النص:
${text.substring(0, 3000)}`
            const timelineResponse = await generateAnswer(timelinePrompt)
            const cleanJson = timelineResponse.replace(/```json|```/g, '').trim()
            const events = JSON.parse(cleanJson)
            for (const event of events) {
                await supabaseAdmin.from('timeline_events').insert({
                    company_id: companyId,
                    title: event.title?.substring(0, 255),
                    description: event.description?.substring(0, 1000),
                    event_date: event.date || new Date().toISOString(),
                    source_document_id: document.id,
                })
            }
        } catch (e) {
            console.log('Timeline extraction skipped:', e.message)
        }

        return NextResponse.json({ success: true, document, chunks: chunks.length })
    } catch (error) {
        console.error('Documents POST error:', error.message)
        return NextResponse.json({ error: 'حدث خطأ في المعالجة' }, { status: 500 })
    }
}

export async function GET(request) {
    const supabaseAdmin = getSupabaseAdmin()
    try {
        const { searchParams } = new URL(request.url)
        const companyId = searchParams.get('company_id')

        if (!companyId || !companyId.match(/^[0-9a-f-]{36}$/)) {
            return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 })
        }

        const { data, error } = await supabaseAdmin
            .from('documents')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false })

        if (error) return NextResponse.json({ error: 'خطأ في جلب البيانات' }, { status: 400 })
        return NextResponse.json({ documents: data })
    } catch (error) {
        console.error('Documents GET error:', error.message)
        return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
    }
}