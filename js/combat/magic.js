import { STATUS_TYPES } from './statusEffects.js';

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
                icon: '🔥',
                manaCost: 3,
                range: 5,
                description: 'Single-target fire spell, ignores 20% DEF',
                damage: 1.0,
                defIgnore: 0.2,
                projectileColor: '#ff4400',
                type: 'single'
            },
            fireball: {
                name: 'Fireball',
                icon: '💥',
                manaCost: 5,
                range: 4,
                description: '3×3 AoE fire spell, 60% damage per target',
                damage: 0.6,
                defIgnore: 0.1,
                projectileColor: '#ff6600',
                aoeSize: 1, // radius 1 = 3x3
                type: 'aoe'
            },
            frost: {
                name: 'Frost',
                icon: '❄️',
                manaCost: 4,
                range: 4,
                description: 'Applies Slow (-30% SPD) for 3 turns',
                damage: 0.7,
                defIgnore: 0.0,
                projectileColor: '#4444ff',
                statusEffect: STATUS_TYPES.SLOW,
                statusDuration: 3,
                type: 'single'
            },
            spark: {
                name: 'Spark',
                icon: '⚡',
                manaCost: 4,
                range: 5,
                description: 'Chains to adjacent enemies, 70% damage',
                damage: 0.7,
                defIgnore: 0.1,
                projectileColor: '#ffff00',
                chainCount: 2, // Can chain to 2 additional targets
                type: 'chain'
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
        const instruction = isMobile ? 'Tap an enemy to cast!' : 'Select direction (WASD/Arrows)';
        this.game.showMessage(`${spell.name}: ${instruction}`, '#aa44ff');
        
        // Add mobile targeting indicator
        const mobileMagicBtn = document.getElementById('mobile-magic-btn');
        if (mobileMagicBtn) {
            mobileMagicBtn.classList.add('targeting');
        }
        
        return true;
    }
    
    selectTarget(enemy) {
        if (!this.targetingMode || !this.activeSpell) return;
        
        const player = this.game.player;
        const spell = this.spells[this.activeSpell];
        
        // Check if enemy is in range
        const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
        if (dist > spell.range) {
            this.game.showMessage('Out of range!', '#ff4444');
            return;
        }
        
        // Check LOS
        const hasLOS = this.checkLineOfSight(player.x, player.y, enemy.x, enemy.y);
        if (!hasLOS) {
            this.game.showMessage('No line of sight!', '#ff4444');
            return;
        }
        
        // Calculate direction to enemy
        const dx = Math.sign(enemy.x - player.x);
        const dy = Math.sign(enemy.y - player.y);
        
        this.targetDirection = { dx, dy };
        this.castSpell();
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
        
        // Handle different spell types
        if (spell.type === 'aoe') {
            this.castAoESpell(spell, dx, dy);
        } else if (spell.type === 'chain') {
            this.castChainSpell(spell, dx, dy);
        } else {
            this.castSingleTargetSpell(spell, dx, dy);
        }
        
        // Consume mana
        player.mana -= spell.manaCost;
        this.game.updateUI();
        
        // Process turn
        this.exitTargetingMode();
        this.game.processTurn();
    }
    
    castSingleTargetSpell(spell, dx, dy) {
        const player = this.game.player;
        const range = spell.range;
        
        // Trace line from player position
        let hitEnemy = null;
        let hitX = player.x;
        let hitY = player.y;
        
        for (let i = 1; i <= range; i++) {
            const checkX = player.x + (dx * i);
            const checkY = player.y + (dy * i);
            
            if (!this.game.labyrinth.isInBounds(checkX, checkY)) break;
            if (this.game.labyrinth.isWall(checkX, checkY)) break;
            
            const enemy = this.game.getEnemyAt(checkX, checkY);
            if (enemy) {
                hitEnemy = enemy;
                hitX = checkX;
                hitY = checkY;
                break;
            }
            
            hitX = checkX;
            hitY = checkY;
        }
        
        // Show projectile
        this.game.renderer.showProjectile(player.x, player.y, hitX, hitY, spell.projectileColor);
        
        // Deal damage if hit
        if (hitEnemy) {
            const effectiveDef = Math.floor(hitEnemy.def * (1 - spell.defIgnore));
            const damage = Math.max(1, Math.floor((player.atk * spell.damage) - effectiveDef));
            
            hitEnemy.hp -= damage;
            this.game.renderer.showDamageNumber(hitX, hitY, damage, spell.projectileColor);
            
            // Apply status effect if spell has one
            if (spell.statusEffect && hitEnemy.statusEffects) {
                hitEnemy.statusEffects.addEffect(spell.statusEffect, spell.statusDuration);
                const statusConfig = hitEnemy.statusEffects.activeEffects.find(e => e.type === spell.statusEffect)?.config;
                if (statusConfig) {
                    this.game.showMessage(`${hitEnemy.type} is ${statusConfig.name}!`, statusConfig.color);
                }
            }
            
            console.log(`${spell.name} hit ${hitEnemy.type} for ${damage} damage`);
            
            if (hitEnemy.hp <= 0) {
                this.game.killEnemy(hitEnemy);
            }
        }
    }
    
    castAoESpell(spell, dx, dy) {
        const player = this.game.player;
        const range = spell.range;
        
        // Find center point
        let centerX = player.x;
        let centerY = player.y;
        
        for (let i = 1; i <= range; i++) {
            const checkX = player.x + (dx * i);
            const checkY = player.y + (dy * i);
            
            if (!this.game.labyrinth.isInBounds(checkX, checkY)) break;
            if (this.game.labyrinth.isWall(checkX, checkY)) break;
            
            centerX = checkX;
            centerY = checkY;
        }
        
        // Show projectile to center
        this.game.renderer.showProjectile(player.x, player.y, centerX, centerY, spell.projectileColor);
        
        // Apply AoE damage
        const hitEnemies = [];
        const radius = spell.aoeSize;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const targetX = centerX + dx;
                const targetY = centerY + dy;
                
                if (!this.game.labyrinth.isInBounds(targetX, targetY)) continue;
                
                const enemy = this.game.getEnemyAt(targetX, targetY);
                if (enemy) {
                    const effectiveDef = Math.floor(enemy.def * (1 - spell.defIgnore));
                    const damage = Math.max(1, Math.floor((player.atk * spell.damage) - effectiveDef));
                    
                    enemy.hp -= damage;
                    hitEnemies.push(enemy);
                    
                    // Show damage number with slight delay for visual effect
                    setTimeout(() => {
                        this.game.renderer.showDamageNumber(targetX, targetY, damage, spell.projectileColor);
                    }, 100);
                }
            }
        }
        
        // Remove dead enemies
        hitEnemies.forEach(enemy => {
            if (enemy.hp <= 0) {
                this.game.killEnemy(enemy);
            }
        });
        
        console.log(`${spell.name} hit ${hitEnemies.length} enemies`);
    }
    
    castChainSpell(spell, dx, dy) {
        const player = this.game.player;
        const range = spell.range;
        
        // Find first target
        let firstEnemy = null;
        let firstX = player.x;
        let firstY = player.y;
        
        for (let i = 1; i <= range; i++) {
            const checkX = player.x + (dx * i);
            const checkY = player.y + (dy * i);
            
            if (!this.game.labyrinth.isInBounds(checkX, checkY)) break;
            if (this.game.labyrinth.isWall(checkX, checkY)) break;
            
            const enemy = this.game.getEnemyAt(checkX, checkY);
            if (enemy) {
                firstEnemy = enemy;
                firstX = checkX;
                firstY = checkY;
                break;
            }
        }
        
        if (!firstEnemy) {
            // Show projectile to max range
            for (let i = 1; i <= range; i++) {
                const checkX = player.x + (dx * i);
                const checkY = player.y + (dy * i);
                if (!this.game.labyrinth.isInBounds(checkX, checkY)) break;
                if (this.game.labyrinth.isWall(checkX, checkY)) break;
                firstX = checkX;
                firstY = checkY;
            }
            this.game.renderer.showProjectile(player.x, player.y, firstX, firstY, spell.projectileColor);
            return;
        }
        
        // Chain logic
        const hitEnemies = [firstEnemy];
        const chainTargets = [{ x: firstX, y: firstY }];
        let currentEnemy = firstEnemy;
        
        // Find chain targets
        for (let i = 0; i < spell.chainCount; i++) {
            let closestEnemy = null;
            let closestDist = Infinity;
            
            // Find nearest unchained enemy
            for (const enemy of this.game.enemies) {
                if (hitEnemies.includes(enemy) || enemy.hp <= 0) continue;
                
                const dist = Math.abs(enemy.x - currentEnemy.x) + Math.abs(enemy.y - currentEnemy.y);
                if (dist <= 2 && dist < closestDist) {
                    closestEnemy = enemy;
                    closestDist = dist;
                }
            }
            
            if (!closestEnemy) break;
            
            hitEnemies.push(closestEnemy);
            chainTargets.push({ x: closestEnemy.x, y: closestEnemy.y });
            currentEnemy = closestEnemy;
        }
        
        // Show chain animation
        this.game.renderer.showProjectile(player.x, player.y, chainTargets[0].x, chainTargets[0].y, spell.projectileColor);
        
        for (let i = 1; i < chainTargets.length; i++) {
            setTimeout(() => {
                this.game.renderer.showProjectile(
                    chainTargets[i-1].x, chainTargets[i-1].y,
                    chainTargets[i].x, chainTargets[i].y,
                    spell.projectileColor
                );
            }, i * 100);
        }
        
        // Deal damage to all chained enemies
        hitEnemies.forEach((enemy, index) => {
            const effectiveDef = Math.floor(enemy.def * (1 - spell.defIgnore));
            const damage = Math.max(1, Math.floor((player.atk * spell.damage) - effectiveDef));
            
            enemy.hp -= damage;
            
            setTimeout(() => {
                this.game.renderer.showDamageNumber(enemy.x, enemy.y, damage, spell.projectileColor);
                if (enemy.hp <= 0) {
                    this.game.killEnemy(enemy);
                }
            }, index * 100);
        });
        
        console.log(`${spell.name} chained to ${hitEnemies.length} enemies`);
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
