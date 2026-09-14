export type GameState = 
  | 'BOOT'
  | 'TITLE'
  | 'INSTRUCTIONS'
  | 'BATTLE'
  | 'ROUND_OVER'
  | 'MATCH_OVER'
  | 'PAUSED';

export type Difficulty = 'NOVICE' | 'MARKSMAN' | 'MASTER';

export type Turn = 'PLAYER' | 'ENEMY';

export type EnemyDesignId = 
  | 'STAG_HELM'        // Armored archer with majestic stag antler crest
  | 'SHADOW_RANGER'    // Dusk hooded brigand with bone half-mask
  | 'TEUTONIC_KNIGHT'  // Iron kettle-helm heavy marksman
  | 'ROYAL_CHAMPION';  // Gilded sallet master bowman

export interface EnemyDesignOption {
  id: EnemyDesignId;
  name: string;
  title: string;
  description: string;
  equipment?: string;
  prompt?: string;
  helm?: string;
  armor?: string;
  bowType?: string;
  badgeColor?: string;
  accentColor?: string;
}

export interface ArcherState {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  angle: number; // in degrees
  power: number; // 0 to 100
  isAiming: boolean;
  isHit: boolean;
  hitType: 'HEAD' | 'BODY' | 'LEG' | null;
  pose: 'IDLE' | 'DRAW' | 'RELEASE' | 'HIT' | 'VICTORY' | 'DEFEAT';
  poseTimer: number;
}

export interface Arrow {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  shooter: 'PLAYER' | 'ENEMY';
  rotation: number;
}

export interface WindState {
  speed: number; // -15 to +15 (negative = blowing left, positive = blowing right)
  displaySpeed: number; // absolute knots
  direction: 'LEFT' | 'RIGHT' | 'CALM';
}

export interface MatchStats {
  playerScore: number;
  enemyScore: number;
  currentRound: number;
  playerShots: number;
  playerHits: number;
  playerHeadshots: number;
  enemyShots: number;
  enemyHits: number;
  enemyHeadshots: number;
}

export type ScreenScale = 'AUTO' | '2X' | '3X' | '4X';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

export interface SpriteFusionAsset {
  id: string;
  category: 'character' | 'scenery' | 'arrow' | 'logo';
  name: string;
  imageUrl: string;
  generatedAt?: string;
}
