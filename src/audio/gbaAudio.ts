/**
 * GBA Sound Chip Synthesizer
 * Emulates the Game Boy Advance sound channels:
 * - Channel 1 & 2: Square wave PSG with sweep and envelope
 * - Channel 3: Programmable 4-bit Waveform
 * - Channel 4: White/Periodic Noise generator
 */

class GbaAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Sound 1: UI Cursor Beep (GBA menu navigation)
   */
  public playMenuBeep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  /**
   * Sound 2: Bow Drawing / String Tension
   */
  public playBowDraw() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(360, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  /**
   * Sound 3: Arrow Release Whoosh
   */
  public playArrowRelease() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Pitch sweep down + noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  /**
   * Sound 4: Body Hit
   */
  public playHitBody() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    // Flesh impact: low square thud + noise burst
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * Sound 5: Headshot Critical Hit
   */
  public playHeadshot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Chime 1
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(1046.5, t); // C6
    gain1.gain.setValueAtTime(0.15, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.35);

    // Chime 2
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1567.98, t + 0.08); // G6
    gain2.gain.setValueAtTime(0.18, t + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.45);
  }

  /**
   * Sound 6: Arrow hitting dirt / stone wall
   */
  public playThud() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  /**
   * Sound 7: Round Victory Fanfare
   */
  public playVictoryFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.12 }, // G5
      { f: 1046.5, d: 0.4 },  // C6
    ];

    let t = this.ctx.currentTime;
    notes.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 0.9;
    });
  }

  /**
   * Sound 8: Round Defeat Tone
   */
  public playDefeatTone() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [
      { f: 440.0, d: 0.18 }, // A4
      { f: 415.3, d: 0.18 }, // G#4
      { f: 392.0, d: 0.22 }, // G4
      { f: 349.23, d: 0.5 }, // F4
    ];

    let t = this.ctx.currentTime;
    notes.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d);
      t += note.d * 0.95;
    });
  }

  /**
   * Sound 9: Iconic Game Boy Advance Boot Arpeggio & Crystal Chime ("Bling!")
   */
  public playBootChime() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;

      // 1. Initial ascending arpeggio sweep as the GBA logo drops down
      const arpNotes = [
        { f: 349.23, delay: 0.0, dur: 0.1 },  // F4
        { f: 440.0, delay: 0.06, dur: 0.1 },  // A4
        { f: 523.25, delay: 0.12, dur: 0.1 }, // C5
        { f: 698.46, delay: 0.18, dur: 0.1 }, // F5
        { f: 880.0, delay: 0.24, dur: 0.1 },  // A5
        { f: 1046.5, delay: 0.30, dur: 0.12 } // C6
      ];

      arpNotes.forEach(({ f, delay, dur }) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, t + delay);

        gain.gain.setValueAtTime(0.04, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + delay);
        osc.stop(t + delay + dur);
      });

      // 2. The famous GBA signature crystal double-chime at ~0.68s
      const chimeTime = t + 0.68;

      // Bell Fundamental (C7 - 2093 Hz)
      const bell1 = this.ctx.createOscillator();
      const bellGain1 = this.ctx.createGain();
      bell1.type = 'sine';
      bell1.frequency.setValueAtTime(2093.0, chimeTime);
      bellGain1.gain.setValueAtTime(0.25, chimeTime);
      bellGain1.gain.exponentialRampToValueAtTime(0.0005, chimeTime + 1.25);
      bell1.connect(bellGain1);
      bellGain1.connect(this.ctx.destination);
      bell1.start(chimeTime);
      bell1.stop(chimeTime + 1.25);

      // Bell Harmonic sparkle (G7 - 3135.96 Hz)
      const bell2 = this.ctx.createOscillator();
      const bellGain2 = this.ctx.createGain();
      bell2.type = 'sine';
      bell2.frequency.setValueAtTime(3135.96, chimeTime + 0.02);
      bellGain2.gain.setValueAtTime(0.18, chimeTime + 0.02);
      bellGain2.gain.exponentialRampToValueAtTime(0.0005, chimeTime + 0.95);
      bell2.connect(bellGain2);
      bellGain2.connect(this.ctx.destination);
      bell2.start(chimeTime + 0.02);
      bell2.stop(chimeTime + 0.95);

      // Warm retro body resonance (C6 / E6 chime)
      const bell3 = this.ctx.createOscillator();
      const bellGain3 = this.ctx.createGain();
      bell3.type = 'triangle';
      bell3.frequency.setValueAtTime(1318.51, chimeTime); // E6
      bellGain3.gain.setValueAtTime(0.12, chimeTime);
      bellGain3.gain.exponentialRampToValueAtTime(0.0005, chimeTime + 0.7);
      bell3.connect(bellGain3);
      bellGain3.connect(this.ctx.destination);
      bell3.start(chimeTime);
      bell3.stop(chimeTime + 0.7);
    } catch (_) {}
  }
}

export const gbaAudio = new GbaAudioEngine();
