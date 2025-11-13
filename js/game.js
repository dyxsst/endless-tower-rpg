import { Player } from './entities/player.js';
import { Labyrinth } from './labyrinth.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';

export class Game {
    constructor(database) {
        this.db = database;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.floor = 1;
        this.player = null;
        this.labyrinth = null;
        this.enemies = [];
        this.items = [];
        
        // Systems
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.input = new InputHandler(this);
        
        // Turn management
        this.turnCount = 0;
        this.gameRunning = false;
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        // Set canvas size (adjust based on screen)
        const isMobile = window.innerWidth < 768;
        const size = isMobile ? Math.min(window.innerWidth, window.innerHeight) - 20 : 800;
        this.canvas.width = size;
        this.canvas.height = size;
    }
    
    async start(isNewGame) {
        if (isNewGame) {
            await this.newGame();
        } else {
            await this.loadGame();
        }
        
        this.gameRunning = true;
        this.gameLoop();
    }
    
    async newGame() {
        // Create player
        this.player = new Player(0, 0);
        
        // Generate first floor
        await this.generateFloor(1);
        
        // Save initial state
        await this.saveGame();
        
        this.updateUI();
    }
    
    async loadGame() {
        const saveData = await this.db.loadGame();
        
        if (!saveData) {
            console.error('No save data found');
            await this.newGame();
            return;
        }
        
        // Restore game state
        this.floor = saveData.floor;
        this.player = Player.fromSaveData(saveData.player);
        this.turnCount = saveData.turnCount;
        
        // Regenerate floor (or load if you save the full labyrinth)
        await this.generateFloor(this.floor);
        
        this.updateUI();
    }
    
    async generateFloor(floorNumber) {
        this.floor = floorNumber;
        
        // Generate labyrinth
        this.labyrinth = new Labyrinth(40, 40, this.floor);
        this.labyrinth.generate();
        
        // Place player at start
        const start = this.labyrinth.startPos;
        this.player.x = start.x;
        this.player.y = start.y;
        
        // Spawn enemies
        this.spawnEnemies();
        
        // Spawn items
        this.spawnItems();
        
        console.log(`Floor ${floorNumber} generated`);
    }
    
    spawnEnemies() {
        import('./entities/enemy.js').then(module => {
            const { Enemy } = module;
            
            this.enemies = [];
            
            // Get all floor tiles for spawning
            const floorTiles = [];
            for (let y = 0; y < this.labyrinth.height; y++) {
                for (let x = 0; x < this.labyrinth.width; x++) {
                    const tile = this.labyrinth.getTile(x, y);
                    if (tile === 0 || tile === 2) { // Floor or start (not exit)
                        // Don't spawn too close to player
                        const dist = Math.abs(x - this.player.x) + Math.abs(y - this.player.y);
                        if (dist > 8) {
                            floorTiles.push({ x, y });
                        }
                    }
                }
            }
            
            // Calculate enemy count based on floor
            const baseCount = 3 + this.floor;
            const enemyCount = Math.min(baseCount, Math.floor(floorTiles.length * 0.15));
            
            // Spawn enemies
            for (let i = 0; i < enemyCount; i++) {
                if (floorTiles.length === 0) break;
                
                const idx = Math.floor(Math.random() * floorTiles.length);
                const pos = floorTiles.splice(idx, 1)[0];
                
                // Choose enemy type based on floor
                const type = this.chooseEnemyType();
                
                const enemy = new Enemy(pos.x, pos.y, type, this.floor);
                this.enemies.push(enemy);
            }
            
            console.log(`Spawned ${this.enemies.length} enemies on floor ${this.floor}`);
        });
    }
    
    chooseEnemyType() {
        const roll = Math.random() * 100;
        
        // Floor-based type distribution
        if (this.floor < 3) {
            return roll < 80 ? 'walker' : 'archer';
        } else if (this.floor < 6) {
            if (roll < 50) return 'walker';
            if (roll < 85) return 'archer';
            return 'mage';
        } else {
            if (roll < 40) return 'walker';
            if (roll < 70) return 'archer';
            if (roll < 90) return 'mage';
            return 'protector';
        }
    }
    
    spawnItems() {
        // TODO: Implement item spawning
        this.items = [];
    }
    
    async playerAction(action) {
        if (!this.gameRunning) return;
        
        let actionTaken = false;
        
        switch (action.type) {
            case 'move':
                actionTaken = this.handleMove(action.dx, action.dy);
                break;
            case 'wait':
                actionTaken = true;
                break;
            case 'ranged':
                actionTaken = this.handleRangedAttack(action.direction);
                break;
            case 'magic':
                actionTaken = this.handleMagic(action.spell);
                break;
        }
        
        if (actionTaken) {
            this.processTurn();
        }
    }
    
    handleMove(dx, dy) {
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // Check bounds
        if (!this.labyrinth.isInBounds(newX, newY)) return false;
        
        // Check walls
        if (this.labyrinth.isWall(newX, newY)) return false;
        
        // Check for enemy (bump attack)
        const enemy = this.getEnemyAt(newX, newY);
        if (enemy) {
            this.bumpAttack(enemy);
            return true;
        }
        
        // Move player
        this.player.x = newX;
        this.player.y = newY;
        
        // Check for exit
        if (this.labyrinth.isExit(newX, newY)) {
            this.ascendFloor();
            return true;
        }
        
        // Check for items
        this.collectItems(newX, newY);
        
        return true;
    }
    
    bumpAttack(enemy) {
        // Calculate damage
        const damage = Math.max(1, this.player.atk - enemy.def);
        enemy.hp -= damage;
        
        // Show damage number
        this.renderer.showDamageNumber(enemy.x, enemy.y, damage, '#ff4444');
        
        console.log(`Player deals ${damage} damage to ${enemy.type}`);
        
        // Enemy retaliates if alive
        if (enemy.hp > 0) {
            const retaliation = Math.max(1, enemy.atk - this.player.def);
            this.player.takeDamage(retaliation);
            this.renderer.showDamageNumber(this.player.x, this.player.y, retaliation, '#ffaa00');
            console.log(`${enemy.type} retaliates for ${retaliation} damage`);
        } else {
            this.killEnemy(enemy);
        }
    }
    
    handleRangedAttack(direction) {
        // TODO: Implement ranged attack
        console.log('Ranged attack not yet implemented');
        return false;
    }
    
    handleMagic(spell) {
        // TODO: Implement magic system
        console.log('Magic not yet implemented');
        return false;
    }
    
    processTurn() {
        this.turnCount++;
        
        // Process enemy turns
        this.enemies.forEach(enemy => {
            if (enemy.hp > 0) {
                enemy.takeTurn(this.player, this.labyrinth, this.enemies);
            }
        });
        
        // Remove dead enemies
        this.enemies = this.enemies.filter(e => e.hp > 0);
        
        // Check win/loss conditions
        if (this.player.hp <= 0) {
            this.gameOver();
        }
        
        // Update UI
        this.updateUI();
        
        // Auto-save every 10 turns
        if (this.turnCount % 10 === 0) {
            this.saveGame();
        }
    }
    
    getEnemyAt(x, y) {
        return this.enemies.find(e => e.x === x && e.y === y && e.hp > 0);
    }
    
    collectItems(x, y) {
        // TODO: Implement item collection
    }
    
    killEnemy(enemy) {
        // Grant XP and gold
        this.player.gainXP(enemy.xpValue);
        this.player.gold += enemy.goldValue;
        
        // Partial heal on kill (30% of max HP)
        const healAmount = Math.floor(this.player.maxHp * 0.3);
        this.player.heal(healAmount);
        this.renderer.showDamageNumber(this.player.x, this.player.y, healAmount, '#44ff44');
        
        console.log(`Enemy defeated! +${enemy.xpValue} XP, +${enemy.goldValue} gold, +${healAmount} HP`);
    }
    
    async ascendFloor() {
        this.floor++;
        console.log(`Ascending to floor ${this.floor}...`);
        
        // Partial heal
        this.player.heal(Math.floor(this.player.maxHp * 0.3));
        
        // Generate next floor
        await this.generateFloor(this.floor);
        
        // Save progress
        await this.saveGame();
    }
    
    updateUI() {
        document.getElementById('floor-number').textContent = this.floor;
        document.getElementById('player-hp').textContent = `${this.player.hp}/${this.player.maxHp}`;
        document.getElementById('player-xp').textContent = this.player.xp;
        document.getElementById('player-gold').textContent = this.player.gold;
    }
    
    async saveGame() {
        const saveData = {
            floor: this.floor,
            player: this.player.toSaveData(),
            turnCount: this.turnCount,
            timestamp: Date.now()
        };
        
        await this.db.saveGame(saveData);
        console.log('Game saved');
    }
    
    gameOver() {
        this.gameRunning = false;
        console.log('Game Over!');
        alert(`Game Over! You reached floor ${this.floor}`);
        
        // TODO: Show game over screen with stats
        // Reset to title screen
        window.location.reload();
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render game
        this.renderer.render(this.labyrinth, this.player, this.enemies, this.items);
        
        // Continue loop
        requestAnimationFrame(() => this.gameLoop());
    }
}
