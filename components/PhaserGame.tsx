'use client';

import { useEffect, useRef } from 'react';

export default function PhaserGame() {
    const gameRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<any>(null);

    useEffect(() => {
        const initGame = async () => {
            if (typeof window !== 'undefined' && gameRef.current && !gameInstanceRef.current) {
                const Phaser = await import('phaser/dist/phaser.esm.js');
                const { MainScene } = await import('../game/MainScene');

                const dpr = window.devicePixelRatio || 1;

                // Use full viewport size
                const baseWidth = window.innerWidth;
                const baseHeight = window.innerHeight;

                const config = {
                    type: Phaser.CANVAS,
                    width: baseWidth * dpr,
                    height: baseHeight * dpr,
                    parent: gameRef.current!,
                    backgroundColor: '#000000',
                    scene: [MainScene],
                    scale: {
                        mode: Phaser.Scale.NONE,
                        autoCenter: Phaser.Scale.NO_CENTER,
                    },
                    render: {
                        antialias: true,
                        crisp: true,
                    }
                };

                gameInstanceRef.current = new Phaser.Game(config);

                // Scale canvas with CSS
                const canvas = gameRef.current.querySelector('canvas');
                if (canvas) {
                    canvas.style.width = `${baseWidth}px`;
                    canvas.style.height = `${baseHeight}px`;
                }

                // Handle window resize
                const handleResize = () => {
                    if (gameInstanceRef.current) {
                        const newWidth = window.innerWidth;
                        const newHeight = window.innerHeight;
                        gameInstanceRef.current.scale.resize(newWidth * dpr, newHeight * dpr);
                        const canvas = gameRef.current?.querySelector('canvas');
                        if (canvas) {
                            canvas.style.width = `${newWidth}px`;
                            canvas.style.height = `${newHeight}px`;
                        }
                    }
                };

                window.addEventListener('resize', handleResize);

                // Store cleanup function
                (gameInstanceRef.current as any)._resizeHandler = handleResize;
            }
        };

        initGame();

        return () => {
            if (gameInstanceRef.current) {
                const handler = (gameInstanceRef.current as any)._resizeHandler;
                if (handler) {
                    window.removeEventListener('resize', handler);
                }
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
