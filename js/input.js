export class InputHandler {
    constructor(game) {
        this.game = game;
        this.setupKeyboard();
        this.setupTouch();
    }
    
    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
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
            
            // Check if in ranged targeting mode
            if (this.game.rangedCombat && this.game.rangedCombat.targetingMode) {
                // Determine swipe direction for shooting
                const threshold = 30;
                if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        // Horizontal swipe
                        this.game.rangedCombat.selectDirection(dx > 0 ? 1 : -1, 0);
                    } else {
                        // Vertical swipe
                        this.game.rangedCombat.selectDirection(0, dy > 0 ? 1 : -1);
                    }
                }
                return;
            }
            
            // Check if in magic targeting mode
            if (this.game.magic && this.game.magic.targetingMode) {
                // Determine swipe direction for casting
                const threshold = 30;
                if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        // Horizontal swipe
                        this.game.magic.selectDirection(dx > 0 ? 1 : -1, 0);
                    } else {
                        // Vertical swipe
                        this.game.magic.selectDirection(0, dy > 0 ? 1 : -1);
                    }
                }
                return;
            }
            
            // Normal movement
            // Determine swipe direction
            const threshold = 30;
            if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
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
    
    // Mobile magic button
    const mobileMagicBtn = document.getElementById('mobile-magic-btn');
    if (mobileMagicBtn) {
        mobileMagicBtn.addEventListener('click', () => {
            if (window.game && window.game.magic) {
                const success = window.game.magic.enterTargetingMode('firebolt');
                if (success) {
                    mobileMagicBtn.classList.add('targeting');
                }
            }
        });
    }
});
