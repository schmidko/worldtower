// GameScene.ts - Uses fixed 720x1000 world from constants
import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_CENTER_X, WORLD_CENTER_Y, UI_HEIGHT } from './constants';
import { LevelLoader } from './LevelLoader';

export class GameScene extends Phaser.Scene {
    private tower: Phaser.GameObjects.Graphics | null = null;
    private levelLoader: LevelLoader | null = null;
    private enemies: Phaser.GameObjects.Image[] = [];

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

            // 1. Preload all required SVG sprites
            await this.levelLoader.preloadSprites(levelData.enemy);

            console.log(`Starting Level ${levelData.level}...`);

            // 2. Schedule Spawns
            for (const enemySpawn of levelData.enemy) {
                // time is in seconds, convert to ms
                const delay = enemySpawn.time * 1000;

                this.time.delayedCall(delay, () => {
                    const textureKey = this.levelLoader!.getTextureKey(enemySpawn.id);
                    const scale = enemySpawn.scale || 1;
                    this.spawnEnemy(enemySpawn.angle, textureKey, scale, enemySpawn.speed || 0);
                });
            }
        }
    }

    spawnEnemy(angleDeg: number, textureKey: string, scale: number = 1, speed: number = 0) {
        // Convert angle to radians (0 is right, 90 is down, -90 is up)
        const angleRad = angleDeg * (Math.PI / 180);

        // Calculate spawn position at the edge of the screen
        const margin = 0;
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

        if (dx > 0) t = Math.min(t, (w + margin - cx) / dx);
        if (dx < 0) t = Math.min(t, (-margin - cx) / dx);
        if (dy > 0) t = Math.min(t, (h + margin - cy) / dy);
        if (dy < 0) t = Math.min(t, (-margin - cy) / dy);

        const x = cx + dx * t;
        const y = cy + dy * t;

        // Create enemy image from pre-loaded SVG texture
        const enemy = this.add.image(x, y, textureKey);
        enemy.setScale(scale); // Apply scale from level data
        enemy.setData('speed', speed);

        this.enemies.push(enemy);
    }

    createTower() {
        const towerSize = 25;

        this.tower = this.add.graphics();
        this.tower.lineStyle(4, 0xffffff);

        const points: Phaser.Math.Vector2[] = [];
        const sides = 8;
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 / sides) * i - Math.PI / 2 + (Math.PI / 8);
            const x = Math.cos(angle) * towerSize;
            const y = Math.sin(angle) * towerSize;
            points.push(new Phaser.Math.Vector2(x, y));
        }

        this.tower.beginPath();
        this.tower.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.tower.lineTo(points[i].x, points[i].y);
        }
        this.tower.closePath();
        this.tower.strokePath();

        this.tower.x = WORLD_CENTER_X;
        this.tower.y = WORLD_CENTER_Y;

        const orbitCircle = this.add.graphics();
        orbitCircle.lineStyle(2, 0x888888, 0.2);
        orbitCircle.strokeCircle(WORLD_CENTER_X, WORLD_CENTER_Y, 300);
        orbitCircle.fillStyle(0x333333, 0.2);
        orbitCircle.fillCircle(WORLD_CENTER_X, WORLD_CENTER_Y, 300);
    }

    centerCamera() {
        const cam = this.cameras.main;
        const screenHeight = this.scale.height;
        const gameAreaHeight = screenHeight - UI_HEIGHT;

        cam.setViewport(0, 0, this.scale.width, gameAreaHeight);
        cam.centerOn(WORLD_CENTER_X, WORLD_CENTER_Y);
    }

    update(time: number, delta: number) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

            if (!enemy.active) {
                this.enemies.splice(i, 1);
                continue;
            }

            const speed = enemy.getData('speed') as number;

            if (speed > 0) {
                const dx = WORLD_CENTER_X - enemy.x;
                const dy = WORLD_CENTER_Y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 5) {
                    enemy.destroy();
                    this.enemies.splice(i, 1);
                } else {
                    const moveDist = speed * (delta / 1000);
                    const moveX = (dx / dist) * moveDist;
                    const moveY = (dy / dist) * moveDist;

                    enemy.x += moveX;
                    enemy.y += moveY;
                }
            }
        }
    }
}
