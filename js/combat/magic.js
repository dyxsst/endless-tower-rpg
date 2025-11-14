export class MagicSystem {
    constructor(game) {
        this.game = game;
        this.targetingMode = false;
        this.activeSpell = null;
        this.targetDirection = null;
        
        // Available spells
        this.spells = {
            firebolt: {
                name: 'Firebolt',
                manaCost: 3,
                range: 5,
                description: 'Single-target fire spell, ignores 20% DEF',
                damage: 1.0, // 100% of base
                defIgnore: 0.2 // Ignores 20% of target DEF
            }
        };
    }
    
    enterTargetingMode(spellName) {
        const spell = this.spells[spellName];
        if (!spell) {
            console.error('Unknown spell:', spellName);
            return false;
        }
        
        const player = this.game.player;
        
        // Check mana
        if (player.mana < spell.manaCost) {
            this.game.showMessage('Not enough mana!', '#ff4444');
            return false;
        }
        
        this.activeSpell = spellName;
        this.targetingMode = true;
        this.targetDirection = null;
        
        // Show message
        const isMobile = window.innerWidth < 768;
        const instruction = isMobile ? 'Swipe to cast!' : 'Select direction (WASD/Arrows)';
        this.game.showMessage(`${spell.name}: ${instruction}`, '#aa44ff');
        
        // Add mobile targeting indicator
        const mobileMagicBtn = document.getElementById('mobile-magic-btn');
        if (mobileMagicBtn) {
            mobileMagicBtn.classList.add('targeting');
        }
        
        return true;
    }
    
    selectDirection(dx, dy) {
        if (!this.targetingMode || !this.activeSpell) return;
        
        this.targetDirection = { dx, dy };
        this.castSpell();
    }
    
    castSpell() {
        if (!this.targetDirection || !this.activeSpell) return;
        
        const spell = this.spells[this.activeSpell];
        const player = this.game.player;
        const { dx, dy } = this.targetDirection;
        
        // Remove mobile targeting indicator
        const mobileMagicBtn = document.getElementById('mobile-magic-btn');
        if (mobileMagicBtn) {
            mobileMagicBtn.classList.remove('targeting');
        }
        
        // Get spell range
        const range = spell.range;
        
        // Trace line from player position
        let hitEnemy = null;
        let hitX = player.x;
        let hitY = player.y;
        
        for (let i = 1; i <= range; i++) {
            const checkX = player.x + (dx * i);
            const checkY = player.y + (dy * i);
            
            // Check bounds
            if (!this.game.labyrinth.isInBounds(checkX, checkY)) break;
            
            // Check wall
            if (this.game.labyrinth.isWall(checkX, checkY)) break;
            
            // Check for enemy
            const enemy = this.game.getEnemyAt(checkX, checkY);
            if (enemy) {
                hitEnemy = enemy;
                hitX = checkX;
                hitY = checkY;
                break;
            }
            
            // Update last valid position
            hitX = checkX;
            hitY = checkY;
        }
        
        // Show spell projectile animation (purple/fire effect)
        this.game.renderer.showProjectile(player.x, player.y, hitX, hitY, '#ff4400');
        
        // Deal damage if hit
        if (hitEnemy) {
            // Firebolt: base damage, ignores 20% DEF
            const effectiveDef = Math.floor(hitEnemy.def * (1 - spell.defIgnore));
            const damage = Math.max(1, Math.floor((player.atk * spell.damage) - effectiveDef));
            
            hitEnemy.hp -= damage;
            this.game.renderer.showDamageNumber(hitX, hitY, damage, '#ff4400');
            
            console.log(`${spell.name} hit ${hitEnemy.type} for ${damage} damage`);
            
            // Check if enemy died
            if (hitEnemy.hp <= 0) {
                this.game.killEnemy(hitEnemy);
            }
        }
        
        // Consume mana
        player.mana -= spell.manaCost;
        this.game.updateUI();
        
        // Process turn
        this.exitTargetingMode();
        this.game.processTurn();
    }
    
    exitTargetingMode() {
        this.targetingMode = false;
        this.activeSpell = null;
        this.targetDirection = null;
        
        // Remove mobile indicator
        const mobileMagicBtn = document.getElementById('mobile-magic-btn');
        if (mobileMagicBtn) {
            mobileMagicBtn.classList.remove('targeting');
        }
    }
    
    canCastSpell(spellName) {
        const spell = this.spells[spellName];
        if (!spell) return false;
        
        return this.game.player.mana >= spell.manaCost;
    }
}
