export class Labyrinth {
    constructor(width, height, floor) {
        this.width = width;
        this.height = height;
        this.floor = floor;
        this.grid = [];
        this.startPos = { x: 0, y: 0 };
        this.exitPos = { x: 0, y: 0 };
    }
    
    generate() {
        // Initialize grid with walls
        this.grid = Array(this.height).fill(null).map(() => 
            Array(this.width).fill(1) // 1 = wall
        );
        
        // Simple maze generation (will improve with proper algorithm)
        this.simpleGeneration();
        
        // Place start and exit
        this.placeStartAndExit();
    }
    
    simpleGeneration() {
        // Create more rooms for better connectivity
        const rooms = this.generateRooms(6, 10);
        
        // Carve rooms
        rooms.forEach(room => this.carveRoom(room));
        
        // Connect all rooms first (minimum spanning tree)
        for (let i = 0; i < rooms.length - 1; i++) {
            this.connectRooms(rooms[i], rooms[i + 1]);
        }
        
        // Add loops by connecting additional room pairs (10-25% extra connections)
        const extraConnections = Math.floor(rooms.length * 0.2);
        for (let i = 0; i < extraConnections; i++) {
            const idx1 = Math.floor(Math.random() * rooms.length);
            let idx2 = Math.floor(Math.random() * rooms.length);
            
            // Ensure different rooms
            while (idx2 === idx1) {
                idx2 = Math.floor(Math.random() * rooms.length);
            }
            
            this.connectRooms(rooms[idx1], rooms[idx2]);
        }
    }
    
    generateRooms(minRooms, maxRooms) {
        const rooms = [];
        const roomCount = minRooms + Math.floor(Math.random() * (maxRooms - minRooms));
        
        for (let i = 0; i < roomCount; i++) {
            const w = 4 + Math.floor(Math.random() * 6);
            const h = 4 + Math.floor(Math.random() * 6);
            const x = 1 + Math.floor(Math.random() * (this.width - w - 2));
            const y = 1 + Math.floor(Math.random() * (this.height - h - 2));
            
            const room = { x, y, w, h };
            
            // Check if room overlaps with existing rooms
            const overlaps = rooms.some(r => this.roomsOverlap(room, r));
            if (!overlaps) {
                rooms.push(room);
            }
        }
        
        return rooms;
    }
    
    roomsOverlap(r1, r2) {
        return !(r1.x + r1.w + 1 < r2.x || 
                 r2.x + r2.w + 1 < r1.x || 
                 r1.y + r1.h + 1 < r2.y || 
                 r2.y + r2.h + 1 < r1.y);
    }
    
    carveRoom(room) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                this.grid[y][x] = 0; // 0 = floor
            }
        }
    }
    
    connectRooms(r1, r2) {
        const x1 = Math.floor(r1.x + r1.w / 2);
        const y1 = Math.floor(r1.y + r1.h / 2);
        const x2 = Math.floor(r2.x + r2.w / 2);
        const y2 = Math.floor(r2.y + r2.h / 2);
        
        // Horizontal then vertical corridor
        if (Math.random() > 0.5) {
            this.carveCorridor(x1, y1, x2, y1);
            this.carveCorridor(x2, y1, x2, y2);
        } else {
            this.carveCorridor(x1, y1, x1, y2);
            this.carveCorridor(x1, y2, x2, y2);
        }
    }
    
    carveCorridor(x1, y1, x2, y2) {
        const dx = Math.sign(x2 - x1);
        const dy = Math.sign(y2 - y1);
        
        let x = x1;
        let y = y1;
        
        while (x !== x2 || y !== y2) {
            if (this.isInBounds(x, y)) {
                this.grid[y][x] = 0;
            }
            
            if (x !== x2) x += dx;
            else if (y !== y2) y += dy;
        }
        
        if (this.isInBounds(x2, y2)) {
            this.grid[y2][x2] = 0;
        }
    }
    
    placeStartAndExit() {
        // Find all floor tiles
        const floors = [];
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.grid[y][x] === 0) {
                    floors.push({ x, y });
                }
            }
        }
        
        if (floors.length < 2) {
            console.error('Not enough floor space!');
            return;
        }
        
        // Place start at first floor tile
        this.startPos = floors[0];
        this.grid[this.startPos.y][this.startPos.x] = 2; // 2 = start
        
        // Find tiles far from start for exit placement
        const candidates = floors.filter(pos => {
            const dist = Math.abs(pos.x - this.startPos.x) + Math.abs(pos.y - this.startPos.y);
            return dist > Math.min(this.width, this.height) * 0.6;
        });
        
        if (candidates.length === 0) {
            // Fallback to furthest tile
            let maxDist = 0;
            let exitIdx = floors.length - 1;
            
            floors.forEach((pos, idx) => {
                const dist = Math.abs(pos.x - this.startPos.x) + Math.abs(pos.y - this.startPos.y);
                if (dist > maxDist) {
                    maxDist = dist;
                    exitIdx = idx;
                }
            });
            
            this.exitPos = floors[exitIdx];
        } else {
            // Random choice from candidates
            this.exitPos = candidates[Math.floor(Math.random() * candidates.length)];
        }
        
        this.grid[this.exitPos.y][this.exitPos.x] = 3; // 3 = exit
    }
    
    isInBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    isWall(x, y) {
        if (!this.isInBounds(x, y)) return true;
        return this.grid[y][x] === 1;
    }
    
    isExit(x, y) {
        return this.grid[y][x] === 3;
    }
    
    getTile(x, y) {
        if (!this.isInBounds(x, y)) return 1;
        return this.grid[y][x];
    }
}
