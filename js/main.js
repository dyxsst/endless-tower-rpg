import { Game } from './game.js';
import { DB } from './database.js';

// Initialize database
const db = new DB();

// Game instance
let game = null;
window.game = null; // Make accessible to inventory UI

// Title screen controls
const titleScreen = document.getElementById('title-screen');
const newGameBtn = document.getElementById('new-game-btn');
const continueBtn = document.getElementById('continue-btn');

// Check for saved game
async function checkSavedGame() {
    const hasSave = await db.hasSaveData();
    continueBtn.disabled = !hasSave;
}

// Start new game
newGameBtn.addEventListener('click', async () => {
    titleScreen.classList.add('hidden');
    game = new Game(db);
    window.game = game;
    await game.start(true); // true = new game
});

// Continue game
continueBtn.addEventListener('click', async () => {
    titleScreen.classList.add('hidden');
    game = new Game(db);
    window.game = game;
    await game.start(false); // false = load game
});

// Service Worker registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered:', registration))
            .catch(error => console.log('SW registration failed:', error));
    });
}

// Initialize
checkSavedGame();
