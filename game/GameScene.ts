// GameScene.ts - Uses fixed 720x1000 world from constants
import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_CENTER_X, WORLD_CENTER_Y, UI_HEIGHT } from './constants';
import { LevelLoader } from './LevelLoader';
import { DefaultPlayerStats } from './PlayerConfig';

interface Bullet {
    graphic: Phaser.GameObjects.Rectangle;
    vx: number;
    vy: number;
    active: boolean;
}

export class GameScene extends Phaser.Scene {
    private tower: Phaser.GameObjects.Graphics | null = null;
    private levelLoader: LevelLoader | null = null;
    private enemies: Phaser.GameObjects.Image[] = [];
    private bullets: Bullet[] = [];
    private lastFired: number = 0;

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
                    const lp = enemySpawn.lp || DefaultPlayerStats.lp;
                    const spinSpeed = (enemySpawn.spinper10second || 0) / 10;
                    this.spawnEnemy(enemySpawn.angle, textureKey, scale, enemySpawn.speed || 0, lp, spinSpeed);
                });
            }
        }
    }

    spawnEnemy(angleDeg: number, textureKey: string, scale: number = 1, speed: number = 0, lp: number = 100, spinSpeed: number = 0) {
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
        enemy.setScale(scale); // Apply scale from level data
        enemy.setData('speed', speed);
        enemy.setData('lp', lp);
        enemy.setData('spinSpeed', spinSpeed);

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
        // --- Enemy Update ---
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

            const spinSpeed = enemy.getData('spinSpeed') as number;
            if (spinSpeed !== 0) {
                enemy.angle += spinSpeed * 360 * (delta / 1000);
            }
        }

        // --- Tower Shooting Logic ---
        const fireInterval = 1000 / DefaultPlayerStats.bulletpersecond;
        if (time > this.lastFired + fireInterval) {
            // Find nearest enemy within range
            let nearestEnemy: Phaser.GameObjects.Image | null = null;
            let minDist = DefaultPlayerStats.bulletdistance; // Use configured range

            for (const enemy of this.enemies) {
                const dx = enemy.x - WORLD_CENTER_X;
                const dy = enemy.y - WORLD_CENTER_Y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist <= minDist) {
                    minDist = dist;
                    nearestEnemy = enemy;
                }
            }

            if (nearestEnemy) {
                this.fireBullet(nearestEnemy);
                this.lastFired = time;
            }
        }

        // --- Bullet Update ---
        const bulletSpeed = DefaultPlayerStats.bulletspeed; // Pixels per second
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];

            if (!bullet.active) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Move bullet
            const moveDist = bulletSpeed * (delta / 1000);
            bullet.graphic.x += bullet.vx * moveDist;
            bullet.graphic.y += bullet.vy * moveDist;

            // Check collision with enemies
            let hit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = bullet.graphic.x - enemy.x;
                const dy = bullet.graphic.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Collision radius reduced to 10px (inner square radius) to match visual 'core'
                if (dist < 10 * enemy.scale) {
                    // HIT!
                    hit = true;

                    // Damage Enemy
                    const currentLp = enemy.getData('lp') as number;
                    const newLp = currentLp - DefaultPlayerStats.damage;
                    enemy.setData('lp', newLp);

                    // Visual Hit Feedback: Flash/Darken (Tint)
                    enemy.setTint(0x555555);
                    this.time.delayedCall(100, () => {
                        if (enemy && enemy.active) {
                            enemy.clearTint();
                        }
                    });

                    console.log(`Enemy hit! LP: ${newLp}`);

                    if (newLp <= 0) {
                        enemy.destroy();
                        this.enemies.splice(j, 1);
                        console.log('Enemy destroyed!');
                    }

                    // Destroy Bullet
                    bullet.graphic.destroy();
                    bullet.active = false;
                    break; // Bullet hits only one enemy
                }
            }

            // Cleanup bullets that fly too far (e.g. out of world bounds)
            if (!hit) {
                const dx = bullet.graphic.x - WORLD_CENTER_X;
                const dy = bullet.graphic.y - WORLD_CENTER_Y;
                if (Math.sqrt(dx * dx + dy * dy) > WORLD_WIDTH) { // Safe cleanup distance
                    bullet.graphic.destroy();
                    bullet.active = false;
                }
            }
        }
    }

    fireBullet(target: Phaser.GameObjects.Image) {
        // Calculate direction to target
        const dx = target.x - WORLD_CENTER_X;
        const dy = target.y - WORLD_CENTER_Y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist === 0) return; // Should not happen if outside tower

        const dirX = dx / dist;
        const dirY = dy / dist;

        // Create bullet at tower center
        const bulletGraphic = this.add.rectangle(WORLD_CENTER_X, WORLD_CENTER_Y, 4, 4, 0xffffff);
        bulletGraphic.setDepth(100);

        this.bullets.push({
            graphic: bulletGraphic,
            vx: dirX,
            vy: dirY,
            active: true
        });
    }
}
