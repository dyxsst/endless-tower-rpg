export class Item {
    constructor(type, rarity, floor) {
        this.type = type; // 'weapon', 'armor', 'charm', 'boots'
        this.rarity = rarity; // 'common', 'uncommon', 'rare', 'epic'
        this.floor = floor;
        this.name = '';
        this.stats = {};
        
        this.generate();
    }
    
    generate() {
        // Generate stats based on type, rarity, and floor
        const rarityMultiplier = {
            'common': 1.0,
            'uncommon': 1.3,
            'rare': 1.6,
            'epic': 2.0
        };
        
        const mult = rarityMultiplier[this.rarity];
        const floorBonus = this.floor * 0.5;
        
        switch (this.type) {
            case 'weapon':
                this.stats.atk = Math.floor((3 + floorBonus) * mult);
                
                // Randomly choose between melee and bow (30% chance for bow)
                this.subtype = Math.random() < 0.3 ? 'bow' : 'melee';
                
                this.name = this.generateWeaponName();
                break;
                
            case 'armor':
                this.stats.def = Math.floor((2 + floorBonus * 0.8) * mult);
                this.stats.hp = Math.floor((5 + floorBonus * 2) * mult);
                this.name = this.generateArmorName();
                break;
                
            case 'charm':
                this.stats.hp = Math.floor((8 + floorBonus * 2.5) * mult);
                this.stats.crit = Math.floor((2 + floorBonus * 0.3) * mult);
                this.name = this.generateCharmName();
                break;
                
            case 'boots':
                this.stats.spd = Math.floor((1 + floorBonus * 0.2) * mult);
                this.stats.def = Math.floor((1 + floorBonus * 0.3) * mult);
                this.name = this.generateBootsName();
                break;
        }
    }
    
    generateWeaponName() {
        const prefixes = {
            'common': ['Rusty', 'Worn', 'Simple', 'Basic'],
            'uncommon': ['Sharp', 'Sturdy', 'Fine', 'Keen'],
            'rare': ['Superior', 'Gleaming', 'Masterwork', 'Deadly'],
            'epic': ['Legendary', 'Ancient', 'Ethereal', 'Divine']
        };
        
        const meleeWeapons = ['Sword', 'Blade', 'Axe', 'Mace', 'Dagger'];
        const bows = ['Shortbow', 'Longbow', 'Recurve Bow', 'Hunting Bow', 'War Bow'];
        
        const prefix = prefixes[this.rarity][Math.floor(Math.random() * prefixes[this.rarity].length)];
        
        if (this.subtype === 'bow') {
            const base = bows[Math.floor(Math.random() * bows.length)];
            return `${prefix} ${base}`;
        } else {
            const base = meleeWeapons[Math.floor(Math.random() * meleeWeapons.length)];
            return `${prefix} ${base}`;
        }
    }
    
    generateArmorName() {
        const prefixes = {
            'common': ['Leather', 'Cloth', 'Padded', 'Simple'],
            'uncommon': ['Chainmail', 'Reinforced', 'Studded', 'Iron'],
            'rare': ['Plate', 'Steel', 'Mythril', 'Enchanted'],
            'epic': ['Dragon', 'Celestial', 'Demon', 'Titan']
        };
        
        const bases = ['Armor', 'Vest', 'Cuirass', 'Mail', 'Coat'];
        const prefix = prefixes[this.rarity][Math.floor(Math.random() * prefixes[this.rarity].length)];
        const base = bases[Math.floor(Math.random() * bases.length)];
        
        return `${prefix} ${base}`;
    }
    
    generateCharmName() {
        const prefixes = {
            'common': ['Simple', 'Small', 'Crude', 'Plain'],
            'uncommon': ['Blessed', 'Carved', 'Polished', 'Engraved'],
            'rare': ['Mystical', 'Radiant', 'Sacred', 'Powerful'],
            'epic': ['Godly', 'Primordial', 'Cosmic', 'Eternal']
        };
        
        const bases = ['Amulet', 'Pendant', 'Talisman', 'Charm', 'Locket'];
        const prefix = prefixes[this.rarity][Math.floor(Math.random() * prefixes[this.rarity].length)];
        const base = bases[Math.floor(Math.random() * bases.length)];
        
        return `${prefix} ${base}`;
    }
    
    generateBootsName() {
        const prefixes = {
            'common': ['Worn', 'Old', 'Tattered', 'Simple'],
            'uncommon': ['Swift', 'Sturdy', 'Reinforced', 'Traveler\'s'],
            'rare': ['Winged', 'Enchanted', 'Featherlight', 'Shadow'],
            'epic': ['Mercury\'s', 'Hermes\'', 'Phantom', 'Godspeed']
        };
        
        const bases = ['Boots', 'Shoes', 'Greaves', 'Sabatons', 'Treads'];
        const prefix = prefixes[this.rarity][Math.floor(Math.random() * prefixes[this.rarity].length)];
        const base = bases[Math.floor(Math.random() * bases.length)];
        
        return `${prefix} ${base}`;
    }
    
    getColor() {
        const colors = {
            'common': '#aaa',
            'uncommon': '#4a4',
            'rare': '#44f',
            'epic': '#a4a'
        };
        return colors[this.rarity];
    }
    
    getStatsText() {
        const parts = [];
        if (this.stats.atk) parts.push(`+${this.stats.atk} ATK`);
        if (this.stats.def) parts.push(`+${this.stats.def} DEF`);
        if (this.stats.hp) parts.push(`+${this.stats.hp} HP`);
        if (this.stats.spd) parts.push(`+${this.stats.spd} SPD`);
        if (this.stats.crit) parts.push(`+${this.stats.crit}% CRIT`);
        return parts.join(', ');
    }
    
    getTotalValue() {
        // Calculate total stat value for pricing
        let total = 0;
        if (this.stats.atk) total += this.stats.atk * 2; // ATK worth more
        if (this.stats.def) total += this.stats.def * 2; // DEF worth more
        if (this.stats.hp) total += this.stats.hp * 0.5; // HP less per point
        if (this.stats.spd) total += this.stats.spd * 3; // SPD rare
        if (this.stats.crit) total += this.stats.crit * 1.5; // CRIT valuable
        return Math.floor(total);
    }
    
    getStatComparison(equippedItem) {
        // Compare this item to equipped item, return colored diff text
        if (!equippedItem) {
            return this.getStatsText();
        }
        
        const parts = [];
        const statTypes = ['atk', 'def', 'hp', 'spd', 'crit'];
        const labels = { atk: 'ATK', def: 'DEF', hp: 'HP', spd: 'SPD', crit: 'CRIT' };
        
        statTypes.forEach(stat => {
            const newVal = this.stats[stat] || 0;
            const oldVal = equippedItem.stats[stat] || 0;
            const diff = newVal - oldVal;
            
            if (newVal > 0) {
                let text = `${newVal} ${labels[stat]}`;
                if (diff > 0) {
                    text += ` <span style="color: #4f4">(+${diff})</span>`;
                } else if (diff < 0) {
                    text += ` <span style="color: #f44">(${diff})</span>`;
                }
                parts.push(text);
            }
        });
        
        return parts.join(', ');
    }
    
    static rollRarity() {
        const roll = Math.random() * 100;
        if (roll < 70) return 'common';
        if (roll < 92) return 'uncommon';
        if (roll < 99) return 'rare';
        return 'epic';
    }
    
    static rollType() {
        const types = ['weapon', 'armor', 'charm', 'boots'];
        return types[Math.floor(Math.random() * types.length)];
    }
}
