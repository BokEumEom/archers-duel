import React, { useMemo } from 'react';
import { Wind, ArrowLeft, ArrowRight, Compass } from 'lucide-react';
import { WindState, GameState } from '../types';

interface WindMeterProps {
  wind: WindState;
  currentRound?: number;
  gameState?: GameState;
  className?: string;
}

export const WindMeter: React.FC<WindMeterProps> = ({
  wind,
  currentRound = 1,
  gameState,
  className = '',
}) => {
  const { speed, displaySpeed, direction } = wind;

  // Maximum scale reference: ±12 knots (standard match range)
  const maxKnots = 12;
  const clampedSpeed = Math.max(-maxKnots, Math.min(maxKnots, speed));
  const fillPercent = (Math.abs(clampedSpeed) / maxKnots) * 50; // 0 to 50% from center

  // Tactical description and trajectory guidance
  const tacticalInfo = useMemo(() => {
    if (speed > 0) {
      return {
        label: 'TAILWIND',
        directionText: 'EAST (Blowing Right)',
        colorText: 'text-cyan-400',
        badgeBg: 'bg-cyan-950/80 border-cyan-700/60 text-cyan-300',
        trajectoryNote: 'Pushes player arrows +farther toward enemy. Aim slightly lower or reduce power.',
        driftSign: `+${speed}`,
      };
    }
    if (speed < 0) {
      return {
        label: 'HEADWIND',
        directionText: 'WEST (Blowing Left)',
        colorText: 'text-amber-400',
        badgeBg: 'bg-amber-950/80 border-amber-700/60 text-amber-300',
        trajectoryNote: 'Drags player arrows back. Aim higher or apply increased power to reach target.',
        driftSign: `${speed}`,
      };
    }
    return {
      label: 'CALM',
      directionText: 'NO DRIFT (Still Air)',
      colorText: 'text-emerald-400',
      badgeBg: 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300',
      trajectoryNote: 'True ballistic parabolic trajectory with zero horizontal wind deflection.',
      driftSign: '0',
    };
  }, [speed]);

  // Tick marks for graphical gauge
  const ticks = [-12, -8, -4, 0, 4, 8, 12];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-stone-800 bg-stone-900/95 p-2.5 sm:p-3 shadow-xl backdrop-blur select-none ${className}`}
      id="main-wind-meter"
    >
      {/* Top Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-stone-800/80 pb-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-stone-800/90 text-cyan-400 shadow-inner">
            <Wind className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${displaySpeed > 0 ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] sm:text-xs font-black tracking-wider text-stone-200">
                WIND METER
              </span>
              <span className="rounded bg-stone-800 px-1.5 py-0.2 font-mono text-[9px] font-bold text-stone-400">
                ROUND {currentRound}
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-stone-400">
              Persistent crosswind for current round
            </span>
          </div>
        </div>

        {/* Numerical Readout Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono text-[10px] sm:text-xs font-bold ${tacticalInfo.badgeBg}`}
          >
            {speed < 0 ? (
              <ArrowLeft className="h-3 w-3" />
            ) : speed > 0 ? (
              <ArrowRight className="h-3 w-3" />
            ) : (
              <Compass className="h-3 w-3" />
            )}
            <span>{tacticalInfo.label}</span>
            <span className="opacity-75">({tacticalInfo.driftSign} KTS)</span>
          </div>

          <div className="flex items-baseline gap-0.5 rounded-md bg-stone-950 px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono shadow-inner">
            <span className="text-sm sm:text-base font-black text-cyan-400">{displaySpeed}</span>
            <span className="text-[9px] sm:text-[10px] font-semibold text-stone-400">KTS</span>
          </div>
        </div>
      </div>

      {/* Graphical Bi-Directional Gauge */}
      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between font-mono text-[9px] sm:text-[10px] font-bold text-stone-400">
          <span className="flex items-center gap-0.5 text-amber-400/90">
            <ArrowLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span>WEST (Headwind)</span>
          </span>
          <span className="text-stone-300 font-semibold">{tacticalInfo.directionText}</span>
          <span className="flex items-center gap-0.5 text-cyan-400/90">
            <span>EAST (Tailwind)</span>
            <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </span>
        </div>

        {/* Track Container */}
        <div className="relative h-5 sm:h-6 w-full overflow-hidden rounded-lg border border-stone-800 bg-[#0c1017] p-0.5 shadow-inner">
          {/* Background grid / tick divisions */}
          <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            {ticks.map((t) => (
              <div key={t} className="flex flex-col items-center">
                <div
                  className={`w-0.5 ${
                    t === 0
                      ? 'h-full bg-amber-400/80 shadow-[0_0_4px_#f59e0b]'
                      : 'h-2 bg-stone-700/60'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Active Meter Fill: Expanding from center (50%) Left or Right */}
          {speed < 0 && (
            <div
              className="absolute top-0.5 bottom-0.5 right-1/2 rounded-l bg-gradient-to-l from-cyan-500 via-sky-400 to-amber-400 shadow-[0_0_10px_rgba(56,189,248,0.6)] transition-all duration-300 flex items-center justify-start pl-1"
              style={{ width: `${fillPercent}%` }}
            >
              <div className="flex items-center gap-0.5 text-[8px] font-mono font-black text-black/80">
                <span>◄</span>
              </div>
            </div>
          )}

          {speed > 0 && (
            <div
              className="absolute top-0.5 bottom-0.5 left-1/2 rounded-r bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-300 shadow-[0_0_10px_rgba(56,189,248,0.6)] transition-all duration-300 flex items-center justify-end pr-1"
              style={{ width: `${fillPercent}%` }}
            >
              <div className="flex items-center gap-0.5 text-[8px] font-mono font-black text-black/80">
                <span>►</span>
              </div>
            </div>
          )}

          {/* Center 0 Pin Indicator */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none z-10">
            <div
              className={`h-2.5 w-2.5 rounded-full border-2 border-stone-900 ${
                speed === 0
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-amber-400 shadow-[0_0_5px_#f59e0b]'
              }`}
            />
          </div>
        </div>

        {/* Tick labels */}
        <div className="flex items-center justify-between px-1 font-mono text-[8px] sm:text-[9px] text-stone-400">
          <span>-12</span>
          <span>-8</span>
          <span>-4</span>
          <span className="font-bold text-amber-400">0</span>
          <span>+4</span>
          <span>+8</span>
          <span>+12</span>
        </div>
      </div>

      {/* Ballistics Tactical Tip */}
      <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-stone-950/70 px-2 py-1.5 text-[9px] sm:text-[10px] text-stone-400">
        <span className="font-mono font-bold text-stone-400 shrink-0">TACTICS:</span>
        <span className="text-stone-300">{tacticalInfo.trajectoryNote}</span>
      </div>
    </div>
  );
};
