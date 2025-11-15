export class InputHandler {
    constructor(game) {
        this.game = game;
        this.setupKeyboard();
        this.setupTouch();
    }
    
    screenToGrid(screenX, screenY) {
        // Convert screen coordinates to grid coordinates
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        const canvasX = screenX - rect.left;
        const canvasY = screenY - rect.top;
        
        const renderer = this.game.renderer;
        const tileSize = renderer.tileSize;
        
        // Calculate grid position based on camera offset
        let gridX, gridY;
        
        if (renderer.isMobile) {
            // Mobile uses smooth camera
            const roundedCameraX = Math.round(renderer.cameraX);
            const roundedCameraY = Math.round(renderer.cameraY);
            gridX = Math.floor(canvasX / tileSize) + roundedCameraX;
            gridY = Math.floor(canvasY / tileSize) + roundedCameraY;
        } else {
            // Desktop centers the labyrinth
            const labyrinth = this.game.labyrinth;
            let offsetX, offsetY;
            
            if (labyrinth.width < renderer.viewportWidth) {
                offsetX = Math.floor((renderer.viewportWidth - labyrinth.width) / 2);
            } else {
                offsetX = 0;
            }
            
            if (labyrinth.height < renderer.viewportHeight) {
                offsetY = Math.floor((renderer.viewportHeight - labyrinth.height) / 2);
            } else {
                offsetY = 0;
            }
            
            gridX = Math.floor(canvasX / tileSize) - offsetX;
            gridY = Math.floor(canvasY / tileSize) - offsetY;
        }
        
        // Check if within labyrinth bounds
        if (gridX < 0 || gridX >= this.game.labyrinth.width || 
            gridY < 0 || gridY >= this.game.labyrinth.height) {
            return null;
        }
        
        return { x: gridX, y: gridY };
    }
    
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });
        
        // Add click support for desktop tap-on-enemy
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('click', (e) => {
            if (!this.game.gameRunning) return;
            
            // Check if in targeting mode (bow or magic)
            if (this.game.rangedCombat && this.game.rangedCombat.targetingMode) {
                const gridPos = this.screenToGrid(e.clientX, e.clientY);
                if (gridPos) {
                    const enemy = this.game.getEnemyAt(gridPos.x, gridPos.y);
                    if (enemy) {
                        this.game.rangedCombat.selectTarget(enemy);
                    } else {
                        this.game.showMessage('Click an enemy to shoot!', '#ff4444');
                    }
                }
                return;
            }
            
            if (this.game.magic && this.game.magic.targetingMode) {
                const gridPos = this.screenToGrid(e.clientX, e.clientY);
                if (gridPos) {
                    const enemy = this.game.getEnemyAt(gridPos.x, gridPos.y);
                    if (enemy) {
                        this.game.magic.selectTarget(enemy);
                    } else {
                        this.game.showMessage('Click an enemy to cast!', '#ff4444');
                    }
                }
                return;
            }
        });
    }
    
    setupTouch() {
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTarget = null;
        
        // Get canvas element for targeted touch handling
        const canvas = document.getElementById('game-canvas');
        
        // Listen on canvas for swipe gestures
        canvas.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            touchStartTarget = e.target;
        }, { passive: true });
        
        canvas.addEventListener('touchend', (e) => {
            if (!this.game.gameRunning) return;
            
            // Only process if touch started and ended on canvas
            if (touchStartTarget !== canvas) return;
            
            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            const swipeThreshold = 30;
            
            // Check if this is a tap (minimal movement) vs swipe
            const isTap = Math.abs(dx) < swipeThreshold && Math.abs(dy) < swipeThreshold;
            
            // Check if in ranged targeting mode
            if (this.game.rangedCombat && this.game.rangedCombat.targetingMode) {
                if (isTap) {
                    // Tap on enemy to shoot
                    const gridPos = this.screenToGrid(touch.clientX, touch.clientY);
                    if (gridPos) {
                        const enemy = this.game.getEnemyAt(gridPos.x, gridPos.y);
                        if (enemy) {
                            this.game.rangedCombat.selectTarget(enemy);
                        } else {
                            this.game.showMessage('Tap an enemy to shoot!', '#ff4444');
                        }
                    }
                }
                return;
            }
            
            // Check if in magic targeting mode
            if (this.game.magic && this.game.magic.targetingMode) {
                if (isTap) {
                    // Tap on enemy to cast spell
                    const gridPos = this.screenToGrid(touch.clientX, touch.clientY);
                    if (gridPos) {
                        const enemy = this.game.getEnemyAt(gridPos.x, gridPos.y);
                        if (enemy) {
                            this.game.magic.selectTarget(enemy);
                        } else {
                            this.game.showMessage('Tap an enemy to cast!', '#ff4444');
                        }
                    }
                }
                return;
            }
            
            // Normal movement - swipe to move
            if (!isTap) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Horizontal swipe
                    this.game.playerAction({
                        type: 'move',
                        dx: dx > 0 ? 1 : -1,
                        dy: 0
                    });
                } else {
                    // Vertical swipe
                    this.game.playerAction({
                        type: 'move',
                        dx: 0,
                        dy: dy > 0 ? 1 : -1
                    });
                }
            } else {
                // Tap (wait turn)
                this.game.playerAction({ type: 'wait' });
            }
        }, { passive: true });
        
        this.addTouchButtons();
    }
    
    addTouchButtons() {
        // Only show on mobile
        if (window.innerWidth > 768) return;
        
        const buttonsHTML = `
            <div id="touch-controls" class="visible">
                <button class="touch-btn" data-action="up">↑</button>
                <div class="touch-row">
                    <button class="touch-btn" data-action="left">←</button>
                    <button class="touch-btn" data-action="wait">⏸</button>
                    <button class="touch-btn" data-action="right">→</button>
                </div>
                <button class="touch-btn" data-action="down">↓</button>
            </div>
            <button id="toggle-controls" title="Toggle Controls">🎮</button>
        `;
        
        document.body.insertAdjacentHTML('beforeend', buttonsHTML);
        
        // Toggle button functionality
        const toggleBtn = document.getElementById('toggle-controls');
        const controls = document.getElementById('touch-controls');
        
        toggleBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            controls.classList.toggle('visible');
            // Save preference
            localStorage.setItem('touch-controls-visible', controls.classList.contains('visible'));
        });
        
        // Load saved preference
        const savedPref = localStorage.getItem('touch-controls-visible');
        if (savedPref === 'false') {
            controls.classList.remove('visible');
        }
        
        // Add button event listeners
        document.querySelectorAll('.touch-btn').forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const action = btn.dataset.action;
                
                const actions = {
                    'up': { type: 'move', dx: 0, dy: -1 },
                    'down': { type: 'move', dx: 0, dy: 1 },
                    'left': { type: 'move', dx: -1, dy: 0 },
                    'right': { type: 'move', dx: 1, dy: 0 },
                    'wait': { type: 'wait' }
                };
                
                if (actions[action]) {
                    this.game.playerAction(actions[action]);
                }
            });
        });
    }
    
    handleKeyPress(e) {
        // Prevent default for game keys
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                         'w', 'a', 's', 'd', ' ', 'r', 'm', 'i', 'I', 'Escape'];
        if (gameKeys.includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
        
        // Check if in ranged targeting mode
        if (this.game.rangedCombat.targetingMode) {
            const moveActions = {
                'ArrowUp': { dx: 0, dy: -1 },
                'ArrowDown': { dx: 0, dy: 1 },
                'ArrowLeft': { dx: -1, dy: 0 },
                'ArrowRight': { dx: 1, dy: 0 },
                'w': { dx: 0, dy: -1 },
                's': { dx: 0, dy: 1 },
                'a': { dx: -1, dy: 0 },
                'd': { dx: 1, dy: 0 }
            };
            
            if (moveActions[e.key]) {
                this.game.rangedCombat.selectDirection(moveActions[e.key].dx, moveActions[e.key].dy);
                return;
            }
            
            if (e.key === 'Escape') {
                this.game.rangedCombat.exitTargetingMode();
                this.game.showMessage('Cancelled');
                return;
            }
            
            return; // Block other actions while targeting
        }
        
        // Movement
        const moveActions = {
            'ArrowUp': { dx: 0, dy: -1 },
            'ArrowDown': { dx: 0, dy: 1 },
            'ArrowLeft': { dx: -1, dy: 0 },
            'ArrowRight': { dx: 1, dy: 0 },
            'w': { dx: 0, dy: -1 },
            's': { dx: 0, dy: 1 },
            'a': { dx: -1, dy: 0 },
            'd': { dx: 1, dy: 0 }
        };
        
        if (moveActions[e.key]) {
            this.game.playerAction({
                type: 'move',
                ...moveActions[e.key]
            });
            return;
        }
        
        // Other actions
        switch (e.key) {
            case ' ':
                this.game.playerAction({ type: 'wait' });
                break;
            case 'r':
            case 'R':
                // Enter ranged mode
                this.game.rangedCombat.enterTargetingMode();
                break;
            case 'm':
            case 'M':
                // Cast Firebolt spell
                this.game.magic.enterTargetingMode('firebolt');
                break;
            case '1':
                // Firebolt (hotkey)
                this.game.magic.enterTargetingMode('firebolt');
                break;
            case '2':
                // Fireball (hotkey)
                this.game.magic.enterTargetingMode('fireball');
                break;
            case '3':
                // Frost (hotkey)
                this.game.magic.enterTargetingMode('frost');
                break;
            case '4':
                // Spark (hotkey)
                this.game.magic.enterTargetingMode('spark');
                break;
            case 'i':
            case 'I':
                // Open inventory
                this.game.openInventory();
                break;
            case 'Escape':
                // Close inventory if open
                const invOverlay = document.getElementById('inventory-overlay');
                if (!invOverlay.classList.contains('hidden')) {
                    this.game.closeInventory();
                }
                break;
        }
    }
}

// Setup inventory button handlers
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-inventory-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (window.game) {
                window.game.closeInventory();
            }
        });
    }
    
    const closeShopBtn = document.getElementById('close-shop-btn');
    if (closeShopBtn) {
        closeShopBtn.addEventListener('click', () => {
            if (window.game) {
                window.game.closeShop();
            }
        });
    }
    
    const inventoryBtn = document.getElementById('inventory-btn');
    if (inventoryBtn) {
        inventoryBtn.addEventListener('click', () => {
            if (window.game) {
                document.getElementById('menu-overlay').classList.add('hidden');
                window.game.openInventory();
            }
        });
    }
    
    // Mobile inventory button
    const mobileInvBtn = document.getElementById('mobile-inventory-btn');
    if (mobileInvBtn) {
        mobileInvBtn.addEventListener('click', () => {
            if (window.game) {
                window.game.openInventory();
            }
        });
    }
    
    // Mobile bow button
    const mobileBowBtn = document.getElementById('mobile-bow-btn');
    if (mobileBowBtn) {
        mobileBowBtn.addEventListener('click', () => {
            if (window.game && window.game.rangedCombat) {
                const success = window.game.rangedCombat.enterTargetingMode();
                if (success) {
                    mobileBowBtn.classList.add('targeting');
                }
            }
        });
    }
    
    // Mobile magic button - now opens spell wheel
    const mobileMagicBtn = document.getElementById('mobile-magic-btn');
    const spellWheelContainer = document.getElementById('spell-wheel-container');
    
    if (mobileMagicBtn && spellWheelContainer) {
        mobileMagicBtn.addEventListener('click', () => {
            if (window.game && window.game.magic) {
                // Toggle spell wheel
                spellWheelContainer.classList.toggle('active');
                
                // Update spell availability based on mana
                const player = window.game.player;
                document.querySelectorAll('.spell-option').forEach(option => {
                    const spellName = option.getAttribute('data-spell');
                    const spell = window.game.magic.spells[spellName];
                    
                    if (spell && player.mana < spell.manaCost) {
                        option.classList.add('disabled');
                    } else {
                        option.classList.remove('disabled');
                    }
                });
            }
        });
        
        // Spell wheel close button
        const spellWheelClose = document.querySelector('.spell-wheel-close');
        if (spellWheelClose) {
            spellWheelClose.addEventListener('click', (e) => {
                e.stopPropagation();
                spellWheelContainer.classList.remove('active');
            });
        }
        
        // Spell selection
        document.querySelectorAll('.spell-option').forEach(option => {
            option.addEventListener('click', () => {
                if (option.classList.contains('disabled')) return;
                
                const spellName = option.getAttribute('data-spell');
                if (window.game && window.game.magic) {
                    const success = window.game.magic.enterTargetingMode(spellName);
                    if (success) {
                        spellWheelContainer.classList.remove('active');
                        mobileMagicBtn.classList.add('targeting');
                    }
                }
            });
        });
    }
});
