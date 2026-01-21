'use client';

import { useEffect, useRef } from 'react';

export default function PhaserGame() {
    const gameRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<any>(null);

    useEffect(() => {
        const initGame = async () => {
            if (typeof window !== 'undefined' && gameRef.current && !gameInstanceRef.current) {
                const Phaser = await import('phaser/dist/phaser.esm.js');
                const { GameScene } = await import('../game/GameScene');
                const { UIScene } = await import('../game/UIScene');
                const { WORLD_WIDTH, TOTAL_HEIGHT } = await import('../game/constants');

                const config = {
                    type: Phaser.AUTO,
                    width: WORLD_WIDTH,      // 720
                    height: TOTAL_HEIGHT,    // 1280 (1000 game + 280 UI)
                    parent: gameRef.current!,
                    backgroundColor: '#000000',
                    scene: [GameScene, UIScene],
                    scale: {
                        mode: Phaser.Scale.EXPAND,
                        autoCenter: Phaser.Scale.CENTER_BOTH,
                    },
                    render: {
                        antialias: true,
                        pixelArt: false,
                    }
                };

                gameInstanceRef.current = new Phaser.Game(config);

                // Start UI scene in parallel
                gameInstanceRef.current.scene.start('UIScene');
            }
        };

        initGame();

        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy(true);
                gameInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={gameRef}
            style={{
                width: '100vw',
                height: '100vh',
                position: 'fixed',
                top: 0,
                left: 0,
                overflow: 'hidden'
            }}
        />
    );
}
