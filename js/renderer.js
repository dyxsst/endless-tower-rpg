export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.tileSize = 16;
        this.viewportWidth = 0;
        this.viewportHeight = 0;
        this.calculateViewport();
        
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
        
        // Calculate camera offset to center on player
        const offsetX = Math.floor(this.viewportWidth / 2) - player.x;
        const offsetY = Math.floor(this.viewportHeight / 2) - player.y;
        
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
