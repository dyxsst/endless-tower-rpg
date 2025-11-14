export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.tileSize = 16;
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.calculateViewport();
        
        // Detect mobile
        this.isMobile = window.innerWidth <= 768;
        
        // Camera position (smooth scrolling on mobile only)
        this.cameraX = 0;
        this.cameraY = 0;
        this.targetCameraX = 0;
        this.targetCameraY = 0;
        this.cameraSpeed = 0.15;
        
        // Border for camera movement (tiles from edge)
        this.cameraBorder = 5;
        
        // Damage numbers
        this.damageNumbers = [];
        
        // Projectiles
        this.projectiles = [];
        
        // Colors
        this.colors = {
            wall: '#333',
            floor: '#555',
            start: '#4a4',
            exit: '#fa4',
            player: '#4af',
            enemy: '#f44',
            item: '#ff4',
            fog: 'rgba(0, 0, 0, 0.85)'
        };
    }
    
    calculateViewport() {
        this.viewportWidth = Math.floor(this.canvas.width / this.tileSize);
        this.viewportHeight = Math.floor(this.canvas.height / this.tileSize);
    }
    
    recalculateViewport() {
        this.calculateViewport();
        this.isMobile = window.innerWidth <= 768;
    }
    
    render(labyrinth, player, enemies, items) {
        if (!labyrinth || !player) return;
        
        let offsetX, offsetY;
        
        if (this.isMobile) {
            // Mobile: smooth scrolling camera
            this.updateCamera(player);
            this.cameraX += (this.targetCameraX - this.cameraX) * this.cameraSpeed;
            this.cameraY += (this.targetCameraY - this.cameraY) * this.cameraSpeed;
            
            const roundedCameraX = Math.round(this.cameraX);
            const roundedCameraY = Math.round(this.cameraY);
            
            offsetX = -roundedCameraX;
            offsetY = -roundedCameraY;
        } else {
            // Desktop: center labyrinth in viewport
            // If labyrinth is smaller than viewport, center it
            // If labyrinth is larger, show top-left portion
            if (labyrinth.width < this.viewportWidth) {
                offsetX = Math.floor((this.viewportWidth - labyrinth.width) / 2);
            } else {
                offsetX = 0;
            }
            
            if (labyrinth.height < this.viewportHeight) {
                offsetY = Math.floor((this.viewportHeight - labyrinth.height) / 2);
            } else {
                offsetY = 0;
            }
        }
        
        // Calculate visibility (FOV)
        const visibleTiles = this.calculateFOV(player, labyrinth);
        
        // Render labyrinth with fog of war
        this.renderLabyrinth(labyrinth, offsetX, offsetY, visibleTiles);
        
        // Render items (only visible ones)
        items.forEach(item => {
            if (visibleTiles.has(`${item.x},${item.y}`)) {
                this.renderItem(item, offsetX, offsetY);
            }
        });
        
        // Render enemies (only visible ones)
        enemies.forEach(enemy => {
            if (enemy.hp > 0 && visibleTiles.has(`${enemy.x},${enemy.y}`)) {
                this.renderEnemy(enemy, offsetX, offsetY);
            }
        });
        
        // Render player
        this.renderPlayer(player, offsetX, offsetY);
        
        // Render damage numbers
        this.renderDamageNumbers(offsetX, offsetY);
        
        // Render projectiles
        this.renderProjectiles(offsetX, offsetY);
    }
    
    showDamageNumber(x, y, amount, color) {
        this.damageNumbers.push({
            x: x,
            y: y,
            amount: amount,
            color: color,
            life: 1.0,
            offsetY: 0
        });
    }
    
    renderDamageNumbers(offsetX, offsetY) {
        // Update and render damage numbers
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const dmg = this.damageNumbers[i];
            
            // Update
            dmg.life -= 0.02;
            dmg.offsetY -= 0.5;
            
            if (dmg.life <= 0) {
                this.damageNumbers.splice(i, 1);
                continue;
            }
            
            // Render
            const screenX = (dmg.x + offsetX) * this.tileSize + this.tileSize / 2;
            const screenY = (dmg.y + offsetY) * this.tileSize + dmg.offsetY;
            
            this.ctx.save();
            this.ctx.globalAlpha = dmg.life;
            this.ctx.fillStyle = dmg.color;
            this.ctx.font = 'bold 14px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(`-${dmg.amount}`, screenX, screenY);
            this.ctx.fillText(`-${dmg.amount}`, screenX, screenY);
            this.ctx.restore();
        }
    }
    
    showProjectile(fromX, fromY, toX, toY, color = '#ffa500') {
        this.projectiles.push({
            fromX: fromX,
            fromY: fromY,
            toX: toX,
            toY: toY,
            color: color,
            progress: 0,
            speed: 0.3
        });
    }
    
    renderProjectiles(offsetX, offsetY) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            
            // Update
            proj.progress += proj.speed;
            
            if (proj.progress >= 1.0) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Interpolate position
            const currentX = proj.fromX + (proj.toX - proj.fromX) * proj.progress;
            const currentY = proj.fromY + (proj.toY - proj.fromY) * proj.progress;
            
            // Render projectile
            const screenX = (currentX + offsetX) * this.tileSize + this.tileSize / 2;
            const screenY = (currentY + offsetY) * this.tileSize + this.tileSize / 2;
            
            this.ctx.save();
            this.ctx.fillStyle = proj.color || '#ffa500';
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            this.ctx.restore();
        }
    }
    
    calculateFOV(player, labyrinth) {
        const visibleTiles = new Set();
        const radius = 8; // Vision radius
        
        // Simple raycasting FOV
        for (let angle = 0; angle < 360; angle += 2) {
            const rad = angle * Math.PI / 180;
            const dx = Math.cos(rad);
            const dy = Math.sin(rad);
            
            let x = player.x + 0.5;
            let y = player.y + 0.5;
            
            for (let i = 0; i < radius; i++) {
                const tileX = Math.floor(x);
                const tileY = Math.floor(y);
                
                if (!labyrinth.isInBounds(tileX, tileY)) break;
                
                visibleTiles.add(`${tileX},${tileY}`);
                
                if (labyrinth.isWall(tileX, tileY)) break;
                
                x += dx * 0.5;
                y += dy * 0.5;
            }
        }
        
        return visibleTiles;
    }
    
    updateCamera(player) {
        const halfViewportX = Math.floor(this.viewportWidth / 2);
        const halfViewportY = Math.floor(this.viewportHeight / 2);
        
        // Calculate player position relative to current camera
        const playerScreenX = player.x - this.targetCameraX;
        const playerScreenY = player.y - this.targetCameraY;
        
        // Check if player is near borders and adjust camera
        if (playerScreenX < this.cameraBorder) {
            this.targetCameraX = player.x - this.cameraBorder;
        } else if (playerScreenX > this.viewportWidth - this.cameraBorder - 1) {
            this.targetCameraX = player.x - this.viewportWidth + this.cameraBorder + 1;
        }
        
        if (playerScreenY < this.cameraBorder) {
            this.targetCameraY = player.y - this.cameraBorder;
        } else if (playerScreenY > this.viewportHeight - this.cameraBorder - 1) {
            this.targetCameraY = player.y - this.viewportHeight + this.cameraBorder + 1;
        }
        
        // Initialize camera on first render
        if (this.cameraX === 0 && this.cameraY === 0) {
            this.cameraX = player.x - halfViewportX;
            this.cameraY = player.y - halfViewportY;
            this.targetCameraX = this.cameraX;
            this.targetCameraY = this.cameraY;
        }
    }
    
    renderLabyrinth(labyrinth, offsetX, offsetY, visibleTiles) {
        for (let y = 0; y < labyrinth.height; y++) {
            for (let x = 0; x < labyrinth.width; x++) {
                const screenX = (x + offsetX) * this.tileSize;
                const screenY = (y + offsetY) * this.tileSize;
                
                // Only render visible tiles
                if (screenX < -this.tileSize || screenX > this.canvas.width ||
                    screenY < -this.tileSize || screenY > this.canvas.height) {
                    continue;
                }
                
                const tile = labyrinth.getTile(x, y);
                const isVisible = visibleTiles.has(`${x},${y}`);
                
                switch (tile) {
                    case 0: // Floor
                        this.ctx.fillStyle = this.colors.floor;
                        break;
                    case 1: // Wall
                        this.ctx.fillStyle = this.colors.wall;
                        break;
                    case 2: // Start
                        this.ctx.fillStyle = this.colors.start;
                        break;
                    case 3: // Exit
                        this.ctx.fillStyle = this.colors.exit;
                        break;
                    default:
                        this.ctx.fillStyle = '#000';
                }
                
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                
                // Draw grid lines
                this.ctx.strokeStyle = '#222';
                this.ctx.strokeRect(screenX, screenY, this.tileSize, this.tileSize);
                
                // Apply fog if not visible
                if (!isVisible) {
                    this.ctx.fillStyle = this.colors.fog;
                    this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                }
            }
        }
    }
    
    renderPlayer(player, offsetX, offsetY) {
        const screenX = (player.x + offsetX) * this.tileSize;
        const screenY = (player.y + offsetY) * this.tileSize;
        
        this.ctx.fillStyle = this.colors.player;
        this.ctx.fillRect(screenX + 2, screenY + 2, this.tileSize - 4, this.tileSize - 4);
        
        // Player symbol
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('@', screenX + this.tileSize / 2, screenY + this.tileSize / 2);
    }
    
    renderEnemy(enemy, offsetX, offsetY) {
        const screenX = (enemy.x + offsetX) * this.tileSize;
        const screenY = (enemy.y + offsetY) * this.tileSize;
        
        this.ctx.fillStyle = this.colors.enemy;
        this.ctx.fillRect(screenX + 2, screenY + 2, this.tileSize - 4, this.tileSize - 4);
        
        // Enemy symbol
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(enemy.symbol || 'E', screenX + this.tileSize / 2, screenY + this.tileSize / 2);
        
        // Render status effect icons if any
        if (enemy.statusEffects && enemy.statusEffects.activeEffects.length > 0) {
            const icons = enemy.statusEffects.getStatusIcons();
            icons.forEach((status, index) => {
                const iconX = screenX + 2 + (index * 6);
                const iconY = screenY + 2;
                
                this.ctx.font = '8px Arial';
                this.ctx.fillText(status.icon, iconX, iconY + 4);
            });
        }
    }
    
    renderItem(item, offsetX, offsetY) {
        const screenX = (item.x + offsetX) * this.tileSize;
        const screenY = (item.y + offsetY) * this.tileSize;
        
        // Item background
        this.ctx.fillStyle = item.getColor();
        this.ctx.fillRect(screenX + 3, screenY + 3, this.tileSize - 6, this.tileSize - 6);
        
        // Item symbol
        const symbols = {
            'weapon': '⚔',
            'armor': '🛡',
            'charm': '📿',
            'boots': '👢'
        };
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(symbols[item.type] || '?', screenX + this.tileSize / 2, screenY + this.tileSize / 2);
    }
}
