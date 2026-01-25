// LevelLoader.ts - Handles loading level and sprite data from JSON/SVG
import Phaser from 'phaser';

export interface EnemySpawn {
    id: string;  // Changed from number to string (e.g., "s001")
    lp: number;
    time: number;
    angle: number;
    scale?: number;
    speed?: number;
    spinper10second?: number;
}

export interface LevelData {
    level: number;
    enemy: EnemySpawn[];
}

export class LevelLoader {
    private scene: Phaser.Scene;
    private loadedTextures: Set<string> = new Set();

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
     * Load an SVG sprite and create a texture for it.
     * SVG is always loaded at base size - scaling is applied at spawn time.
     * @param id - Sprite ID (e.g., "s001")
     * @returns Texture key or null if failed
     */
    async loadSVGSprite(id: string): Promise<string | null> {
        const key = `sprite_${id}`;

        // Return cached texture key if already loaded
        if (this.loadedTextures.has(key)) {
            return key;
        }

        const path = `/gamedata/sprites/${id}.svg`;

        return new Promise((resolve) => {
            // Check if texture already exists in Phaser's texture manager
            if (this.scene.textures.exists(key)) {
                this.loadedTextures.add(key);
                resolve(key);
                return;
            }

            // Load SVG at base size (scaling applied at spawn time)
            this.scene.load.svg(key, path);

            // Handle load complete
            this.scene.load.once('complete', () => {
                if (this.scene.textures.exists(key)) {
                    this.loadedTextures.add(key);
                    console.log(`Loaded SVG sprite: ${key}`);
                    resolve(key);
                } else {
                    console.error(`Failed to create texture for ${id}`);
                    resolve(null);
                }
            });

            // Handle load error
            this.scene.load.once('loaderror', (file: Phaser.Loader.File) => {
                if (file.key === key) {
                    console.error(`Failed to load SVG: ${path}`);
                    resolve(null);
                }
            });

            // Start the loader
            this.scene.load.start();
        });
    }

    /**
     * Preload all unique sprites for a level
     * @param enemies - Array of enemy spawns from level data
     */
    async preloadSprites(enemies: EnemySpawn[]): Promise<void> {
        // Get unique sprite IDs (scale is applied at spawn time, not load time)
        const uniqueIds = new Set<string>();
        for (const enemy of enemies) {
            uniqueIds.add(enemy.id);
        }

        // Load all unique sprites
        const loadPromises: Promise<string | null>[] = [];
        for (const id of uniqueIds) {
            loadPromises.push(this.loadSVGSprite(id));
        }

        await Promise.all(loadPromises);
        console.log(`Preloaded ${loadPromises.length} unique sprite textures`);
    }

    /**
     * Get the texture key for a sprite
     */
    getTextureKey(id: string): string {
        return `sprite_${id}`;
    }
}

