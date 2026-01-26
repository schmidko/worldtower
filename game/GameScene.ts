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
    private levelText: Phaser.GameObjects.Text | null = null;

    // Level Progression State
    private currentLevel: number = 1;
    private totalEnemiesInLevel: number = 0;
    private spawnedEnemiesCount: number = 0;
    private levelInProgress: boolean = false;

    constructor() {
        super('GameScene');
        this.levelLoader = new LevelLoader(this);
    }

    preload() {
        // Load tower asset
        this.load.image('tower', 'assets/tower.png');
    }

    create() {
        // Setup camera
        this.centerCamera();

        // Recenter camera on resize
        this.scale.on('resize', this.centerCamera, this);

        // Draw central tower
        this.createTower();

        // Create UI
        this.createUI();

        // Start Game
        this.startLevel(1);
    }

    async startLevel(levelNum: number) {
        // Stop level progress check during loading
        this.levelInProgress = false;

        // Reset state immediately to prevent stale triggers
        this.spawnedEnemiesCount = 0;
        this.totalEnemiesInLevel = 0; // Prevent completion check

        const success = await this.loadLevelData(levelNum);

        if (success) {
            this.currentLevel = levelNum;
            this.levelInProgress = true;
        } else {
            console.log(`Level ${levelNum} not found. Looping back to Level 1.`);
            if (levelNum !== 1) {
                // Wait a bit before looping to avoid tight loop in case of error
                this.time.delayedCall(1000, () => {
                    this.startLevel(1);
                });
            }
        }
    }

    async loadLevelData(levelNum: number): Promise<boolean> {
        // 1. Load Level JSON
        try {
            const levelData = await this.levelLoader!.loadLevel(levelNum);

            if (!levelData || !levelData.enemy) {
                return false;
            }

            console.log(`Loaded Level ${levelData.level} with ${levelData.enemy.length} enemies`);

            // Reset Counters
            this.totalEnemiesInLevel = levelData.enemy.length;
            this.spawnedEnemiesCount = 0;

            // Update UI
            if (this.levelText) {
                this.levelText.setText(`Level: ${levelData.level}`);
            }

            // 2. Preload all required SVG sprites
            await this.levelLoader!.preloadSprites(levelData.enemy);

            // 3. Schedule Enemy Spawns
            levelData.enemy.forEach(enemySpawn => {
                const spawnDelay = enemySpawn.time * 1000; // Convert seconds to ms

                this.time.delayedCall(spawnDelay, () => {
                    const textureKey = this.levelLoader!.getTextureKey(enemySpawn.id);
                    const scale = enemySpawn.scale || 1;
                    const lp = enemySpawn.lp || DefaultPlayerStats.lp;
                    const spinSpeed = (enemySpawn.spinper10second || 0) / 10;

                    this.spawnEnemy(enemySpawn.angle, textureKey, scale, enemySpawn.speed || 0, lp, spinSpeed);

                    // Increment spawned count
                    this.spawnedEnemiesCount++;
                });
            });

            return true;

        } catch (error) {
            console.warn(`Failed to load level ${levelNum}:`, error);
            return false;
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

            // Move bullet
            bullet.graphic.x += bullet.vx * bulletSpeed * (delta / 1000);
            bullet.graphic.y += bullet.vy * bulletSpeed * (delta / 1000);

            // Check collision with enemies
            if (bullet.active) {
                let hit = false;
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (!enemy.active) continue;

                    // Simple circular collision
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
                            console.log('Enemy destroyed!');
                            this.createExplosion(enemy.x, enemy.y);
                            enemy.destroy();
                            this.enemies.splice(j, 1);
                        }
                        break; // Bullet hits one enemy
                    }
                }

                if (hit) {
                    bullet.graphic.destroy();
                    bullet.active = false;
                    this.bullets.splice(i, 1);
                    continue; // Next bullet
                }
            }

            // Cleanup if out of bounds (simple range check)
            if (bullet.active) {
                const dx = bullet.graphic.x - WORLD_CENTER_X;
                const dy = bullet.graphic.y - WORLD_CENTER_Y;
                if (Math.sqrt(dx * dx + dy * dy) > WORLD_WIDTH) { // Safe cleanup distance
                    bullet.graphic.destroy();
                    bullet.active = false;
                    this.bullets.splice(i, 1);
                }
            }
        }

        // --- Level Progression Check ---
        if (this.levelInProgress &&
            this.spawnedEnemiesCount > 0 &&
            this.spawnedEnemiesCount === this.totalEnemiesInLevel &&
            this.enemies.length === 0) {

            console.log("Level Complete! Starting next level...");
            this.levelInProgress = false; // Prevent multiple triggers

            // Wait 2 seconds before starting next level
            this.time.delayedCall(2000, () => {
                this.startLevel(this.currentLevel + 1);
            });
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

    createUI() {
        // Level Indicator (Bottom Left)
        // Using 'Press Start 2P' font for retro look
        const yPos = this.cameras.main.height - 40;
        this.levelText = this.add.text(20, yPos, 'Level: 0', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: '"Press Start 2P", Arial, sans-serif'
        });
        this.levelText.setScrollFactor(0); // Fix to camera
        this.levelText.setDepth(9999); // Ensure on top
    }

    createExplosion(x: number, y: number) {
        const particleCount = 10;
        for (let i = 0; i < particleCount; i++) {
            // Create white circle (radius 2.5 = diameter 5)
            const particle = this.add.circle(x, y, 2.5, 0xffffff);
            particle.setDepth(200); // Above bullets/enemies

            // Random angle and speed
            const angle = Math.random() * Math.PI * 2;
            const speed = 25; // Reduced from 50 (slower expansion)

            const targetX = x + Math.cos(angle) * speed;
            const targetY = y + Math.sin(angle) * speed;

            this.tweens.add({
                targets: particle,
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: 1000, // Increased from 500ms to 1000ms (longer fade)
                ease: 'Power2',
                onComplete: () => {
                    particle.destroy();
                }
            });
        }
    }
}
