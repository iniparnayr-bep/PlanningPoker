/**
 * AI Rate Limiting
 *
 * Two layers:
 *  1. Per-IP limit: max 5 AI interactions per IP address (persists until server restart)
 *  2. Global hourly limit: max 100 AI calls per hour across all users
 *
 * Socket connections don't expose IPs directly through socket.id, so we track by
 * socket.id at connection time and look up the stored IP via the socketIpMap.
 */

// socketId → IP address (populated at connection time)
const socketIpMap: Map<string, string> = new Map();

// IP → number of AI calls used (lifetime, resets on server restart)
const ipCallCount: Map<string, number> = new Map();

// Global rolling hourly window
const globalHourlyCalls: number[] = []; // timestamps of each call
const GLOBAL_HOURLY_LIMIT = 100;
const PER_IP_LIMIT = 5;
const ONE_HOUR_MS = 60 * 60 * 1000;

export function registerSocketIp(socketId: string, ip: string) {
    socketIpMap.set(socketId, ip);
}

export function unregisterSocket(socketId: string) {
    socketIpMap.delete(socketId);
}

export function getIpForSocket(socketId: string): string {
    return socketIpMap.get(socketId) ?? 'unknown';
}

/**
 * Check if an AI call is allowed for the given socket.
 * Returns { allowed: true } or { allowed: false, reason: string }
 */
export function checkAiRateLimit(socketId: string): { allowed: boolean; reason?: string } {
    const ip = socketIpMap.get(socketId) ?? 'unknown';

    // 1. Global hourly check
    const now = Date.now();
    // Drop timestamps older than 1 hour
    while (globalHourlyCalls.length > 0 && now - globalHourlyCalls[0] > ONE_HOUR_MS) {
        globalHourlyCalls.shift();
    }
    if (globalHourlyCalls.length >= GLOBAL_HOURLY_LIMIT) {
        return {
            allowed: false,
            reason: `The AI assistant is temporarily busy — please try again in a few minutes.`,
        };
    }

    // 2. Per-IP check
    const used = ipCallCount.get(ip) ?? 0;
    if (used >= PER_IP_LIMIT) {
        return {
            allowed: false,
            reason: `You've used your ${PER_IP_LIMIT} free AI interactions for this session. The limit is per network to keep costs fair for everyone.`,
        };
    }

    return { allowed: true };
}

/**
 * Record a successful AI call.
 */
export function recordAiCall(socketId: string) {
    const ip = socketIpMap.get(socketId) ?? 'unknown';
    const used = ipCallCount.get(ip) ?? 0;
    ipCallCount.set(ip, used + 1);
    globalHourlyCalls.push(Date.now());
}

/**
 * Diagnostic info for logging.
 */
export function aiRateLimitStats(): { globalLastHour: number; uniqueIps: number } {
    const now = Date.now();
    const recentGlobal = globalHourlyCalls.filter(t => now - t <= ONE_HOUR_MS).length;
    return { globalLastHour: recentGlobal, uniqueIps: ipCallCount.size };
}
