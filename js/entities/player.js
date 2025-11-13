export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        // Stats
        this.level = 1;
        this.xp = 0;
        this.xpToLevel = 100;
        
        this.maxHp = 100;
        this.hp = 100;
        this.atk = 10;
        this.def = 5;
        this.spd = 5;
        this.crit = 5; // percent
        
        // Resources
        this.gold = 0;
        this.stamina = 10;
        this.maxStamina = 10;
        this.mana = 10;
        this.maxMana = 10;
        
        // Inventory
        this.weapon = null;
        this.armor = null;
        this.charm = null;
        this.boots = null;
        this.inventory = [];
    }
    
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
    }
    
    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
    }
    
    gainXP(amount) {
        this.xp += amount;
        
        while (this.xp >= this.xpToLevel) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.xp -= this.xpToLevel;
        this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
        
        // Stat increases
        this.maxHp += 10;
        this.hp = this.maxHp;
        this.atk += 2;
        this.def += 1;
        this.spd += 1;
        
        console.log(`Level up! Now level ${this.level}`);
    }
    
    toSaveData() {
        return {
            x: this.x,
            y: this.y,
            level: this.level,
            xp: this.xp,
            xpToLevel: this.xpToLevel,
            maxHp: this.maxHp,
            hp: this.hp,
            atk: this.atk,
            def: this.def,
            spd: this.spd,
            crit: this.crit,
            gold: this.gold,
            stamina: this.stamina,
            maxStamina: this.maxStamina,
            mana: this.mana,
            maxMana: this.maxMana,
            inventory: this.inventory
        };
    }
    
    static fromSaveData(data) {
        const player = new Player(data.x, data.y);
        Object.assign(player, data);
        return player;
    }
}
