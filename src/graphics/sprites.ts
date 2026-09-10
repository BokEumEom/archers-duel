import { EnemyDesignId } from '../types';

/**
 * Medieval Pixel Art Sprites & Palettes
 * Hand-crafted with authentic Game Boy Advance 16-color palette restrictions (BGR555 / 15-bit color).
 */

export const GBA_PALETTE = {
  // Player Palette (Robin Hood / Sherwood Archer)
  playerTunic: '#2d6a4f',
  playerTunicDark: '#1b4332',
  playerFeather: '#e9c46a',
  playerSkin: '#ffd166',
  playerBoots: '#6f4e37',
  playerBow: '#a0522d',
  playerBowString: '#e0e1dd',

  // Enemy Palettes (Stag Helm Champion, Shadow Ranger, Teutonic, Royal)
  stagPlate: '#8d99ae',
  stagPlateDark: '#4a5568',
  stagPlateLight: '#edf2f4',
  stagAntlers: '#d4a373',
  stagAntlersDark: '#8b5e34',
  stagTabard: '#9b2226',
  stagTrim: '#d4af37',

  enemyArmor: '#780000',
  enemyArmorDark: '#400000',
  enemyHelm: '#6c757d',
  enemyPlume: '#c1121f',
  enemySkin: '#f4a261',
  enemyBoots: '#212529',
  enemyBow: '#4a2810',

  // Dusk Environment Palettes
  duskSky1: '#111428',
  duskSky2: '#2b1b3d',
  duskSky3: '#5c2443',
  duskSky4: '#9e3b2e',
  duskSky5: '#de6b35',
  duskSky6: '#f7b045',
  mtnDuskFar: '#251d38',
  mtnDuskMid: '#3d2645',
  pinesDusk: '#1a2d28',
  pinesDuskLight: '#243d36',
  stoneGround: '#343a40',
  stoneGroundLight: '#495057',
  stoneFlagstone: '#6c757d',
  stoneCrest: '#edf2f4',
  stoneDark: '#2b2d42',
  stoneLight: '#8d99ae',
  flagRed: '#d90429',
  flagGold: '#ffb703',

  // UI & Effects
  uiDark: '#0d1b2a',
  uiPanel: '#1b263b',
  uiBorder: '#415a77',
  uiText: '#e0e1dd',
  uiGold: '#fca311',
  uiRed: '#e63946',
  uiGreen: '#06d6a0',
  arrowSteel: '#ced4da',
  arrowWood: '#8d5b4c',
};

/**
 * Draw medieval archer on canvas with rich equipment and distinctive enemy designs
 */
export function drawArcher(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isPlayer: boolean,
  pose: 'IDLE' | 'DRAW' | 'RELEASE' | 'HIT' | 'VICTORY' | 'DEFEAT',
  angle: number,
  power: number,
  hitReactionTimer: number = 0,
  customImage?: HTMLImageElement | null,
  enemyDesign: EnemyDesignId = 'STAG_HELM'
) {
  ctx.save();
  ctx.translate(x, y);

  if (!isPlayer) {
    ctx.scale(-1, 1); // Flip horizontally for enemy facing left
  }

  // If Sprite Fusion generated a custom image for this character, render it
  if (customImage && customImage.complete && customImage.naturalWidth > 0) {
    ctx.drawImage(customImage, -16, -32, 32, 32);
    ctx.restore();
    return;
  }

  // Color & equipment palettes
  const p = isPlayer ? {
    tunic: GBA_PALETTE.playerTunic,
    tunicDark: GBA_PALETTE.playerTunicDark,
    feather: GBA_PALETTE.playerFeather,
    skin: GBA_PALETTE.playerSkin,
    boots: GBA_PALETTE.playerBoots,
    bow: GBA_PALETTE.playerBow,
  } : enemyDesign === 'STAG_HELM' ? {
    tunic: GBA_PALETTE.stagTabard,
    tunicDark: '#660708',
    feather: GBA_PALETTE.stagTrim,
    skin: GBA_PALETTE.stagPlate,
    boots: GBA_PALETTE.stagPlateDark,
    bow: '#3c1518',
  } : enemyDesign === 'SHADOW_RANGER' ? {
    tunic: '#1b1d36',
    tunicDark: '#0e101f',
    feather: '#4361ee',
    skin: '#f1faee',
    boots: '#0d1322',
    bow: '#2b2d42',
  } : enemyDesign === 'TEUTONIC_KNIGHT' ? {
    tunic: '#e9ecef',
    tunicDark: '#ced4da',
    feather: '#212529',
    skin: '#adb5bd',
    boots: '#343a40',
    bow: '#5c4033',
  } : {
    tunic: '#1b4332',
    tunicDark: '#081c15',
    feather: '#ffb703',
    skin: '#f4a261',
    boots: '#4a2810',
    bow: '#d4af37',
  };

  // Shake offset if currently hit
  let shakeX = 0;
  let shakeY = 0;
  if (hitReactionTimer > 0) {
    shakeX = (Math.random() - 0.5) * 4;
    shakeY = (Math.random() - 0.5) * 4;
    ctx.translate(shakeX, shakeY);
  }

  // Defeat pose
  if (pose === 'DEFEAT') {
    ctx.fillStyle = p.boots;
    ctx.fillRect(-6, -4, 12, 4); // Legs folded
    ctx.fillStyle = p.tunic;
    ctx.fillRect(-8, -12, 14, 8); // Slumped torso
    ctx.fillStyle = p.skin;
    ctx.fillRect(4, -10, 6, 6); // Head slumped forward
    ctx.fillStyle = p.feather;
    ctx.fillRect(4, -14, 5, 4); // Hat/Helm fallen

    // Dropped bow on ground
    ctx.strokeStyle = p.bow;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(8, -2, 6, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // Victory pose
  if (pose === 'VICTORY') {
    ctx.fillStyle = p.boots;
    ctx.fillRect(-6, -6, 5, 6);
    ctx.fillRect(1, -6, 5, 6);
    ctx.fillStyle = p.tunic;
    ctx.fillRect(-6, -18, 12, 12);
    ctx.fillStyle = p.tunicDark;
    ctx.fillRect(-6, -12, 12, 2); // Belt / surcoat border

    // Armored details if Stag Helm
    if (!isPlayer && enemyDesign === 'STAG_HELM') {
      ctx.fillStyle = GBA_PALETTE.stagPlate;
      ctx.fillRect(-6, -18, 12, 7); // Steel breastplate
      ctx.fillStyle = GBA_PALETTE.stagTrim;
      ctx.fillRect(-7, -19, 4, 4); // Left pauldron
      ctx.fillRect(3, -19, 4, 4);  // Right pauldron
    }

    // Head
    ctx.fillStyle = p.skin;
    ctx.fillRect(-4, -26, 8, 8);

    // Eyes / helmet visor
    if (isPlayer) {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, -23, 2, 2);
      ctx.fillRect(-1, -20, 4, 1);
    } else if (enemyDesign === 'STAG_HELM') {
      // Greathelm visor slit
      ctx.fillStyle = '#111';
      ctx.fillRect(-3, -23, 6, 2);
    }

    // Antlers if Stag Helm in victory
    if (!isPlayer && enemyDesign === 'STAG_HELM') {
      drawAntlers(ctx, 0, -28);
    } else {
      ctx.fillStyle = p.feather;
      ctx.fillRect(-5, -29, 10, 4);
      ctx.fillRect(-6, -26, 12, 2);
    }

    // Arm raised high holding bow aloft!
    ctx.strokeStyle = p.bow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(6, -34, 8, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // 1. Legs & Boots (Armored greaves / sabatons for Stag Helm)
  ctx.fillStyle = p.boots;
  ctx.fillRect(-5, -6, 4, 6);
  ctx.fillRect(1, -6, 4, 6);
  if (!isPlayer && enemyDesign === 'STAG_HELM') {
    // Steel kneecaps
    ctx.fillStyle = GBA_PALETTE.stagPlateLight;
    ctx.fillRect(-5, -5, 4, 2);
    ctx.fillRect(1, -5, 4, 2);
  }

  // 2. Torso / Armor / Tabard
  ctx.fillStyle = p.tunic;
  ctx.fillRect(-6, -18, 12, 12);

  if (!isPlayer && enemyDesign === 'STAG_HELM') {
    // Steel Breastplate with fluted center
    ctx.fillStyle = GBA_PALETTE.stagPlate;
    ctx.fillRect(-5, -18, 10, 8);
    ctx.fillStyle = GBA_PALETTE.stagPlateLight;
    ctx.fillRect(-1, -18, 2, 7); // Center ridge specular
    // Gold-bordered crimson tabard skirt
    ctx.fillStyle = GBA_PALETTE.stagTabard;
    ctx.fillRect(-6, -10, 12, 5);
    ctx.fillStyle = GBA_PALETTE.stagTrim;
    ctx.fillRect(-6, -6, 12, 1); // Gold hem
    // Large heavy steel pauldrons (shoulder armor)
    ctx.fillStyle = GBA_PALETTE.stagPlate;
    ctx.fillRect(-8, -19, 5, 5);
    ctx.fillStyle = GBA_PALETTE.stagTrim;
    ctx.fillRect(-8, -15, 5, 1);
  } else if (!isPlayer && enemyDesign === 'TEUTONIC_KNIGHT') {
    // White surcoat with black cross
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(-5, -18, 10, 11);
    ctx.fillStyle = '#111';
    ctx.fillRect(-1, -17, 2, 8); // Vertical bar of cross
    ctx.fillRect(-4, -14, 8, 2); // Horizontal bar
  } else if (!isPlayer && enemyDesign === 'SHADOW_RANGER') {
    // Raven feather mantle on shoulder
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-7, -19, 5, 6);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -12, 12, 2);
  } else {
    // Belt & Quiver strap
    ctx.fillStyle = p.tunicDark;
    ctx.fillRect(-6, -12, 12, 2);
  }

  // Quiver on back
  ctx.fillStyle = GBA_PALETTE.arrowWood;
  ctx.fillRect(-8, -19, 4, 10);
  ctx.fillStyle = GBA_PALETTE.arrowSteel;
  ctx.fillRect(-8, -22, 2, 3);
  ctx.fillRect(-6, -21, 2, 2);

  // 3. Head & Helmet / Antlers
  if (!isPlayer && enemyDesign === 'STAG_HELM') {
    // Steel Greathelm with polished visor
    ctx.fillStyle = GBA_PALETTE.stagPlate;
    ctx.fillRect(-5, -27, 10, 9);
    ctx.fillStyle = GBA_PALETTE.stagPlateLight;
    ctx.fillRect(-5, -27, 2, 9); // Left edge shine
    // Dark cross-slit visor
    ctx.fillStyle = '#111827';
    ctx.fillRect(-4, -23, 8, 2);
    ctx.fillRect(-1, -25, 2, 6); // Nasal reinforcement
    // Gold visor rivet accents
    ctx.fillStyle = GBA_PALETTE.stagTrim;
    ctx.fillRect(-5, -20, 2, 2);
    ctx.fillRect(3, -20, 2, 2);

    // Majestic Branching Stag Antlers / Horns!
    drawAntlers(ctx, 0, -27);
  } else if (!isPlayer && enemyDesign === 'SHADOW_RANGER') {
    // Hooded cowl with bone half-mask
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-5, -28, 10, 10);
    // Bone mask
    ctx.fillStyle = '#fefae0';
    ctx.fillRect(-4, -24, 8, 5);
    ctx.fillStyle = '#06d6a0'; // Emerald eye slits
    ctx.fillRect(-2, -23, 2, 1);
    ctx.fillRect(1, -23, 2, 1);
  } else if (!isPlayer && enemyDesign === 'TEUTONIC_KNIGHT') {
    // Iron kettle hat with mail coif
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(-6, -28, 12, 4); // Kettle brim
    ctx.fillRect(-4, -30, 8, 4);  // Crown
    ctx.fillStyle = '#adb5bd';
    ctx.fillRect(-4, -24, 8, 6);  // Mail coif
    ctx.fillStyle = '#111';
    ctx.fillRect(-2, -22, 5, 2);  // Eye slit
  } else {
    // Classic Archer Head & Cap
    ctx.fillStyle = p.skin;
    ctx.fillRect(-4, -26, 8, 8);
    ctx.fillStyle = '#111';
    ctx.fillRect(1, -23, 2, 2); // Eye
    // Cap with feather
    ctx.fillStyle = p.feather;
    ctx.fillRect(-5, -29, 10, 4);
    ctx.fillRect(-6, -26, 12, 2);
    ctx.fillStyle = isPlayer ? '#d90429' : '#ffb703';
    ctx.fillRect(-2, -32, 3, 4); // Plume
  }

  // 4. Draw Bow and Arms according to aiming angle & draw state
  const rad = (angle * Math.PI) / 180;
  const bowCenterDist = 13;
  const bowX = Math.cos(rad) * bowCenterDist;
  const bowY = -14 - Math.sin(rad) * bowCenterDist;

  // Front Arm holding bow
  ctx.strokeStyle = !isPlayer && enemyDesign === 'STAG_HELM' ? GBA_PALETTE.stagPlate : p.skin;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(bowX, bowY);
  ctx.stroke();

  // Bow stave (curved arc)
  ctx.save();
  ctx.translate(bowX, bowY);
  ctx.rotate(-rad);

  ctx.strokeStyle = p.bow;
  ctx.lineWidth = !isPlayer && enemyDesign === 'STAG_HELM' ? 2.5 : 2;
  ctx.beginPath();
  ctx.arc(0, 0, 13, -Math.PI / 2.2, Math.PI / 2.2);
  ctx.stroke();

  // Brass / iron reinforcement tips on heavy bow
  if (!isPlayer && enemyDesign === 'STAG_HELM') {
    ctx.fillStyle = GBA_PALETTE.stagTrim;
    ctx.fillRect(Math.cos(-Math.PI / 2.2) * 13 - 1, Math.sin(-Math.PI / 2.2) * 13 - 1, 3, 3);
    ctx.fillRect(Math.cos(Math.PI / 2.2) * 13 - 1, Math.sin(Math.PI / 2.2) * 13 - 1, 3, 3);
  }

  // Bowstring
  ctx.strokeStyle = GBA_PALETTE.playerBowString;
  ctx.lineWidth = 1;

  // Pull back distance based on power if DRAW pose
  const pullBack = pose === 'DRAW' ? Math.min(9, (power / 100) * 9 + 2) : 1;
  const topX = Math.cos(-Math.PI / 2.2) * 13;
  const topY = Math.sin(-Math.PI / 2.2) * 13;
  const botX = Math.cos(Math.PI / 2.2) * 13;
  const botY = Math.sin(Math.PI / 2.2) * 13;

  ctx.beginPath();
  ctx.moveTo(topX, topY);
  ctx.lineTo(-pullBack, 0);
  ctx.lineTo(botX, botY);
  ctx.stroke();

  // Nocked Arrow if DRAW or AIMING
  if (pose === 'DRAW' || pose === 'IDLE') {
    ctx.strokeStyle = GBA_PALETTE.arrowWood;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-pullBack, 0);
    ctx.lineTo(11, 0);
    ctx.stroke();

    // Arrowhead
    ctx.fillStyle = GBA_PALETTE.arrowSteel;
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(10, -2.5);
    ctx.lineTo(10, 2.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
  ctx.restore();
}

/**
 * Draw majestic branching stag antlers on helmet
 */
function drawAntlers(ctx: CanvasRenderingContext2D, centerX: number, topY: number) {
  ctx.fillStyle = GBA_PALETTE.stagAntlers;
  ctx.strokeStyle = GBA_PALETTE.stagAntlersDark;
  ctx.lineWidth = 1;

  // Left Antler (branching up and back)
  ctx.beginPath();
  ctx.moveTo(centerX - 2, topY);
  ctx.lineTo(centerX - 5, topY - 5);
  ctx.lineTo(centerX - 8, topY - 9); // Main beam
  ctx.lineTo(centerX - 10, topY - 13);
  ctx.stroke();

  // Left Brow Tine & Royal Tines
  ctx.beginPath();
  ctx.moveTo(centerX - 5, topY - 5);
  ctx.lineTo(centerX - 8, topY - 5); // Brow tine
  ctx.moveTo(centerX - 8, topY - 9);
  ctx.lineTo(centerX - 11, topY - 8); // Crown tine
  ctx.moveTo(centerX - 9, topY - 11);
  ctx.lineTo(centerX - 7, topY - 15); // Fork
  ctx.stroke();

  // Right Antler (branching forward and up)
  ctx.beginPath();
  ctx.moveTo(centerX + 2, topY);
  ctx.lineTo(centerX + 6, topY - 5);
  ctx.lineTo(centerX + 9, topY - 9); // Main beam
  ctx.lineTo(centerX + 11, topY - 13);
  ctx.stroke();

  // Right Brow Tine & Royal Tines
  ctx.beginPath();
  ctx.moveTo(centerX + 6, topY - 5);
  ctx.lineTo(centerX + 9, topY - 5); // Brow tine
  ctx.moveTo(centerX + 9, topY - 9);
  ctx.lineTo(centerX + 12, topY - 8); // Crown tine
  ctx.moveTo(centerX + 10, topY - 11);
  ctx.lineTo(centerX + 8, topY - 15); // Fork
  ctx.stroke();

  // Base crest plate
  ctx.fillStyle = GBA_PALETTE.stagTrim;
  ctx.fillRect(centerX - 3, topY - 1, 6, 2);
}

/**
 * Draw flying arrow with authentic rotating angle & fletchings
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angleRad: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);

  // Wooden shaft (13px length)
  ctx.strokeStyle = GBA_PALETTE.arrowWood;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(6, 0);
  ctx.stroke();

  // Steel arrowhead
  ctx.fillStyle = GBA_PALETTE.arrowSteel;
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(5, -2.5);
  ctx.lineTo(5, 2.5);
  ctx.closePath();
  ctx.fill();

  // Fletching feathers (white/gold)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(-7, -2.5);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(-9, 0);
  ctx.lineTo(-7, 2.5);
  ctx.lineTo(-5, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

/**
 * Draw CC0 Pixel-Art Medieval Dusk Scenery with Parallax and Flat Firing Ground
 */
export function drawScenery(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number = 0,
  windSpeed: number,
  frameTick: number,
  arenaWidth: number = 520,
  enemyX: number = 460,
  enemyDesign: EnemyDesignId = 'STAG_HELM'
) {
  const W = 240;
  const H = 160;

  // 1. Dusk Sky Gradient (tall gradient to support camera looking up at high shots)
  // When cameraY is negative (looking up), the upper cosmic dusk indigo is revealed!
  const skyTopY = -120 - cameraY * 0.6;
  const skyBottomY = 112 - cameraY * 0.6;
  const skyGrad = ctx.createLinearGradient(0, skyTopY, 0, skyBottomY);
  skyGrad.addColorStop(0.0, GBA_PALETTE.duskSky1); // Cosmic midnight indigo (#111428)
  skyGrad.addColorStop(0.2, GBA_PALETTE.duskSky2); // Twilight plum (#2b1b3d)
  skyGrad.addColorStop(0.45, GBA_PALETTE.duskSky3); // Dusk crimson (#5c2443)
  skyGrad.addColorStop(0.7, GBA_PALETTE.duskSky4); // Burnt sienna (#9e3b2e)
  skyGrad.addColorStop(0.88, GBA_PALETTE.duskSky5); // Glowing dusk amber (#de6b35)
  skyGrad.addColorStop(1.0, GBA_PALETTE.duskSky6); // Warm sunset gold (#f7b045)
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. High Stratosphere Stars & Crescent Moon (visible on high shots and upper sky)
  // Twinkling stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 28; i++) {
    const starX = ((i * 37 + 13) - cameraX * 0.03) % W;
    const drawStarX = starX < 0 ? starX + W : starX;
    const starY = (15 + (i * 17) % 55) - cameraY * 0.15;
    if (starY >= 0 && starY <= 85) {
      const twinkle = (frameTick + i * 11) % 40 > 30 ? 1 : 2;
      ctx.fillRect(drawStarX, starY, twinkle, twinkle);
    }
  }

  // Silver-amber crescent moon
  const moonX = 185 - (cameraX * 0.04);
  const moonY = 22 - (cameraY * 0.12);
  if (moonX > -20 && moonX < W + 20) {
    ctx.fillStyle = '#fefae0';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 7, 0, Math.PI * 2);
    ctx.fill();
    // Cut out crescent shape using twilight sky color
    ctx.fillStyle = GBA_PALETTE.duskSky2;
    ctx.beginPath();
    ctx.arc(moonX + 3, moonY - 1, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Parallax Layer 1: Distant Jagged Mountains (Deep Twilight Violet)
  const mtn1Offset = cameraX * 0.08;
  const mtn1Y = 82 - cameraY * 0.15;
  ctx.fillStyle = GBA_PALETTE.mtnDuskFar;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, mtn1Y + 10);
  for (let x = 0; x <= W + 40; x += 30) {
    const peakIdx = Math.floor((x + mtn1Offset) / 30);
    const peakHeight = ((peakIdx * 43) % 24) - 12;
    ctx.lineTo(x - (mtn1Offset % 30), mtn1Y + peakHeight);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // 4. Parallax Layer 2: Mid-range Warm Misty Ridge
  const mtn2Offset = cameraX * 0.20;
  const mtn2Y = 94 - cameraY * 0.3;
  ctx.fillStyle = GBA_PALETTE.mtnDuskMid;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, mtn2Y + 8);
  for (let x = 0; x <= W + 50; x += 25) {
    const ridgeIdx = Math.floor((x + mtn2Offset) / 25);
    const ridgeH = ((ridgeIdx * 31) % 18) - 8;
    ctx.lineTo(x - (mtn2Offset % 25), mtn2Y + ridgeH);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();

  // 5. Parallax Layer 3: Distant Pine Forest Treeline
  const pineOffset = cameraX * 0.40;
  const pineY = 104 - cameraY * 0.5;
  ctx.fillStyle = GBA_PALETTE.pinesDusk;
  for (let x = -20; x <= W + 30; x += 14) {
    const px = x - (pineOffset % 14);
    const pTreeH = 12 + ((Math.floor((x + pineOffset) / 14) * 7) % 8);
    ctx.beginPath();
    ctx.moveTo(px, pineY + 4);
    ctx.lineTo(px + 7, pineY - pTreeH);
    ctx.lineTo(px + 14, pineY + 4);
    ctx.closePath();
    ctx.fill();
  }

  // 6. FLAT FIRING GROUND: Castle Ramparts / Flat Tournament Bridge
  // "keeping the firing ground flat"
  // Floor y = 108 in world coordinates; transforms with camera
  const groundY = 108 - cameraY;

  // Ground body: dark medieval stone masonry down to bottom of screen
  ctx.fillStyle = GBA_PALETTE.stoneGround;
  ctx.fillRect(0, groundY, W, H - groundY);

  // Ground top flagstone curb
  ctx.fillStyle = GBA_PALETTE.stoneGroundLight;
  ctx.fillRect(0, groundY, W, 3);
  ctx.fillStyle = GBA_PALETTE.stoneFlagstone;
  ctx.fillRect(0, groundY + 3, W, 2);

  // Vertical mortar lines on flagstones (moves 1:1 with cameraX)
  ctx.fillStyle = '#1e2022';
  const mortarStep = 18;
  const mortarStart = -(cameraX % mortarStep);
  for (let mx = mortarStart; mx < W + mortarStep; mx += mortarStep) {
    ctx.fillRect(mx, groundY, 1, 10);
    // Brick pattern below
    ctx.fillRect(mx + 9, groundY + 10, 1, 14);
    ctx.fillRect(mx, groundY + 24, 1, 14);
  }

  // 7. Distance Milestone Markers along the flat ground
  // Render carved stone milestone stakes every 100 paces (at x = 100, 200, 300, 400, 500)
  for (let dist = 100; dist < arenaWidth; dist += 100) {
    const markerScreenX = dist - cameraX;
    if (markerScreenX >= -20 && markerScreenX <= W + 20) {
      // Carved stone milestone post
      ctx.fillStyle = GBA_PALETTE.stoneLight;
      ctx.fillRect(markerScreenX - 4, groundY - 12, 8, 14);
      ctx.fillStyle = GBA_PALETTE.stoneCrest;
      ctx.fillRect(markerScreenX - 4, groundY - 14, 8, 2); // Rounded top

      // Engraved distance text on stone
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${dist}`, markerScreenX, groundY - 4);

      // Signal flag post on the milestone
      ctx.strokeStyle = '#4a2810';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(markerScreenX + 3, groundY - 12);
      ctx.lineTo(markerScreenX + 3, groundY - 24);
      ctx.stroke();

      // Fluttering pennant
      const flagWave = Math.sin(frameTick * 0.15 + dist) * 2;
      const fDir = Math.sign(windSpeed || 1);
      ctx.fillStyle = dist % 200 === 0 ? GBA_PALETTE.flagGold : GBA_PALETTE.flagRed;
      ctx.beginPath();
      ctx.moveTo(markerScreenX + 3, groundY - 24);
      ctx.lineTo(markerScreenX + 3 + fDir * 10, groundY - 21 + flagWave);
      ctx.lineTo(markerScreenX + 3, groundY - 18);
      ctx.closePath();
      ctx.fill();
    }
  }

  // 8. Player Fortress (Left Rampart Tower)
  const leftX = 20 - cameraX;
  if (leftX > -60 && leftX < W + 60) {
    // Main stone tower structure
    ctx.fillStyle = GBA_PALETTE.stoneDark;
    ctx.fillRect(leftX - 35, groundY, 65, H - groundY);

    // Battlements & crenellations
    ctx.fillStyle = GBA_PALETTE.stoneLight;
    ctx.fillRect(leftX - 35, groundY - 8, 12, 8);
    ctx.fillRect(leftX - 15, groundY - 8, 12, 8);
    ctx.fillRect(leftX + 5, groundY - 8, 12, 8);

    // Torch brazier with flickering flame & smoke
    const torchX = leftX - 25;
    const torchY = groundY - 14;
    ctx.fillStyle = '#212529';
    ctx.fillRect(torchX - 2, torchY, 5, 6);
    // Flickering fire
    const fTick = (frameTick * 0.2) % 4;
    ctx.fillStyle = fTick > 2 ? '#ffb703' : '#fb8500';
    ctx.fillRect(torchX - 2, torchY - 4 - Math.sin(frameTick * 0.3) * 2, 5, 4);
    ctx.fillStyle = '#ff006e';
    ctx.fillRect(torchX - 1, torchY - 2, 3, 2);

    // Player Golden Lion Banner
    const pWave = Math.sin(frameTick * 0.1) * 3;
    ctx.strokeStyle = '#2b2d42';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftX - 30, groundY - 8);
    ctx.lineTo(leftX - 30, groundY - 32);
    ctx.stroke();

    ctx.fillStyle = GBA_PALETTE.flagGold;
    ctx.beginPath();
    ctx.moveTo(leftX - 30, groundY - 30);
    ctx.lineTo(leftX - 30 + Math.sign(windSpeed || 1) * 16, groundY - 25 + pWave);
    ctx.lineTo(leftX - 30, groundY - 18);
    ctx.closePath();
    ctx.fill();
  }

  // 9. Enemy Fortress (Right Rampart Tower at enemyX)
  const rightX = enemyX - cameraX;
  if (rightX > -60 && rightX < W + 60) {
    ctx.fillStyle = GBA_PALETTE.stoneDark;
    ctx.fillRect(rightX - 25, groundY, 65, H - groundY);

    // Battlements & crenellations
    ctx.fillStyle = GBA_PALETTE.stoneLight;
    ctx.fillRect(rightX - 25, groundY - 8, 12, 8);
    ctx.fillRect(rightX - 5, groundY - 8, 12, 8);
    ctx.fillRect(rightX + 15, groundY - 8, 12, 8);

    // Iron torch brazier
    const eTorchX = rightX + 22;
    const eTorchY = groundY - 14;
    ctx.fillStyle = '#212529';
    ctx.fillRect(eTorchX - 2, eTorchY, 5, 6);
    const efTick = (frameTick * 0.25) % 4;
    ctx.fillStyle = efTick > 2 ? '#ffb703' : '#d90429';
    ctx.fillRect(eTorchX - 2, eTorchY - 4 - Math.sin(frameTick * 0.35) * 2, 5, 4);

    // Enemy Heraldic Banner (Stag Helm: Crimson banner with stag antler emblem)
    const eWave = Math.sin(frameTick * 0.12) * 3;
    ctx.strokeStyle = '#2b2d42';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rightX + 26, groundY - 8);
    ctx.lineTo(rightX + 26, groundY - 32);
    ctx.stroke();

    ctx.fillStyle = enemyDesign === 'STAG_HELM' ? GBA_PALETTE.flagRed : '#1b1d36';
    ctx.beginPath();
    ctx.moveTo(rightX + 26, groundY - 30);
    ctx.lineTo(rightX + 26 + Math.sign(windSpeed || 1) * 16, groundY - 25 + eWave);
    ctx.lineTo(rightX + 26, groundY - 18);
    ctx.closePath();
    ctx.fill();

    // Antler crest on banner if Stag Helm
    if (enemyDesign === 'STAG_HELM') {
      ctx.fillStyle = GBA_PALETTE.stagTrim;
      ctx.fillRect(rightX + 26 + Math.sign(windSpeed || 1) * 6, groundY - 26 + eWave * 0.5, 4, 3);
    }
  }
}

/**
 * Draw small dry golden ochre oak leaf drifting sideways in autumn wind.
 * Simple asymmetrical pointed silhouette with short thin stem and two darker ochre vein accents.
 * Muted amber and warm brown palette, compact shape.
 */
export function drawOakLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number = 0,
  flip: boolean = false
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  if (flip) ctx.scale(-1, 1);

  // Short thin stem (warm brown)
  ctx.strokeStyle = '#6e4414';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-5, 2);
  ctx.lineTo(-2, 0);
  ctx.stroke();

  // Asymmetrical pointed silhouette (golden ochre & muted amber)
  ctx.fillStyle = '#c88a2a'; // Golden ochre body
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.quadraticCurveTo(0, -3, 3, -4);
  ctx.lineTo(6, -1); // Upper lobe
  ctx.lineTo(8, 0);  // Pointed tip
  ctx.lineTo(5, 3);  // Lower lobe
  ctx.quadraticCurveTo(2, 4, 0, 3);
  ctx.closePath();
  ctx.fill();

  // Darker warm amber shading on upper rim
  ctx.fillStyle = '#b6751c';
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.quadraticCurveTo(0, -3, 3, -4);
  ctx.lineTo(5, -2);
  ctx.lineTo(1, -1);
  ctx.closePath();
  ctx.fill();

  // Two darker ochre vein accents
  ctx.strokeStyle = '#7c4d16';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  // Central midrib
  ctx.moveTo(-1, 0);
  ctx.lineTo(6, 0);
  // Upper vein accent
  ctx.moveTo(2, 0);
  ctx.lineTo(4, -2);
  // Lower vein accent
  ctx.moveTo(3, 0);
  ctx.lineTo(4, 2);
  ctx.stroke();

  ctx.restore();
}

