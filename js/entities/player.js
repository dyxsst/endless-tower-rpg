import { StatusEffectManager } from '../combat/statusEffects.js';

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        // Stats (GDD Base: HP 30, ATK 6, DEF 2, SPD 5, CRIT 5%)
        this.level = 1;
        this.xp = 0;
        this.xpToLevel = 100; // GDD: 20 + 10*L, but starting at 100 for feel
        
        this.maxHp = 30;  // GDD base
        this.hp = 30;
        this.atk = 6;     // GDD base
        this.def = 2;     // GDD base
        this.spd = 5;     // GDD base
        this.crit = 5;    // GDD base (percent)
        
        // Resources
        this.gold = 0;
        this.stamina = 10;
        this.maxStamina = 10;
        this.mana = 10;
        this.maxMana = 10;
        
        // Equipment
        this.weapon = null;
        this.bow = null;
        this.armor = null;
        this.charm = null;
        this.boots = null;
        
        // Inventory
        this.inventory = [];
        
        // Status effects
        this.statusEffects = new StatusEffectManager(this);
    }
    
    equip(item) {
        console.log(`Attempting to equip ${item.name} (${item.type})`);
        console.log('Current equipment:', {
            weapon: this.weapon?.name,
            bow: this.bow?.name,
            armor: this.armor?.name,
            charm: this.charm?.name,
            boots: this.boots?.name
        });
        
        // Unequip current item in slot
        const currentItem = this[item.type];
        if (currentItem) {
            console.log(`Unequipping current ${item.type}: ${currentItem.name}`);
            this.unequip(item.type);
            this.inventory.push(currentItem);
            console.log(`Moved ${currentItem.name} to inventory`);
        }
        
        // Equip new item
        this[item.type] = item;
        
        // Apply stats
        if (item.stats.atk) this.atk += item.stats.atk;
        if (item.stats.def) this.def += item.stats.def;
        if (item.stats.hp) {
            this.maxHp += item.stats.hp;
            this.hp += item.stats.hp;
        }
        if (item.stats.spd) this.spd += item.stats.spd;
        if (item.stats.crit) this.crit += item.stats.crit;
        
        // Remove from inventory if it was there
        const invIdx = this.inventory.indexOf(item);
        if (invIdx >= 0) {
            this.inventory.splice(invIdx, 1);
            console.log(`Removed ${item.name} from inventory`);
        }
        
        console.log(`Equipped ${item.name} successfully`);
        console.log('New equipment:', {
            weapon: this.weapon?.name,
            bow: this.bow?.name,
            armor: this.armor?.name,
            charm: this.charm?.name,
            boots: this.boots?.name
        });
    }
    
    unequip(slotType) {
        const item = this[slotType];
        if (!item) return;
        
        // Remove stats
        if (item.stats.atk) this.atk -= item.stats.atk;
        if (item.stats.def) this.def -= item.stats.def;
        if (item.stats.hp) {
            this.maxHp -= item.stats.hp;
            this.hp = Math.min(this.hp, this.maxHp);
        }
        if (item.stats.spd) this.spd -= item.stats.spd;
        if (item.stats.crit) this.crit -= item.stats.crit;
        
        this[slotType] = null;
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
        
        // Restore 1 stamina and 1 mana on XP gain (kill)
        this.restoreStamina(1);
        this.restoreMana(1);
    }
    
    levelUp() {
        this.level++;
        this.xp -= this.xpToLevel;
        this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
        
        // GDD Stat increases per level: HP +6, ATK +2, DEF +1, SPD +0.2
        this.maxHp += 6;
        this.hp = this.maxHp;
        this.atk += 2;
        this.def += 1;
        this.spd += 0.2;
        
        // Restore resources
        this.stamina = this.maxStamina;
        this.mana = this.maxMana;
        
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
            weapon: this.weapon,
            bow: this.bow,
            armor: this.armor,
            charm: this.charm,
            boots: this.boots,
            inventory: this.inventory
        };
    }
    
    static fromSaveData(data) {
        const player = new Player(data.x, data.y);
        Object.assign(player, data);
        return player;
    }
    
    hasBow() {
        // Check if bow is equipped in bow slot
        return this.bow !== null;
    }
    
    getBowRange() {
        // Default range is 4 tiles
        return 4;
    }
    
    restoreStamina(amount) {
        this.stamina = Math.min(this.maxStamina, this.stamina + amount);
    }
    
    restoreMana(amount) {
        this.mana = Math.min(this.maxMana, this.mana + amount);
    }
}
