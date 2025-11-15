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
        
        // Different message for mobile vs desktop
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            this.game.showMessage('Swipe to shoot!');
        } else {
            this.game.showMessage('Select direction to shoot (WASD/Arrows)');
        }
        
        return true;
    }
    
    exitTargetingMode() {
        this.targetingMode = false;
        this.targetDirection = null;
        
        // Remove mobile targeting indicator
        const mobileBowBtn = document.getElementById('mobile-bow-btn');
        if (mobileBowBtn) {
            mobileBowBtn.classList.remove('targeting');
        }
    }
    
    selectTarget(enemy) {
        if (!this.targetingMode) return;
        
        const player = this.game.player;
        
        // Check if enemy is in range and has LOS
        const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
        const range = player.getBowRange();
        
        if (dist > range) {
            this.game.showMessage('Out of range!', '#ff4444');
            return;
        }
        
        // Check if we have LOS to target
        const hasLOS = this.checkLineOfSight(player.x, player.y, enemy.x, enemy.y);
        if (!hasLOS) {
            this.game.showMessage('No line of sight!', '#ff4444');
            return;
        }
        
        // Calculate direction to enemy
        const dx = Math.sign(enemy.x - player.x);
        const dy = Math.sign(enemy.y - player.y);
        
        this.targetDirection = { dx, dy };
        this.fireArrow();
        this.exitTargetingMode();
    }
    
    checkLineOfSight(x1, y1, x2, y2) {
        // Simple LOS check - no walls between points
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            if (x === x2 && y === y2) return true;
            
            // Check if current tile is a wall
            if (this.game.labyrinth.isWall(x, y)) return false;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
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
        
        // Remove mobile targeting indicator
        const mobileBowBtn = document.getElementById('mobile-bow-btn');
        if (mobileBowBtn) {
            mobileBowBtn.classList.remove('targeting');
        }
        
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
