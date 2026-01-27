import Phaser from 'phaser';

export class StartScene extends Phaser.Scene {
    constructor() {
        super('StartScene');
    }

    preload() {
        this.load.image('start-background', 'images/image.png');
    }

    create() {
        const width = this.scale.width;
        const height = this.scale.height;

        // Background
        const bg = this.add.image(width / 2, height / 2, 'start-background');

        // Scale background to cover screen (Aspect Fill)
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        // Input to start
        this.input.on('pointerdown', () => {
            console.log('StartScene clicked, starting GameScene with UIScene');
            this.scene.start('GameScene');
            this.scene.launch('UIScene');
        });
    }
}
