export class Enemy {
    constructor(x, y, type, floor) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.floor = floor;
        
        this.symbol = 'E';
        this.hp = 0;
        this.maxHp = 0;
        this.atk = 0;
        this.def = 0;
        this.spd = 0;
        
        this.xpValue = 0;
        this.goldValue = 0;
        
        this.initStats();
    }
    
    initStats() {
        const baseStats = this.getBaseStats();
        const floorMultiplier = 1 + (this.floor - 1) * 0.15;
        
        this.maxHp = Math.floor(baseStats.hp * floorMultiplier);
        this.hp = this.maxHp;
        this.atk = Math.floor(baseStats.atk * floorMultiplier);
        this.def = Math.floor(baseStats.def * floorMultiplier);
        this.spd = baseStats.spd;
        
        this.xpValue = Math.floor(baseStats.xp * floorMultiplier);
        this.goldValue = Math.floor(baseStats.gold * floorMultiplier);
    }
    
    getBaseStats() {
        const stats = {
            'walker': { hp: 30, atk: 8, def: 3, spd: 5, xp: 15, gold: 5, symbol: 'W' },
            'archer': { hp: 20, atk: 12, def: 2, spd: 6, xp: 20, gold: 8, symbol: 'A' },
            'mage': { hp: 25, atk: 15, def: 1, spd: 4, xp: 25, gold: 10, symbol: 'M' },
            'protector': { hp: 50, atk: 10, def: 8, spd: 3, xp: 35, gold: 15, symbol: 'P' }
        };
        
        const stat = stats[this.type] || stats['walker'];
        this.symbol = stat.symbol;
        return stat;
    }
    
    takeTurn(player, labyrinth) {
        // Simple AI: move towards player
        const dx = Math.sign(player.x - this.x);
        const dy = Math.sign(player.y - this.y);
        
        // Try to move
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (!labyrinth.isWall(newX, newY)) {
            this.x = newX;
            this.y = newY;
            
            // If now adjacent to player, attack
            if (Math.abs(this.x - player.x) + Math.abs(this.y - player.y) === 0) {
                const damage = Math.max(1, this.atk - player.def);
                player.takeDamage(damage);
            }
        }
    }
}
