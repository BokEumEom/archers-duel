import { Difficulty, WindState } from '../types';
import { GRAVITY, WIND_FACTOR } from './physics';

export interface AiAimDecision {
  targetAngle: number;
  targetPower: number;
}

export class EnemyArcherAi {
  private lastShotDistanceError: number | null = null; // positive = overshoot, negative = undershoot

  public recordLastShot(landedX: number, playerX: number) {
    // Player is at playerX (approx 20). Enemy is at approx 220.
    // If landedX > playerX, the shot landed to the right of player (short for enemy)
    // If landedX < playerX, the shot went behind player (overshot)
    this.lastShotDistanceError = playerX - landedX; // positive = overshot player, negative = fell short
  }

  public resetMemory() {
    this.lastShotDistanceError = null;
  }

  /**
   * Calculate angle and power with believable human errors
   */
  public calculateShot(
    enemyX: number,
    enemyY: number,
    playerX: number,
    playerY: number,
    wind: WindState,
    difficulty: Difficulty
  ): AiAimDecision {
    const dx = Math.abs(enemyX - playerX); // Horizontal distance (e.g. 200px)
    const dy = enemyY - playerY; // Vertical difference (both roughly 106px)

    // Base ideal ballistic trajectory calculation
    // Standard GBA optimal launch angle is usually 35 to 55 degrees
    let baseAngle = 45;
    // Ballistic formula speed: v^2 = (g * dx^2) / (2 * cos^2(theta) * (dx * tan(theta) - dy))
    const rad = (baseAngle * Math.PI) / 180;
    const denom = 2 * Math.pow(Math.cos(rad), 2) * (dx * Math.tan(rad) - dy);
    let idealSpeed = Math.sqrt((GRAVITY * Math.pow(dx, 2)) / Math.max(0.1, denom));

    // Convert speed back to power (speed range 2.5 to 10.7)
    let idealPower = ((idealSpeed - 2.5) / 8.2) * 100;
    idealPower = Math.max(20, Math.min(100, idealPower));

    // Wind compensation calculation:
    // Estimated time of flight: t = dx / (v * cos(theta))
    const flightTime = dx / (idealSpeed * Math.cos(rad));
    // Wind drift = 0.5 * (wind.speed * WIND_FACTOR) * t^2
    // For enemy shooting left (-x), a positive wind pushes arrow right (opposing shot, i.e. headwind)
    const windDrift = 0.5 * (wind.speed * WIND_FACTOR) * Math.pow(flightTime, 2);

    let windCompensationFactor = 0;
    let angleNoise = 0;
    let powerNoise = 0;

    switch (difficulty) {
      case 'NOVICE':
        // Squire: Barely understands wind, makes noticeable angle/power errors
        windCompensationFactor = 0.15; // only adjusts 15% of wind
        angleNoise = (Math.random() - 0.5) * 24; // +/- 12 degrees
        powerNoise = (Math.random() - 0.5) * 26; // +/- 13% power
        break;

      case 'MARKSMAN':
        // Knight: Experienced archer, accounts for ~65% of wind, moderate jitter
        windCompensationFactor = 0.65;
        angleNoise = (Math.random() - 0.5) * 10; // +/- 5 degrees
        powerNoise = (Math.random() - 0.5) * 12; // +/- 6% power
        break;

      case 'MASTER':
        // Royal Champion: Deadly accuracy, accounts for ~92% of wind, fine human jitter
        windCompensationFactor = 0.92;
        angleNoise = (Math.random() - 0.5) * 4; // +/- 2 degrees
        powerNoise = (Math.random() - 0.5) * 5; // +/- 2.5% power
        break;
    }

    // Adjust power for wind:
    // If wind pushes right (wind.speed > 0), headwind requires MORE power to reach player on left
    const windPowerAdjust = (windDrift * windCompensationFactor * 0.4);
    let finalPower = idealPower + windPowerAdjust + powerNoise;
    let finalAngle = baseAngle + angleNoise;

    // Apply memory correction from last shot (if available)
    if (this.lastShotDistanceError !== null) {
      // If overshot, reduce power slightly; if fell short, increase power
      const memoryCorrection = this.lastShotDistanceError * (difficulty === 'MASTER' ? 0.35 : difficulty === 'MARKSMAN' ? 0.2 : 0.08);
      finalPower -= memoryCorrection;
    }

    // Clamp values to realistic GBA game ranges
    finalAngle = Math.round(Math.max(15, Math.min(80, finalAngle)));
    finalPower = Math.round(Math.max(20, Math.min(100, finalPower)));

    return {
      targetAngle: finalAngle,
      targetPower: finalPower,
    };
  }
}

export const enemyAi = new EnemyArcherAi();
