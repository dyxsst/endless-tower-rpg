import { StatusEffectManager } from '../combat/statusEffects.js';

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
        
        // Status effects
        this.statusEffects = new StatusEffectManager(this);
        
        this.initStats();
    }
    
    initStats() {
        const baseStats = this.getBaseStats();
        const F = this.floor;
        
        // GDD Formula: HP = 20 + 6F + floor(F^1.15)
        // GDD Formula: ATK = 5 + 1.6F
        // GDD Formula: DEF = 1 + 0.6F
        // GDD Formula: SPD = 4 + 0.15F
        const baseHP = 20 + 6*F + Math.floor(Math.pow(F, 1.15));
        const baseATK = 5 + 1.6*F;
        const baseDEF = 1 + 0.6*F;
        const baseSPD = 4 + 0.15*F;
        
        // Apply boss/elite modifiers per GDD
        const isBoss = this.type === 'boss';
        const isElite = this.type === 'protector'; // Protector acts as elite
        
        let hpMod = 1.0;
        let atkMod = 1.0;
        let defMod = 1.0;
        
        if (isBoss) {
            hpMod = 1.6;   // GDD Boss Mod
            atkMod = 1.2;
            defMod = 1.2;
        } else if (isElite) {
            hpMod = 1.35;  // GDD Elite Mod
            atkMod = 1.2;
            defMod = 1.2;
        }
        
        this.maxHp = Math.floor(baseHP * hpMod);
        this.hp = this.maxHp;
        this.atk = Math.floor(baseATK * atkMod);
        this.def = Math.floor(baseDEF * defMod);
        this.spd = Math.floor(baseSPD * 10) / 10; // Round to 1 decimal
        
        // XP/Gold balanced for ~3 kills per level
        this.xpValue = Math.floor(this.maxHp / 2);
        this.goldValue = Math.floor(this.maxHp / 3);
    }
    
    getBaseStats() {
        // Visual and range properties only (stats now calculated via GDD formulas in initStats)
        const stats = {
            'walker': { symbol: '●', color: '#94a3b8', range: 0 },
            'archer': { symbol: '▲', color: '#22c55e', range: 4 },
            'mage': { symbol: '★', color: '#a855f7', range: 3 },
            'protector': { symbol: '▣', color: '#3b82f6', range: 0 },
            'boss': { symbol: '♛', color: '#ef4444', range: 0 }
        };
        
        const stat = stats[this.type] || stats['walker'];
        this.symbol = stat.symbol;
        this.color = stat.color;
        this.range = stat.range || 0;
        return stat;
    }
    
    takeTurn(player, labyrinth, allEnemies, game) {
        // Check line of sight to player
        const hasLOS = this.hasLineOfSight(player, labyrinth);
        
        // Check distance to player
        const distToPlayer = Math.abs(this.x - player.x) + Math.abs(this.y - player.y);
        
        // Check if this enemy can use ranged attacks
        const canRangedAttack = this.range > 0;
        
        // Adjacent melee attack
        if (distToPlayer === 1) {
            const damage = Math.max(1, this.atk - player.def);
            player.takeDamage(damage);
            game.renderer.showDamageNumber(player.x, player.y, damage, '#ffffff');
            console.log(`${this.type} attacks player for ${damage} damage`);
            return;
        }
        
        // Step back if ranged enemy and player is getting too close (within 2 tiles)
        // Check this BEFORE shooting so they kite instead of standing still
        if (canRangedAttack && hasLOS && distToPlayer === 2) {
            // Calculate direction away from player
            const dx = this.x - player.x;
            const dy = this.y - player.y;
            
            let moveX = 0;
            let moveY = 0;
            
            // Prioritize moving away in the axis with most distance
            if (Math.abs(dx) >= Math.abs(dy)) {
                moveX = Math.sign(dx); // Move away horizontally
            } else {
                moveY = Math.sign(dy); // Move away vertically
            }
            
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            
            const blocked = labyrinth.isWall(newX, newY) || 
                           allEnemies.some(e => e !== this && e.hp > 0 && e.x === newX && e.y === newY);
            
            if (!blocked) {
                this.x = newX;
                this.y = newY;
                console.log(`${this.type} steps back from player`);
                return;
            }
            // If can't step back, shoot instead (cornered)
        }
        
        // Ranged attack if in range and has LOS
        if (canRangedAttack && hasLOS && distToPlayer <= this.range && distToPlayer > 1) {
            // Fire ranged attack
            const damage = Math.max(1, Math.floor((this.atk - player.def) * 0.7)); // 70% of melee damage
            player.takeDamage(damage);
            
            // Show projectile animation
            game.renderer.showProjectile(this.x, this.y, player.x, player.y);
            game.renderer.showDamageNumber(player.x, player.y, damage, '#ffaa00');
            
            console.log(`${this.type} shoots player for ${damage} damage`);
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
    
    static fromSaveData(data) {
        const enemy = new Enemy(data.x, data.y, data.type, data.floor);
        enemy.hp = data.hp;
        enemy.maxHp = data.maxHp;
        enemy.atk = data.atk;
        enemy.def = data.def;
        enemy.spd = data.spd;
        enemy.range = data.range || 0;
        return enemy;
    }
}
