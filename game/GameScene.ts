// GameScene.ts - Uses fixed 720x1000 world from constants
import * as Phaser from 'phaser/dist/phaser.esm.js';
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
        this.levelLoader = new LevelLoader(this);

        // Center camera on the fixed world
        this.centerCamera();

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

            // Spawn each enemy
            for (const enemySpawn of levelData.enemy) {
                const spriteDef = await this.levelLoader.loadSprite(enemySpawn.id);
                if (spriteDef) {
                    this.spawnEnemy(enemySpawn.angle, spriteDef, enemySpawn.scale || 1);
                }
            }
        }
    }

    spawnEnemy(angleDeg: number, spriteDef: SpriteDefinition, scale: number = 1) {
        // Convert angle to radians relative to top
        const radius = 300;
        const angleRad = (angleDeg - 90) * (Math.PI / 180);

        const x = WORLD_CENTER_X + Math.cos(angleRad) * radius;
        const y = WORLD_CENTER_Y + Math.sin(angleRad) * radius;

        // Container to hold both glow and core graphics
        const container = this.add.container(x, y);
        container.setScale(scale);

        // Helper to draw points on a graphics object
        const drawOnGraphics = (gfx: Phaser.GameObjects.Graphics, points: { x: number, y: number }[], isGlow: boolean = false) => {
            if (points.length > 0) {
                gfx.beginPath();
                gfx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    gfx.lineTo(points[i].x, points[i].y);
                }
                gfx.closePath();
                gfx.strokePath();
            }
        };

        // 1. Draw Glow Layer (if glow is defined)
        if (spriteDef.glow) {
            const glowGfx = this.make.graphics({}, false);
            const glowColor = parseInt(spriteDef.glow.color, 16);

            // Draw all layers/points onto the glow graphics
            glowGfx.lineStyle(2, glowColor, 1); // Thicker line for better glow

            if (spriteDef.layers) {
                for (const layer of spriteDef.layers) {
                    drawOnGraphics(glowGfx, layer.points);
                }
            } else if (spriteDef.points) {
                drawOnGraphics(glowGfx, spriteDef.points);
            }

            // Apply Glow FX
            glowGfx.postFX.addGlow(
                glowColor,
                spriteDef.glow.outerStrength ?? 4,
                spriteDef.glow.strength ?? 0,
                false,
                0.1,
                24
            );

            container.add(glowGfx);
        }

        // 2. Draw Core Layer (Normal appearance)
        const coreGfx = this.make.graphics({}, false);

        if (spriteDef.layers && spriteDef.layers.length > 0) {
            for (const layer of spriteDef.layers) {
                const color = parseInt(layer.color, 16);
                coreGfx.lineStyle(layer.lineWidth ?? 2, color, layer.alpha ?? 1);
                drawOnGraphics(coreGfx, layer.points);
            }
        } else if (spriteDef.points) {
            const color = parseInt(spriteDef.color || '0xffffff', 16);
            coreGfx.lineStyle(spriteDef.lineWidth || 2, color, 1);
            drawOnGraphics(coreGfx, spriteDef.points);
        }

        container.add(coreGfx);

        // Store container instead of just graphics
        // Note: this.enemies type change might be needed or just cast as any for list
        this.enemies.push(container as any);
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

    update() {
        // Tower is static
    }
}
