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
        
        // Apply boss modifier if boss type (reduced from GDD for better balance)
        const isBoss = this.type === 'boss';
        const hpMod = isBoss ? 1.4 : 1.0;  // Reduced from 1.6
        const atkMod = isBoss ? 1.15 : 1.0; // Reduced from 1.2
        const defMod = isBoss ? 1.15 : 1.0; // Reduced from 1.2
        
        this.maxHp = Math.floor(baseStats.hp * floorMultiplier * hpMod);
        this.hp = this.maxHp;
        this.atk = Math.floor(baseStats.atk * floorMultiplier * atkMod);
        this.def = Math.floor(baseStats.def * floorMultiplier * defMod);
        this.spd = baseStats.spd;
        
        this.xpValue = Math.floor(baseStats.xp * floorMultiplier);
        this.goldValue = Math.floor(baseStats.gold * floorMultiplier);
    }
    
    getBaseStats() {
        const stats = {
            'walker': { hp: 30, atk: 8, def: 3, spd: 5, xp: 15, gold: 5, symbol: 'W' },
            'archer': { hp: 20, atk: 12, def: 2, spd: 6, xp: 20, gold: 8, symbol: 'A' },
            'mage': { hp: 25, atk: 15, def: 1, spd: 4, xp: 25, gold: 10, symbol: 'M' },
            'protector': { hp: 50, atk: 10, def: 8, spd: 3, xp: 35, gold: 15, symbol: 'P' },
            'boss': { hp: 80, atk: 18, def: 10, spd: 4, xp: 100, gold: 50, symbol: 'B' }
        };
        
        const stat = stats[this.type] || stats['walker'];
        this.symbol = stat.symbol;
        return stat;
    }
    
    takeTurn(player, labyrinth, allEnemies) {
        // Check line of sight to player
        const hasLOS = this.hasLineOfSight(player, labyrinth);
        
        // Check if adjacent to player (attack)
        const distToPlayer = Math.abs(this.x - player.x) + Math.abs(this.y - player.y);
        
        if (distToPlayer === 1) {
            // Already adjacent, attack
            const damage = Math.max(1, this.atk - player.def);
            player.takeDamage(damage);
            console.log(`${this.type} attacks player for ${damage} damage`);
            return;
        }
        
        // Only move if we can see the player
        if (!hasLOS) {
            // Wander randomly if can't see player
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const newX = this.x + dir[0];
            const newY = this.y + dir[1];
            
            const blocked = labyrinth.isWall(newX, newY) || 
                           allEnemies.some(e => e !== this && e.hp > 0 && e.x === newX && e.y === newY);
            
            if (!blocked) {
                this.x = newX;
                this.y = newY;
            }
            return;
        }
        
        // Move towards player if we can see them
        let moveX = 0;
        let moveY = 0;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            moveX = Math.sign(dx);
        } else {
            moveY = Math.sign(dy);
        }
        
        // Try primary direction
        const newX = this.x + moveX;
        const newY = this.y + moveY;
        
        const blocked = labyrinth.isWall(newX, newY) || 
                       allEnemies.some(e => e !== this && e.hp > 0 && e.x === newX && e.y === newY);
        
        if (!blocked && !(newX === player.x && newY === player.y)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Try alternate direction
            const altX = this.x + (moveX === 0 ? Math.sign(dx) : 0);
            const altY = this.y + (moveY === 0 ? Math.sign(dy) : 0);
            
            const altBlocked = labyrinth.isWall(altX, altY) || 
                              allEnemies.some(e => e !== this && e.hp > 0 && e.x === altX && e.y === altY);
            
            if (!altBlocked && !(altX === player.x && altY === player.y)) {
                this.x = altX;
                this.y = altY;
            }
        }
    }
    
    hasLineOfSight(player, labyrinth) {
        // Simple line of sight check
        const dx = Math.abs(player.x - this.x);
        const dy = Math.abs(player.y - this.y);
        const dist = Math.max(dx, dy);
        
        if (dist > 8) return false; // Too far
        
        const stepX = (player.x - this.x) / dist;
        const stepY = (player.y - this.y) / dist;
        
        let x = this.x + 0.5;
        let y = this.y + 0.5;
        
        for (let i = 0; i < dist; i++) {
            x += stepX;
            y += stepY;
            
            const tileX = Math.floor(x);
            const tileY = Math.floor(y);
            
            if (labyrinth.isWall(tileX, tileY)) {
                return false;
            }
        }
        
        return true;
    }
}
