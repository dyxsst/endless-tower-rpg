import { Player } from './entities/player.js';
import { Labyrinth } from './labyrinth.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input.js';
import { RangedCombat } from './combat/ranged.js';

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
        this.rangedCombat = new RangedCombat(this);
        
        // Turn management
        this.turnCount = 0;
        this.gameRunning = false;
        
        this.setupCanvas();
    }
    
    setupCanvas() {
        // Set canvas size (adjust based on screen)
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            const size = Math.min(window.innerWidth, window.innerHeight) - 20;
            this.canvas.width = size;
            this.canvas.height = size;
        } else {
            // Desktop: size to fit labyrinth (40x40 tiles at 16px = 640px)
            this.canvas.width = 640;
            this.canvas.height = 640;
        }
    }
    
    async start(isNewGame) {
        if (isNewGame) {
            await this.newGame();
        } else {
            await this.loadGame();
        }
        
        // Recalculate viewport after canvas is sized
        this.renderer.recalculateViewport();
        
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
        
        // Show mobile buttons
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            document.getElementById('mobile-inventory-btn').style.setProperty('display', 'flex', 'important');
            document.getElementById('mobile-bow-btn').style.setProperty('display', 'flex', 'important');
        }
        
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
        
        // Show mobile buttons
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            document.getElementById('mobile-inventory-btn').style.setProperty('display', 'flex', 'important');
            document.getElementById('mobile-bow-btn').style.setProperty('display', 'flex', 'important');
        }
        
        this.updateUI();
    }
    
    async generateFloor(floorNumber) {
        this.floor = floorNumber;
        const isMilestone = (this.floor % 5 === 0);
        
        // Generate labyrinth
        this.labyrinth = new Labyrinth(40, 40, this.floor);
        this.labyrinth.generate();
        
        // Place player at start
        const start = this.labyrinth.startPos;
        this.player.x = start.x;
        this.player.y = start.y;
        
        // Spawn enemies
        if (isMilestone) {
            this.spawnBoss();
            this.showMilestoneEntry();
        } else {
            this.spawnEnemies();
        }
        
        // Clear items from previous floor
        this.items = [];
        
        console.log(`Floor ${floorNumber} generated${isMilestone ? ' (MILESTONE)' : ''}`);
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
    
    spawnBoss() {
        import('./entities/enemy.js').then(module => {
            const { Enemy } = module;
            
            this.enemies = [];
            
            // Spawn boss near exit
            const exit = this.labyrinth.exitPos;
            const boss = new Enemy(exit.x, exit.y, 'boss', this.floor);
            this.enemies.push(boss);
            
            console.log(`Boss spawned at exit on floor ${this.floor}`);
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
        this.pickupItem(newX, newY);
        
        return true;
    }
    
    pickupItem(x, y) {
        const itemIdx = this.items.findIndex(item => item.x === x && item.y === y);
        if (itemIdx >= 0) {
            const item = this.items[itemIdx];
            this.items.splice(itemIdx, 1);
            
            // Auto-equip if slot is empty, otherwise add to inventory
            if (!this.player[item.type]) {
                this.player.equip(item);
                this.showMessage(`Equipped ${item.name}!`, item.getColor());
            } else {
                this.player.inventory.push(item);
                this.showMessage(`Picked up ${item.name}`, item.getColor());
            }
            
            this.updateUI();
        }
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
    
    showMessage(text, color = '#fff') {
        // Simple message display (can be enhanced later)
        const msgDiv = document.createElement('div');
        msgDiv.textContent = text;
        msgDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: ${color};
            padding: 20px 40px;
            border: 2px solid ${color};
            border-radius: 10px;
            font-size: 18px;
            font-weight: bold;
            z-index: 9999;
            animation: fadeOut 2s forwards;
        `;
        
        document.body.appendChild(msgDiv);
        setTimeout(() => msgDiv.remove(), 2000);
    }
    
    showMilestoneEntry() {
        // Small heal on milestone entry
        const healAmount = Math.floor(this.player.maxHp * 0.2);
        this.player.heal(healAmount);
        
        this.showMessage(`MILESTONE FLOOR ${this.floor}! +${healAmount} HP`);
        
        // Show shop button after message
        setTimeout(() => {
            this.showShopPrompt();
        }, 2500);
    }
    
    showShopPrompt() {
        const msgDiv = document.createElement('div');
        msgDiv.innerHTML = `
            <div style="text-align: center;">
                <h3 style="margin-bottom: 15px; color: #ffa500;">Shop Available!</h3>
                <button id="open-shop-btn" style="
                    padding: 10px 20px;
                    font-size: 16px;
                    font-family: 'Courier New', monospace;
                    background: #333;
                    color: #ffa500;
                    border: 2px solid #ffa500;
                    border-radius: 5px;
                    cursor: pointer;
                ">Open Shop</button>
                <button id="skip-shop-btn" style="
                    padding: 10px 20px;
                    margin-left: 10px;
                    font-size: 16px;
                    font-family: 'Courier New', monospace;
                    background: #222;
                    color: #888;
                    border: 2px solid #666;
                    border-radius: 5px;
                    cursor: pointer;
                ">Skip</button>
            </div>
        `;
        msgDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            padding: 30px;
            border: 3px solid #ffa500;
            border-radius: 10px;
            z-index: 2500;
        `;
        
        document.body.appendChild(msgDiv);
        
        document.getElementById('open-shop-btn').addEventListener('click', () => {
            msgDiv.remove();
            this.openShop();
        });
        
        document.getElementById('skip-shop-btn').addEventListener('click', () => {
            msgDiv.remove();
        });
    }
    
    openShop() {
        const overlay = document.getElementById('shop-overlay');
        if (!overlay) {
            console.error('Shop overlay not found');
            return;
        }
        
        overlay.classList.remove('hidden');
        this.gameRunning = false;
        
        // Update shop floor display
        const shopFloor = document.getElementById('shop-floor');
        if (shopFloor) {
            shopFloor.textContent = this.floor;
        }
        
        this.generateShopInventory();
    }
    
    closeShop() {
        const overlay = document.getElementById('shop-overlay');
        overlay.classList.add('hidden');
        this.gameRunning = true;
        this.gameLoop();
    }
    
    generateShopInventory() {
        const shopList = document.getElementById('shop-inventory');
        shopList.innerHTML = '';
        
        // Generate 3-5 items for sale
        const itemCount = 3 + Math.floor(Math.random() * 3);
        const shopItems = [];
        
        import('./items/item.js').then(module => {
            const { Item } = module;
            
            for (let i = 0; i < itemCount; i++) {
                const rarity = Item.rollRarity();
                const type = Item.rollType();
                const item = new Item(type, rarity, this.floor);
                
                // Shop items cost gold based on stat value
                item.price = Math.floor(item.getTotalValue() * 3 + this.floor * 5);
                shopItems.push(item);
            }
            
            // Add heal option
            const healOption = {
                name: 'Full Heal',
                description: 'Restore all HP',
                price: 20 + this.floor * 3,
                isHeal: true
            };
            
            // Render shop items
            shopItems.forEach((item, idx) => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'shop-item';
                itemDiv.style.borderColor = item.getColor();
                
                // Get comparison with equipped item of same type
                const equippedItem = this.player[item.type];
                const statsDisplay = item.getStatComparison(equippedItem);
                
                itemDiv.innerHTML = `
                    <div class="item-name" style="color: ${item.getColor()}">${item.name}</div>
                    <div class="item-stats">${statsDisplay}</div>
                    <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #ffa500; font-weight: bold;">${item.price} gold</span>
                        <button onclick="game.buyItem(${idx})" class="shop-buy-btn">Buy</button>
                    </div>
                `;
                shopList.appendChild(itemDiv);
            });
            
            // Add heal option
            const healDiv = document.createElement('div');
            healDiv.className = 'shop-item';
            healDiv.style.borderColor = '#44ff44';
            healDiv.innerHTML = `
                <div class="item-name" style="color: #44ff44">${healOption.name}</div>
                <div class="item-stats" style="color: #aaa;">${healOption.description}</div>
                <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: #ffa500; font-weight: bold;">${healOption.price} gold</span>
                    <button onclick="game.buyHeal()" class="shop-buy-btn">Buy</button>
                </div>
            `;
            shopList.appendChild(healDiv);
            
            // Store items for purchase
            this.shopItems = shopItems;
        });
    }
    
    buyItem(idx) {
        const item = this.shopItems[idx];
        if (!item) return;
        
        if (this.player.gold < item.price) {
            this.showMessage('Not enough gold!');
            return;
        }
        
        this.player.gold -= item.price;
        this.player.inventory.push(item);
        this.updateUI();
        this.showMessage(`Purchased ${item.name}`);
        
        // Remove from shop
        this.shopItems.splice(idx, 1);
        this.generateShopInventory();
    }
    
    buyHeal() {
        const price = 20 + this.floor * 3;
        
        if (this.player.gold < price) {
            this.showMessage('Not enough gold!');
            return;
        }
        
        if (this.player.hp === this.player.maxHp) {
            this.showMessage('Already at full HP!');
            return;
        }
        
        this.player.gold -= price;
        const healAmount = this.player.maxHp - this.player.hp;
        this.player.heal(healAmount);
        this.updateUI();
        this.showMessage(`Healed ${healAmount} HP`);
    }
    
    killEnemy(enemy) {
        // Grant XP and gold
        this.player.gainXP(enemy.xpValue);
        this.player.gold += enemy.goldValue;
        
        // Partial heal on kill (30% of max HP)
        const healAmount = Math.floor(this.player.maxHp * 0.3);
        this.player.heal(healAmount);
        this.renderer.showDamageNumber(this.player.x, this.player.y, healAmount, '#44ff44');
        
        // Item drop chance
        const isBoss = enemy.type === 'boss';
        
        if (isBoss) {
            // Boss: guaranteed Uncommon+ drop
            this.dropBossLoot(enemy.x, enemy.y);
        } else {
            // Normal: 30% base + floor bonus, cap at 60%
            const dropChance = Math.min(60, 30 + this.floor * 2);
            if (Math.random() * 100 < dropChance) {
                this.dropItem(enemy.x, enemy.y);
            }
        }
        
        console.log(`Enemy defeated! +${enemy.xpValue} XP, +${enemy.goldValue} gold, +${healAmount} HP`);
    }
    
    dropBossLoot(x, y) {
        import('./items/item.js').then(module => {
            const { Item } = module;
            
            // Roll rarity with guarantee of at least Uncommon
            let rarity = Item.rollRarity();
            if (rarity === 'common') {
                rarity = 'uncommon'; // Upgrade common to uncommon
            }
            
            const type = Item.rollType();
            const item = new Item(type, rarity, this.floor);
            
            item.x = x;
            item.y = y;
            
            this.items.push(item);
            this.showMessage(`Boss dropped: ${item.name}!`, item.getColor());
            console.log(`Boss dropped: ${item.name} (${item.rarity})`);
        });
    }
    
    dropItem(x, y) {
        import('./items/item.js').then(module => {
            const { Item } = module;
            
            const rarity = Item.rollRarity();
            const type = Item.rollType();
            const item = new Item(type, rarity, this.floor);
            
            item.x = x;
            item.y = y;
            
            this.items.push(item);
            console.log(`Dropped: ${item.name} (${item.rarity})`);
        });
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
        document.getElementById('player-level').textContent = this.player.level;
        document.getElementById('player-hp').textContent = `${this.player.hp}/${this.player.maxHp}`;
        document.getElementById('player-xp').textContent = `${this.player.xp}/${this.player.xpToLevel}`;
        document.getElementById('player-gold').textContent = this.player.gold;
        document.getElementById('player-stamina').textContent = `${this.player.stamina}/${this.player.maxStamina}`;
        
        // Update equipment display (add to stats panel)
        const statsPanel = document.getElementById('stats-panel');
        let equipDiv = document.getElementById('equipment-display');
        if (!equipDiv) {
            equipDiv = document.createElement('div');
            equipDiv.id = 'equipment-display';
            equipDiv.style.marginTop = '10px';
            equipDiv.style.fontSize = '11px';
            statsPanel.appendChild(equipDiv);
        }
        
        const equip = [];
        if (this.player.weapon) equip.push(`⚔️ ${this.player.weapon.name}`);
        if (this.player.armor) equip.push(`🛡️ ${this.player.armor.name}`);
        if (this.player.charm) equip.push(`📿 ${this.player.charm.name}`);
        if (this.player.boots) equip.push(`👢 ${this.player.boots.name}`);
        
        equipDiv.innerHTML = equip.length > 0 ? equip.join('<br>') : 'No equipment';
    }
    
    openInventory() {
        const overlay = document.getElementById('inventory-overlay');
        overlay.classList.remove('hidden');
        this.gameRunning = false;
        
        this.updateInventoryUI();
    }
    
    closeInventory() {
        const overlay = document.getElementById('inventory-overlay');
        overlay.classList.add('hidden');
        this.gameRunning = true;
        this.gameLoop(); // Restart the game loop
    }
    
    updateInventoryUI() {
        // Update equipped slots
        const slots = ['weapon', 'bow', 'armor', 'charm', 'boots'];
        slots.forEach(slot => {
            const slotDiv = document.getElementById(`slot-${slot}`);
            const item = this.player[slot];
            
            if (item) {
                slotDiv.innerHTML = `
                    <div style="color: ${item.getColor()}">${item.name}</div>
                    <div style="font-size: 11px; color: #888">${item.getStatsText()}</div>
                `;
                slotDiv.classList.remove('empty');
                slotDiv.onclick = () => this.unequipItem(slot);
            } else {
                slotDiv.textContent = 'Empty';
                slotDiv.classList.add('empty');
                slotDiv.onclick = null;
            }
        });
        
        // Update inventory list
        const listDiv = document.getElementById('inventory-list');
        listDiv.innerHTML = '';
        
        if (this.player.inventory.length === 0) {
            listDiv.innerHTML = '<div style="color: #666; font-style: italic; text-align: center; padding: 20px;">No items in backpack</div>';
            return;
        }
        
        this.player.inventory.forEach((item, idx) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.style.borderColor = item.getColor();
            
            // Get comparison with equipped item of same type
            const equippedItem = this.player[item.type];
            const statsDisplay = item.getStatComparison(equippedItem);
            
            itemDiv.innerHTML = `
                <div class="item-name" style="color: ${item.getColor()}">${item.name}</div>
                <div class="item-stats">${statsDisplay}</div>
                <div class="item-actions">
                    <button onclick="game.equipFromInventory(${idx})">Equip</button>
                    <button onclick="game.dropFromInventory(${idx})">Drop</button>
                </div>
            `;
            listDiv.appendChild(itemDiv);
        });
    }
    
    equipFromInventory(idx) {
        const item = this.player.inventory[idx];
        if (!item) return;
        
        this.player.equip(item);
        this.updateInventoryUI();
        this.updateUI();
    }
    
    unequipItem(slotType) {
        const item = this.player[slotType];
        if (!item) return;
        
        this.player.inventory.push(item);
        this.player.unequip(slotType);
        this.updateInventoryUI();
        this.updateUI();
        this.showMessage(`Unequipped ${item.name}`, item.getColor());
    }
    
    dropFromInventory(idx) {
        const item = this.player.inventory[idx];
        if (!item) return;
        
        // Drop on player's current position
        item.x = this.player.x;
        item.y = this.player.y;
        this.items.push(item);
        
        this.player.inventory.splice(idx, 1);
        this.updateInventoryUI();
        this.showMessage(`Dropped ${item.name}`, '#888');
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
