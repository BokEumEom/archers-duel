import { Arrow, ArcherState, WindState } from '../types';

export const GRAVITY = 0.16; // GBA physics gravity (tuned for long-distance arc)
export const WIND_FACTOR = 0.0055; // Wind push coefficient

export interface CollisionResult {
  hit: boolean;
  type: 'HEAD' | 'BODY' | 'LEG' | 'GROUND' | 'WALL' | null;
  target: 'PLAYER' | 'ENEMY' | null;
  damage: number;
}

/**
 * Initialize new arrow flight with velocity tuned for long-distance duels
 */
export function spawnArrow(
  shooter: 'PLAYER' | 'ENEMY',
  originX: number,
  originY: number,
  angleDeg: number,
  powerPercent: number
): Arrow {
  const rad = (angleDeg * Math.PI) / 180;
  // Velocity scaled for long range (200px to 650px):
  // 10% -> 3.3 px/frame, 100% -> 10.7 px/frame
  const speed = 2.5 + (powerPercent / 100) * 8.2;

  // Player shoots to the right (+vx), Enemy shoots to the left (-vx)
  const dir = shooter === 'PLAYER' ? 1 : -1;
  const vx = Math.cos(rad) * speed * dir;
  const vy = -Math.sin(rad) * speed;

  return {
    active: true,
    x: originX,
    y: originY,
    vx,
    vy,
    trail: [{ x: originX, y: originY }],
    shooter,
    rotation: Math.atan2(vy, vx),
  };
}

/**
 * Step arrow physics for 1 frame
 */
export function updateArrowPhysics(
  arrow: Arrow,
  wind: WindState
): void {
  if (!arrow.active) return;

  // Apply wind acceleration horizontally
  arrow.vx += wind.speed * WIND_FACTOR;

  // Apply gravity vertically
  arrow.vy += GRAVITY;

  // Update position
  arrow.x += arrow.vx;
  arrow.y += arrow.vy;

  // Update rotation to tangent of arc
  arrow.rotation = Math.atan2(arrow.vy, arrow.vx);

  // Store trail points (last 12 points for smoother arc visual)
  arrow.trail.push({ x: arrow.x, y: arrow.y });
  if (arrow.trail.length > 12) {
    arrow.trail.shift();
  }
}

/**
 * Check if arrow collides with archers or flat medieval ground
 */
export function checkArrowCollision(
  arrow: Arrow,
  player: ArcherState,
  enemy: ArcherState
): CollisionResult {
  const targetArcher = arrow.shooter === 'PLAYER' ? enemy : player;
  const targetLabel = arrow.shooter === 'PLAYER' ? 'ENEMY' : 'PLAYER';

  // Archer bounding box coordinates (archer origin is bottom center between boots, at y = 106)
  const ax = targetArcher.x;
  const ay = targetArcher.y;

  // 1. Head hitbox: y - 29 to y - 20 (radius approx 6px)
  const headDistX = Math.abs(arrow.x - ax);
  const headDistY = Math.abs(arrow.y - (ay - 25));
  if (headDistX <= 7 && headDistY <= 6) {
    return {
      hit: true,
      type: 'HEAD',
      target: targetLabel,
      damage: 55, // Massive Headshot damage!
    };
  }

  // 2. Body / Torso hitbox: y - 20 to y - 8
  const bodyDistX = Math.abs(arrow.x - ax);
  if (bodyDistX <= 8 && arrow.y >= ay - 20 && arrow.y <= ay - 8) {
    return {
      hit: true,
      type: 'BODY',
      target: targetLabel,
      damage: 28, // Standard Body Hit
    };
  }

  // 3. Legs / Feet hitbox: y - 7 to y + 3
  if (bodyDistX <= 7 && arrow.y >= ay - 7 && arrow.y <= ay + 3) {
    return {
      hit: true,
      type: 'LEG',
      target: targetLabel,
      damage: 16, // Leg Graze
    };
  }

  // 4. Flat firing ground & platform collision:
  // Both archers stand on flat ground/ramparts at y = 106; ground surface is at y = 108
  if (arrow.y >= 108) {
    return {
      hit: true,
      type: 'GROUND',
      target: null,
      damage: 0,
    };
  }

  // Out of bounds (below bottom or far beyond targets)
  if (arrow.y > 165 || arrow.x < -80 || arrow.x > enemy.x + 100) {
    return {
      hit: true,
      type: 'GROUND',
      target: null,
      damage: 0,
    };
  }

  return {
    hit: false,
    type: null,
    target: null,
    damage: 0,
  };
}

/**
 * Calculate preview trajectory arc points for slingshot gesture aiming (like Angry Birds)
 */
export function getTrajectoryPreviewPoints(
  originX: number,
  originY: number,
  angleDeg: number,
  powerPercent: number,
  wind: WindState,
  steps: number = 9,
  subSteps: number = 2
): { x: number; y: number }[] {
  const rad = (angleDeg * Math.PI) / 180;
  const speed = 2.5 + (powerPercent / 100) * 8.2;
  let vx = Math.cos(rad) * speed;
  let vy = -Math.sin(rad) * speed;
  let x = originX;
  let y = originY;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < steps; i++) {
    for (let s = 0; s < subSteps; s++) {
      vx += wind.speed * WIND_FACTOR;
      vy += GRAVITY;
      x += vx;
      y += vy;
    }
    if (y > 112) break; // Don't extend underground
    points.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }
  return points;
}
