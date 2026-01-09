export interface InventoryItem {
    id: string;
    productName: string;
    strainName: string;
    type: 'flower' | 'preroll' | 'blend';
    cannabinoids: Record<string, number>; // e.g. { THC: 24.5, CBD: 0.1 }
    terpenes: Record<string, number>; // e.g. { Myrcene: 0.5, Limonene: 0.3 }
    source: 'camera' | 'manual';
    imageUrl?: string;
    createdAt: string;
    active: boolean;
}

class InventoryStore {
    private items: InventoryItem[] = [];
    private listeners: (() => void)[] = [];

    constructor() {
        // Load from localStorage if client-side
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem('go_inventory');
                if (stored) {
                    this.items = JSON.parse(stored);
                } else {
                    // Mock data for demo
                    this.seedMockData();
                }
            } catch (e) {
                console.error('Failed to load inventory', e);
            }
        }
    }

    getItems(): InventoryItem[] {
        return this.items;
    }

    addItem(item: Omit<InventoryItem, 'id' | 'createdAt'>): InventoryItem {
        const newItem: InventoryItem = {
            ...item,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        this.items.unshift(newItem);
        this.persist();
        this.notify();
        return newItem;
    }

    removeItem(id: string) {
        this.items = this.items.filter(i => i.id !== id);
        this.persist();
        this.notify();
    }

    toggleActive(id: string) {
        const item = this.items.find(i => i.id === id);
        if (item) {
            item.active = !item.active;
            this.persist();
            this.notify();
        }
    }

    subscribe(listener: () => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private persist() {
        if (typeof window !== 'undefined') {
            localStorage.setItem('go_inventory', JSON.stringify(this.items));
        }
    }

    private notify() {
        this.listeners.forEach(l => l());
    }

    private seedMockData() {
        this.items = [
            {
                id: 'mock-1',
                productName: 'Premium Blue Dream',
                strainName: 'Blue Dream',
                type: 'flower',
                cannabinoids: { THC: 18.5, CBD: 0.1 },
                terpenes: { Myrcene: 0.8, Pinene: 0.3, Caryophyllene: 0.2 },
                source: 'manual',
                createdAt: new Date().toISOString(),
                active: true
            },
            {
                id: 'mock-2',
                productName: 'OG Kush Reserve',
                strainName: 'OG Kush',
                type: 'flower',
                cannabinoids: { THC: 24.2, CBD: 0.05 },
                terpenes: { Limonene: 0.6, Myrcene: 0.5, Linalool: 0.2 },
                source: 'manual',
                createdAt: new Date().toISOString(),
                active: true
            }
        ];
        this.persist();
    }
}

// Singleton instance
export const inventoryStore = new InventoryStore();
