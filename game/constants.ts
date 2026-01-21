// constants.ts - Game world and UI size definitions
// All sprites and graphics use this coordinate system

/**
 * GAME WORLD DIMENSIONS
 * The game world uses a fixed 720x1000 coordinate system.
 * All sprite positions are relative to this grid.
 * 
 * Coordinate System:
 * - Origin (0,0) is top-left
 * - X ranges from 0 to WORLD_WIDTH (720)
 * - Y ranges from 0 to WORLD_HEIGHT (1000)
 * - Center is at (360, 500)
 */
export const WORLD_WIDTH = 720;
export const WORLD_HEIGHT = 1000;

/**
 * UI LAYER HEIGHT
 * Fixed height in pixels for the UI layer at the bottom of the screen.
 * The UI layer is always visible and not part of the game world.
 */
export const UI_HEIGHT = 280;

/**
 * TOTAL DESIGN HEIGHT
 * Combined height of game world + UI layer for reference.
 */
export const TOTAL_HEIGHT = WORLD_HEIGHT + UI_HEIGHT; // 1280

/**
 * Helper: Get center of game world
 */
export const WORLD_CENTER_X = WORLD_WIDTH / 2;   // 360
export const WORLD_CENTER_Y = WORLD_HEIGHT / 2;  // 500
