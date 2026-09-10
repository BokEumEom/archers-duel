import React from 'react';
import { Download, Volume2, VolumeX, Sparkles, Monitor } from 'lucide-react';
import { downloadGbaRom } from '../gba/romBuilder';

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
}) => {
  return (
    <div className="flex flex-col items-center">
      {/* Top Utility Ribbon */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={() => downloadGbaRom('archers_duel.gba')}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold tracking-wide text-white shadow-md transition-all hover:bg-emerald-500 active:scale-95"
          id="btn-download-rom"
          title="Download the compiled .gba ROM to test in mGBA, VBA, or Delta"
        >
          <Download className="h-4 w-4" />
          <span>DOWNLOAD .GBA ROM (64 KB)</span>
        </button>

        <button
          onClick={onToggleCrt}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold shadow-sm transition-all ${
            crtFilter
              ? 'bg-amber-600/90 text-white hover:bg-amber-500'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
          }`}
          id="btn-toggle-scanlines"
        >
          <Monitor className="h-3.5 w-3.5" />
          <span>LCD Grid: {crtFilter ? 'ON' : 'OFF'}</span>
        </button>

        <button
          onClick={onToggleSound}
          className="inline-flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-xs font-semibold text-stone-300 shadow-sm transition-all hover:bg-stone-700 active:scale-95"
          id="btn-toggle-sound"
        >
          {soundMuted ? <VolumeX className="h-3.5 w-3.5 text-red-400" /> : <Volume2 className="h-3.5 w-3.5 text-emerald-400" />}
          <span>{soundMuted ? 'Muted' : 'Audio On'}</span>
        </button>

        <button
          onClick={onOpenSpriteFusion}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-indigo-500 active:scale-95"
          id="btn-open-spritefusion"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-300" />
          <span>Sprite Fusion Studio {hasCustomSprites && '• Active'}</span>
        </button>
      </div>

      {/* Handheld GBA Console Body */}
      <div
        className="relative flex flex-col items-center rounded-[42px] border-4 border-[#2f3542] bg-gradient-to-b from-[#485460] via-[#353b48] to-[#1e272e] p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)]"
        id="gba-hardware-shell"
      >
        {/* Top L and R shoulder bumpers */}
        <div className="absolute -top-3 left-10 flex gap-4">
          <button
            onClick={() => onPressButton('L')}
            className="h-5 w-16 rounded-t-lg bg-[#2f3542] text-[10px] font-black tracking-wider text-stone-400 shadow transition-transform active:translate-y-1"
            id="btn-bumper-l"
          >
            L
          </button>
        </div>
        <div className="absolute -top-3 right-10 flex gap-4">
          <button
            onMouseDown={() => onPressButton('R')}
            onMouseUp={() => onReleaseButton && onReleaseButton('R')}
            onMouseLeave={() => onReleaseButton && onReleaseButton('R')}
            onTouchStart={(e) => { e.preventDefault(); onPressButton('R'); }}
            onTouchEnd={(e) => { e.preventDefault(); onReleaseButton && onReleaseButton('R'); }}
            className={`h-5 w-24 rounded-t-lg text-[9px] font-black tracking-wider shadow transition-all ${
              isScouting
                ? 'bg-amber-500 text-black translate-y-1 font-extrabold shadow-inner'
                : 'bg-[#2f3542] text-stone-300 hover:bg-[#3d4554]'
            }`}
            id="btn-bumper-r"
            title="Hold R to scout the enemy distance and position"
          >
            {isScouting ? 'SCOUTING...' : 'R • SCOUT'}
          </button>
        </div>

        {/* Central Display Frame with GBA Badge */}
        <div className="relative flex flex-col items-center rounded-2xl border-4 border-[#1e272e] bg-[#0c1017] p-4 shadow-inner">
          {/* Top Logo / Power LED */}
          <div className="mb-2 flex w-full items-center justify-between px-2 text-[10px] font-bold tracking-widest text-stone-400">
            <span className="italic text-stone-300">GAME BOY <span className="font-extrabold text-indigo-400">ADVANCE</span></span>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-stone-500">POWER</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            </div>
          </div>

          {/* 240x160 Screen Viewport */}
          {children}

          {/* Screen Bottom Bezel */}
          <div className="mt-2 flex w-full items-center justify-between px-2 text-[9px] text-stone-500">
            <span>240 × 160 NATIVE 60FPS</span>
            <span>ARM7TDMI 16.78MHz</span>
          </div>
        </div>

        {/* Lower Controls Area: D-Pad, Start/Select, A/B buttons */}
        <div className="mt-6 flex w-full max-w-[560px] items-center justify-between px-4">
          {/* D-PAD (Directional Cross) */}
          <div className="flex flex-col items-center" id="gba-dpad-container">
            <div className="relative h-28 w-28">
              {/* Up */}
              <button
                onClick={() => onPressButton('UP')}
                className="absolute top-0 left-9 h-10 w-10 rounded-t-md bg-[#1e272e] text-stone-400 shadow active:bg-[#0c1017] active:scale-95"
                id="btn-dpad-up"
                title="D-Pad Up (Increase Angle / Up)"
              >
                ▲
              </button>
              {/* Down */}
              <button
                onClick={() => onPressButton('DOWN')}
                className="absolute bottom-0 left-9 h-10 w-10 rounded-b-md bg-[#1e272e] text-stone-400 shadow active:bg-[#0c1017] active:scale-95"
                id="btn-dpad-down"
                title="D-Pad Down (Decrease Angle / Down)"
              >
                ▼
              </button>
              {/* Left */}
              <button
                onClick={() => onPressButton('LEFT')}
                className="absolute top-9 left-0 h-10 w-10 rounded-l-md bg-[#1e272e] text-stone-400 shadow active:bg-[#0c1017] active:scale-95"
                id="btn-dpad-left"
                title="D-Pad Left (Decrease Power)"
              >
                ◀
              </button>
              {/* Right */}
              <button
                onClick={() => onPressButton('RIGHT')}
                className="absolute top-9 right-0 h-10 w-10 rounded-r-md bg-[#1e272e] text-stone-400 shadow active:bg-[#0c1017] active:scale-95"
                id="btn-dpad-right"
                title="D-Pad Right (Increase Power)"
              >
                ▶
              </button>
              {/* Center Pivot */}
              <div className="absolute top-9 left-9 h-10 w-10 bg-[#1e272e]" />
            </div>
            <span className="mt-1 text-[9px] font-bold tracking-wider text-stone-400">AIM & POWER</span>
          </div>

          {/* Center: START and SELECT pill buttons + Speaker Grilles */}
          <div className="flex flex-col items-center gap-3">
            {/* Speaker Holes */}
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1e272e]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#1e272e]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#1e272e]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#1e272e]" />
            </div>

            <div className="flex gap-5">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onPressButton('SELECT')}
                  className="h-3 w-10 rotate-[-25deg] rounded-full bg-[#1e272e] shadow active:scale-95"
                  id="btn-select"
                  title="Select (How to Play)"
                />
                <span className="mt-1.5 text-[8px] font-extrabold tracking-wider text-stone-400">SELECT</span>
              </div>
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onPressButton('START')}
                  className="h-3 w-10 rotate-[-25deg] rounded-full bg-[#1e272e] shadow active:scale-95"
                  id="btn-start"
                  title="Start (Pause / Menu)"
                />
                <span className="mt-1.5 text-[8px] font-extrabold tracking-wider text-stone-400">START</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: A and B */}
          <div className="flex flex-col items-center">
            <div className="flex rotate-[-25deg] gap-4">
              {/* B Button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onPressButton('B')}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#6c5ce7] text-sm font-black text-white shadow-md transition-transform active:scale-90"
                  id="btn-b"
                  title="B (Back / Cancel)"
                >
                  B
                </button>
                <span className="mt-1 rotate-[25deg] text-[9px] font-bold text-stone-400">CANCEL</span>
              </div>

              {/* A Button */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => onPressButton('A')}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e84393] text-sm font-black text-white shadow-md transition-transform active:scale-90"
                  id="btn-a"
                  title="A (Shoot / Confirm)"
                >
                  A
                </button>
                <span className="mt-1 rotate-[25deg] text-[9px] font-bold text-stone-400">SHOOT</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Control Quick Reference */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-stone-400">
        <div className="flex items-center gap-1.5">
          <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">▲ ▼</kbd>
          <span>Angle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">◀ ▶</kbd>
          <span>Power</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">Z</kbd>
          <span>or</span>
          <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">Space</kbd>
          <span className="font-semibold text-pink-400">A (Shoot)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">X</kbd>
          <span>B (Back)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="rounded bg-stone-800 px-1.5 py-0.5 font-mono text-[10px] text-stone-200">Enter</kbd>
          <span>Start (Pause)</span>
        </div>
      </div>
    </div>
  );
};
