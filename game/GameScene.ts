// GameScene.ts - Uses fixed 720x1000 world from constants
import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_CENTER_X, WORLD_CENTER_Y, UI_HEIGHT } from './constants';
import { LevelLoader, SpriteDefinition } from './LevelLoader';

export class GameScene extends Phaser.Scene {
    private tower: Phaser.GameObjects.Graphics | null = null;
    private levelLoader: LevelLoader | null = null;
    private enemies: (Phaser.GameObjects.Graphics | Phaser.GameObjects.Container)[] = [];

    constructor() {
        super('GameScene');
    }

    create() {
        console.log('GameScene create() called');
        this.levelLoader = new LevelLoader(this);

        // Center camera on the fixed world
        this.centerCamera();
        console.log('Camera centered');

        // Recenter camera on resize
        this.scale.on('resize', this.centerCamera, this);

        // Draw central tower
        this.createTower();

        // Load Level 1
        this.loadLevelData(1);
    }

    async loadLevelData(levelNum: number) {
        if (!this.levelLoader) return;

        const levelData = await this.levelLoader.loadLevel(levelNum);
        if (levelData && levelData.enemy) {
            console.log(`Loaded Level ${levelData.level} with ${levelData.enemy.length} enemies`);

            // 1. Preload all required sprites
            const uniqueSpriteIds = new Set(levelData.enemy.map(e => e.id));
            for (const id of uniqueSpriteIds) {
                await this.levelLoader.loadSprite(id);
            }

            console.log(`Starting Level ${levelData.level}...`);

            // 2. Schedule Spawns
            for (const enemySpawn of levelData.enemy) {
                // time is in seconds, convert to ms
                const delay = enemySpawn.time * 1000;

                this.time.delayedCall(delay, async () => {
                    const spriteDef = await this.levelLoader!.loadSprite(enemySpawn.id);
                    if (spriteDef) {
                        this.spawnEnemy(enemySpawn.angle, enemySpawn.id, spriteDef, enemySpawn.scale || 1, enemySpawn.speed || 0);
                    }
                });
            }
        }
    }

    spawnEnemy(angleDeg: number, enemyId: number, spriteDef: SpriteDefinition, scale: number = 1, speed: number = 0) {
        // Convert angle to radians (0 is top/up, -90 in math terms relative to 0 being right)
        // Adjusting for standard clock-wise usage where 0 is UP
        const angleRad = (angleDeg - 90) * (Math.PI / 180);

        // Calculate spawn position at the edge of the screen + margin
        // Screen Bounds
        const margin = 50; // Extra buffer for sprite size
        const w = WORLD_WIDTH;
        const h = WORLD_HEIGHT;

        // Center position
        const cx = WORLD_CENTER_X;
        const cy = WORLD_CENTER_Y;

        // Direction vector
        const dx = Math.cos(angleRad);
        const dy = Math.sin(angleRad);

        // Ray vs AABB Intersection (Center to Edge)
        let t = Infinity;

        // Right Wall (x = w)
        if (dx > 0) t = Math.min(t, (w + margin - cx) / dx);
        // Left Wall (x = 0)
        if (dx < 0) t = Math.min(t, (-margin - cx) / dx);
        // Bottom Wall (y = h)
        if (dy > 0) t = Math.min(t, (h + margin - cy) / dy);
        // Top Wall (y = 0)
        if (dy < 0) t = Math.min(t, (-margin - cy) / dy);

        const x = cx + dx * t;
        const y = cy + dy * t;

        // Optimized: Use Pre-rendered Texture
        // Pass scale here so line width is properly handled (constant width)
        const textureKey = this.levelLoader!.generateTexture(enemyId, spriteDef, scale);

        const enemy = this.add.image(x, y, textureKey);
        // Important: setScale must be 1 because texture is already scaled!
        enemy.setScale(1);
        enemy.setData('speed', speed);

        this.enemies.push(enemy as any);
    }

    createTower() {
        const towerSize = 25; // 50px width (radius = 25)

        this.tower = this.add.graphics();
        this.tower.lineStyle(4, 0xffffff);

        // Draw octagon (8 sides)
        const points: Phaser.Math.Vector2[] = [];
        const sides = 8;
        for (let i = 0; i < sides; i++) {
            // Rotate starting angle by 22.5 degrees (PI/8) to get flat top/bottom edges
            const angle = (Math.PI * 2 / sides) * i - Math.PI / 2 + (Math.PI / 8);
            const x = Math.cos(angle) * towerSize;
            const y = Math.sin(angle) * towerSize;
            points.push(new Phaser.Math.Vector2(x, y));
        }

        // Draw the octagon
        this.tower.beginPath();
        this.tower.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.tower.lineTo(points[i].x, points[i].y);
        }
        this.tower.closePath();
        this.tower.strokePath();

        // Position at world center
        this.tower.x = WORLD_CENTER_X;   // 360
        this.tower.y = WORLD_CENTER_Y;   // 500

        // Draw orbital circle (300px radius)
        const orbitCircle = this.add.graphics();
        orbitCircle.lineStyle(2, 0x888888, 0.2); // Gray stroke, 20% alpha
        orbitCircle.strokeCircle(WORLD_CENTER_X, WORLD_CENTER_Y, 300);

        orbitCircle.fillStyle(0x333333, 0.2); // Dark gray fill, 20% alpha
        orbitCircle.fillCircle(WORLD_CENTER_X, WORLD_CENTER_Y, 300);
    }

    centerCamera() {
        const cam = this.cameras.main;
        const screenHeight = this.scale.height;

        // Game area is screen height minus UI height
        const gameAreaHeight = screenHeight - UI_HEIGHT;

        // Set camera viewport to only show game area (above UI)
        cam.setViewport(0, 0, this.scale.width, gameAreaHeight);

        // Center on the fixed world
        cam.centerOn(WORLD_CENTER_X, WORLD_CENTER_Y);
    }

    update(time: number, delta: number) {
        // Iterate backwards to safely remove enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            // Check if enemy is active
            if (!enemy.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            const speed = enemy.getData('speed') as number;

            if (speed > 0) {
                // Calculate distance to center
                const dx = WORLD_CENTER_X - enemy.x;
                const dy = WORLD_CENTER_Y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Check if reached center (threshold)
                if (dist < 5) {
                    enemy.destroy();
                    this.enemies.splice(i, 1);
                } else {
                    // Move towards center
                    // delta is in ms, speed is px/s -> distance = speed * (delta/1000)
                    const moveDist = speed * (delta / 1000);

                    // Normalize vector and scale by move distance
                    const moveX = (dx / dist) * moveDist;
                    const moveY = (dy / dist) * moveDist;

                    enemy.x += moveX;
                    enemy.y += moveY;
                }
            }
        }
    }
}
