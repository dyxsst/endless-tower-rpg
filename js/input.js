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
        const canvas = this.game.canvas;
        let touchStartX = 0;
        let touchStartY = 0;
        
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const touch = e.changedTouches[0];
            const dx = touch.clientX - touchStartX;
            const dy = touch.clientY - touchStartY;
            
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
        });
    }
    
    handleKeyPress(e) {
        // Prevent default for game keys
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
                         'w', 'a', 's', 'd', ' ', 'r', 'm'];
        if (gameKeys.includes(e.key.toLowerCase())) {
            e.preventDefault();
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
                // TODO: Enter ranged mode
                console.log('Ranged attack mode (not implemented)');
                break;
            case 'm':
                // TODO: Open magic menu
                console.log('Magic menu (not implemented)');
                break;
            case 'Escape':
                // TODO: Open pause menu
                console.log('Pause menu (not implemented)');
                break;
        }
    }
}
