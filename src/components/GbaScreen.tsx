import React, { useEffect, useRef } from 'react';
import { GameState, ArcherState, Arrow, WindState, MatchStats, Difficulty, Particle, EnemyDesignId } from '../types';
import { drawArcher, drawArrow, drawScenery, drawOakLeaf, GBA_PALETTE } from '../graphics/sprites';

interface GbaScreenProps {
  gameState: GameState;
  difficulty: Difficulty;
  player: ArcherState;
  enemy: ArcherState;
  arrow: Arrow | null;
  wind: WindState;
  stats: MatchStats;
  turn: 'PLAYER' | 'ENEMY';
  cameraX: number;
  cameraY?: number;
  bannerText: string | null;
  bannerColor: string;
  particles: Particle[];
  pauseMenuIndex: number;
  crtFilter: boolean;
  enemyDesign?: EnemyDesignId;
  arenaWidth?: number;
  isScouting?: boolean;
  roundIntroNotice?: string | null;
  playerCustomImage?: HTMLImageElement | null;
  enemyCustomImage?: HTMLImageElement | null;
  onCanvasClick?: () => void;
}

export const GbaScreen: React.FC<GbaScreenProps> = ({
  gameState,
  difficulty,
  player,
  enemy,
  arrow,
  wind,
  stats,
  turn,
  cameraX,
  cameraY = 0,
  bannerText,
  bannerColor,
  particles,
  pauseMenuIndex,
  crtFilter,
  enemyDesign = 'STAG_HELM' as EnemyDesignId,
  arenaWidth = 520,
  isScouting = false,
  roundIntroNotice = null,
  playerCustomImage,
  enemyCustomImage,
  onCanvasClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameTickRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    frameTickRef.current += 1;
    const tick = frameTickRef.current;
    const W = 240;
    const H = 160;

    // Crisp pixel rendering
    ctx.imageSmoothingEnabled = false;

    // 1. Render Background & Battlefield
    if (gameState === 'TITLE') {
      renderTitleScreen(ctx, tick, difficulty);
    } else if (gameState === 'INSTRUCTIONS') {
      renderInstructionsScreen(ctx, tick);
    } else {
      // BATTLE, ROUND_OVER, MATCH_OVER, PAUSED
      drawScenery(ctx, cameraX, cameraY, wind.speed, tick, arenaWidth, enemy.x, enemyDesign);

      // Draw floating wind leaves / dust particles
      drawWindDust(ctx, wind.speed, tick, cameraX, cameraY);

      // Draw Archers with vertical camera offset
      drawArcher(
        ctx,
        player.x - cameraX,
        player.y - cameraY,
        true,
        player.pose,
        player.angle,
        player.power,
        player.poseTimer,
        playerCustomImage
      );

      drawArcher(
        ctx,
        enemy.x - cameraX,
        enemy.y - cameraY,
        false,
        enemy.pose,
        enemy.angle,
        enemy.power,
        enemy.poseTimer,
        enemyCustomImage,
        enemyDesign
      );

      // Draw Arrow if active (with vertical tracking)
      if (arrow && arrow.active) {
        // Draw faint trail
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < arrow.trail.length; i++) {
          const pt = arrow.trail[i];
          const tx = pt.x - cameraX;
          const ty = pt.y - cameraY;
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.stroke();

        // Draw arrow sprite
        drawArrow(ctx, arrow.x - cameraX, arrow.y - cameraY, arrow.rotation);
      }

      // Draw Combat Particles
      for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - cameraX, p.y - cameraY, p.size, p.size);
      }

      // Draw HUD
      drawBattleHud(ctx, player, enemy, stats, wind, turn, difficulty, gameState, enemyDesign, isScouting);

      // Draw Scouting Mode Indicator Banner
      if (isScouting) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(30, 24, W - 60, 14);
        ctx.strokeStyle = GBA_PALETTE.uiGold;
        ctx.lineWidth = 1;
        ctx.strokeRect(30, 24, W - 60, 14);

        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = GBA_PALETTE.uiGold;
        ctx.fillText('◄ SCOUTING FOE • RELEASE [R] TO RETURN ►', W / 2, 34);
      }

      // Draw Round Intro Notice (briefly shows opponent & range at round start)
      if (roundIntroNotice && !bannerText) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(20, 50, W - 40, 26);
        ctx.strokeStyle = GBA_PALETTE.uiGold;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(20, 50, W - 40, 26);

        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = GBA_PALETTE.uiGold;
        ctx.fillText(roundIntroNotice, W / 2, 62);

        ctx.font = '6px monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText('HOLD [R] TO SCOUT ENEMY DISTANCE', W / 2, 71);
      }

      // Draw floating combat banner (HEADSHOT, BODY HIT, MISS, ROUND WON)
      if (bannerText) {
        drawBanner(ctx, bannerText, bannerColor);
      }

      // Overlay for Round Over
      if (gameState === 'ROUND_OVER') {
        renderRoundOverOverlay(ctx, stats, tick);
      }

      // Overlay for Match Over
      if (gameState === 'MATCH_OVER') {
        renderMatchOverOverlay(ctx, stats, tick);
      }

      // Overlay for Pause Menu
      if (gameState === 'PAUSED') {
        renderPauseMenu(ctx, pauseMenuIndex, difficulty);
      }
    }
  }, [
    gameState,
    difficulty,
    player,
    enemy,
    arrow,
    wind,
    stats,
    turn,
    cameraX,
    cameraY,
    bannerText,
    bannerColor,
    particles,
    pauseMenuIndex,
    enemyDesign,
    arenaWidth,
    isScouting,
    roundIntroNotice,
    playerCustomImage,
    enemyCustomImage,
  ]);

  return (
    <div className="relative inline-block select-none overflow-hidden rounded-md border-2 border-stone-800 bg-black shadow-2xl">
      <canvas
        ref={canvasRef}
        width={240}
        height={160}
        onClick={onCanvasClick}
        className="block h-[320px] w-[480px] cursor-pointer [image-rendering:pixelated] sm:h-[360px] sm:w-[540px] md:h-[400px] md:w-[600px]"
        id="gba-viewport-canvas"
      />
      {/* Optional CRT / GBA LCD scanline grid filter */}
      {crtFilter && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30 mix-blend-overlay"
        />
      )}
    </div>
  );
};

/**
 * Render GBA Title Screen
 */
function renderTitleScreen(ctx: CanvasRenderingContext2D, tick: number, difficulty: Difficulty) {
  const W = 240;
  const H = 160;

  // Rich medieval castle background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#0f172a');
  bgGrad.addColorStop(0.5, '#1e293b');
  bgGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Distant castle silhouette
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(20, 70, 35, 90);
  ctx.fillRect(185, 70, 35, 90);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(30, 60, 15, 10);
  ctx.fillRect(195, 60, 15, 10);

  // Decorative border
  ctx.strokeStyle = GBA_PALETTE.uiGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, W - 12, H - 12);
  ctx.strokeRect(9, 9, W - 18, H - 18);

  // Logo Banner / Crossed Bows
  const bounce = Math.sin(tick * 0.08) * 2;
  ctx.save();
  ctx.translate(W / 2, 42 + bounce);

  // Crossed longbows graphic
  ctx.strokeStyle = GBA_PALETTE.playerBow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-8, 0, 16, -Math.PI / 3, Math.PI / 3);
  ctx.arc(8, 0, 16, (2 * Math.PI) / 3, (4 * Math.PI) / 3);
  ctx.stroke();

  // Title: ARCHER'S DUEL
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#000000';
  ctx.fillText("ARCHER'S DUEL", 1, 1);
  ctx.fillStyle = GBA_PALETTE.uiGold;
  ctx.fillText("ARCHER'S DUEL", 0, 0);

  // Subtitle
  ctx.font = '7px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('GAME BOY ADVANCE MEDIEVAL COMBAT', 0, 12);
  ctx.restore();

  // Flashing Start Prompt
  const showPrompt = Math.floor(tick / 24) % 2 === 0;
  if (showPrompt) {
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('► PRESS A TO START ◄', W / 2, 94);
  }

  // Options & info
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`DIFFICULTY: [ ${difficulty} ]`, W / 2, 114);

  ctx.fillStyle = '#64748b';
  ctx.font = '7px monospace';
  ctx.fillText('SELECT: INSTRUCTIONS | BEST OF THREE', W / 2, 130);
  ctx.fillText('© 2026 ROYAL ARCHERY GUILD • GBA MODE 3', W / 2, 144);
}

/**
 * Render Instructions Screen
 */
function renderInstructionsScreen(ctx: CanvasRenderingContext2D, tick: number) {
  const W = 240;
  const H = 160;

  ctx.fillStyle = '#0d1b2a';
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = GBA_PALETTE.uiGold;
  ctx.lineWidth = 1;
  ctx.strokeRect(6, 6, W - 12, H - 12);

  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = GBA_PALETTE.uiGold;
  ctx.fillText('HOW TO PLAY ARCHER\'S DUEL', W / 2, 22);

  ctx.font = '7px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e2e8f0';

  const lines = [
    '• D-PAD UP / DOWN  : Adjust Angle (10° - 85°)',
    '• D-PAD LEFT / RIGHT: Adjust Shot Power (10% - 100%)',
    '• A BUTTON          : Shoot Arrow',
    '• START BUTTON      : Pause Game / Options',
    '',
    '• WIND & GRAVITY    : Watch the wind vane at the bottom!',
    '• HEADSHOTS         : Hit the enemy helmet for 55 DMG!',
    '• BODY HIT / GRAZE  : Torso 28 DMG, Legs 16 DMG.',
    '• BEST OF THREE     : First to win 2 rounds wins the duel.',
  ];

  let y = 38;
  for (const line of lines) {
    ctx.fillText(line, 14, y);
    y += 11;
  }

  // Flashing return prompt
  if (Math.floor(tick / 20) % 2 === 0) {
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = GBA_PALETTE.uiGold;
    ctx.fillText('PRESS A OR B TO RETURN', W / 2, 146);
  }
}

/**
 * Floating Wind Dust & Drifting Autumn Oak Leaves
 */
function drawWindDust(
  ctx: CanvasRenderingContext2D,
  windSpeed: number,
  tick: number,
  cameraX: number,
  cameraY: number = 0
) {
  // Drifting dry golden ochre oak leaves in autumn wind
  const dir = Math.sign(windSpeed || 1);
  const speed = Math.max(0.4, Math.abs(windSpeed) * 0.35);

  // 1. Oak leaves drifting sideways across the dusk sky
  for (let i = 0; i < 4; i++) {
    // Offset each leaf in space and time
    const baseX = (i * 75 + tick * (dir * speed) - cameraX) % 300;
    const drawX = baseX < -30 ? baseX + 300 : baseX;
    // Gentle bobbing and sinusoidal swaying
    const drawY = (22 + (i * 22 + Math.sin(tick * 0.04 + i * 2) * 8 + (tick * 0.08) % 75)) - cameraY * 0.5;
    // Tumbling rotation as the autumn leaf catches the breeze
    const rotation = Math.sin(tick * 0.06 + i) * 0.45 + (dir > 0 ? 0.2 : -0.2);

    if (drawY >= -10 && drawY <= 150) {
      drawOakLeaf(ctx, drawX, drawY, rotation, dir < 0);
    }
  }

  // 2. Faint dusk breeze specks
  ctx.fillStyle = 'rgba(255, 235, 200, 0.4)';
  for (let i = 0; i < 5; i++) {
    const px = (i * 45 + tick * (windSpeed * 0.5) - cameraX) % 270;
    const py = (35 + (i * 15 + Math.sin(tick * 0.05 + i) * 5) % 80) - cameraY * 0.4;
    const drawX = px < 0 ? px + 270 : px;
    if (py >= 0 && py <= 140) {
      ctx.fillRect(drawX, py, 2, 1);
    }
  }
}

/**
 * Top & Bottom GBA HUD
 */
function drawBattleHud(
  ctx: CanvasRenderingContext2D,
  player: ArcherState,
  enemy: ArcherState,
  stats: MatchStats,
  wind: WindState,
  turn: 'PLAYER' | 'ENEMY',
  difficulty: Difficulty,
  gameState: GameState,
  enemyDesign: EnemyDesignId = 'STAG_HELM',
  isScouting: boolean = false
) {
  const W = 240;
  const distance = Math.round(enemy.x - player.x);

  // Top Bar Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(0, 0, W, 20);

  // Player Health Bar (Left)
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = GBA_PALETTE.uiGreen;
  ctx.fillText(`YOU: ${player.health} HP`, 6, 9);

  // Health Bar Frame
  ctx.fillStyle = '#334155';
  ctx.fillRect(6, 11, 55, 5);
  ctx.fillStyle = player.health > 30 ? GBA_PALETTE.uiGreen : GBA_PALETTE.uiRed;
  ctx.fillRect(6, 11, Math.max(0, (player.health / player.maxHealth) * 55), 5);

  // Player Win Pips
  drawPips(ctx, 65, 11, stats.playerScore, GBA_PALETTE.uiGold);

  // Round & Range Indicator (Center)
  ctx.font = 'bold 7px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = GBA_PALETTE.uiGold;
  ctx.fillText(`RND ${stats.currentRound} • ${distance}p`, W / 2, 9);
  ctx.font = '6px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`BEST OF 3`, W / 2, 16);

  // Enemy Name & Health Bar (Right)
  const enemyTitle = enemyDesign === 'STAG_HELM' ? 'STAG KNIGHT' :
                     enemyDesign === 'SHADOW_RANGER' ? 'SHADOW RANGER' :
                     enemyDesign === 'TEUTONIC_KNIGHT' ? 'TEUTONIC FOE' : 'CHAMPION';
  ctx.textAlign = 'right';
  ctx.fillStyle = GBA_PALETTE.uiRed;
  ctx.fillText(`${enemyTitle}: ${enemy.health} HP`, W - 6, 9);

  ctx.fillStyle = '#334155';
  ctx.fillRect(W - 61, 11, 55, 5);
  ctx.fillStyle = enemy.health > 30 ? GBA_PALETTE.uiRed : '#ff0055';
  ctx.fillRect(W - 61, 11, Math.max(0, (enemy.health / enemy.maxHealth) * 55), 5);

  // Enemy Win Pips
  drawPips(ctx, W - 78, 11, stats.enemyScore, GBA_PALETTE.uiGold);

  // Bottom Control Panel HUD
  ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
  ctx.fillRect(0, 138, W, 22);

  // Angle Display
  ctx.textAlign = 'left';
  ctx.font = 'bold 7px monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(`ANG: ${player.angle}°`, 6, 147);

  // Power Meter
  ctx.fillText(`PWR: ${player.power}%`, 6, 156);
  ctx.fillStyle = '#334155';
  ctx.fillRect(48, 151, 35, 5);
  ctx.fillStyle = GBA_PALETTE.uiGold;
  ctx.fillRect(48, 151, (player.power / 100) * 35, 5);

  // Wind Display (Center)
  ctx.textAlign = 'center';
  ctx.fillStyle = '#38bdf8';
  let windArrow = '◄';
  if (wind.speed > 0) windArrow = '►';
  else if (wind.speed === 0) windArrow = '•';

  ctx.fillText(`WIND ${windArrow} ${wind.displaySpeed} KTS`, W / 2, 147);
  ctx.font = '6px monospace';
  ctx.fillStyle = isScouting ? GBA_PALETTE.uiGold : '#94a3b8';
  ctx.fillText(isScouting ? 'HOLD [R] SCOUTING' : '[R] HOLD TO SCOUT', W / 2, 156);

  // Turn status prompt
  ctx.textAlign = 'right';
  ctx.font = 'bold 7px monospace';
  if (gameState === 'BATTLE') {
    if (turn === 'PLAYER') {
      ctx.fillStyle = GBA_PALETTE.uiGreen;
      ctx.fillText(`YOUR TURN! [A]`, W - 6, 147);
      ctx.font = '6px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`[▲▼]ANG [◄►]PWR`, W - 6, 156);
    } else {
      ctx.fillStyle = GBA_PALETTE.uiRed;
      ctx.fillText(`ENEMY AIMING...`, W - 6, 147);
      ctx.font = '6px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`RANGE: ${distance} PACES`, W - 6, 156);
    }
  }
}

/**
 * Helper to draw win pip indicators (●○)
 */
function drawPips(ctx: CanvasRenderingContext2D, x: number, y: number, wins: number, color: string) {
  for (let i = 0; i < 2; i++) {
    const px = x + i * 6;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(px, y, 4, 4);
    if (i < wins) {
      ctx.fillStyle = color;
      ctx.fillRect(px + 1, y + 1, 2, 2);
    }
  }
}

/**
 * Draw Combat Banner (HEADSHOT, BODY HIT, MISS)
 */
function drawBanner(ctx: CanvasRenderingContext2D, text: string, color: string) {
  const W = 240;
  ctx.save();
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';

  // Backdrop box
  const tw = ctx.measureText(text).width + 16;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(W / 2 - tw / 2, 45, tw, 20);

  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(W / 2 - tw / 2, 45, tw, 20);

  // Text shadow & glow
  ctx.fillStyle = '#000';
  ctx.fillText(text, W / 2 + 1, 59);
  ctx.fillStyle = color;
  ctx.fillText(text, W / 2, 58);
  ctx.restore();
}

/**
 * Overlay for Round Over
 */
function renderRoundOverOverlay(ctx: CanvasRenderingContext2D, stats: MatchStats, tick: number) {
  const W = 240;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(30, 35, W - 60, 75);

  ctx.strokeStyle = GBA_PALETTE.uiGold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 35, W - 60, 75);

  const roundWinner = stats.playerScore > stats.enemyScore ? 'PLAYER' : 'ENEMY';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = GBA_PALETTE.uiGold;
  ctx.fillText(`ROUND ${stats.currentRound} CONCLUDED`, W / 2, 52);

  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`MATCH SCORE: YOU ${stats.playerScore} - ${stats.enemyScore} CPU`, W / 2, 70);

  if (Math.floor(tick / 20) % 2 === 0) {
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = GBA_PALETTE.uiGold;
    ctx.fillText('PRESS A FOR NEXT ROUND', W / 2, 95);
  }
}

/**
 * Overlay for Match Over
 */
function renderMatchOverOverlay(ctx: CanvasRenderingContext2D, stats: MatchStats, tick: number) {
  const W = 240;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
  ctx.fillRect(20, 25, W - 40, 105);

  ctx.strokeStyle = GBA_PALETTE.uiGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 25, W - 40, 105);

  const playerWon = stats.playerScore >= 2;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = playerWon ? GBA_PALETTE.uiGold : GBA_PALETTE.uiRed;
  ctx.fillText(playerWon ? '★ VICTORY! ★' : '☠ DEFEAT ☠', W / 2, 45);

  ctx.font = '8px monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(
    playerWon
      ? 'YOU ARE THE ROYAL ARCHER CHAMPION!'
      : 'THE ENEMY KNIGHT PREVAILED IN THE DUEL',
    W / 2,
    60
  );

  // Match stats
  ctx.font = '7px monospace';
  ctx.fillStyle = '#94a3b8';
  const playerAcc = stats.playerShots > 0 ? Math.round((stats.playerHits / stats.playerShots) * 100) : 0;
  ctx.fillText(`FINAL SCORE: ${stats.playerScore} - ${stats.enemyScore}`, W / 2, 75);
  ctx.fillText(`HEADSHOTS: ${stats.playerHeadshots} | ACCURACY: ${playerAcc}%`, W / 2, 88);

  if (Math.floor(tick / 20) % 2 === 0) {
    ctx.font = 'bold 8px monospace';
    ctx.fillStyle = GBA_PALETTE.uiGold;
    ctx.fillText('PRESS A TO PLAY AGAIN', W / 2, 114);
  }
}

/**
 * Overlay for Pause Menu
 */
function renderPauseMenu(ctx: CanvasRenderingContext2D, selectedIdx: number, difficulty: Difficulty) {
  const W = 240;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(45, 30, W - 90, 85);

  ctx.strokeStyle = GBA_PALETTE.uiGold;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(45, 30, W - 90, 85);

  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = GBA_PALETTE.uiGold;
  ctx.fillText('PAUSED', W / 2, 46);

  const items = [
    'RESUME',
    'RESTART MATCH',
    `DIFFICULTY: ${difficulty}`,
    'TITLE SCREEN',
  ];

  ctx.font = '8px monospace';
  let y = 62;
  items.forEach((item, idx) => {
    if (idx === selectedIdx) {
      ctx.fillStyle = GBA_PALETTE.uiGold;
      ctx.fillText(`► ${item} ◄`, W / 2, y);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(item, W / 2, y);
    }
    y += 12;
  });
}
