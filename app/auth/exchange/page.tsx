'use client'

import { useEffect } from 'react'

export default function ExchangePage() {
    useEffect(() => {
        async function test() {
            console.log('========== OAUTH DEBUG ==========')
            console.log('FULL URL:', window.location.href)
            console.log('SEARCH:', window.location.search)
            console.log('HASH:', window.location.hash)

            const params = new URL(window.location.href).searchParams

            console.log('CODE:', params.get('code'))
            console.log('ERROR:', params.get('error'))
            console.log('ERROR DESC:', params.get('error_description'))
        }

        test()
    }, [])

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#111',
            color: 'white'
        }}>
            Debugging OAuth...
        </div>
    )
}