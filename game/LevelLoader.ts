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
}
