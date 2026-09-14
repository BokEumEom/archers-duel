import React, { useRef, useEffect, useMemo } from 'react';
import { Download, Volume2, VolumeX, Sparkles, Monitor, Tv, Gamepad2, Eye, Maximize2 } from 'lucide-react';
import { downloadGbaRom } from '../gba/romBuilder';
import { ScreenScale } from '../types';

interface GbaConsoleProps {
  children: React.ReactNode;
  onPressButton: (button: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'START' | 'SELECT' | 'L' | 'R') => void;
  onReleaseButton?: (button: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'START' | 'SELECT' | 'L' | 'R') => void;
  crtFilter: boolean;
  onToggleCrt: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
  onOpenSpriteFusion: () => void;
  hasCustomSprites: boolean;
  isScouting?: boolean;
  viewMode?: 'CONSOLE' | 'THEATER';
  onToggleViewMode?: () => void;
  screenScale?: ScreenScale;
  onCycleScreenScale?: () => void;
}

export const GbaConsole: React.FC<GbaConsoleProps> = ({
  children,
  onPressButton,
  onReleaseButton,
  crtFilter,
  onToggleCrt,
  soundMuted,
  onToggleSound,
  onOpenSpriteFusion,
  hasCustomSprites,
  isScouting = false,
  viewMode = 'CONSOLE',
  onToggleViewMode,
  screenScale = 'AUTO',
  onCycleScreenScale,
}) => {
  const repeatTimeoutRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);

  // Responsive max width styles according to screen resolution scale
  const shellMaxWidth = useMemo(() => {
    if (screenScale === '2X') return 'max-w-[560px]';
    if (screenScale === '3X') return 'max-w-[840px]';
    if (screenScale === '4X') return 'max-w-[1100px]';
    // AUTO: Scaled gracefully from mobile up to high-resolution PC displays
    return 'max-w-[340px] min-[380px]:max-w-[380px] min-[440px]:max-w-[460px] sm:max-w-[620px] md:max-w-[780px] lg:max-w-[920px] xl:max-w-[1040px] 2xl:max-w-[1140px]';
  }, [screenScale]);

  const theaterMaxWidth = useMemo(() => {
    if (screenScale === '2X') return 'max-w-[540px]';
    if (screenScale === '3X') return 'max-w-[800px]';
    if (screenScale === '4X') return 'max-w-[1060px]';
    // AUTO:
    return 'max-w-[340px] min-[380px]:max-w-[380px] min-[440px]:max-w-[460px] sm:max-w-[620px] md:max-w-[780px] lg:max-w-[920px] xl:max-w-[1040px] 2xl:max-w-[1140px]';
  }, [screenScale]);

  const ribbonMaxWidth = useMemo(() => {
    if (screenScale === '2X') return 'max-w-[560px]';
    if (screenScale === '3X') return 'max-w-[840px]';
    if (screenScale === '4X') return 'max-w-[1100px]';
    return 'max-w-[340px] min-[380px]:max-w-[380px] min-[440px]:max-w-[460px] sm:max-w-[620px] md:max-w-[780px] lg:max-w-[920px] xl:max-w-[1040px] 2xl:max-w-[1140px]';
  }, [screenScale]);

  // Stop any active repeating timer on unmount
  useEffect(() => {
    return () => {
      if (repeatTimeoutRef.current) clearTimeout(repeatTimeoutRef.current);
      if (repeatIntervalRef.current) clearInterval(repeatIntervalRef.current);
    };
  }, []);

  // Rapid touch/mouse hold repeat for D-Pad angle and power adjustment
  const handleStartPress = (
    btn: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'START' | 'SELECT' | 'L' | 'R'
  ) => {
    // Gentle haptic feedback on mobile if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore if not supported or denied
      }
    }

    onPressButton(btn);

    // Only auto-repeat directional angle & power buttons
    if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(btn)) {
      handleStopPress();
      repeatTimeoutRef.current = window.setTimeout(() => {
        repeatIntervalRef.current = window.setInterval(() => {
          onPressButton(btn);
        }, 75);
      }, 240);
    }
  };

  const handleStopPress = (
    btn?: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'A' | 'B' | 'START' | 'SELECT' | 'L' | 'R'
  ) => {
    if (repeatTimeoutRef.current !== null) {
      clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    if (repeatIntervalRef.current !== null) {
      clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
    if (btn && onReleaseButton) {
      onReleaseButton(btn);
    }
  };

  return (
    <div className="flex w-full flex-col items-center select-none">
      {/* Top Utility Ribbon - Clean responsive flex wrap */}
      <div className={`mb-3 sm:mb-4 flex w-full flex-wrap items-center justify-center gap-1.5 sm:gap-2 lg:gap-2.5 px-1 text-xs transition-all duration-200 ${ribbonMaxWidth}`}>
        <button
          onClick={() => downloadGbaRom('archers_duel.gba')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold tracking-wide text-white shadow-md transition-all hover:bg-emerald-500 active:scale-95 touch-manipulation"
          id="btn-download-rom"
          title="Download the compiled .gba ROM to test in mGBA, VBA, or Delta"
        >
          <Download className="h-3.5 w-3.5" />
          <span className="hidden min-[400px]:inline">DOWNLOAD</span>
          <span>.GBA ROM (64KB)</span>
        </button>

        {onToggleViewMode && (
          <button
            onClick={onToggleViewMode}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-semibold text-stone-300 shadow-sm transition-all hover:bg-stone-700 active:scale-95 touch-manipulation"
            id="btn-toggle-viewmode"
            title="Toggle between retro GBA Handheld Shell and Theater Arcade View"
          >
            {viewMode === 'CONSOLE' ? (
              <>
                <Tv className="h-3.5 w-3.5 text-indigo-400" />
                <span className="hidden min-[380px]:inline">Theater Mode</span>
                <span className="min-[380px]:hidden">Theater</span>
              </>
            ) : (
              <>
                <Gamepad2 className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden min-[380px]:inline">Console Shell</span>
                <span className="min-[380px]:hidden">Console</span>
              </>
            )}
          </button>
        )}

        {onCycleScreenScale && (
          <button
            onClick={onCycleScreenScale}
            className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-semibold text-stone-300 shadow-sm transition-all hover:bg-stone-700 active:scale-95 touch-manipulation"
            id="btn-cycle-screenscale"
            title="Adjust display resolution scale (Auto, 2X, 3X, 4X)"
          >
            <Maximize2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Size: {screenScale === 'AUTO' ? 'Auto' : screenScale}</span>
          </button>
        )}

        <button
          onClick={onToggleCrt}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-semibold shadow-sm transition-all touch-manipulation active:scale-95 ${
            crtFilter
              ? 'bg-amber-600/90 text-white hover:bg-amber-500'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
          }`}
          id="btn-toggle-scanlines"
        >
          <Monitor className="h-3.5 w-3.5" />
          <span>LCD: {crtFilter ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={onToggleSound}
          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-semibold text-stone-300 shadow-sm transition-all hover:bg-stone-700 active:scale-95 touch-manipulation"
          id="btn-toggle-sound"
        >
          {soundMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
          <span>{soundMuted ? 'Muted' : 'Sound'}</span>
        </button>

        <button
          onClick={onOpenSpriteFusion}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-95 touch-manipulation"
          id="btn-open-spritefusion"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>Sprite Fusion {hasCustomSprites && '• Active'}</span>
        </button>
      </div>

      {/* VIEW MODE 1: CLASSIC RETRO GBA CONSOLE SHELL */}
      {viewMode === 'CONSOLE' ? (
        <div
          className={`relative flex w-full flex-col items-center rounded-[24px] min-[380px]:rounded-[32px] sm:rounded-[38px] md:rounded-[44px] lg:rounded-[52px] border-2 sm:border-4 border-[#2f3542] bg-gradient-to-b from-[#485460] via-[#353b48] to-[#1e272e] p-2.5 min-[380px]:p-3.5 sm:p-5 md:p-6 lg:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.8)] touch-manipulation select-none transition-all duration-200 ${shellMaxWidth}`}
          id="gba-hardware-shell"
        >
          {/* Top L and R shoulder bumpers */}
          <div className="absolute -top-3 sm:-top-3.5 lg:-top-4 left-3 min-[380px]:left-6 sm:left-10 lg:left-14 flex gap-2">
            <button
              onClick={() => handleStartPress('L')}
              className="h-5 sm:h-6 lg:h-7 w-12 sm:w-16 lg:w-20 rounded-t-lg bg-[#2f3542] text-[9px] sm:text-[10px] lg:text-xs font-black tracking-wider text-stone-400 shadow active:translate-y-0.5 touch-manipulation"
              id="btn-bumper-l"
            >
              L
            </button>
          </div>
          <div className="absolute -top-3 sm:-top-3.5 lg:-top-4 right-3 min-[380px]:right-6 sm:right-10 lg:right-14 flex gap-2">
            <button
              onMouseDown={() => handleStartPress('R')}
              onMouseUp={() => handleStopPress('R')}
              onMouseLeave={() => handleStopPress('R')}
              onTouchStart={(e) => { e.preventDefault(); handleStartPress('R'); }}
              onTouchEnd={(e) => { e.preventDefault(); handleStopPress('R'); }}
              className={`h-5 sm:h-6 lg:h-7 w-20 sm:w-24 lg:w-32 rounded-t-lg text-[8px] sm:text-[9px] lg:text-[10px] font-black tracking-wider shadow transition-all touch-manipulation ${
                isScouting
                  ? 'bg-amber-500 text-black translate-y-0.5 font-extrabold shadow-inner'
                  : 'bg-[#2f3542] text-stone-300 hover:bg-[#3d4554]'
              }`}
              id="btn-bumper-r"
              title="Hold R to scout the enemy distance and position"
            >
              {isScouting ? 'SCOUTING...' : 'R • SCOUT'}
            </button>
          </div>

          {/* Central Display Frame with GBA Badge */}
          <div className="relative flex w-full flex-col items-center rounded-xl sm:rounded-2xl lg:rounded-3xl border-2 sm:border-4 border-[#1e272e] bg-[#0c1017] p-2 sm:p-3.5 md:p-4 lg:p-6 shadow-inner">
            {/* Top Logo / Power LED */}
            <div className="mb-1.5 sm:mb-2 lg:mb-3 flex w-full items-center justify-between px-1 sm:px-2 lg:px-4 text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-bold tracking-widest text-stone-400">
              <span className="italic text-stone-300">
                GAME BOY <span className="font-extrabold text-indigo-400">ADVANCE</span>
              </span>
              <div className="flex items-center gap-1.5 lg:gap-2">
                <span className="text-[7px] sm:text-[8px] md:text-[9px] lg:text-[10px] text-stone-500 font-semibold">POWER</span>
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 lg:h-2.5 lg:w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              </div>
            </div>

            {/* 240x160 Responsive Fluid Screen Viewport */}
            {children}

            {/* Screen Bottom Bezel */}
            <div className="mt-1.5 sm:mt-2 lg:mt-3 flex w-full items-center justify-between px-1 sm:px-2 lg:px-4 text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-mono text-stone-500">
              <span>240 × 160 • 60FPS</span>
              <span className="hidden min-[400px]:inline">ARM7TDMI 16.78MHz</span>
              <span className="min-[400px]:hidden">GBA NATIVE</span>
            </div>
          </div>

          {/* Lower Controls Area: D-Pad, Start/Select, A/B buttons */}
          <div className="mt-4 sm:mt-6 lg:mt-8 flex w-full max-w-[560px] md:max-w-[720px] lg:max-w-[840px] xl:max-w-[960px] items-center justify-between px-1 min-[380px]:px-2 sm:px-4 lg:px-6">
            {/* D-PAD (Directional Cross with Auto-Repeat Touch/Hold) */}
            <div className="flex flex-col items-center" id="gba-dpad-container">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 lg:h-32 lg:w-32">
                {/* Up */}
                <button
                  onMouseDown={() => handleStartPress('UP')}
                  onMouseUp={() => handleStopPress()}
                  onMouseLeave={() => handleStopPress()}
                  onTouchStart={(e) => { e.preventDefault(); handleStartPress('UP'); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleStopPress(); }}
                  className="absolute top-0 left-8 sm:left-9 lg:left-10 flex h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-t-md bg-[#1e272e] text-xs lg:text-sm font-bold text-stone-300 shadow active:bg-[#0c1017] active:scale-95 touch-manipulation"
                  id="btn-dpad-up"
                  title="Angle Up (Tap or Hold)"
                >
                  ▲
                </button>
                {/* Down */}
                <button
                  onMouseDown={() => handleStartPress('DOWN')}
                  onMouseUp={() => handleStopPress()}
                  onMouseLeave={() => handleStopPress()}
                  onTouchStart={(e) => { e.preventDefault(); handleStartPress('DOWN'); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleStopPress(); }}
                  className="absolute bottom-0 left-8 sm:left-9 lg:left-10 flex h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-b-md bg-[#1e272e] text-xs lg:text-sm font-bold text-stone-300 shadow active:bg-[#0c1017] active:scale-95 touch-manipulation"
                  id="btn-dpad-down"
                  title="Angle Down (Tap or Hold)"
                >
                  ▼
                </button>
                {/* Left */}
                <button
                  onMouseDown={() => handleStartPress('LEFT')}
                  onMouseUp={() => handleStopPress()}
                  onMouseLeave={() => handleStopPress()}
                  onTouchStart={(e) => { e.preventDefault(); handleStartPress('LEFT'); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleStopPress(); }}
                  className="absolute top-8 sm:top-9 lg:top-10 left-0 flex h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-l-md bg-[#1e272e] text-xs lg:text-sm font-bold text-stone-300 shadow active:bg-[#0c1017] active:scale-95 touch-manipulation"
                  id="btn-dpad-left"
                  title="Power Down (Tap or Hold)"
                >
                  ◀
                </button>
                {/* Right */}
                <button
                  onMouseDown={() => handleStartPress('RIGHT')}
                  onMouseUp={() => handleStopPress()}
                  onMouseLeave={() => handleStopPress()}
                  onTouchStart={(e) => { e.preventDefault(); handleStartPress('RIGHT'); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleStopPress(); }}
                  className="absolute top-8 sm:top-9 lg:top-10 right-0 flex h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-r-md bg-[#1e272e] text-xs lg:text-sm font-bold text-stone-300 shadow active:bg-[#0c1017] active:scale-95 touch-manipulation"
                  id="btn-dpad-right"
                  title="Power Up (Tap or Hold)"
                >
                  ▶
                </button>
                {/* Center Pivot */}
                <div className="absolute top-8 sm:top-9 lg:top-10 left-8 sm:left-9 lg:left-10 h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-[#1e272e]" />
              </div>
              <span className="mt-1 text-[8px] sm:text-[9px] lg:text-[11px] font-bold tracking-wider text-stone-400">
                AIM & POWER
              </span>
            </div>

            {/* Center: START and SELECT pill buttons + Speaker Grilles */}
            <div className="flex flex-col items-center gap-2 sm:gap-3 lg:gap-4">
              {/* Speaker Holes */}
              <div className="flex gap-1 lg:gap-1.5">
                <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 lg:h-2 lg:w-2 rounded-full bg-[#1e272e]" />
                <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 lg:h-2 lg:w-2 rounded-full bg-[#1e272e]" />
                <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 lg:h-2 lg:w-2 rounded-full bg-[#1e272e]" />
                <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 lg:h-2 lg:w-2 rounded-full bg-[#1e272e]" />
              </div>

              <div className="flex gap-3 sm:gap-5 lg:gap-7">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleStartPress('SELECT')}
                    className="h-2.5 sm:h-3 lg:h-3.5 w-8 sm:w-10 lg:w-12 rotate-[-25deg] rounded-full bg-[#1e272e] shadow active:scale-95 touch-manipulation"
                    id="btn-select"
                    title="Select (How to Play)"
                  />
                  <span className="mt-1 text-[7px] sm:text-[8px] lg:text-[10px] font-extrabold tracking-wider text-stone-400">SELECT</span>
                </div>
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => handleStartPress('START')}
                    className="h-2.5 sm:h-3 lg:h-3.5 w-8 sm:w-10 lg:w-12 rotate-[-25deg] rounded-full bg-[#1e272e] shadow active:scale-95 touch-manipulation"
                    id="btn-start"
                    title="Start (Pause / Menu)"
                  />
                  <span className="mt-1 text-[7px] sm:text-[8px] lg:text-[10px] font-extrabold tracking-wider text-stone-400">START</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: A and B */}
            <div className="flex flex-col items-center">
              <div className="flex rotate-[-25deg] gap-2.5 sm:gap-4 lg:gap-6">
                {/* B Button */}
                <div className="flex flex-col items-center">
                  <button
                    onMouseDown={() => handleStartPress('B')}
                    onMouseUp={() => handleStopPress('B')}
                    onTouchStart={(e) => { e.preventDefault(); handleStartPress('B'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleStopPress('B'); }}
                    className="flex h-10 w-10 sm:h-11 sm:w-11 lg:h-13 lg:w-13 items-center justify-center rounded-full bg-[#6c5ce7] text-xs sm:text-sm lg:text-base font-black text-white shadow-md transition-transform active:scale-90 touch-manipulation"
                    id="btn-b"
                    title="B (Back / Cancel)"
                  >
                    B
                  </button>
                  <span className="mt-1 rotate-[25deg] text-[8px] sm:text-[9px] lg:text-[11px] font-bold text-stone-400">CANCEL</span>
                </div>

                {/* A Button */}
                <div className="flex flex-col items-center">
                  <button
                    onMouseDown={() => handleStartPress('A')}
                    onMouseUp={() => handleStopPress('A')}
                    onTouchStart={(e) => { e.preventDefault(); handleStartPress('A'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleStopPress('A'); }}
                    className="flex h-10 w-10 sm:h-11 sm:w-11 lg:h-13 lg:w-13 items-center justify-center rounded-full bg-[#e84393] text-xs sm:text-sm lg:text-base font-black text-white shadow-md transition-transform active:scale-90 touch-manipulation"
                    id="btn-a"
                    title="A (Shoot / Confirm)"
                  >
                    A
                  </button>
                  <span className="mt-1 rotate-[25deg] text-[8px] sm:text-[9px] lg:text-[11px] font-bold text-stone-400">SHOOT</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: THEATER / ARCADE MODERN LAYOUT */
        <div className={`flex w-full flex-col items-center transition-all duration-200 ${theaterMaxWidth}`}>
          {/* Direct Screen Container */}
          <div className="relative flex w-full flex-col items-center rounded-2xl border-2 sm:border-4 border-stone-800 bg-[#0c1017] p-2.5 sm:p-4 lg:p-6 shadow-2xl">
            {children}
          </div>

          {/* Integrated Modern Arcade Controller Bar */}
          <div className="mt-3 lg:mt-4 flex w-full flex-wrap items-center justify-between gap-3 rounded-xl lg:rounded-2xl border border-stone-800 bg-stone-900/90 p-3 sm:p-4 lg:p-5 shadow-lg">
            {/* D-Pad controls */}
            <div className="flex items-center gap-1 sm:gap-3">
              <div className="grid grid-cols-3 gap-1 lg:gap-1.5">
                <div />
                <button
                  onMouseDown={() => handleStartPress('UP')}
                  onMouseUp={() => handleStopPress()}
                  onTouchStart={(e) => { e.preventDefault(); handleStartPress('UP'); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleStopPress(); }}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 lg:h-11 lg:w-11 items-center justify-center rounded bg-stone-800 text-xs lg:text-sm font-bold text-stone-200 hover:bg-stone-700 active:bg-amber-600 active:text-black touch-manipulation"
                  title="Angle Up"
                >
                  ▲
                </button>
                <div />
                <button
                  onMouseDown={() => handleStartPress('LEFT')}
                  onMouseUp={() => handleStopPress()}
                  onTouchStart={(e) => { e.preventDefault(); handleStartPress('LEFT'); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleStopPress(); }}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 lg:h-11 lg:w-11 items-center justify-center rounded bg-stone-800 text-xs lg:text-sm font-bold text-stone-200 hover:bg-stone-700 active:bg-amber-600 active:text-black touch-manipulation"
                  title="Power Down"
                >
                  ◀
                </button>
                <button
                  onMouseDown={() => handleStartPress('DOWN')}
                  onMouseUp={() => handleStopPress()}
                  onTouchStart={(e) => { e.preventDefault(); handleStartPress('DOWN'); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleStopPress(); }}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 lg:h-11 lg:w-11 items-center justify-center rounded bg-stone-800 text-xs lg:text-sm font-bold text-stone-200 hover:bg-stone-700 active:bg-amber-600 active:text-black touch-manipulation"
                  title="Angle Down"
                >
                  ▼
                </button>
                <button
                  onMouseDown={() => handleStartPress('RIGHT')}
                  onMouseUp={() => handleStopPress()}
                  onTouchStart={(e) => { e.preventDefault(); handleStartPress('RIGHT'); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleStopPress(); }}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 lg:h-11 lg:w-11 items-center justify-center rounded bg-stone-800 text-xs lg:text-sm font-bold text-stone-200 hover:bg-stone-700 active:bg-amber-600 active:text-black touch-manipulation"
                  title="Power Up"
                >
                  ▶
                </button>
              </div>
              <span className="hidden sm:inline text-[10px] lg:text-xs font-bold text-stone-400 ml-1">
                Aim / Power
              </span>
            </div>

            {/* Utility buttons: Scout, Pause, Select */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                onMouseDown={() => handleStartPress('R')}
                onMouseUp={() => handleStopPress('R')}
                onTouchStart={(e) => { e.preventDefault(); handleStartPress('R'); }}
                onTouchEnd={(e) => { e.preventDefault(); handleStopPress('R'); }}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-bold transition-all touch-manipulation ${
                  isScouting
                    ? 'bg-amber-500 text-black shadow'
                    : 'bg-stone-800 text-stone-200 hover:bg-stone-700'
                }`}
                title="Hold to Scout Foe"
              >
                <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                <span>{isScouting ? 'Scouting' : 'Scout (R)'}</span>
              </button>

              <button
                onClick={() => handleStartPress('START')}
                className="rounded-lg bg-stone-800 px-2.5 py-2 lg:px-4 lg:py-2.5 text-xs lg:text-sm font-bold text-stone-300 hover:bg-stone-700 active:scale-95 touch-manipulation"
              >
                Pause (Enter)
              </button>
            </div>

            {/* Action buttons: Cancel & Shoot */}
            <div className="flex items-center gap-2 lg:gap-3">
              <button
                onClick={() => handleStartPress('B')}
                className="flex h-9 w-9 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-full bg-[#6c5ce7] text-xs lg:text-sm font-black text-white shadow hover:opacity-90 active:scale-90 touch-manipulation"
                title="B (Cancel)"
              >
                B
              </button>
              <button
                onClick={() => handleStartPress('A')}
                className="flex h-10 px-4 sm:px-5 lg:h-12 lg:px-7 items-center justify-center rounded-full bg-[#e84393] text-xs sm:text-sm lg:text-base font-black tracking-wider text-white shadow-md hover:bg-pink-500 active:scale-95 touch-manipulation"
                title="A (Shoot Arrow / Select)"
              >
                A • SHOOT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Help Footer: Desktop Keyboard Reference vs Mobile Touch Tips */}
      <div className={`mt-3 sm:mt-4 w-full px-2 text-stone-400 transition-all duration-200 ${ribbonMaxWidth}`}>
        {/* Desktop Keyboard Shortcuts (visible sm and up) */}
        <div className="hidden sm:flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">▲ ▼</kbd>
            <span>Angle</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">◀ ▶</kbd>
            <span>Power</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">Hold R</kbd>
            <span>Scout</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">Space / Z</kbd>
            <span className="font-semibold text-pink-400">Shoot (A)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">X</kbd>
            <span>Back (B)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">Enter</kbd>
            <span>Pause</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">V</kbd>
            <span>View</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">C</kbd>
            <span>Scale ({screenScale === 'AUTO' ? 'Auto' : screenScale})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">M</kbd>
            <span>Mute</span>
          </div>
        </div>

        {/* Mobile Touch Quick Guide (visible only on mobile) */}
        <div className="flex sm:hidden items-center justify-around rounded-lg border border-stone-800/60 bg-stone-900/40 p-2 text-[10px] text-stone-400">
          <span>📱 <b>Hold D-Pad</b> aim/power</span>
          <span>•</span>
          <span>👁️ <b>Hold R</b> scout</span>
          <span>•</span>
          <span>🎯 <b>Tap A</b> fire</span>
        </div>
      </div>
    </div>
  );
};

