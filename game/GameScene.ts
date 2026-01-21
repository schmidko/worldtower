// GameScene.ts - Uses fixed 720x1000 world from constants
import * as Phaser from 'phaser/dist/phaser.esm.js';
import { WORLD_WIDTH, WORLD_HEIGHT, WORLD_CENTER_X, WORLD_CENTER_Y, UI_HEIGHT } from './constants';

export class GameScene extends Phaser.Scene {
    private square: Phaser.GameObjects.Graphics | null = null;
    private helloText: Phaser.GameObjects.Text | null = null;

    constructor() {
        super('GameScene');
    }

    create() {
        // Center camera on the fixed world
        this.centerCamera();

        // Recenter camera on resize
        this.scale.on('resize', this.centerCamera, this);

        // Add "Hello World" text using FIXED world coordinates
        this.helloText = this.add.text(WORLD_CENTER_X, 100, 'Hello World', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Draw rotating square at CENTER of fixed game world
        const squareSize = WORLD_WIDTH * 0.10; // 72px

        this.square = this.add.graphics();
        this.square.lineStyle(4, 0xffffff);
        this.square.strokeRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);
        this.square.x = WORLD_CENTER_X;   // 360
        this.square.y = WORLD_CENTER_Y;   // 500
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
        if (this.square) {
            this.square.rotation += 0.01;
        }
    }
}
