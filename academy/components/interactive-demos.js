// Interactive Demo Components - ES Module
// Reusable educational tools

class InteractiveDemo {
    static sha256Hash(input) {
        // Simple SHA-256 demonstration (using crypto API if available)
        if (crypto && crypto.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            });
        } else {
            // Fallback simple hash for demo purposes
            let hash = 0;
            for (let i = 0; i < input.length; i++) {
                const char = input.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Promise.resolve(Math.abs(hash).toString(16).padStart(8, '0'));
        }
    }

    static inflationCalculator(amount, rate, years) {
        const futureValue = amount * Math.pow(1 + rate/100, years);
        const purchasing_power = amount / futureValue * amount;
        return {
            futureValue: futureValue.toFixed(2),
            purchasingPower: purchasing_power.toFixed(2),
            valueDestroyed: (amount - purchasing_power).toFixed(2)
        };
    }

    static bitcoinAddressGenerator() {
        // Generate demo Bitcoin addresses (not real!)
        const prefixes = ['1', '3', 'bc1q'];
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        
        let address = prefix;
        const length = prefix === 'bc1q' ? 39 : 30;
        
        for (let i = prefix.length; i < length; i++) {
            address += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return address;
    }

    static moneySupplyChart(year) {
        // Simulate money supply growth data
        const baseYear = 1971; // Nixon shock
        const yearsElapsed = year - baseYear;
        const growth = Math.pow(1.07, yearsElapsed); // ~7% annual growth
        
        return {
            year: year,
            usdSupply: (1 * growth).toFixed(1) + 'T',
            bitcoinSupply: Math.min(21, (year - 2009) * 0.5).toFixed(1) + 'M',
            inflationRate: year > 2020 ? '8.5%' : '2.1%'
        };
    }

    static merkleTreeDemo(transactions) {
        // Simple Merkle tree visualization
        if (!transactions || transactions.length === 0) {
            return { error: 'Need at least one transaction' };
        }

        // Pad to power of 2
        while (transactions.length & (transactions.length - 1)) {
            transactions.push(transactions[transactions.length - 1]);
        }

        let level = transactions.map(tx => this.simpleHash(tx));
        const tree = [level];

        while (level.length > 1) {
            const nextLevel = [];
            for (let i = 0; i < level.length; i += 2) {
                const combined = level[i] + level[i + 1];
                nextLevel.push(this.simpleHash(combined));
            }
            level = nextLevel;
            tree.push(level);
        }

        return {
            root: level[0],
            tree: tree,
            levels: tree.length
        };
    }

    static simpleHash(input) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16).substring(0, 8);
    }
}

export default InteractiveDemo;
