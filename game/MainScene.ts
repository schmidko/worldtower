// MainScene.ts - Full screen, responsive
import * as Phaser from 'phaser/dist/phaser.esm.js';

export class MainScene extends Phaser.Scene {
    private square: Phaser.GameObjects.Graphics | null = null;
    private helloText: Phaser.GameObjects.Text | null = null;

    constructor() {
        super('MainScene');
    }

    create() {
        this.drawScene();

        // Redraw on resize
        this.scale.on('resize', this.drawScene, this);
    }

    drawScene() {
        const { width, height } = this.scale;
        const dpr = window.devicePixelRatio || 1;

        // Clear previous graphics
        if (this.square) {
            this.square.destroy();
        }
        if (this.helloText) {
            this.helloText.destroy();
        }

        // Add "Hello World" text
        this.helloText = this.add.text(width / 2, 50 * dpr, 'Hello World', {
            fontFamily: 'Arial',
            fontSize: `${24 * dpr}px`,
            color: '#ffffff'
        }).setOrigin(0.5);

        // Draw a square (stroke only) in the center - 10% of visual width
        const visualWidth = width / dpr;
        const squareSize = visualWidth * 0.10 * dpr;

        this.square = this.add.graphics();
        this.square.lineStyle(2 * dpr, 0xffffff);
        this.square.strokeRect(-squareSize / 2, -squareSize / 2, squareSize, squareSize);
        this.square.x = width / 2;
        this.square.y = height / 2;
    }

    update() {
        if (this.square) {
            this.square.rotation += 0.01;
        }
    }
}
