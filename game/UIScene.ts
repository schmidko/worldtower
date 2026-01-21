// UIScene.ts - Fixed 280px UI at bottom of screen
import * as Phaser from 'phaser/dist/phaser.esm.js';
import { UI_HEIGHT } from './constants';

export class UIScene extends Phaser.Scene {
    private uiBackground: Phaser.GameObjects.Graphics | null = null;
    private testButton: Phaser.GameObjects.Container | null = null;

    constructor() {
        super('UIScene');
    }

    create() {
        this.drawUI();

        // Redraw on resize
        this.scale.on('resize', this.drawUI, this);
    }

    drawUI() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;
        const uiY = screenHeight - UI_HEIGHT; // Fixed 280px from bottom

        // Clear previous UI
        if (this.uiBackground) {
            this.uiBackground.destroy();
        }
        if (this.testButton) {
            this.testButton.destroy();
        }

        // Draw gray background for UI area (fixed 280px height)
        this.uiBackground = this.add.graphics();
        this.uiBackground.fillStyle(0x333333, 1);
        this.uiBackground.fillRect(0, uiY, screenWidth, UI_HEIGHT);

        // Create test button centered in UI area
        const buttonWidth = 200;
        const buttonHeight = 60;
        const buttonX = screenWidth / 2;
        const buttonY = uiY + UI_HEIGHT / 2;

        // Button background
        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x666666, 1);
        buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
        buttonBg.lineStyle(2, 0xffffff);
        buttonBg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);

        // Button text
        const buttonText = this.add.text(0, 0, 'Test Button', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Container for button
        this.testButton = this.add.container(buttonX, buttonY, [buttonBg, buttonText]);
        this.testButton.setSize(buttonWidth, buttonHeight);
        this.testButton.setInteractive({ useHandCursor: true });

        // Button click handler
        this.testButton.on('pointerdown', () => {
            console.log('Test Button clicked!');
            this.testButton?.setScale(0.95);
        });

        this.testButton.on('pointerup', () => {
            this.testButton?.setScale(1);
        });

        this.testButton.on('pointerout', () => {
            this.testButton?.setScale(1);
        });
    }
}
