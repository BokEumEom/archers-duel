/**
 * Archer's Duel: GBA Edition
 * Single-player, turn-based medieval bow duel against the computer
 * Built for Game Boy Advance with physics, headshots, best-of-three, and Sprite Fusion API.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  Difficulty,
  ArcherState,
  Arrow,
  WindState,
  MatchStats,
  Particle,
  SpriteFusionAsset,
  EnemyDesignId,
  ScreenScale,
} from './types';
import { GbaScreen } from './components/GbaScreen';
import { GbaConsole } from './components/GbaConsole';
import { SpriteFusionPanel } from './components/SpriteFusionPanel';
import { gbaAudio } from './audio/gbaAudio';
import { spawnArrow, updateArrowPhysics, checkArrowCollision } from './game/physics';
import { enemyAi } from './game/ai';
import autumnOakLeafImg from './assets/images/autumn_oak_leaf_1788932580849.jpg';

export default function App() {
  // Game Lifecycle State
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [difficulty, setDifficulty] = useState<Difficulty>('MARKSMAN');
  const [turn, setTurn] = useState<'PLAYER' | 'ENEMY'>('PLAYER');

  // Enemy Visual Identity & Lore
  const [enemyDesign, setEnemyDesign] = useState<EnemyDesignId>('STAG_HELM');

  // Arena Dimensions: 440+ paces long duel (Enemy placed far outside starting view)
  const [arenaWidth, setArenaWidth] = useState<number>(540);

  // Archers
  const [player, setPlayer] = useState<ArcherState>({
    x: 30,
    y: 106,
    health: 100,
    maxHealth: 100,
    angle: 45,
    power: 70,
    isAiming: false,
    isHit: false,
    hitType: null,
    pose: 'IDLE',
    poseTimer: 0,
  });

  const [enemy, setEnemy] = useState<ArcherState>({
    x: 440,
    y: 106,
    health: 100,
    maxHealth: 100,
    angle: 45,
    power: 70,
    isAiming: false,
    isHit: false,
    hitType: null,
    pose: 'IDLE',
    poseTimer: 0,
  });

  // Active Arrow
  const [arrow, setArrow] = useState<Arrow | null>(null);

  // Environmental Wind (Consistent throughout each round, changes between rounds)
  const [wind, setWind] = useState<WindState>({
    speed: 5,
    displaySpeed: 5,
    direction: 'RIGHT',
  });

  // Match Statistics (Best-of-Three)
  const [stats, setStats] = useState<MatchStats>({
    playerScore: 0,
    enemyScore: 0,
    currentRound: 1,
    playerShots: 0,
    playerHits: 0,
    playerHeadshots: 0,
    enemyShots: 0,
    enemyHits: 0,
    enemyHeadshots: 0,
  });

  // Viewport Camera (Horizontal & Vertical tracking)
  const [cameraX, setCameraX] = useState<number>(0);
  const [cameraY, setCameraY] = useState<number>(0);
  const targetCameraX = useRef<number>(0);
  const targetCameraY = useRef<number>(0);

  // Hold-to-Scout State (Hold R to view opponent and judge range)
  const [isScouting, setIsScouting] = useState<boolean>(false);

  // Round Intro Notice & Opponent Showcase
  const [roundIntroNotice, setRoundIntroNotice] = useState<string | null>(null);
  const roundIntroTimerRef = useRef<number>(0);

  // Floating Combat Banner & Particles
  const [bannerText, setBannerText] = useState<string | null>(null);
  const [bannerColor, setBannerColor] = useState<string>('#fca311');
  const [particles, setParticles] = useState<Particle[]>([]);

  // Pause Menu Index
  const [pauseMenuIndex, setPauseMenuIndex] = useState<number>(0);

  // Settings & Toggles
  const [crtFilter, setCrtFilter] = useState<boolean>(true);
  const [soundMuted, setSoundMuted] = useState<boolean>(false);
  const [isSpriteFusionOpen, setIsSpriteFusionOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'CONSOLE' | 'THEATER'>('CONSOLE');
  const [screenScale, setScreenScale] = useState<ScreenScale>('AUTO');

  const handleCycleScreenScale = useCallback(() => {
    setScreenScale((curr) => {
      switch (curr) {
        case 'AUTO':
          return '2X';
        case '2X':
          return '3X';
        case '3X':
          return '4X';
        case '4X':
          return 'AUTO';
        default:
          return 'AUTO';
      }
    });
    gbaAudio.playMenuBeep();
  }, []);

  // Custom Generated Artwork from Sprite Fusion
  const [playerCustomImage, setPlayerCustomImage] = useState<HTMLImageElement | null>(null);
  const [enemyCustomImage, setEnemyCustomImage] = useState<HTMLImageElement | null>(null);
  const [savedAssets, setSavedAssets] = useState<SpriteFusionAsset[]>([
    {
      id: 'sf-autumn-oak-leaf',
      category: 'scenery',
      name: 'Drifting Golden Ochre Oak Leaf',
      imageUrl: autumnOakLeafImg,
      generatedAt: 'Asset Library',
    },
  ]);

  // Function to randomize wind (Called ONLY between rounds)
  const generateNewWind = useCallback(() => {
    // Speed range -12 to +12 knots
    const speed = Math.round((Math.random() - 0.5) * 24);
    setWind({
      speed,
      displaySpeed: Math.abs(speed),
      direction: speed > 0 ? 'RIGHT' : speed < 0 ? 'LEFT' : 'CALM',
    });
  }, []);

  // Initialize new match (Randomizes distance outside starting view & wind)
  const startNewMatch = useCallback(() => {
    const newEnemyX = Math.round(420 + Math.random() * 70); // 420 to 490 paces
    const newArenaW = Math.max(540, newEnemyX + 90);
    setArenaWidth(newArenaW);

    setStats({
      playerScore: 0,
      enemyScore: 0,
      currentRound: 1,
      playerShots: 0,
      playerHits: 0,
      playerHeadshots: 0,
      enemyShots: 0,
      enemyHits: 0,
      enemyHeadshots: 0,
    });
    setPlayer((prev) => ({
      ...prev,
      health: 100,
      angle: 45,
      power: 70,
      pose: 'IDLE',
      poseTimer: 0,
    }));
    setEnemy((prev) => ({
      ...prev,
      x: newEnemyX,
      health: 100,
      angle: 45,
      power: 70,
      pose: 'IDLE',
      poseTimer: 0,
    }));
    setArrow(null);
    setTurn('PLAYER');
    setIsScouting(false);
    setBannerText(null);
    setParticles([]);
    enemyAi.resetMemory();
    generateNewWind();

    // Showcase opponent and announce range at round start
    const range = Math.round(newEnemyX - 30);
    setRoundIntroNotice(`ROUND 1 • RANGE: ${range} PACES`);
    roundIntroTimerRef.current = 150; // ~2.5 seconds total intro
    targetCameraX.current = Math.max(0, newEnemyX - 170); // Briefly pan to opponent
    targetCameraY.current = 0;

    setGameState('BATTLE');
    gbaAudio.playMenuBeep();
  }, [generateNewWind]);

  // Start next round in best-of-three (New distance & new consistent wind)
  const startNextRound = useCallback(() => {
    const newEnemyX = Math.round(420 + Math.random() * 70);
    const newArenaW = Math.max(540, newEnemyX + 90);
    setArenaWidth(newArenaW);

    setPlayer((prev) => ({
      ...prev,
      health: 100,
      angle: 45,
      power: 70,
      pose: 'IDLE',
      poseTimer: 0,
    }));
    setEnemy((prev) => ({
      ...prev,
      x: newEnemyX,
      health: 100,
      angle: 45,
      power: 70,
      pose: 'IDLE',
      poseTimer: 0,
    }));
    setArrow(null);
    setTurn('PLAYER');
    setIsScouting(false);
    setBannerText(null);
    setParticles([]);
    generateNewWind();

    setStats((prev) => {
      const nextR = prev.currentRound + 1;
      const range = Math.round(newEnemyX - 30);
      setRoundIntroNotice(`ROUND ${nextR} • RANGE: ${range} PACES`);
      roundIntroTimerRef.current = 150;
      targetCameraX.current = Math.max(0, newEnemyX - 170); // Briefly show opponent
      targetCameraY.current = 0;
      return { ...prev, currentRound: nextR };
    });

    setGameState('BATTLE');
    gbaAudio.playMenuBeep();
  }, [generateNewWind]);

  // Spawn visual impact particles
  const spawnParticlesAt = useCallback((x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.5;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1, // Slight upward burst
        color,
        life: 0,
        maxLife: 20 + Math.random() * 15,
        size: Math.random() > 0.5 ? 2 : 1,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  // Handle Player Shot Action
  const handlePlayerShoot = useCallback(() => {
    if (gameState !== 'BATTLE' || turn !== 'PLAYER' || arrow !== null || isScouting) return;

    // 1. Draw bow
    setPlayer((prev) => ({ ...prev, pose: 'DRAW', poseTimer: 15 }));
    gbaAudio.playBowDraw();

    // 2. Release arrow after short drawing animation
    setTimeout(() => {
      setPlayer((prev) => ({ ...prev, pose: 'RELEASE', poseTimer: 20 }));
      gbaAudio.playArrowRelease();

      const newArrow = spawnArrow('PLAYER', player.x + 8, player.y - 14, player.angle, player.power);
      setArrow(newArrow);
      setStats((prev) => ({ ...prev, playerShots: prev.playerShots + 1 }));
    }, 280);
  }, [gameState, turn, arrow, isScouting, player.x, player.y, player.angle, player.power]);

  // Handle Enemy Turn automatically when it is ENEMY turn and no arrow is active
  useEffect(() => {
    if (gameState !== 'BATTLE' || turn !== 'ENEMY' || arrow !== null) return;

    // AI thinking delay (smooth pan to enemy, stance, and aiming)
    const thinkTimer = setTimeout(() => {
      // Double check game still active and enemy turn
      setTurn((currentTurn) => {
        if (currentTurn !== 'ENEMY') return currentTurn;

        const decision = enemyAi.calculateShot(
          enemy.x,
          enemy.y,
          player.x,
          player.y,
          wind,
          difficulty
        );

        setEnemy((prev) => ({
          ...prev,
          angle: decision.targetAngle,
          power: decision.targetPower,
          pose: 'DRAW',
          poseTimer: 20,
        }));
        gbaAudio.playBowDraw();

        // Release arrow after short drawing animation
        setTimeout(() => {
          setEnemy((prev) => ({ ...prev, pose: 'RELEASE', poseTimer: 20 }));
          gbaAudio.playArrowRelease();

          const enemyArrow = spawnArrow(
            'ENEMY',
            enemy.x - 8,
            enemy.y - 14,
            decision.targetAngle,
            decision.targetPower
          );
          setArrow(enemyArrow);
          setStats((prev) => ({ ...prev, enemyShots: prev.enemyShots + 1 }));
        }, 380);

        return currentTurn;
      });
    }, 700);

    return () => clearTimeout(thinkTimer);
  }, [gameState, turn, arrow, enemy.x, enemy.y, player.x, player.y, wind, difficulty]);

  // Main 60FPS Physics, Camera, and Animation Loop
  useEffect(() => {
    let animId: number;

    const gameLoop = () => {
      // 1. Manage round intro sequence (Opponent showcase -> return to player)
      if (roundIntroTimerRef.current > 0) {
        roundIntroTimerRef.current -= 1;
        if (roundIntroTimerRef.current <= 70) {
          // After showing enemy, pan camera back to player
          targetCameraX.current = 0;
          targetCameraY.current = 0;
        }
        if (roundIntroTimerRef.current === 0) {
          setRoundIntroNotice(null);
        }
      }

      // 2. Camera target calculation when arrow is NOT in flight
      if (!arrow || !arrow.active) {
        if (isScouting) {
          // Hold R: Pan camera smoothly to view the enemy and arena ahead
          targetCameraX.current = Math.max(0, enemy.x - 170);
          targetCameraY.current = 0;
        } else if (roundIntroTimerRef.current <= 70) {
          if (turn === 'PLAYER') {
            targetCameraX.current = 0;
            targetCameraY.current = 0;
          } else if (turn === 'ENEMY') {
            targetCameraX.current = Math.max(0, enemy.x - 170);
            targetCameraY.current = 0;
          }
        }
      }

      // 3. Camera interpolation (Smooth lerp horizontal and vertical)
      setCameraX((prev) => {
        const diff = targetCameraX.current - prev;
        if (Math.abs(diff) < 0.2) return targetCameraX.current;
        return prev + diff * 0.12;
      });

      setCameraY((prev) => {
        const diff = targetCameraY.current - prev;
        if (Math.abs(diff) < 0.2) return targetCameraY.current;
        return prev + diff * 0.14;
      });

      // 4. Update combat particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.1, // gravity on particles
            life: p.life + 1,
          }))
          .filter((p) => p.life < p.maxLife)
      );

      // 5. Update active Arrow flight and dynamic camera tracking
      setArrow((currentArrow) => {
        if (!currentArrow || !currentArrow.active) return currentArrow;

        // Step physics
        const updated = { ...currentArrow };
        updateArrowPhysics(updated, wind);

        // FOLLOW THE ARROW WITH THE CAMERA:
        // Horizontal: Keep arrow centered on screen across the 400+ paces arena
        const screenMid = updated.x - 120;
        targetCameraX.current = Math.max(0, Math.min(arenaWidth - 240, screenMid));

        // Vertical: If the arrow travels high above the initial screen (y < 45),
        // pan camera upward to follow high lobbing arcs into the dusk cosmos!
        if (updated.y < 45) {
          targetCameraY.current = Math.min(0, updated.y - 45);
        } else {
          targetCameraY.current = 0;
        }

        // Check collisions
        const col = checkArrowCollision(updated, player, enemy);
        if (col.hit) {
          updated.active = false;

          // Keep camera focused on impact site for brief analysis
          targetCameraX.current = Math.max(0, Math.min(arenaWidth - 240, updated.x - 120));
          targetCameraY.current = 0;

          // Process collision outcome
          if (col.target === 'ENEMY') {
            // Player hit Enemy
            setStats((prev) => ({
              ...prev,
              playerHits: prev.playerHits + 1,
              playerHeadshots: col.type === 'HEAD' ? prev.playerHeadshots + 1 : prev.playerHeadshots,
            }));

            // Record landing for AI memory
            enemyAi.recordLastShot(updated.x, player.x);

            // Apply damage to Enemy
            setEnemy((prev) => {
              const newHp = Math.max(0, prev.health - col.damage);
              return {
                ...prev,
                health: newHp,
                pose: newHp <= 0 ? 'DEFEAT' : 'HIT',
                poseTimer: 25,
                hitType: col.type as 'HEAD' | 'BODY' | 'LEG',
              };
            });

            // Audio & Banner
            if (col.type === 'HEAD') {
              gbaAudio.playHeadshot();
              setBannerText('CRITICAL HEADSHOT! -55 HP');
              setBannerColor('#ffb703');
              spawnParticlesAt(updated.x, updated.y, '#ffd166', 16);
            } else if (col.type === 'BODY') {
              gbaAudio.playHitBody();
              setBannerText('BODY HIT! -28 HP');
              setBannerColor('#e63946');
              spawnParticlesAt(updated.x, updated.y, '#e63946', 10);
            } else {
              gbaAudio.playHitBody();
              setBannerText('GRAZE! -16 HP');
              setBannerColor('#f4a261');
              spawnParticlesAt(updated.x, updated.y, '#f4a261', 6);
            }

            // Check if Round Won
            setTimeout(() => {
              setEnemy((currEnemy) => {
                if (currEnemy.health <= 0) {
                  // Round Won by Player!
                  gbaAudio.playVictoryFanfare();
                  setPlayer((p) => ({ ...p, pose: 'VICTORY' }));
                  setStats((prev) => {
                    const newScore = prev.playerScore + 1;
                    if (newScore >= 2) {
                      setGameState('MATCH_OVER');
                    } else {
                      setGameState('ROUND_OVER');
                    }
                    return { ...prev, playerScore: newScore };
                  });
                } else {
                  // Pass turn to Enemy (WIND REMAINS CONSISTENT DURING ROUND)
                  setTurn('ENEMY');
                  setBannerText(null);
                  targetCameraX.current = Math.max(0, enemy.x - 170);
                  targetCameraY.current = 0;
                }
                return currEnemy;
              });
            }, 1200);
          } else if (col.target === 'PLAYER') {
            // Enemy hit Player
            setStats((prev) => ({
              ...prev,
              enemyHits: prev.enemyHits + 1,
              enemyHeadshots: col.type === 'HEAD' ? prev.enemyHeadshots + 1 : prev.enemyHeadshots,
            }));

            // Apply damage to Player
            setPlayer((prev) => {
              const newHp = Math.max(0, prev.health - col.damage);
              return {
                ...prev,
                health: newHp,
                pose: newHp <= 0 ? 'DEFEAT' : 'HIT',
                poseTimer: 25,
                hitType: col.type as 'HEAD' | 'BODY' | 'LEG',
              };
            });

            if (col.type === 'HEAD') {
              gbaAudio.playHeadshot();
              setBannerText('ENEMY HEADSHOT! -55 HP');
              setBannerColor('#e63946');
              spawnParticlesAt(updated.x, updated.y, '#e63946', 16);
            } else if (col.type === 'BODY') {
              gbaAudio.playHitBody();
              setBannerText('ENEMY HIT! -28 HP');
              setBannerColor('#f4a261');
              spawnParticlesAt(updated.x, updated.y, '#f4a261', 10);
            } else {
              gbaAudio.playHitBody();
              setBannerText('ENEMY GRAZE! -16 HP');
              setBannerColor('#ffd166');
              spawnParticlesAt(updated.x, updated.y, '#ffd166', 6);
            }

            // Check if Round Lost
            setTimeout(() => {
              setPlayer((currPlayer) => {
                if (currPlayer.health <= 0) {
                  // Round Lost by Player!
                  gbaAudio.playDefeatTone();
                  setEnemy((e) => ({ ...e, pose: 'VICTORY' }));
                  setStats((prev) => {
                    const newEnemyScore = prev.enemyScore + 1;
                    if (newEnemyScore >= 2) {
                      setGameState('MATCH_OVER');
                    } else {
                      setGameState('ROUND_OVER');
                    }
                    return { ...prev, enemyScore: newEnemyScore };
                  });
                } else {
                  // Pass turn to Player (WIND REMAINS CONSISTENT DURING ROUND)
                  setTurn('PLAYER');
                  setBannerText(null);
                  targetCameraX.current = 0;
                  targetCameraY.current = 0;
                }
                return currPlayer;
              });
            }, 1200);
          } else {
            // Missed: Ground or Wall
            gbaAudio.playThud();
            setBannerText('MISS!');
            setBannerColor('#94a3b8');
            spawnParticlesAt(updated.x, updated.y, '#8d99ae', 8);

            // Record landing for AI memory if enemy missed
            if (updated.shooter === 'ENEMY') {
              enemyAi.recordLastShot(updated.x, player.x);
            }

            setTimeout(() => {
              setBannerText(null);
              if (updated.shooter === 'PLAYER') {
                // Pass to Enemy (WIND REMAINS CONSISTENT)
                setTurn('ENEMY');
                targetCameraX.current = Math.max(0, enemy.x - 170);
                targetCameraY.current = 0;
              } else {
                // Pass to Player (WIND REMAINS CONSISTENT)
                setTurn('PLAYER');
                targetCameraX.current = 0;
                targetCameraY.current = 0;
              }
            }, 900);
          }

          return null;
        }

        return updated;
      });

      // 6. Tick hit/pose timers down
      setPlayer((prev) => {
        if (prev.poseTimer > 0) {
          const nextTimer = prev.poseTimer - 1;
          return {
            ...prev,
            poseTimer: nextTimer,
            pose: nextTimer === 0 && prev.pose !== 'DEFEAT' && prev.pose !== 'VICTORY' ? 'IDLE' : prev.pose,
          };
        }
        return prev;
      });

      setEnemy((prev) => {
        if (prev.poseTimer > 0) {
          const nextTimer = prev.poseTimer - 1;
          return {
            ...prev,
            poseTimer: nextTimer,
            pose: nextTimer === 0 && prev.pose !== 'DEFEAT' && prev.pose !== 'VICTORY' ? 'IDLE' : prev.pose,
          };
        }
        return prev;
      });

      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animId);
  }, [
    wind,
    player,
    enemy,
    arenaWidth,
    isScouting,
    turn,
    arrow,
    spawnParticlesAt,
  ]);

  // Handle Hardware Button Press
  const handleButtonPress = useCallback(
    (btn: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'START' | 'SELECT' | 'L' | 'R') => {
      // 1. TITLE SCREEN
      if (gameState === 'TITLE') {
        if (btn === 'A' || btn === 'START') {
          startNewMatch();
        } else if (btn === 'SELECT') {
          setGameState('INSTRUCTIONS');
          gbaAudio.playMenuBeep();
        } else if (btn === 'UP' || btn === 'DOWN' || btn === 'LEFT' || btn === 'RIGHT') {
          // Cycle difficulty
          setDifficulty((prev) => {
            if (prev === 'NOVICE') return 'MARKSMAN';
            if (prev === 'MARKSMAN') return 'MASTER';
            return 'NOVICE';
          });
          gbaAudio.playMenuBeep();
        }
        return;
      }

      // 2. INSTRUCTIONS SCREEN
      if (gameState === 'INSTRUCTIONS') {
        if (btn === 'A' || btn === 'B' || btn === 'SELECT' || btn === 'START') {
          setGameState('TITLE');
          gbaAudio.playMenuBeep();
        }
        return;
      }

      // 3. ROUND OVER SCREEN
      if (gameState === 'ROUND_OVER') {
        if (btn === 'A' || btn === 'START') {
          startNextRound();
        }
        return;
      }

      // 4. MATCH OVER SCREEN
      if (gameState === 'MATCH_OVER') {
        if (btn === 'A' || btn === 'START') {
          startNewMatch();
        } else if (btn === 'B') {
          setGameState('TITLE');
          gbaAudio.playMenuBeep();
        }
        return;
      }

      // 5. PAUSED MENU
      if (gameState === 'PAUSED') {
        if (btn === 'UP') {
          setPauseMenuIndex((prev) => (prev > 0 ? prev - 1 : 3));
          gbaAudio.playMenuBeep();
        } else if (btn === 'DOWN') {
          setPauseMenuIndex((prev) => (prev < 3 ? prev + 1 : 0));
          gbaAudio.playMenuBeep();
        } else if (btn === 'A' || btn === 'START') {
          if (pauseMenuIndex === 0) {
            // Resume
            setGameState('BATTLE');
          } else if (pauseMenuIndex === 1) {
            // Restart Match
            startNewMatch();
          } else if (pauseMenuIndex === 2) {
            // Cycle Difficulty
            setDifficulty((prev) => {
              if (prev === 'NOVICE') return 'MARKSMAN';
              if (prev === 'MARKSMAN') return 'MASTER';
              return 'NOVICE';
            });
            gbaAudio.playMenuBeep();
          } else if (pauseMenuIndex === 3) {
            // Title Screen
            setGameState('TITLE');
          }
          gbaAudio.playMenuBeep();
        } else if (btn === 'B') {
          setGameState('BATTLE');
          gbaAudio.playMenuBeep();
        }
        return;
      }

      // 6. ACTIVE BATTLE
      if (gameState === 'BATTLE') {
        if (btn === 'START') {
          setGameState('PAUSED');
          setPauseMenuIndex(0);
          gbaAudio.playMenuBeep();
          return;
        }

        // Scouting mode via R button
        if (btn === 'R') {
          setIsScouting(true);
          return;
        }

        if (turn === 'PLAYER' && arrow === null && !isScouting) {
          if (btn === 'UP') {
            // Increase angle (up to 85 degrees)
            setPlayer((prev) => ({
              ...prev,
              angle: Math.min(85, prev.angle + 1),
            }));
            gbaAudio.playMenuBeep();
          } else if (btn === 'DOWN') {
            // Decrease angle (down to 10 degrees)
            setPlayer((prev) => ({
              ...prev,
              angle: Math.max(10, prev.angle - 1),
            }));
            gbaAudio.playMenuBeep();
          } else if (btn === 'RIGHT') {
            // Increase power (up to 100%)
            setPlayer((prev) => ({
              ...prev,
              power: Math.min(100, prev.power + 2),
            }));
            gbaAudio.playMenuBeep();
          } else if (btn === 'LEFT') {
            // Decrease power (down to 10%)
            setPlayer((prev) => ({
              ...prev,
              power: Math.max(10, prev.power - 2),
            }));
            gbaAudio.playMenuBeep();
          } else if (btn === 'A') {
            // Shoot arrow!
            handlePlayerShoot();
          }
        }
      }
    },
    [
      gameState,
      pauseMenuIndex,
      turn,
      arrow,
      isScouting,
      handlePlayerShoot,
      startNewMatch,
      startNextRound,
    ]
  );

  // Handle Hardware Button Release (Hold-to-scout on R)
  const handleButtonRelease = useCallback(
    (btn: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'START' | 'SELECT' | 'L' | 'R') => {
      if (btn === 'R') {
        setIsScouting(false);
      }
    },
    []
  );

  // Keyboard Event Listeners for GBA emulation controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'r' || e.key === 'R') {
        if (!e.repeat) {
          handleButtonPress('R');
        }
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleButtonPress('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleButtonPress('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleButtonPress('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleButtonPress('RIGHT');
          break;
        case 'z':
        case 'Z':
        case ' ':
          handleButtonPress('A');
          break;
        case 'x':
        case 'X':
          handleButtonPress('B');
          break;
        case 'Enter':
        case 'p':
        case 'P':
          handleButtonPress('START');
          break;
        case 'Shift':
        case 'Tab':
          handleButtonPress('SELECT');
          break;
        case 'v':
        case 'V':
          setViewMode((prev) => (prev === 'CONSOLE' ? 'THEATER' : 'CONSOLE'));
          break;
        case 'c':
        case 'C':
          handleCycleScreenScale();
          break;
        case 'm':
        case 'M':
          setSoundMuted(() => gbaAudio.toggleMute());
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleButtonRelease('R');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleButtonPress, handleButtonRelease]);

  // Handle applying Sprite Fusion generated artwork
  const handleApplyAsset = (category: 'player' | 'enemy' | 'scenery' | 'arrow' | 'logo', imageUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      if (category === 'player') {
        setPlayerCustomImage(img);
      } else if (category === 'enemy') {
        setEnemyCustomImage(img);
      }
    };
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden bg-[#12161f] px-2 py-2.5 sm:px-4 sm:py-6 font-sans text-stone-100 antialiased selection:bg-amber-500 selection:text-black">
      {/* Handheld GBA Console / Theater Controller */}
      <GbaConsole
        onPressButton={handleButtonPress}
        onReleaseButton={handleButtonRelease}
        isScouting={isScouting}
        crtFilter={crtFilter}
        onToggleCrt={() => setCrtFilter((prev) => !prev)}
        soundMuted={soundMuted}
        onToggleSound={() => {
          const next = gbaAudio.toggleMute();
          setSoundMuted(next);
        }}
        onOpenSpriteFusion={() => setIsSpriteFusionOpen(true)}
        hasCustomSprites={playerCustomImage !== null || enemyCustomImage !== null}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'CONSOLE' ? 'THEATER' : 'CONSOLE'))}
        screenScale={screenScale}
        onCycleScreenScale={handleCycleScreenScale}
      >
        <GbaScreen
          gameState={gameState}
          difficulty={difficulty}
          player={player}
          enemy={enemy}
          arrow={arrow}
          wind={wind}
          stats={stats}
          turn={turn}
          cameraX={cameraX}
          cameraY={cameraY}
          bannerText={bannerText}
          bannerColor={bannerColor}
          particles={particles}
          pauseMenuIndex={pauseMenuIndex}
          crtFilter={crtFilter}
          enemyDesign={enemyDesign}
          arenaWidth={arenaWidth}
          isScouting={isScouting}
          roundIntroNotice={roundIntroNotice}
          playerCustomImage={playerCustomImage}
          enemyCustomImage={enemyCustomImage}
          screenScale={screenScale}
          onCanvasClick={() => {
            if (gameState === 'TITLE' || gameState === 'INSTRUCTIONS' || gameState === 'ROUND_OVER' || gameState === 'MATCH_OVER') {
              handleButtonPress('A');
            }
          }}
        />
      </GbaConsole>

      {/* Sprite Fusion Studio Panel Modal */}
      <SpriteFusionPanel
        isOpen={isSpriteFusionOpen}
        onClose={() => setIsSpriteFusionOpen(false)}
        onApplyAsset={handleApplyAsset}
        currentAssets={savedAssets}
        selectedEnemyDesign={enemyDesign}
        onSelectEnemyDesign={(design) => setEnemyDesign(design)}
      />
    </div>
  );
}
