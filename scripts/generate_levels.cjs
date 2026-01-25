const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../public/gamedata/level');

// Enemy Types Configuration
const ENEMY_TYPES = [
    { id: 's001', lpMod: 1.0, speedMod: 1.0, scale: 1.0, spin: 2 },  // Standard
    { id: 's002', lpMod: 1.5, speedMod: 0.8, scale: 1.5, spin: 1 },  // Triangle (Stronger)
    { id: 's003', lpMod: 0.6, speedMod: 1.5, scale: 0.8, spin: 5 },  // Diamond (Fast, Weak)
    { id: 's004', lpMod: 2.5, speedMod: 0.5, scale: 2.0, spin: 0.5 } // Hexagon (Tank)
];

function generateLevel(levelNum) {
    const prevLevelDifficulty = Math.pow(1.1, levelNum - 1);
    const enemyCount = 6 + (levelNum - 2); // Increase count by 1 each level

    // Determine available enemy types based on level
    // Level 1-2: s001, s002
    // Level 3: +s003
    // Level 4+: +s004
    let availableTypes = [ENEMY_TYPES[0], ENEMY_TYPES[1]];
    if (levelNum >= 3) availableTypes.push(ENEMY_TYPES[2]);
    if (levelNum >= 4) availableTypes.push(ENEMY_TYPES[3]);

    const enemies = [];
    let currentTime = 1;

    for (let i = 0; i < enemyCount; i++) {
        // Pick random type
        const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];

        // Base stats adjusted by level difficulty
        const baseLp = 50 * prevLevelDifficulty;
        const baseSpeed = 30; // Speed doesn't scale as much as LP usually

        const lp = Math.round(baseLp * type.lpMod);
        const speed = Math.round(baseSpeed * type.speedMod);

        // Randomize spawn time gap (0.5s to 2s)
        currentTime += 0.5 + Math.random() * 1.5;

        // Random Angle
        const angle = Math.floor(Math.random() * 360);

        enemies.push({
            id: type.id,
            lp: lp,
            time: Number(currentTime.toFixed(1)),
            angle: angle,
            scale: type.scale,
            speed: speed,
            spinper10second: type.spin
        });
    }

    return [{
        level: levelNum,
        enemy: enemies
    }];
}

// Generate Levels 3 to 10
for (let i = 3; i <= 10; i++) {
    const levelData = generateLevel(i);
    const fileName = `level${i.toString().padStart(4, '0')}.json`;
    const filePath = path.join(OUTPUT_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(levelData, null, 4));
    console.log(`Generated ${fileName}`);
}
