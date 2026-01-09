'use client';

type UsageHistory = {
    [strainId: string]: {
        lastUsed: number;
        usageCount: number;
    };
};

class UsageHistoryStore {
    private history: UsageHistory = {};
    private readonly STORAGE_KEY = 'go_usage_history';

    constructor() {
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(this.STORAGE_KEY);
                if (stored) {
                    this.history = JSON.parse(stored);
                }
            } catch (e) {
                console.error('Failed to load usage history', e);
            }
        }
    }

    /**
     * Calculate freshness penalty (0.25 to 1.0) based on recency.
     * 1.0 = Fresh (Available)
     * 0.25 = Stale (Avoid)
     */
    getFreshnessFactor(strainId: string): number {
        const entry = this.history[strainId];
        if (!entry) return 1.0;

        const hoursSince = (Date.now() - entry.lastUsed) / (1000 * 60 * 60);

        // Hard penalty for immediate repetition
        if (hoursSince < 0.5) return 0.25; // < 30 mins
        if (hoursSince < 2) return 0.5;    // < 2 hours
        if (hoursSince < 12) return 0.8;   // < 12 hours

        return 1.0;
    }

    /**
     * Record usage of a strain.
     */
    recordUsage(strainId: string) {
        const entry = this.history[strainId] || { lastUsed: 0, usageCount: 0 };
        entry.lastUsed = Date.now();
        entry.usageCount += 1;
        this.history[strainId] = entry;
        this.persist();
    }

    /**
     * Get raw usage count for debugging or analytics
     */
    getUsageCount(strainId: string): number {
        return this.history[strainId]?.usageCount || 0;
    }

    private persist() {
        if (typeof window !== 'undefined') {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.history));
        }
    }
}

export const usageHistoryStore = new UsageHistoryStore();
