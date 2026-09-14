import React, { useEffect, useState } from 'react';
import { gbaAudio } from '../audio/gbaAudio';

interface GbaBootScreenProps {
  onComplete: () => void;
  isRestart?: boolean;
}

export const GbaBootScreen: React.FC<GbaBootScreenProps> = ({
  onComplete,
  isRestart = false,
}) => {
  const [sparkleActive, setSparkleActive] = useState(false);
  const [nintendoVisible, setNintendoVisible] = useState(false);

  useEffect(() => {
    // 1. Play signature GBA arpeggio & double chime at 680ms when logo drops
    const chimeTimer = setTimeout(() => {
      gbaAudio.playBootChime();
      setSparkleActive(true);
    }, 680);

    // 2. Reveal Nintendo badge & cartridge status at 900ms
    const badgeTimer = setTimeout(() => {
      setNintendoVisible(true);
    }, 900);

    // 3. Complete boot sequence and transition at 2200ms
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(chimeTimer);
      clearTimeout(badgeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      className="absolute inset-0 flex flex-col items-center justify-between p-3 sm:p-5 md:p-6 bg-[#f7f9fd] text-slate-900 select-none overflow-hidden cursor-pointer z-30"
      id="gba-boot-screen-overlay"
      title="Tap or press A to skip boot sequence"
    >
      {/* Background Subtle LCD Pixel Matrix / Scanlines */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px] opacity-25" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-300/20" />

      {/* Top Header: Boot Status / Memory Verification */}
      <div className="relative z-10 flex w-full items-center justify-between text-[7px] min-[380px]:text-[8px] sm:text-[10px] font-mono text-slate-400">
        <span className="tracking-wider uppercase font-semibold">
          {isRestart ? 'SYS_REBOOT // WARM RESET' : 'SYS_INIT // COLD BOOT'}
        </span>
        <span className="text-emerald-600 font-bold">VRAM 60Hz OK</span>
      </div>

      {/* Center: The Iconic Animated GBA Logo */}
      <div className="relative z-10 flex flex-col items-center my-auto animate-gba-drop">
        {/* Main "GAME BOY" Title with Rainbow Sheen & Retro Styling */}
        <div className="relative flex items-center">
          <h1
            className="font-black italic tracking-tighter text-2xl min-[380px]:text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#26307a] select-none"
            style={{
              fontFamily: '"Arial Black", Impact, sans-serif',
              textShadow: '0 2px 4px rgba(38,48,122,0.18)',
            }}
          >
            <span className="inline-block tracking-tight bg-gradient-to-r from-[#21276b] via-[#3543b5] to-[#21276b] bg-clip-text text-transparent animate-gba-sheen">
              GAME BOY
            </span>
          </h1>

          {/* Golden 4-Point Star Sparkle at Top-Right of "GAME BOY" */}
          {sparkleActive && (
            <div className="absolute -top-2 -right-3 sm:-top-3 sm:-right-5 pointer-events-none animate-gba-sparkle">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                fill="currentColor"
              >
                {/* 4-point diamond star */}
                <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" />
              </svg>
            </div>
          )}
        </div>

        {/* Sub-Banner: Horizontal Rules flanking ADVANCE */}
        <div className="mt-1 sm:mt-1.5 flex items-center gap-2 sm:gap-3 w-full justify-center">
          <div className="h-[2px] w-6 min-[380px]:w-10 sm:w-16 bg-gradient-to-r from-transparent via-[#4b58c7] to-[#26307a]" />
          <span
            className="font-black italic text-[9px] min-[380px]:text-xs sm:text-sm md:text-base tracking-[0.25em] text-[#3f4cae] uppercase select-none"
            style={{ fontFamily: 'sans-serif' }}
          >
            A D V A N C E
          </span>
          <div className="h-[2px] w-6 min-[380px]:w-10 sm:w-16 bg-gradient-to-l from-transparent via-[#4b58c7] to-[#26307a]" />
        </div>

        {/* Archer's Duel Custom Cartridge Badge */}
        <div className="mt-2 sm:mt-2.5 flex items-center gap-1.5 rounded bg-slate-200/80 px-2 py-0.5 border border-slate-300 shadow-sm">
          <span className="text-[8px] min-[380px]:text-[9px] sm:text-xs font-mono font-bold text-slate-700 tracking-wider">
            ARCHER&apos;S DUEL
          </span>
        </div>
      </div>

      {/* Bottom Footer: Nintendo Brand Badge & Cartridge Verification */}
      <div className="relative z-10 flex flex-col items-center gap-1 sm:gap-1.5 text-center">
        <div
          className={`transition-all duration-300 transform ${
            nintendoVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          {/* Authentic Nintendo Classic Red Oval Badge */}
          <div className="inline-flex items-center rounded-full bg-[#e60012] px-2.5 sm:px-3 py-0.5 shadow-sm">
            <span
              className="font-bold text-[8px] min-[380px]:text-[9px] sm:text-[11px] text-white tracking-widest uppercase select-none"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Nintendo®
            </span>
          </div>
        </div>

        {/* Skip instruction prompt */}
        <div className="font-mono text-[7px] min-[380px]:text-[8px] sm:text-[9px] font-semibold text-slate-400 animate-pulse mt-0.5">
          ► TAP SCREEN OR PRESS [A] TO SKIP ◄
        </div>
      </div>
    </div>
  );
};
