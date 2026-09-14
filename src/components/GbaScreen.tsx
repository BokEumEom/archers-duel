import React, { useEffect, useRef, useMemo } from 'react';
import { GameState, ArcherState, Arrow, WindState, MatchStats, Difficulty, Particle, EnemyDesignId, ScreenScale } from '../types';
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
  screenScale?: ScreenScale;
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
  screenScale = 'AUTO',
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

  const screenMaxWidthClass = useMemo(() => {
    if (screenScale === '2X') return 'max-w-[480px]';
    if (screenScale === '3X') return 'max-w-[720px]';
    if (screenScale === '4X') return 'max-w-[960px]';
    // AUTO: Scaled gracefully from small mobile up to high-resolution PC displays
    return 'max-w-[280px] min-[360px]:max-w-[320px] min-[400px]:max-w-[360px] min-[480px]:max-w-[460px] sm:max-w-[540px] md:max-w-[680px] lg:max-w-[800px] xl:max-w-[920px] 2xl:max-w-[980px]';
  }, [screenScale]);

  const distance = Math.round(enemy.x - player.x);
  const enemyTitle = enemyDesign === 'STAG_HELM' ? 'STAG KNIGHT' :
                     enemyDesign === 'SHADOW_RANGER' ? 'SHADOW RANGER' :
                     enemyDesign === 'TEUTONIC_KNIGHT' ? 'TEUTONIC FOE' : 'CHAMPION';

  const pauseMenuItems = [
    'RESUME',
    'RESTART MATCH',
    `DIFFICULTY: ${difficulty}`,
    'TITLE SCREEN',
  ];

  return (
    <div className={`relative flex w-full select-none items-center justify-center overflow-hidden rounded-lg sm:rounded-xl border-2 sm:border-4 border-stone-800 bg-black shadow-2xl aspect-[3/2] transition-all duration-200 ${screenMaxWidthClass}`}>
      {/* Retro 60FPS Pixel-Art Canvas (Scenery, Archers, Bow Animation, Arrow Physics, Trails, Particles) */}
      <canvas
        ref={canvasRef}
        width={240}
        height={160}
        onClick={onCanvasClick}
        className="block h-full w-full cursor-pointer object-contain [image-rendering:pixelated]"
        id="gba-viewport-canvas"
      />

      {/* Optional CRT / GBA LCD scanline grid filter applied over game graphics */}
      {crtFilter && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20"
        />
      )}

      {/* ========================================================================= */}
      {/* CRISP IN-GAME UI OVERLAY (Zero blur, high readability, inside game screen) */}
      {/* ========================================================================= */}

      {/* 1. TITLE SCREEN OVERLAY */}
      {gameState === 'TITLE' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-3 sm:p-5 md:p-6 bg-slate-950/40">
          <div className="pt-2 sm:pt-4 text-center">
            <h1 className="font-mono text-base min-[380px]:text-lg sm:text-2xl md:text-3xl font-black tracking-widest text-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              ARCHER'S DUEL
            </h1>
            <p className="font-mono text-[8px] min-[380px]:text-[10px] sm:text-xs text-slate-300 font-semibold tracking-wider drop-shadow-md">
              GAME BOY ADVANCE MEDIEVAL COMBAT
            </p>
          </div>

          <div className="flex flex-col items-center gap-1.5 sm:gap-2 text-center">
            <div className="font-mono text-[10px] min-[380px]:text-xs sm:text-sm md:text-base font-black tracking-wider text-white animate-pulse drop-shadow-[0_2px_4px_rgba(0,0,0,1)] bg-slate-950/80 px-3 py-1 rounded border border-amber-400/60">
              ► PRESS A TO START ◄
            </div>
            <div className="font-mono text-[9px] min-[380px]:text-[11px] sm:text-xs font-bold text-amber-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
              DIFFICULTY: [ {difficulty} ]
            </div>
          </div>

          <div className="pb-1 text-center font-mono text-[7px] min-[380px]:text-[8px] sm:text-[10px] text-slate-400">
            <span>SELECT: INSTRUCTIONS • BEST OF THREE DUEL</span>
          </div>
        </div>
      )}

      {/* 2. INSTRUCTIONS SCREEN OVERLAY */}
      {gameState === 'INSTRUCTIONS' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 sm:p-5 md:p-6 bg-slate-950/95 border-2 border-amber-400/80">
          <div className="text-center">
            <h2 className="font-mono text-xs min-[380px]:text-sm sm:text-base md:text-lg font-black text-amber-400 tracking-wider">
              HOW TO PLAY ARCHER'S DUEL
            </h2>
          </div>

          <div className="space-y-1 sm:space-y-1.5 font-mono text-[8px] min-[380px]:text-[9px] sm:text-xs md:text-sm text-slate-200">
            <p><span className="text-amber-300 font-bold">• D-PAD ▲ / ▼:</span> Adjust Shot Angle (10° - 85°)</p>
            <p><span className="text-amber-300 font-bold">• D-PAD ◄ / ►:</span> Adjust Shot Power (10% - 100%)</p>
            <p><span className="text-emerald-400 font-bold">• A BUTTON:</span> Shoot Arrow</p>
            <p><span className="text-cyan-300 font-bold">• HOLD R BUTTON:</span> Scout foe position & range ahead</p>
            <p><span className="text-sky-300 font-bold">• IN-GAME WIND METER:</span> Watch wind drift at bottom of screen!</p>
            <p><span className="text-rose-400 font-bold">• HEADSHOTS:</span> Strike the enemy helm for 55 Critical DMG</p>
            <p><span className="text-yellow-400 font-bold">• BEST OF THREE:</span> First archer to win 2 rounds triumphs!</p>
          </div>

          <div className="text-center font-mono text-[9px] min-[380px]:text-[10px] sm:text-xs font-black text-amber-400 animate-pulse">
            PRESS A OR B TO RETURN
          </div>
        </div>
      )}

      {/* 3. BATTLE IN-GAME HUD & PERSISTENT VISUAL WIND METER */}
      {gameState !== 'TITLE' && gameState !== 'INSTRUCTIONS' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-1 sm:p-1.5 md:p-2 z-20">
          {/* Top In-Game Bar (HP, Score, Range) */}
          <div className="w-full rounded border border-slate-700/80 bg-slate-950/90 px-1.5 py-0.5 sm:px-2.5 sm:py-1 backdrop-blur-sm shadow-md flex items-center justify-between">
            {/* Player HP */}
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex flex-col">
                <span className="font-mono text-[8px] min-[380px]:text-[10px] sm:text-xs md:text-sm font-black text-emerald-400 leading-none">
                  YOU: {player.health} HP
                </span>
                <div className="mt-0.5 h-1.5 sm:h-2 md:h-2.5 w-14 min-[380px]:w-18 sm:w-24 md:w-32 rounded bg-slate-800 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-150 ${player.health > 30 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${Math.max(0, (player.health / player.maxHealth) * 100)}%` }}
                  />
                </div>
              </div>
              {/* Player Win Pips */}
              <div className="flex gap-0.5 sm:gap-1">
                {[0, 1].map((pipIdx) => (
                  <div
                    key={pipIdx}
                    className={`h-2 w-2 sm:h-2.5 sm:w-2.5 border border-amber-400/80 rounded-sm ${
                      pipIdx < stats.playerScore ? 'bg-amber-400 shadow-[0_0_4px_#f59e0b]' : 'bg-slate-900'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Center: Round & Distance */}
            <div className="flex flex-col items-center font-mono leading-none">
              <span className="text-[8px] min-[380px]:text-[10px] sm:text-xs md:text-sm font-black text-amber-400 tracking-wider">
                ROUND {stats.currentRound} • {distance} PACES
              </span>
              <span className="hidden min-[420px]:inline text-[7px] sm:text-[8px] md:text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">
                BEST OF THREE
              </span>
            </div>

            {/* Enemy HP */}
            <div className="flex items-center gap-1 sm:gap-2 justify-end">
              {/* Enemy Win Pips */}
              <div className="flex gap-0.5 sm:gap-1">
                {[0, 1].map((pipIdx) => (
                  <div
                    key={pipIdx}
                    className={`h-2 w-2 sm:h-2.5 sm:w-2.5 border border-amber-400/80 rounded-sm ${
                      pipIdx < stats.enemyScore ? 'bg-amber-400 shadow-[0_0_4px_#f59e0b]' : 'bg-slate-900'
                    }`}
                  />
                ))}
              </div>
              <div className="flex flex-col items-end">
                <span className="font-mono text-[8px] min-[380px]:text-[10px] sm:text-xs md:text-sm font-black text-rose-400 leading-none">
                  {enemyTitle}: {enemy.health} HP
                </span>
                <div className="mt-0.5 h-1.5 sm:h-2 md:h-2.5 w-14 min-[380px]:w-18 sm:w-24 md:w-32 rounded bg-slate-800 overflow-hidden border border-slate-700">
                  <div
                    className={`h-full transition-all duration-150 ${enemy.health > 30 ? 'bg-rose-500' : 'bg-red-600'}`}
                    style={{ width: `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center Floating Alerts (Scouting / Round Intro / Combat Banners) */}
          <div className="flex flex-col items-center justify-center gap-1 my-auto">
            {isScouting && (
              <div className="rounded bg-slate-950/90 px-3 py-1 border border-amber-400 shadow-lg font-mono text-[9px] min-[380px]:text-[11px] sm:text-xs font-bold text-amber-300">
                ◄ SCOUTING FOE • RELEASE [R] TO RETURN ►
              </div>
            )}

            {roundIntroNotice && !bannerText && !isScouting && (
              <div className="rounded bg-slate-950/90 px-3 py-1.5 border border-amber-400 shadow-xl flex flex-col items-center text-center font-mono">
                <span className="text-[9px] min-[380px]:text-[11px] sm:text-xs font-black text-amber-400">{roundIntroNotice}</span>
                <span className="text-[7px] min-[380px]:text-[8px] sm:text-[9px] text-slate-300 mt-0.5">HOLD [R] TO SCOUT ENEMY DISTANCE</span>
              </div>
            )}

            {bannerText && (
              <div
                className="rounded px-3 py-1.5 font-mono text-[10px] min-[380px]:text-xs sm:text-sm md:text-base font-black tracking-wider shadow-2xl border-2"
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderColor: bannerColor,
                  color: bannerColor,
                  textShadow: '0 0 8px rgba(0,0,0,0.9)',
                }}
              >
                {bannerText}
              </div>
            )}
          </div>

          {/* ===================================================================== */}
          {/* BOTTOM IN-GAME CONTROL DECK: AIM, POWER & PERSISTENT VISUAL WIND METER */}
          {/* ===================================================================== */}
          <div className="w-full rounded border border-slate-700/80 bg-slate-950/95 px-1.5 py-1 sm:px-2.5 sm:py-1.5 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {/* Left: Player Angle & Power */}
              <div className="flex flex-col gap-0.5 min-w-[65px] min-[380px]:min-w-[80px] sm:min-w-[110px] md:min-w-[130px]">
                <div className="flex items-center justify-between font-mono text-[8px] min-[380px]:text-[10px] sm:text-xs md:text-sm font-bold text-slate-200 leading-none">
                  <span>ANG: <span className="text-amber-300">{player.angle}°</span></span>
                  <span className="text-[7px] min-[380px]:text-[8px] sm:text-[10px] text-slate-400">▲▼</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[8px] min-[380px]:text-[10px] sm:text-xs md:text-sm font-bold text-slate-200 leading-none mt-0.5">
                  <span>PWR: <span className="text-amber-400">{player.power}%</span></span>
                  <div className="h-1.5 sm:h-2 flex-1 rounded bg-slate-800 overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-75"
                      style={{ width: `${player.power}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Center: PERSISTENT IN-GAME VISUAL WIND METER */}
              <div className="flex-1 flex flex-col items-center px-1 sm:px-2">
                {/* Numerical & Directional Readout */}
                <div className="flex items-center gap-1 font-mono text-[8px] min-[380px]:text-[10px] sm:text-xs md:text-sm font-extrabold leading-none">
                  <span className="text-cyan-400 flex items-center gap-0.5">
                    {wind.speed < 0 ? '◄' : wind.speed > 0 ? '►' : '•'}
                    <span>WIND: {wind.displaySpeed} KTS</span>
                  </span>
                  <span className={`text-[7px] min-[380px]:text-[8px] sm:text-[9px] md:text-[10px] font-bold ${
                    wind.speed > 0 ? 'text-teal-300' : wind.speed < 0 ? 'text-amber-300' : 'text-emerald-300'
                  }`}>
                    {wind.speed > 0 ? 'EAST (TAILWIND)' : wind.speed < 0 ? 'WEST (HEADWIND)' : 'CALM'}
                  </span>
                </div>

                {/* Graphical Bi-Directional Graduated Gauge Bar */}
                <div className="relative w-full max-w-[130px] min-[380px]:max-w-[170px] sm:max-w-[240px] md:max-w-[300px] h-1.5 min-[380px]:h-2 sm:h-2.5 rounded bg-slate-900 border border-slate-700 overflow-hidden my-0.5">
                  {/* Center Zero Line */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-amber-400 z-10 -translate-x-1/2" />
                  {/* Left / Right Tick Divisions */}
                  <div className="absolute top-0 bottom-0 left-1/4 w-px bg-slate-700 pointer-events-none" />
                  <div className="absolute top-0 bottom-0 right-1/4 w-px bg-slate-700 pointer-events-none" />

                  {/* Active Fill: Headwind (Left) */}
                  {wind.speed < 0 && (
                    <div
                      className="absolute top-0 bottom-0 right-1/2 bg-gradient-to-l from-cyan-400 to-amber-400 transition-all duration-300 flex items-center justify-start pl-0.5"
                      style={{ width: `${Math.min(50, (Math.abs(wind.speed) / 12) * 50)}%` }}
                    >
                      <span className="text-[6px] text-black font-black leading-none">◄</span>
                    </div>
                  )}

                  {/* Active Fill: Tailwind (Right) */}
                  {wind.speed > 0 && (
                    <div
                      className="absolute top-0 bottom-0 left-1/2 bg-gradient-to-r from-cyan-400 to-teal-300 transition-all duration-300 flex items-center justify-end pr-0.5"
                      style={{ width: `${Math.min(50, (wind.speed / 12) * 50)}%` }}
                    >
                      <span className="text-[6px] text-black font-black leading-none">►</span>
                    </div>
                  )}

                  {/* Calm Indicator */}
                  {wind.speed === 0 && (
                    <div className="absolute top-0.5 bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                  )}
                </div>

                {/* Tactical Trajectory Advice */}
                <div className="font-mono text-[7px] min-[380px]:text-[8px] sm:text-[9px] md:text-[10px] text-slate-400 leading-none">
                  {isScouting ? (
                    <span className="text-amber-400 font-bold animate-pulse">SCOUTING ENEMY POSITION</span>
                  ) : (
                    <span>{wind.speed > 0 ? 'Assists Arrow • [R] Hold Scout' : wind.speed < 0 ? 'Drags Arrow • [R] Hold Scout' : 'Zero Drift • [R] Hold Scout'}</span>
                  )}
                </div>
              </div>

              {/* Right: Turn Status & Prompts */}
              <div className="text-right min-w-[65px] min-[380px]:min-w-[80px] sm:min-w-[110px] md:min-w-[130px] font-mono leading-none">
                {turn === 'PLAYER' ? (
                  <>
                    <div className="text-[8px] min-[380px]:text-[10px] sm:text-xs md:text-sm font-black text-emerald-400 tracking-wide">
                      YOUR TURN! [A]
                    </div>
                    <div className="text-[7px] min-[380px]:text-[8px] sm:text-[9px] text-slate-300 mt-0.5">
                      [▲▼]ANG [◄►]PWR
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[8px] min-[380px]:text-[10px] sm:text-xs md:text-sm font-black text-rose-400 animate-pulse tracking-wide">
                      ENEMY AIMING...
                    </div>
                    <div className="text-[7px] min-[380px]:text-[8px] sm:text-[9px] text-slate-400 mt-0.5">
                      RANGE: {distance}p
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ROUND OVER MODAL OVERLAY */}
      {gameState === 'ROUND_OVER' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 bg-black/75 z-30">
          <div className="w-full max-w-[220px] sm:max-w-[280px] rounded-lg border-2 border-amber-400 bg-slate-950/95 p-3 sm:p-4 text-center font-mono shadow-2xl">
            <h3 className="text-xs sm:text-sm md:text-base font-black text-amber-400">
              ROUND {stats.currentRound} CONCLUDED
            </h3>
            <p className="my-1.5 sm:my-2 text-[10px] sm:text-xs font-bold text-white">
              MATCH SCORE: YOU {stats.playerScore} - {stats.enemyScore} CPU
            </p>
            <div className="mt-2 text-[9px] sm:text-xs font-black text-amber-300 animate-pulse">
              ► PRESS A FOR NEXT ROUND ◄
            </div>
          </div>
        </div>
      )}

      {/* 5. MATCH OVER MODAL OVERLAY */}
      {gameState === 'MATCH_OVER' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-3 sm:p-4 bg-black/85 z-30">
          <div className="w-full max-w-[240px] sm:max-w-[320px] rounded-lg border-2 border-amber-400 bg-slate-950/95 p-3 sm:p-4 text-center font-mono shadow-2xl">
            <h3 className={`text-sm sm:text-base md:text-lg font-black ${stats.playerScore >= 2 ? 'text-amber-400' : 'text-rose-400'}`}>
              {stats.playerScore >= 2 ? '★ VICTORY! ★' : '☠ DEFEAT ☠'}
            </h3>
            <p className="text-[9px] sm:text-xs text-slate-300 mt-0.5">
              {stats.playerScore >= 2 ? 'YOU ARE THE ROYAL ARCHER CHAMPION!' : 'THE ENEMY KNIGHT PREVAILED IN THE DUEL'}
            </p>

            <div className="my-2 py-1.5 border-y border-slate-800 text-[8px] sm:text-[10px] text-slate-300 space-y-0.5">
              <p>FINAL SCORE: {stats.playerScore} - {stats.enemyScore}</p>
              <p>HEADSHOTS: {stats.playerHeadshots} | ACCURACY: {stats.playerShots > 0 ? Math.round((stats.playerHits / stats.playerShots) * 100) : 0}%</p>
            </div>

            <div className="mt-2 text-[9px] sm:text-xs font-black text-amber-400 animate-pulse">
              ► PRESS A TO PLAY AGAIN ◄
            </div>
          </div>
        </div>
      )}

      {/* 6. PAUSE MENU MODAL OVERLAY */}
      {gameState === 'PAUSED' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 bg-black/80 z-30">
          <div className="w-full max-w-[200px] sm:max-w-[250px] rounded-lg border-2 border-amber-400 bg-slate-950/95 p-3 sm:p-4 text-center font-mono shadow-2xl">
            <h3 className="text-xs sm:text-sm md:text-base font-black text-amber-400 mb-2">
              PAUSED
            </h3>
            <div className="space-y-1 sm:space-y-1.5 text-left text-[9px] sm:text-xs font-bold">
              {pauseMenuItems.map((item, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-0.5 rounded ${
                    idx === pauseMenuIndex
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60'
                      : 'text-slate-400'
                  }`}
                >
                  {idx === pauseMenuIndex ? `► ${item} ◄` : item}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Render GBA Title Screen (Pixel art castle & crossed bows background)
 */
function renderTitleScreen(ctx: CanvasRenderingContext2D, tick: number, _difficulty: Difficulty) {
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

  // Crossed longbows graphic
  const bounce = Math.sin(tick * 0.08) * 2;
  ctx.save();
  ctx.translate(W / 2, 48 + bounce);

  ctx.strokeStyle = GBA_PALETTE.playerBow;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-8, 0, 16, -Math.PI / 3, Math.PI / 3);
  ctx.arc(8, 0, 16, (2 * Math.PI) / 3, (4 * Math.PI) / 3);
  ctx.stroke();
  ctx.restore();
}

/**
 * Render Instructions Screen (Pixel art backdrop & gold frame)
 */
function renderInstructionsScreen(ctx: CanvasRenderingContext2D, _tick: number) {
  const W = 240;
  const H = 160;

  ctx.fillStyle = '#0d1b2a';
  ctx.fillRect(0, 0, W, H);

  // Border
  ctx.strokeStyle = GBA_PALETTE.uiGold;
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, W - 12, H - 12);
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


