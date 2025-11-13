# Endless Tower RPG

An endless, floor-by-floor roguelite RPG with procedurally generated labyrinths. Navigate mazes, engage in tactical bump-to-attack combat, and use ranged attacks and magic to survive as long as possible.

## Features

- **Procedurally Generated Labyrinths**: Every floor is unique with rooms, corridors, and secrets
- **Tactical Combat**: Bump-to-attack melee, ranged bow shots, and magic spells
- **Progressive Difficulty**: Enemies and rewards scale with floor number
- **Cross-Platform**: Play on PC, mobile, or tablet
- **Cloud Saves**: Your progress syncs across devices using InstantDB
- **PWA Support**: Install as an app on mobile devices

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Then open your browser to the URL shown (usually `http://localhost:5173`)

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Controls

### Desktop
- **Arrow Keys / WASD**: Move
- **Space**: Wait Turn
- **R**: Ranged Attack Mode
- **M**: Magic Menu
- **ESC**: Pause Menu

### Mobile/Touch
- **Swipe**: Move in direction
- **Tap**: Wait Turn

## Game Design

See [Endless Tower RPG.md](Endless%20Tower%20RPG.md) for the complete Game Design Document.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Rendering**: HTML5 Canvas
- **Database**: InstantDB (real-time, cloud-synced)
- **Build Tool**: Vite
- **PWA**: Service Workers for offline play

## License

MIT
