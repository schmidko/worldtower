// LevelLoader.ts - Handles loading level and sprite data from JSON
import Phaser from 'phaser';

export interface SpriteFrame {
    x: number;
    y: number;
}

export interface SpriteLayer {
    points: SpriteFrame[];
    color: string;
    alpha?: number;
    lineWidth?: number;
}

export interface SpriteDefinition {
    name: string;
    points?: SpriteFrame[]; // Legacy support
    color?: string;         // Legacy support
    lineWidth?: number;     // Legacy support
    layers?: SpriteLayer[]; // New multi-layer support
    glow?: {                // Glow effect support
        color: string;
        strength?: number;
        outerStrength?: number;
    };
}

export interface EnemySpawn {
    id: number;
    lp: number;
    time: number;
    angle: number;
    scale?: number; // Optional scaling factor
    speed?: number; // Pixels per second
}

export interface LevelData {
    level: number;
    enemy: EnemySpawn[];
}

export class LevelLoader {
    private scene: Phaser.Scene;
    private spriteCache: Map<number, SpriteDefinition> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    /**
     * Load a level by its number (e.g. 1 -> level0001.json)
     */
    async loadLevel(levelNumber: number): Promise<LevelData | null> {
        const paddedNum = levelNumber.toString().padStart(4, '0');
        const path = `/gamedata/level/level${paddedNum}.json`;

        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Failed to load level ${levelNumber}`);

            const data = await response.json();
            // JSON structure is an array with one level object
            return data[0] as LevelData;
        } catch (error) {
            console.error('Error loading level:', error);
            return null;
        }
    }

    /**
     * Load a sprite definition by ID (e.g. 1001 -> 1001.json)
     * Caches loaded sprites to avoid re-fetching
     */
    async loadSprite(id: number): Promise<SpriteDefinition | null> {
        if (this.spriteCache.has(id)) {
            return this.spriteCache.get(id)!;
        }

        const path = `/gamedata/sprites/${id}.json`;

        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`Failed to load sprite ${id}`);

            const data = await response.json();
            this.spriteCache.set(id, data);
            return data as SpriteDefinition;
        } catch (error) {
            console.error('Error loading sprite:', error);
            return null;
        }
    }

    /**
         * Helper to generate a texture from a sprite definition if it doesn't exist yet.
         * Returns the texture key.
         */
    generateTexture(id: number, spriteDef: SpriteDefinition, scale: number = 1): string {
        const key = `sprite_${id}_s${scale}`;

        if (this.scene.textures.exists(key)) {
            return key;
        }

        // Create a temporary graphics object to draw the sprite
        // We need ample space for the glow
        const size = 100 * scale + 20; // Dynamic size based on scale (No glow)
        const center = size / 2;

        const container = this.scene.make.container({ x: 0, y: 0 });

        // Helper to draw points
        const drawOnGraphics = (gfx: Phaser.GameObjects.Graphics, points: { x: number, y: number }[]) => {
            if (points.length > 0) {
                gfx.beginPath();
                gfx.moveTo(points[0].x * scale, points[0].y * scale);
                for (let i = 1; i < points.length; i++) {
                    gfx.lineTo(points[i].x * scale, points[i].y * scale);
                }
                gfx.closePath();
                gfx.strokePath();
            }
        };

        // Glow Layer removed as requested

        // 2. Core Layer
        const coreGfx = this.scene.make.graphics({}, false);
        if (spriteDef.layers) {
            for (const layer of spriteDef.layers) {
                coreGfx.lineStyle(layer.lineWidth ?? 2, parseInt(layer.color, 16), layer.alpha ?? 1);
                drawOnGraphics(coreGfx, layer.points);
            }
        } else if (spriteDef.points) {
            coreGfx.lineStyle(spriteDef.lineWidth || 2, parseInt(spriteDef.color || '0xffffff', 16), 1);
            drawOnGraphics(coreGfx, spriteDef.points);
        }
        container.add(coreGfx);

        // Snapshot the container to a texture
        // We need to ensure the container bounds cover the graphics
        // Since graphics are centered around 0,0, we render it centered in the texture
        const texture = this.scene.add.renderTexture(0, 0, size, size);

        // Center the container in the texture
        container.setPosition(center, center);

        texture.draw(container);
        texture.saveTexture(key); // Register in TextureManager

        // Cleanup
        container.destroy();
        texture.destroy(); // destroying the RenderTexture object, but the key remains in TextureManager

        return key;
    }
}
