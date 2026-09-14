import React, { useEffect, useRef, useMemo, useState } from 'react';
import { GameState, ArcherState, Arrow, WindState, MatchStats, Difficulty, Particle, EnemyDesignId, ScreenScale } from '../types';
import { drawArcher, drawArrow, drawScenery, drawOakLeaf, GBA_PALETTE } from '../graphics/sprites';
import { getTrajectoryPreviewPoints } from '../game/physics';
import { GbaBootScreen } from './GbaBootScreen';

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
  onGestureShoot?: (angle: number, power: number) => void;
  onAimStart?: () => void;
  onAimChange?: (angle: number, power: number) => void;
  onAimCancel?: () => void;
  onBootComplete?: () => void;
  isRestartBoot?: boolean;
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
  onGestureShoot,
  onAimStart,
  onAimChange,
  onAimCancel,
  onBootComplete,
  isRestartBoot = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameTickRef = useRef<number>(0);

  const [containerSize, setContainerSize] = useState({ width: 240, height: 160 });

  // Mobile Gesture Slingshot Aiming State (Angry Birds style)
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    angle: player.angle,
    power: player.power,
    dist: 0,
  });

  const [gestureState, setGestureState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    angle: number;
    power: number;
    dist: number;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    angle: player.angle,
    power: player.power,
    dist: 0,
  });

  // Track container size dynamically for accurate SVG coordinate scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width || 240, height: rect.height || 160 });
      }
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

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
    if (gameState === 'BOOT') {
      renderBootScreen(ctx, tick);
    } else if (gameState === 'TITLE') {
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

  // Handle mobile touch / mouse gesture aiming (Angry Birds slingshot)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gameState !== 'BATTLE') {
      if (gameState === 'BOOT') {
        onBootComplete?.();
      } else if (gameState === 'TITLE' || gameState === 'INSTRUCTIONS' || gameState === 'ROUND_OVER' || gameState === 'MATCH_OVER') {
        onCanvasClick?.();
      }
      return;
    }

    if (turn !== 'PLAYER' || arrow !== null || isScouting) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}

    dragStateRef.current = {
      isDragging: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      angle: player.angle,
      power: player.power,
      dist: 0,
    };

    setGestureState({
      isDragging: true,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      angle: player.angle,
      power: player.power,
      dist: 0,
    });

    onAimStart?.();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - dragStateRef.current.startX;
    const dy = y - dragStateRef.current.startY;
    const dist = Math.hypot(dx, dy);

    // Slingshot Aim Mechanics (Angry Birds):
    // Pulling back & down (dx < 0, dy > 0) fires forward & up
    let rawAngle = dragStateRef.current.angle;
    if (dist >= 6) {
      if (dx < 0) {
        // Standard slingshot pullback: pulling left/down launches right/up
        rawAngle = Math.atan2(dy, -dx) * (180 / Math.PI);
      } else if (dx > 0) {
        // Forward aiming drag towards target: dragging right/up launches right/up
        rawAngle = Math.atan2(-dy, dx) * (180 / Math.PI);
      }
    }

    const angle = Math.max(10, Math.min(85, Math.round(rawAngle)));
    const maxPull = Math.max(70, Math.min(160, rect.height * 0.45));
    const power = Math.max(10, Math.min(100, Math.round((dist / maxPull) * 100)));

    dragStateRef.current = {
      ...dragStateRef.current,
      currentX: x,
      currentY: y,
      angle,
      power,
      dist,
    };

    setGestureState({
      isDragging: true,
      startX: dragStateRef.current.startX,
      startY: dragStateRef.current.startY,
      currentX: x,
      currentY: y,
      angle,
      power,
      dist,
    });

    onAimChange?.(angle, power);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.isDragging) return;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const { dist, angle, power } = dragStateRef.current;
    dragStateRef.current.isDragging = false;
    setGestureState((prev) => ({ ...prev, isDragging: false, dist: 0 }));

    if (dist >= 14) {
      // Slingshot release! Instant shot
      onGestureShoot?.(angle, power);
    } else {
      // Short tap or cancel
      onAimCancel?.();
      if (dist < 6 && onCanvasClick) {
        onCanvasClick();
      }
    }
  };

  // Trajectory arc preview for Angry Birds slingshot aiming
  const trajectoryPoints = useMemo(() => {
    if (!gestureState.isDragging || gestureState.dist < 8) return [];
    return getTrajectoryPreviewPoints(
      player.x + 8,
      player.y - 14,
      gestureState.angle,
      gestureState.power,
      wind,
      9,
      2
    );
  }, [gestureState.isDragging, gestureState.dist, gestureState.angle, gestureState.power, player.x, player.y, wind]);

  const bowScreenX = player.x + 8 - cameraX;
  const bowScreenY = player.y - 14 - cameraY;
  const bowPctX = Math.max(0, Math.min(100, (bowScreenX / 240) * 100));
  const bowPctY = Math.max(0, Math.min(100, (bowScreenY / 160) * 100));

  const nockPctX = containerSize.width > 0 ? Math.max(2, Math.min(98, (gestureState.currentX / containerSize.width) * 100)) : bowPctX;
  const nockPctY = containerSize.height > 0 ? Math.max(2, Math.min(98, (gestureState.currentY / containerSize.height) * 100)) : bowPctY;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
      className={`relative flex w-full select-none items-center justify-center overflow-hidden rounded-lg sm:rounded-xl border-2 sm:border-4 border-stone-800 bg-black shadow-2xl aspect-[3/2] transition-all duration-200 ${screenMaxWidthClass} ${
        turn === 'PLAYER' && gameState === 'BATTLE' && !arrow && !isScouting ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
      }`}
    >
      {/* Retro 60FPS Pixel-Art Canvas (Scenery, Archers, Bow Animation, Arrow Physics, Trails, Particles) */}
      <canvas
        ref={canvasRef}
        width={240}
        height={160}
        className="block h-full w-full object-contain [image-rendering:pixelated] pointer-events-none"
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
      {/* ANGRY BIRDS SLINGSHOT GESTURE OVERLAY (Elastic bands, nock & trajectory)  */}
      {/* ========================================================================= */}
      {gameState === 'BATTLE' && gestureState.isDragging && gestureState.dist >= 8 && (
        <>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible z-15">
            <defs>
              <filter id="glow-slingshot" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Upper & Lower Elastic Bowstring Bands stretching to drag position */}
            <line
              x1={`${bowPctX}%`}
              y1={`${bowPctY - 3.8}%`}
              x2={`${nockPctX}%`}
              y2={`${nockPctY}%`}
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />
            <line
              x1={`${bowPctX}%`}
              y1={`${bowPctY + 3.8}%`}
              x2={`${nockPctX}%`}
              y2={`${nockPctY}%`}
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.9"
            />

            {/* Arrow nocked on bowstring pointing forward along launch angle */}
            <line
              x1={`${nockPctX}%`}
              y1={`${nockPctY}%`}
              x2={`${bowPctX + (bowPctX - nockPctX) * 0.35}%`}
              y2={`${bowPctY + (bowPctY - nockPctY) * 0.35}%`}
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Slingshot Pull Notch Reticle */}
            <circle
              cx={`${nockPctX}%`}
              cy={`${nockPctY}%`}
              r={gestureState.dist >= 14 ? 7 : 5}
              fill={gestureState.dist >= 14 ? '#fbbf24' : '#38bdf8'}
              stroke="#ffffff"
              strokeWidth="2"
              filter="url(#glow-slingshot)"
            />

            {/* Angry Birds Parabolic Trajectory Guide Arc Dots */}
            {trajectoryPoints.map((pt, idx) => {
              const px = ((pt.x - cameraX) / 240) * 100;
              const py = ((pt.y - cameraY) / 160) * 100;
              if (px < 0 || px > 102 || py < 0 || py > 100) return null;
              const radius = Math.max(1.8, 4.2 - idx * 0.28);
              const alpha = Math.max(0.25, 1 - idx * 0.08);
              return (
                <g key={idx}>
                  <circle
                    cx={`${px}%`}
                    cy={`${py}%`}
                    r={radius + 1}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="1.2"
                    opacity={alpha * 0.9}
                  />
                  <circle
                    cx={`${px}%`}
                    cy={`${py}%`}
                    r={radius}
                    fill={idx % 2 === 0 ? '#fbbf24' : '#38bdf8'}
                    opacity={alpha}
                  />
                </g>
              );
            })}
          </svg>

          {/* Floating Slingshot Tactical HUD near Touch */}
          <div
            className="pointer-events-none absolute z-25 flex flex-col items-center rounded border border-amber-400 bg-slate-950/95 px-2 py-0.5 shadow-2xl backdrop-blur-sm -translate-x-1/2 -translate-y-full -mt-2"
            style={{
              left: `${Math.max(14, Math.min(86, nockPctX))}%`,
              top: `${Math.max(10, Math.min(85, nockPctY))}%`,
            }}
          >
            <div className="font-mono text-[9px] sm:text-xs md:text-sm font-black text-amber-300 whitespace-nowrap leading-tight">
              🏹 {gestureState.angle}° • {gestureState.power}%
            </div>
            <div className={`font-mono text-[7px] sm:text-[8px] font-bold uppercase tracking-wider leading-tight ${
              gestureState.dist >= 14 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
            }`}>
              {gestureState.dist >= 14 ? 'RELEASE TO SHOOT' : 'PULL TO AIM'}
            </div>
          </div>
        </>
      )}

      {/* Slingshot Gesture Guidance Prompt when Player's turn */}
      {gameState === 'BATTLE' && turn === 'PLAYER' && !gestureState.isDragging && !arrow && !isScouting && (
        <div className="pointer-events-none absolute left-[12%] sm:left-[16%] top-[34%] z-15 -translate-y-1/2 flex items-center gap-1.5 rounded-full border border-amber-400/80 bg-slate-950/85 px-2.5 py-1 text-amber-300 shadow-xl backdrop-blur-sm animate-pulse">
          <span className="text-xs">🎯</span>
          <span className="font-mono text-[8px] min-[380px]:text-[9px] sm:text-xs font-black tracking-wide whitespace-nowrap">
            화면을 당겨서 조준 & 발사!
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CRISP IN-GAME UI OVERLAY (Zero blur, high readability, inside game screen) */}
      {/* ========================================================================= */}

      {/* 0. GBA LOGO RETRO BOOT SEQUENCE */}
      {gameState === 'BOOT' && onBootComplete && (
        <GbaBootScreen onComplete={onBootComplete} isRestart={isRestartBoot} />
      )}

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
            <p><span className="text-amber-300 font-bold">• 터치 & 드래그:</span> 화면을 터치 후 뒤로 당겨 각도/파워 조준, 손을 떼면 발사!</p>
            <p><span className="text-amber-300 font-bold">• D-PAD ▲ / ▼ / ◄ / ►:</span> 미세 각도(10°-85°) & 파워(10%-100%) 조절</p>
            <p><span className="text-emerald-400 font-bold">• A 버튼 / 터치:</span> 조준 상태에서 즉시 발사</p>
            <p><span className="text-cyan-300 font-bold">• R 버튼 길게 누름:</span> 전방 적 위치 및 거리 정찰(Scout)</p>
            <p><span className="text-sky-300 font-bold">• 인게임 바람 계측기:</span> 하단 게이지에서 풍향과 풍속(KTS) 실시간 확인</p>
            <p><span className="text-rose-400 font-bold">• 헤드샷(HEADSHOT):</span> 적 투구를 정밀 타격 시 55 치명타 데미지!</p>
            <p><span className="text-yellow-400 font-bold">• 3판 2선승제:</span> 2라운드를 먼저 승리하는 궁수가 승리!</p>
          </div>

          <div className="text-center font-mono text-[9px] min-[380px]:text-[10px] sm:text-xs font-black text-amber-400 animate-pulse">
            PRESS A OR B TO RETURN
          </div>
        </div>
      )}

      {/* 3. BATTLE IN-GAME HUD & PERSISTENT VISUAL WIND METER */}
      {gameState !== 'BOOT' && gameState !== 'TITLE' && gameState !== 'INSTRUCTIONS' && (
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
              <div className="text-right min-w-[70px] min-[380px]:min-w-[90px] sm:min-w-[120px] md:min-w-[140px] font-mono leading-none">
                {turn === 'PLAYER' ? (
                  <>
                    <div className="text-[8px] min-[380px]:text-[10px] sm:text-xs md:text-sm font-black text-emerald-400 tracking-wide">
                      YOUR TURN! 🏹
                    </div>
                    <div className="text-[7px] min-[380px]:text-[8px] sm:text-[9px] text-amber-300 font-bold mt-0.5 animate-pulse">
                      PULL & RELEASE!
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
 * Render GBA Cold Boot Screen (Authentic LCD clean ivory & subpixel scanlines)
 */
function renderBootScreen(ctx: CanvasRenderingContext2D, _tick: number) {
  const W = 240;
  const H = 160;

  // Authentic retro Game Boy Advance LCD ivory background
  ctx.fillStyle = '#f7f9fd';
  ctx.fillRect(0, 0, W, H);

  // Subtle GBA LCD subpixel matrix scanlines
  ctx.fillStyle = 'rgba(203, 213, 225, 0.25)';
  for (let y = 0; y < H; y += 2) {
    ctx.fillRect(0, y, W, 1);
  }

  // Faint metallic framing rule
  ctx.strokeStyle = 'rgba(45, 56, 130, 0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(4, 4, W - 8, H - 8);
}

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


