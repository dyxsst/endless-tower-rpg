// Test progression balance
console.log('FLOOR 1 SIMULATION (with starter gear)\n');

// Starter gear: +2 ATK, +1 DEF, +3 HP
let playerHP = 33;
let playerATK = 8;
let playerDEF = 3;

const walkerHP = 27;
const walkerATK = 6;
const walkerDEF = 1;

const playerDmg = playerATK - walkerDEF; // 7
const walkerDmg = Math.max(1, walkerATK - playerDEF); // 3
const hitsToKill = Math.ceil(walkerHP / playerDmg); // 4
const dmgPerFight = hitsToKill * walkerDmg; // 12
const healPerKill = Math.floor(playerHP * 0.3); // 9
const netDmg = dmgPerFight - healPerKill; // 3

console.log('Per fight: Take', dmgPerFight, 'dmg, heal', healPerKill, '→ net', netDmg, 'HP loss');
console.log('Can survive', Math.floor(playerHP / netDmg), 'fights before death');
console.log('Need 3 kills to level up');
console.log('');

// Current drop rate simulation
console.log('DROP RATE SIMULATION (Floor 1):');
const dropRate = 0.53; // 50% + 3%
let kills = 0;
let drops = 0;
let totalDrops = 0;

for (let i = 0; i < 100; i++) {
    kills++;
    if (Math.random() < dropRate) {
        drops++;
        totalDrops++;
    }
    
    if (kills === 3) {
        console.log('Level up after 3 kills - got', drops, 'item(s)');
        kills = 0;
        drops = 0;
    }
    
    if (i === 99) {
        console.log('Total: 100 kills =', totalDrops, 'items (', (totalDrops) + '% actual rate)');
    }
}

console.log('\nEQUIPMENT QUALITY (Floor 1 Common items):');
// Common weapon floor 1: (3 + 0.5) * 1.0 = 3 ATK
// Common armor floor 1: (2 + 0.4) * 1.0 = 2 DEF, (5 + 1) * 1.0 = 6 HP
console.log('Weapon: +3 ATK (starter is +2)');
console.log('Armor: +2 DEF, +6 HP (starter is +1 DEF, +3 HP)');
console.log('Bow: +3 ATK (none equipped)');
console.log('\nWith ONE new weapon drop:');
const newATK = 8 + 1; // +3 weapon vs +2 starter
const newDmg = newATK - walkerDEF;
const newHits = Math.ceil(walkerHP / newDmg);
const newDmgTaken = newHits * walkerDmg;
const newNet = newDmgTaken - healPerKill;
console.log('Now deal', newDmg, 'dmg → kill in', newHits, 'hits → take', newDmgTaken, 'dmg → net', newNet, 'HP loss');
console.log('Can survive', Math.floor(playerHP / newNet), 'fights');
