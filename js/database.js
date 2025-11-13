import { init, tx, id } from '@instantdb/core';

const APP_ID = '5fdaa269-3039-4888-94dc-b1a759d96541';

export class DB {
    constructor() {
        this.db = init({ appId: APP_ID });
        this.userId = this.getOrCreateUserId();
    }
    
    getOrCreateUserId() {
        // Get or create a unique user ID for this device
        let userId = localStorage.getItem('tower_rpg_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            localStorage.setItem('tower_rpg_user_id', userId);
        }
        return userId;
    }
    
    async saveGame(saveData) {
        try {
            // Query for existing save
            const { data } = await this.db.query({ saves: { $: { where: { userId: this.userId } } } });
            
            if (data.saves && data.saves.length > 0) {
                // Update existing save
                const saveId = data.saves[0].id;
                await this.db.transact([
                    tx.saves[saveId].update({
                        gameData: JSON.stringify(saveData),
                        floor: saveData.floor,
                        timestamp: saveData.timestamp
                    })
                ]);
            } else {
                // Create new save
                await this.db.transact([
                    tx.saves[id()].update({
                        userId: this.userId,
                        gameData: JSON.stringify(saveData),
                        floor: saveData.floor,
                        timestamp: saveData.timestamp
                    })
                ]);
            }
            
            return true;
        } catch (error) {
            console.error('Save failed:', error);
            // Fallback to localStorage
            localStorage.setItem('tower_rpg_save', JSON.stringify(saveData));
            return false;
        }
    }
    
    async loadGame() {
        try {
            // Query for save data
            const { data } = await this.db.query({ saves: { $: { where: { userId: this.userId } } } });
            
            if (data.saves && data.saves.length > 0) {
                const saveData = JSON.parse(data.saves[0].gameData);
                return saveData;
            }
        } catch (error) {
            console.error('Load failed:', error);
        }
        
        // Fallback to localStorage
        const localSave = localStorage.getItem('tower_rpg_save');
        return localSave ? JSON.parse(localSave) : null;
    }
    
    async hasSaveData() {
        try {
            const { data } = await this.db.query({ saves: { $: { where: { userId: this.userId } } } });
            return data.saves && data.saves.length > 0;
        } catch (error) {
            // Fallback to localStorage
            return localStorage.getItem('tower_rpg_save') !== null;
        }
    }
    
    async submitScore(floor, stats) {
        try {
            await this.db.transact([
                tx.leaderboard[id()].update({
                    userId: this.userId,
                    floor: floor,
                    stats: JSON.stringify(stats),
                    timestamp: Date.now()
                })
            ]);
            return true;
        } catch (error) {
            console.error('Score submission failed:', error);
            return false;
        }
    }
    
    async getLeaderboard(limit = 10) {
        try {
            const { data } = await this.db.query({
                leaderboard: {
                    $: {
                        order: { serverCreatedAt: 'desc' },
                        limit: limit
                    }
                }
            });
            return data.leaderboard || [];
        } catch (error) {
            console.error('Leaderboard fetch failed:', error);
            return [];
        }
    }
}
