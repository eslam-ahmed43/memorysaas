const requests = new Map()

export function rateLimit(ip, limit = 20, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs

    if (!requests.has(ip)) {
        requests.set(ip, [])
    }

    const userRequests = requests.get(ip).filter(time => time > windowStart)
    userRequests.push(now)
    requests.set(ip, userRequests)

    return userRequests.length <= limit
}