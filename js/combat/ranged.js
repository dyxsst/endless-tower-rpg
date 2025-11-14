export class RangedCombat {
    constructor(game) {
        this.game = game;
        this.targetingMode = false;
        this.targetDirection = null;
    }
    
    enterTargetingMode() {
        if (!this.game.player.hasBow()) {
            this.game.showMessage('No bow equipped!');
            return false;
        }
        
        if (this.game.player.stamina <= 0) {
            this.game.showMessage('No stamina!');
            return false;
        }
        
        this.targetingMode = true;
        this.targetDirection = null;
        this.game.showMessage('Select direction to shoot (WASD/Arrows)');
        return true;
    }
    
    exitTargetingMode() {
        this.targetingMode = false;
        this.targetDirection = null;
    }
    
    selectDirection(dx, dy) {
        if (!this.targetingMode) return;
        
        this.targetDirection = { dx, dy };
        this.fireArrow();
        this.exitTargetingMode();
    }
    
    fireArrow() {
        if (!this.targetDirection) return;
        
        const player = this.game.player;
        const { dx, dy } = this.targetDirection;
        
        // Get bow range (default 4 tiles)
        const range = player.getBowRange();
        
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
        
        // Show projectile animation
        this.game.renderer.showProjectile(player.x, player.y, hitX, hitY);
        
        // Deal damage if hit
        if (hitEnemy) {
            // Bow does 80% of melee damage (per GDD)
            const baseDamage = Math.max(1, player.atk - hitEnemy.def);
            const bowDamage = Math.floor(baseDamage * 0.8);
            
            hitEnemy.hp -= bowDamage;
            this.game.renderer.showDamageNumber(hitX, hitY, bowDamage, '#ff4444');
            
            console.log(`Bow hit ${hitEnemy.type} for ${bowDamage} damage`);
            
            // Check if enemy died
            if (hitEnemy.hp <= 0) {
                this.game.killEnemy(hitEnemy);
            }
        }
        
        // Consume stamina
        player.stamina -= 1;
        this.game.updateUI();
        
        // Process turn
        this.game.processTurn();
    }
}
