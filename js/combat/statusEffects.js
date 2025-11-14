// Status Effects System
// Handles Bleed, Poison, Slow, Vulnerable, Burn

export const STATUS_TYPES = {
    BLEED: 'bleed',
    POISON: 'poison',
    SLOW: 'slow',
    VULNERABLE: 'vulnerable',
    BURN: 'burn'
};

export const STATUS_CONFIG = {
    bleed: {
        name: 'Bleed',
        color: '#cc0000',
        icon: '🩸',
        damagePerTurn: 2,
        duration: 3,
        description: 'Takes damage at end of turn'
    },
    poison: {
        name: 'Poison',
        color: '#00cc00',
        icon: '☠️',
        damagePerTurn: 1,
        duration: 5,
        description: 'Takes damage over time'
    },
    slow: {
        name: 'Slow',
        color: '#4444ff',
        icon: '❄️',
        spdReduction: 0.3, // 30% SPD reduction
        duration: 3,
        description: 'Movement and attack speed reduced'
    },
    vulnerable: {
        name: 'Vulnerable',
        color: '#ff8800',
        icon: '🛡️',
        damageIncrease: 0.25, // 25% more damage taken
        duration: 2,
        description: 'Takes increased damage'
    },
    burn: {
        name: 'Burn',
        color: '#ff4400',
        icon: '🔥',
        damagePerTurn: 1,
        duration: 4,
        fireAmp: 0.15, // 15% more damage from next fire attack
        description: 'Burning, amplifies fire damage'
    }
};

export class StatusEffect {
    constructor(type, duration = null) {
        this.type = type;
        this.config = STATUS_CONFIG[type];
        this.duration = duration !== null ? duration : this.config.duration;
        this.turnsRemaining = this.duration;
    }

    // Apply the status effect for one turn
    processTurn(entity, game) {
        const config = this.config;
        let damage = 0;

        // Apply damage-over-time effects
        if (config.damagePerTurn && this.turnsRemaining > 0) {
            damage = config.damagePerTurn;
            entity.hp -= damage;
            
            if (game) {
                game.renderer.showDamageNumber(entity.x, entity.y, damage, config.color);
                game.showMessage(`${entity.type || 'Player'} takes ${damage} ${config.name} damage!`, config.color);
            }
        }

        // Decrement duration
        this.turnsRemaining--;

        return {
            damage,
            expired: this.turnsRemaining <= 0
        };
    }

    // Get current stat modifier
    getStatModifier(stat) {
        if (this.type === STATUS_TYPES.SLOW && stat === 'spd') {
            return -this.config.spdReduction;
        }
        return 0;
    }

    // Get damage multiplier for incoming damage
    getDamageMultiplier() {
        if (this.type === STATUS_TYPES.VULNERABLE) {
            return 1 + this.config.damageIncrease;
        }
        if (this.type === STATUS_TYPES.BURN) {
            // Burn amplifies fire damage - can be checked by damage source
            return 1;
        }
        return 1;
    }

    // Check if this status amplifies fire damage
    amplifiesFireDamage() {
        return this.type === STATUS_TYPES.BURN;
    }

    getFireAmp() {
        return this.type === STATUS_TYPES.BURN ? this.config.fireAmp : 0;
    }
}

export class StatusEffectManager {
    constructor(entity) {
        this.entity = entity;
        this.activeEffects = [];
    }

    // Add a status effect (stacks duration if already present)
    addEffect(type, customDuration = null) {
        const existing = this.activeEffects.find(e => e.type === type);
        
        if (existing) {
            // Refresh duration
            const newDuration = customDuration !== null ? customDuration : STATUS_CONFIG[type].duration;
            existing.turnsRemaining = Math.max(existing.turnsRemaining, newDuration);
        } else {
            // Add new effect
            this.activeEffects.push(new StatusEffect(type, customDuration));
        }
    }

    // Remove a specific status effect
    removeEffect(type) {
        this.activeEffects = this.activeEffects.filter(e => e.type !== type);
    }

    // Check if entity has a specific status
    hasEffect(type) {
        return this.activeEffects.some(e => e.type === type);
    }

    // Get stat modifier from all status effects
    getStatModifier(stat) {
        return this.activeEffects.reduce((total, effect) => {
            return total + effect.getStatModifier(stat);
        }, 0);
    }

    // Get damage multiplier from all status effects
    getDamageMultiplier() {
        return this.activeEffects.reduce((total, effect) => {
            return total * effect.getDamageMultiplier();
        }, 1);
    }

    // Get fire damage amplification
    getFireAmp() {
        return this.activeEffects.reduce((total, effect) => {
            return total + effect.getFireAmp();
        }, 0);
    }

    // Process all status effects at end of turn
    processTurn(game) {
        const expiredEffects = [];

        for (const effect of this.activeEffects) {
            const result = effect.processTurn(this.entity, game);
            
            if (result.expired) {
                expiredEffects.push(effect);
            }
        }

        // Remove expired effects
        for (const effect of expiredEffects) {
            this.removeEffect(effect.type);
            if (game) {
                const config = effect.config;
                game.showMessage(`${this.entity.type || 'Player'}'s ${config.name} wore off`, '#888888');
            }
        }

        return this.activeEffects.length > 0;
    }

    // Get list of active status icons for UI display
    getStatusIcons() {
        return this.activeEffects.map(effect => ({
            icon: effect.config.icon,
            color: effect.config.color,
            name: effect.config.name,
            turns: effect.turnsRemaining,
            description: effect.config.description
        }));
    }

    // Serialize for saving
    toSaveData() {
        return this.activeEffects.map(effect => ({
            type: effect.type,
            turnsRemaining: effect.turnsRemaining
        }));
    }

    // Restore from save data
    fromSaveData(data) {
        this.activeEffects = [];
        if (data && Array.isArray(data)) {
            for (const effectData of data) {
                const effect = new StatusEffect(effectData.type);
                effect.turnsRemaining = effectData.turnsRemaining;
                this.activeEffects.push(effect);
            }
        }
    }
}
