export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.tileSize = 16;
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.calculateViewport();
        
        // Camera position (smooth scrolling)
        this.cameraX = 0;
        this.cameraY = 0;
        this.targetCameraX = 0;
        this.targetCameraY = 0;
        this.cameraSpeed = 0.15;
        
        // Border for camera movement (tiles from edge)
        this.cameraBorder = 5;
        
        // Damage numbers
        this.damageNumbers = [];
        
        // Colors
        this.colors = {
            wall: '#333',
            floor: '#555',
            start: '#4a4',
            exit: '#fa4',
            player: '#4af',
            enemy: '#f44',
            item: '#ff4'
        };
    }
    
    calculateViewport() {
        this.viewportWidth = Math.floor(this.canvas.width / this.tileSize);
        this.viewportHeight = Math.floor(this.canvas.height / this.tileSize);
    }
    
    render(labyrinth, player, enemies, items) {
        if (!labyrinth || !player) return;
        
        // Update camera target based on player position and borders
        this.updateCamera(player);
        
        // Smooth camera movement
        this.cameraX += (this.targetCameraX - this.cameraX) * this.cameraSpeed;
        this.cameraY += (this.targetCameraY - this.cameraY) * this.cameraSpeed;
        
        // Round to prevent sub-pixel rendering issues
        const roundedCameraX = Math.round(this.cameraX);
        const roundedCameraY = Math.round(this.cameraY);
        
        // Calculate render offset (camera position is top-left of viewport)
        const offsetX = -roundedCameraX;
        const offsetY = -roundedCameraY;
        
        // Render labyrinth
        this.renderLabyrinth(labyrinth, offsetX, offsetY);
        
        // Render items
        items.forEach(item => {
            this.renderItem(item, offsetX, offsetY);
        });
        
        // Render enemies
        enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                this.renderEnemy(enemy, offsetX, offsetY);
            }
        });
        
        // Render player
        this.renderPlayer(player, offsetX, offsetY);
        
        // Render damage numbers
        this.renderDamageNumbers(offsetX, offsetY);
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
    
    renderLabyrinth(labyrinth, offsetX, offsetY) {
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
    }
    
    renderItem(item, offsetX, offsetY) {
        const screenX = (item.x + offsetX) * this.tileSize;
        const screenY = (item.y + offsetY) * this.tileSize;
        
        this.ctx.fillStyle = this.colors.item;
        this.ctx.fillRect(screenX + 4, screenY + 4, this.tileSize - 8, this.tileSize - 8);
    }
}
