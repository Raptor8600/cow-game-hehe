// cow.js - Highland Cow Character Model & 360° Omnidirectional Hair Physics Engine
class HighlandCoo {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Cow Colors
    this.baseColor = '#c7662c';
    this.shadowColor = '#964417';
    this.highlightColor = '#e08343';
    this.muzzleColor = '#dd9675';
    this.nostrilColor = '#5c2a12';
    this.hornColor = '#eae0cb';

    // Expressions & State
    this.eyeOpenness = 1;
    this.isSquinting = false;
    this.eyeTargetX = 0;
    this.eyeTargetY = 0;
    this.lookX = 0;
    this.lookY = 0;
    this.blinkTimer = 0;
    this.earTwitchLeft = 0;
    this.earTwitchRight = 0;
    this.headTilt = 0;
    this.mouthOpen = 0;
    this.chewingTimer = 0;
    this.tongueBlep = 0;

    // Styling Parameters
    this.hairColor = '#c7662c';
    this.hairVolume = 1.0;

    // Accessories
    this.activeHat = null;
    this.activeGlasses = null;
    this.activeNoseRing = 'gold_septum';
    this.hairClips = [];

    // Particles
    this.particles = [];

    // Initialize 360° Directional Hair Locks
    this.initHairLocks();

    this.lastTime = performance.now();
  }

  initHairLocks() {
    this.hairLocks = [];
    const numLocks = 38;
    for (let i = 0; i < numLocks; i++) {
      const u = i / (numLocks - 1);
      const rootX = 246 + u * 308 + (Math.random() - 0.5) * 12;
      const rootY = 210 + Math.sin(u * Math.PI) * -36 + (Math.random() - 0.5) * 10;
      
      const fullLen = 175 + Math.sin(u * Math.PI) * 58 + (Math.random() * 22);
      const width = 20 + (Math.random() * 8);
      const naturalCurlX = (u - 0.5) * 42 + (Math.random() - 0.5) * 18;
      const naturalCurlY = fullLen; // initial downward length

      this.hairLocks.push({
        id: i,
        rootX,
        rootY,
        baseLength: fullLen,
        currentLength: fullLen,
        targetLength: fullLen,
        width,
        // Full 2D deflection vector
        curlX: naturalCurlX,
        curlY: naturalCurlY,
        targetCurlX: naturalCurlX,
        targetCurlY: naturalCurlY,
        naturalCurlX: naturalCurlX,
        naturalCurlY: naturalCurlY,
        curlVelX: 0,
        curlVelY: 0,
        curvature: (Math.random() - 0.5) * 25,
        texture: 'natural', // 'natural', 'straight', 'wavy', 'crimped'
        waveAmp: 6,
        waveFreq: 2.5,
        color: this.hairColor,
        layer: Math.floor(Math.random() * 3)
      });
    }
  }

  regrowHair() {
    this.hairLocks.forEach(lock => {
      lock.targetLength = lock.baseLength;
      lock.targetCurlX = lock.naturalCurlX;
      lock.targetCurlY = lock.naturalCurlY;
      lock.texture = 'natural';
      lock.waveAmp = 6;
      lock.color = this.hairColor;
    });
    this.hairVolume = 1.0;

    for (let i = 0; i < 28; i++) {
      this.particles.push({
        x: 240 + Math.random() * 320,
        y: 180 + Math.random() * 160,
        vx: (Math.random() - 0.5) * 4,
        vy: -2 - Math.random() * 4,
        life: 1.0,
        decay: 1.1,
        type: Math.random() > 0.4 ? 'sparkle' : 'water'
      });
    }
  }

  // Snip hair along 2D lock vectors
  snipAt(x, y, radius = 40) {
    let snippedAny = false;
    this.hairLocks.forEach(lock => {
      const len = Math.hypot(lock.curlX, lock.curlY) || 1;
      const ux = lock.curlX / len;
      const uy = lock.curlY / len;

      const toX = x - lock.rootX;
      const toY = y - lock.rootY;
      const proj = toX * ux + toY * uy;
      const t = Math.max(0.1, Math.min(1.0, proj / len));

      const segX = lock.rootX + lock.curlX * t;
      const segY = lock.rootY + lock.curlY * t;

      const dist = Math.hypot(x - segX, y - segY);
      if (dist < radius) {
        const cutDist = Math.max(28, proj);
        if (cutDist < len - 6) {
          const ratio = cutDist / len;
          lock.targetCurlX = lock.curlX * ratio;
          lock.targetCurlY = lock.curlY * ratio;
          lock.targetLength = cutDist;
          snippedAny = true;

          const count = 4 + Math.floor(Math.random() * 4);
          for (let p = 0; p < count; p++) {
            this.particles.push({
              x: segX + (Math.random() - 0.5) * 15,
              y: segY + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 3,
              vy: 2 + Math.random() * 3.5,
              rot: Math.random() * Math.PI,
              vRot: (Math.random() - 0.5) * 0.2,
              len: 12 + Math.random() * 15,
              color: lock.color,
              life: 1.0,
              type: 'hair'
            });
          }
        }
      }
    });

    if (snippedAny) {
      this.earTwitchLeft = 0.35;
      this.earTwitchRight = 0.35;
    }
    return snippedAny;
  }

  // 360° Omnidirectional Comb Physics: comb up, down, left, or right!
  combLockAt(x, y, dx, dy, radius = 60) {
    let movedAny = false;
    this.hairLocks.forEach(lock => {
      const len = Math.hypot(lock.curlX, lock.curlY) || 1;
      const ux = lock.curlX / len;
      const uy = lock.curlY / len;
      const proj = (x - lock.rootX) * ux + (y - lock.rootY) * uy;
      const t = Math.max(0.1, Math.min(1.0, proj / len));

      const segX = lock.rootX + lock.curlX * t;
      const segY = lock.rootY + lock.curlY * t;

      const dist = Math.hypot(x - segX, y - segY);
      if (dist < radius) {
        const falloff = 1 - (dist / radius);
        // Can be dragged upward (dy < 0) all the way to top of head, or sideways, or down!
        lock.targetCurlX = Math.max(-160, Math.min(160, lock.targetCurlX + dx * 0.9 * falloff));
        lock.targetCurlY = Math.max(-145, Math.min(220, lock.targetCurlY + dy * 0.9 * falloff));
        lock.curlVelX += dx * 0.55 * falloff;
        lock.curlVelY += dy * 0.55 * falloff;
        movedAny = true;
      }
    });
    return movedAny;
  }

  // Flat Iron Straightener
  straightenAt(x, y, radius = 60) {
    let straightenedAny = false;
    this.hairLocks.forEach(lock => {
      const len = Math.hypot(lock.curlX, lock.curlY) || 1;
      const ux = lock.curlX / len;
      const uy = lock.curlY / len;
      const proj = (x - lock.rootX) * ux + (y - lock.rootY) * uy;
      const t = Math.max(0.1, Math.min(1.0, proj / len));

      const segX = lock.rootX + lock.curlX * t;
      const segY = lock.rootY + lock.curlY * t;

      if (Math.hypot(x - segX, y - segY) < radius) {
        lock.texture = 'straight';
        lock.waveAmp = 0;
        lock.curvature = 0;
        straightenedAny = true;

        if (Math.random() < 0.4) {
          this.particles.push({
            x: segX + (Math.random() - 0.5) * 20,
            y: segY - 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -2 - Math.random() * 2,
            radius: 6 + Math.random() * 8,
            life: 0.6,
            decay: 1.6,
            type: 'steam'
          });
        }
      }
    });
    return straightenedAny;
  }

  // Curling Wand / Wavy Tool
  waveAt(x, y, radius = 60) {
    let wavedAny = false;
    this.hairLocks.forEach(lock => {
      const len = Math.hypot(lock.curlX, lock.curlY) || 1;
      const ux = lock.curlX / len;
      const uy = lock.curlY / len;
      const proj = (x - lock.rootX) * ux + (y - lock.rootY) * uy;
      const t = Math.max(0.1, Math.min(1.0, proj / len));

      const segX = lock.rootX + lock.curlX * t;
      const segY = lock.rootY + lock.curlY * t;

      if (Math.hypot(x - segX, y - segY) < radius) {
        lock.texture = 'wavy';
        lock.waveAmp = 14;
        lock.waveFreq = 3.2;
        wavedAny = true;

        if (Math.random() < 0.4) {
          this.particles.push({
            x: segX + (Math.random() - 0.5) * 20,
            y: segY - 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -2 - Math.random() * 2,
            radius: 5 + Math.random() * 6,
            life: 0.6,
            decay: 1.6,
            type: 'sparkle'
          });
        }
      }
    });
    return wavedAny;
  }

  blowdry() {
    this.hairVolume = Math.min(1.85, this.hairVolume + 0.035);
    // Blowdryer lifts hair upwards and outwards!
    this.hairLocks.forEach(lock => {
      lock.curlVelY -= 0.6;
      lock.targetCurlY = Math.max(-120, lock.targetCurlY - 0.8);
    });

    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: 300 + Math.random() * 200,
        y: 200 + Math.random() * 150,
        vx: (Math.random() - 0.5) * 4,
        vy: -2 - Math.random() * 3,
        rot: 0,
        radius: 8 + Math.random() * 12,
        life: 1.0,
        type: 'wind'
      });
    }
  }

  dyeHair(hexColor, nearX = null, radius = 75) {
    if (hexColor === 'rainbow') {
      const rainbowColors = ['#ff5964', '#fbb13c', '#feea00', '#35ce8d', '#3891a6', '#8954bf'];
      this.hairLocks.forEach((lock, idx) => {
        lock.color = rainbowColors[idx % rainbowColors.length];
      });
      return;
    }

    if (nearX === null) {
      this.hairColor = hexColor;
      this.hairLocks.forEach(l => l.color = hexColor);
    } else {
      this.hairLocks.forEach(lock => {
        if (Math.abs(lock.rootX - nearX) < radius) {
          lock.color = hexColor;
        }
      });
    }
  }

  addClip(type, x, y) {
    this.hairClips.push({
      type,
      x,
      y,
      rotation: (Math.random() - 0.5) * 0.3
    });
  }

  removeClip(index) {
    this.hairClips.splice(index, 1);
  }

  clearClips() {
    this.hairClips = [];
  }

  chew() {
    this.chewingTimer = 1.8;
    this.isSquinting = true;
    setTimeout(() => {
      this.isSquinting = false;
    }, 2000);
  }

  setLookTarget(x, y) {
    const headCenterX = 400;
    const headCenterY = 320;
    const dx = (x - headCenterX) / 400;
    const dy = (y - headCenterY) / 300;
    this.eyeTargetX = Math.max(-1, Math.min(1, dx)) * 14;
    this.eyeTargetY = Math.max(-1, Math.min(1, dy)) * 10;
  }

  scritchReaction(zone) {
    if (zone === 'chin') {
      this.headTilt = -0.09;
      this.isSquinting = true;
      this.tongueBlep = 0.9;
    } else if (zone === 'ears') {
      this.earTwitchLeft = 0.85;
      this.earTwitchRight = 0.85;
      this.isSquinting = true;
    } else if (zone === 'forehead') {
      this.headTilt = 0.06;
      this.isSquinting = true;
    }
  }

  update(dt) {
    this.lookX += (this.eyeTargetX - this.lookX) * 0.15;
    this.lookY += (this.eyeTargetY - this.lookY) * 0.15;

    this.blinkTimer += dt;
    if (this.blinkTimer > 3.6 + Math.sin(this.blinkTimer) * 1.5) {
      this.eyeOpenness = Math.max(0, this.eyeOpenness - dt * 8);
      if (this.eyeOpenness <= 0.05) {
        this.blinkTimer = 0;
      }
    } else {
      this.eyeOpenness = Math.min(1, this.eyeOpenness + dt * 6);
    }

    this.earTwitchLeft = Math.max(0, this.earTwitchLeft - dt * 2.5);
    this.earTwitchRight = Math.max(0, this.earTwitchRight - dt * 2.5);
    this.headTilt += (0 - this.headTilt) * 0.08;
    this.tongueBlep = Math.max(0, this.tongueBlep - dt * 1.2);

    if (this.chewingTimer > 0) {
      this.chewingTimer -= dt;
      this.mouthOpen = Math.abs(Math.sin(this.chewingTimer * 12)) * 0.8;
    } else {
      this.mouthOpen = Math.max(0, this.mouthOpen - dt * 4);
    }

    // 2D Spring Physics for every lock (X & Y independently responsive!)
    this.hairLocks.forEach(lock => {
      const forceX = (lock.targetCurlX - lock.curlX) * 0.16;
      const forceY = (lock.targetCurlY - lock.curlY) * 0.16;
      lock.curlVelX = (lock.curlVelX + forceX) * 0.82;
      lock.curlVelY = (lock.curlVelY + forceY) * 0.82;
      lock.curlX += lock.curlVelX;
      lock.curlY += lock.curlVelY;
    });

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += (p.vx || 0);
      p.y += (p.vy || 0);
      if (p.vRot) p.rot += p.vRot;
      p.life -= dt * (p.decay || 1.2);
      if (p.life <= 0 || p.y > this.height + 50) {
        this.particles.splice(i, 1);
      }
    }
  }

  drawWebkinzRoom(ctx) {
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, 0, 500);
    grad.addColorStop(0, '#fbf4d9');
    grad.addColorStop(1, '#f3e6bd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this.width, 510);

    ctx.fillStyle = 'rgba(230, 214, 172, 0.35)';
    for (let x = 0; x < this.width; x += 36) {
      ctx.fillRect(x, 0, 18, 510);
    }

    ctx.save();
    ctx.translate(400, 280);
    ctx.beginPath();
    ctx.ellipse(0, 0, 240, 210, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffdf7a';
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#e0a92d';
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(0, 0, 230, 200, 0, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    const mirrorGrad = ctx.createLinearGradient(0, -200, 0, 200);
    mirrorGrad.addColorStop(0, '#eaf5fc');
    mirrorGrad.addColorStop(0.5, '#d9effa');
    mirrorGrad.addColorStop(1, '#c5e5f5');
    ctx.fillStyle = mirrorGrad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-160, -180);
    ctx.lineTo(-70, -190);
    ctx.lineTo(10, 190);
    ctx.lineTo(-80, 190);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#9c663b';
    ctx.fillRect(0, 495, this.width, 16);
    ctx.fillStyle = '#7a4e2a';
    ctx.fillRect(0, 508, this.width, 4);

    const tileW = 50;
    const tileH = 26;
    let row = 0;
    for (let y = 512; y < this.height; y += tileH) {
      for (let x = -tileW; x < this.width + tileW; x += tileW) {
        const isDark = (Math.floor(x / tileW) + row) % 2 === 0;
        ctx.fillStyle = isDark ? '#d4ba9f' : '#faeedb';
        ctx.fillRect(x + (row % 2) * (tileW * 0.5), y, tileW, tileH);
        ctx.strokeStyle = 'rgba(120, 80, 50, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + (row % 2) * (tileW * 0.5), y, tileW, tileH);
      }
      row++;
    }

    const flags = ['#ff6b8b', '#ffd15c', '#6cd9a6', '#6eb4f7', '#ba7df5', '#ff9f59', '#ff6b8b', '#ffd15c', '#6cd9a6', '#6eb4f7', '#ba7df5'];
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.quadraticCurveTo(400, 45, 800, 15);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    for (let i = 0; i < flags.length; i++) {
      const u = (i + 0.5) / flags.length;
      const fx = u * 800;
      const fy = 15 + Math.sin(u * Math.PI) * 22;
      ctx.beginPath();
      ctx.moveTo(fx - 18, fy);
      ctx.lineTo(fx + 18, fy);
      ctx.lineTo(fx, fy + 28);
      ctx.closePath();
      ctx.fillStyle = flags[i];
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  render(currentMode = 'salon') {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawWebkinzRoom(ctx);

    ctx.save();
    ctx.translate(400, 350);
    ctx.rotate(this.headTilt);
    ctx.translate(-400, -350);

    // 1. Horns
    this.drawHorns(ctx);

    // 2. Ears
    this.drawEars(ctx);

    // 3. Body
    this.drawBody(ctx);

    // 4. Head Base
    this.drawHeadBase(ctx);

    // 5. Snout & Muzzle
    this.drawMuzzle(ctx);

    // 6. Nose Piercings
    this.drawNoseJewelry(ctx);

    // 7. Eyes
    this.drawEyes(ctx);

    // 8. Dynamic 360° Bangs (Can go UP to top of head, sideways, or down!)
    this.drawHair(ctx);

    // 9. Barrettes / Clips
    this.drawClips(ctx);

    // 10. Glasses & Hats
    this.drawGlasses(ctx);
    this.drawHat(ctx);

    ctx.restore();

    this.drawParticles(ctx);
  }

  drawHorns(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(310, 220);
    ctx.bezierCurveTo(180, 160, 110, 70, 90, -10);
    ctx.bezierCurveTo(125, -20, 220, 90, 330, 195);
    ctx.closePath();

    const hornGradL = ctx.createLinearGradient(310, 220, 90, -10);
    hornGradL.addColorStop(0, '#c7bca1');
    hornGradL.addColorStop(0.5, '#eae0cb');
    hornGradL.addColorStop(0.85, '#998668');
    hornGradL.addColorStop(1, '#3b3223');
    ctx.fillStyle = hornGradL;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#382f21';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(490, 220);
    ctx.bezierCurveTo(620, 160, 690, 70, 710, -10);
    ctx.bezierCurveTo(675, -20, 580, 90, 470, 195);
    ctx.closePath();

    const hornGradR = ctx.createLinearGradient(490, 220, 710, -10);
    hornGradR.addColorStop(0, '#c7bca1');
    hornGradR.addColorStop(0.5, '#eae0cb');
    hornGradR.addColorStop(0.85, '#998668');
    hornGradR.addColorStop(1, '#3b3223');
    ctx.fillStyle = hornGradR;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#382f21';
    ctx.stroke();

    ctx.restore();
  }

  drawEars(ctx) {
    ctx.save();
    ctx.save();
    ctx.translate(250, 260);
    ctx.rotate(-0.25 - this.earTwitchLeft * 0.4);
    ctx.beginPath();
    ctx.ellipse(0, 0, 85, 45, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = this.shadowColor;
    ctx.fill();
    ctx.strokeStyle = '#421a08';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(-8, 2, 60, 28, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#e5a587';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-50, 15);
    ctx.lineTo(-75, 40);
    ctx.lineTo(-40, 30);
    ctx.lineTo(-55, 55);
    ctx.lineTo(-20, 35);
    ctx.fillStyle = this.baseColor;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(550, 260);
    ctx.rotate(0.25 + this.earTwitchRight * 0.4);
    ctx.beginPath();
    ctx.ellipse(0, 0, 85, 45, 0.35, 0, Math.PI * 2);
    ctx.fillStyle = this.shadowColor;
    ctx.fill();
    ctx.strokeStyle = '#421a08';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(8, 2, 60, 28, 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#e5a587';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(50, 15);
    ctx.lineTo(75, 40);
    ctx.lineTo(40, 30);
    ctx.lineTo(55, 55);
    ctx.lineTo(20, 35);
    ctx.fillStyle = this.baseColor;
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  drawBody(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(140, 700);
    ctx.bezierCurveTo(170, 480, 240, 420, 310, 400);
    ctx.bezierCurveTo(400, 420, 490, 420, 490, 400);
    ctx.bezierCurveTo(560, 420, 630, 480, 660, 700);
    ctx.closePath();

    const bodyGrad = ctx.createRadialGradient(400, 520, 60, 400, 560, 300);
    bodyGrad.addColorStop(0, this.highlightColor);
    bodyGrad.addColorStop(0.6, this.baseColor);
    bodyGrad.addColorStop(1, this.shadowColor);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    ctx.fillStyle = this.shadowColor;
    for (let i = 0; i < 7; i++) {
      const tx = 220 + i * 55;
      const ty = 510 + (i % 2) * 20;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx + 25, ty + 45);
      ctx.lineTo(tx + 40, ty);
      ctx.fill();
    }
    ctx.restore();
  }

  drawHeadBase(ctx) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(400, 320, 175, 160, 0, 0, Math.PI * 2);

    const headGrad = ctx.createRadialGradient(400, 290, 40, 400, 330, 190);
    headGrad.addColorStop(0, this.highlightColor);
    headGrad.addColorStop(0.65, this.baseColor);
    headGrad.addColorStop(1, this.shadowColor);
    ctx.fillStyle = headGrad;
    ctx.fill();
    ctx.strokeStyle = '#421a08';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    const drawCheekTufts = (side) => {
      const sign = side === 'left' ? -1 : 1;
      const cx = 400 + sign * 165;
      for (let j = 0; j < 4; j++) {
        const cy = 290 + j * 30;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + sign * (35 + j * 6), cy + 25);
        ctx.lineTo(cx + sign * 10, cy + 35);
        ctx.fill();
      }
    };
    drawCheekTufts('left');
    drawCheekTufts('right');

    ctx.restore();
  }

  drawEyes(ctx) {
    ctx.save();
    const eyeSpacing = 85;
    const eyeY = 300;

    const renderEye = (centerX) => {
      ctx.save();
      ctx.translate(centerX, eyeY);

      if (this.isSquinting || this.eyeOpenness < 0.2) {
        ctx.beginPath();
        ctx.arc(0, 0, 24, 1.2 * Math.PI, 1.8 * Math.PI, false);
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#301306';
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(14, -8);
        ctx.lineTo(22, -18);
        ctx.moveTo(-14, -8);
        ctx.lineTo(-22, -18);
        ctx.lineWidth = 3.5;
        ctx.stroke();
        ctx.restore();
        return;
      }

      const openH = 26 * this.eyeOpenness;
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, openH, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#291104';
      ctx.stroke();

      const pupilX = Math.max(-10, Math.min(10, this.lookX));
      const pupilY = Math.max(-8, Math.min(8, this.lookY));

      ctx.beginPath();
      ctx.ellipse(pupilX, pupilY, 17, 17 * this.eyeOpenness, 0, 0, Math.PI * 2);
      const irisGrad = ctx.createRadialGradient(pupilX - 3, pupilY - 3, 2, pupilX, pupilY, 17);
      irisGrad.addColorStop(0, '#66391d');
      irisGrad.addColorStop(0.6, '#381c0c');
      irisGrad.addColorStop(1, '#1a0b04');
      ctx.fillStyle = irisGrad;
      ctx.fill();

      if (this.eyeOpenness > 0.4) {
        ctx.beginPath();
        ctx.arc(pupilX - 5, pupilY - 5, 5.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pupilX + 6, pupilY + 5, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(0, -32, 20, 1.2 * Math.PI, 1.8 * Math.PI, false);
      ctx.lineWidth = 4;
      ctx.strokeStyle = this.shadowColor;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.restore();
    };

    renderEye(400 - eyeSpacing);
    renderEye(400 + eyeSpacing);

    ctx.restore();
  }

  drawMuzzle(ctx) {
    ctx.save();
    const muzzleX = 400;
    const muzzleY = 385;

    ctx.beginPath();
    ctx.ellipse(muzzleX, muzzleY, 115, 68, 0, 0, Math.PI * 2);
    const snoutGrad = ctx.createRadialGradient(muzzleX, muzzleY - 10, 20, muzzleX, muzzleY, 115);
    snoutGrad.addColorStop(0, '#f2b599');
    snoutGrad.addColorStop(0.7, this.muzzleColor);
    snoutGrad.addColorStop(1, '#b86b49');
    ctx.fillStyle = snoutGrad;
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#4f220f';
    ctx.stroke();

    const renderNostril = (x) => {
      ctx.save();
      ctx.translate(x, muzzleY - 5);
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 22, (x > muzzleX ? 0.2 : -0.2), 0, Math.PI * 2);
      ctx.fillStyle = this.nostrilColor;
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x > muzzleX ? -2 : 2, -2, 7, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#260e04';
      ctx.fill();
      ctx.restore();
    };

    renderNostril(muzzleX - 44);
    renderNostril(muzzleX + 44);

    if (this.mouthOpen > 0.05) {
      const openH = 28 * this.mouthOpen;
      ctx.beginPath();
      ctx.ellipse(muzzleX, muzzleY + 40, 36, openH, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#7a1f28';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#3b0c11';
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(muzzleX, muzzleY + 40 + openH * 0.3, 22, openH * 0.6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8fa3';
      ctx.fill();
    } else if (this.tongueBlep > 0.1) {
      ctx.beginPath();
      ctx.ellipse(muzzleX + 8, muzzleY + 42, 14, 18, 0.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ff8fa3';
      ctx.fill();
      ctx.strokeStyle = '#c44d62';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(muzzleX + 8, muzzleY + 34);
      ctx.lineTo(muzzleX + 9, muzzleY + 48);
      ctx.strokeStyle = '#c44d62';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(muzzleX - 25, muzzleY + 36);
      ctx.quadraticCurveTo(muzzleX, muzzleY + 42, muzzleX + 25, muzzleY + 36);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#4f220f';
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(muzzleX - 28, muzzleY + 36);
      ctx.quadraticCurveTo(muzzleX, muzzleY + 44, muzzleX + 28, muzzleY + 36);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#4f220f';
      ctx.stroke();
    }

    ctx.restore();
  }

  drawNoseJewelry(ctx) {
    if (!this.activeNoseRing || this.activeNoseRing === 'none') return;
    ctx.save();
    const muzzleX = 400;
    const muzzleY = 385;

    if (this.activeNoseRing === 'gold_septum') {
      ctx.beginPath();
      ctx.arc(muzzleX, muzzleY + 14, 22, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.lineWidth = 6.5;
      const ringGrad = ctx.createLinearGradient(muzzleX - 25, muzzleY, muzzleX + 25, muzzleY + 35);
      ringGrad.addColorStop(0, '#ffd700');
      ringGrad.addColorStop(0.4, '#fff280');
      ringGrad.addColorStop(0.8, '#d49b00');
      ctx.strokeStyle = ringGrad;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(muzzleX, muzzleY + 14, 22, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#946700';
      ctx.stroke();
    } else if (this.activeNoseRing === 'rainbow_septum') {
      ctx.beginPath();
      ctx.arc(muzzleX, muzzleY + 14, 22, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.lineWidth = 7;
      const rainGrad = ctx.createLinearGradient(muzzleX - 24, muzzleY + 15, muzzleX + 24, muzzleY + 15);
      rainGrad.addColorStop(0, '#ff477e');
      rainGrad.addColorStop(0.2, '#ff9900');
      rainGrad.addColorStop(0.4, '#fcd34d');
      rainGrad.addColorStop(0.6, '#4ade80');
      rainGrad.addColorStop(0.8, '#38bdf8');
      rainGrad.addColorStop(1, '#c084fc');
      ctx.strokeStyle = rainGrad;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(muzzleX + 5, muzzleY + 36, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    } else if (this.activeNoseRing === 'horseshoe') {
      ctx.beginPath();
      ctx.arc(muzzleX, muzzleY + 12, 20, 0.2 * Math.PI, 0.8 * Math.PI, false);
      ctx.lineWidth = 5.5;
      ctx.strokeStyle = '#1e2229';
      ctx.lineCap = 'round';
      ctx.stroke();

      [[-16, 26], [16, 26]].forEach(([bx, by]) => {
        ctx.beginPath();
        ctx.arc(muzzleX + bx, muzzleY + by, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#374151';
        ctx.fill();
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    } else if (this.activeNoseRing === 'silver_stud') {
      const studX = muzzleX - 42;
      const studY = muzzleY - 14;
      ctx.beginPath();
      ctx.arc(studX, studY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#e2e8f0';
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(studX - 1.5, studY - 1.5, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    ctx.restore();
  }

  // Draw 360° Omnidirectional Hair (Supports pointing UP to top of head, sideways, or down!)
  drawHair(ctx) {
    ctx.save();
    const sorted = [...this.hairLocks].sort((a, b) => a.layer - b.layer || a.rootY - b.rootY);

    sorted.forEach(lock => {
      ctx.save();
      const x0 = lock.rootX;
      const y0 = lock.rootY;

      // Length and Direction Vectors
      const len = (Math.hypot(lock.curlX, lock.curlY) || 1) * this.hairVolume;
      const ux = (lock.curlX * this.hairVolume) / len;
      const uy = (lock.curlY * this.hairVolume) / len;
      // Normal vector perpendicular to strand direction
      const nx = -uy;
      const ny = ux;

      const tipX = x0 + lock.curlX * this.hairVolume;
      const tipY = y0 + lock.curlY * this.hairVolume;

      const halfW = (lock.width * 0.5) * (this.hairVolume > 1.2 ? 1.25 : 1.0);

      // --- TEXTURE: STRAIGHT (Flat Ironed) ---
      if (lock.texture === 'straight') {
        ctx.beginPath();
        ctx.moveTo(x0 - nx * halfW, y0 - ny * halfW);
        ctx.lineTo(tipX - nx * 2, tipY - ny * 2);
        ctx.lineTo(tipX + nx * 2, tipY + ny * 2);
        ctx.lineTo(x0 + nx * halfW, y0 + ny * halfW);
        ctx.closePath();

        const grad = ctx.createLinearGradient(x0, y0, tipX, tipY);
        grad.addColorStop(0, lock.color);
        grad.addColorStop(0.7, lock.color);
        grad.addColorStop(1, this.adjustColor(lock.color, -25));
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = this.adjustColor(lock.color, -35);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Sleek specular highlight
        ctx.beginPath();
        ctx.moveTo(x0 + ux * 10, y0 + uy * 10);
        ctx.lineTo(tipX - ux * 8, tipY - uy * 8);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2.2;
        ctx.stroke();
      }
      // --- TEXTURE: WAVY (Curling Wand) ---
      else if (lock.texture === 'wavy') {
        const segments = 16;
        const leftPoints = [];
        const rightPoints = [];

        for (let s = 0; s <= segments; s++) {
          const t = s / segments;
          const baseX = x0 + (tipX - x0) * t;
          const baseY = y0 + (tipY - y0) * t;
          // Sine wave offset along the normal vector
          const wave = Math.sin(t * Math.PI * lock.waveFreq) * (lock.waveAmp || 12);
          const currentW = halfW * (1 - t * 0.7);

          leftPoints.push({
            x: baseX + nx * (wave - currentW),
            y: baseY + ny * (wave - currentW)
          });
          rightPoints.push({
            x: baseX + nx * (wave + currentW),
            y: baseY + ny * (wave + currentW)
          });
        }

        ctx.beginPath();
        ctx.moveTo(leftPoints[0].x, leftPoints[0].y);
        for (let i = 1; i < leftPoints.length; i++) {
          ctx.lineTo(leftPoints[i].x, leftPoints[i].y);
        }
        for (let i = rightPoints.length - 1; i >= 0; i--) {
          ctx.lineTo(rightPoints[i].x, rightPoints[i].y);
        }
        ctx.closePath();

        const grad = ctx.createLinearGradient(x0, y0, tipX, tipY);
        grad.addColorStop(0, lock.color);
        grad.addColorStop(0.7, lock.color);
        grad.addColorStop(1, this.adjustColor(lock.color, -25));
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.strokeStyle = this.adjustColor(lock.color, -40);
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Highlight ribbon
        ctx.beginPath();
        for (let i = 0; i < leftPoints.length; i += 2) {
          const midX = (leftPoints[i].x + rightPoints[i].x) * 0.5;
          const midY = (leftPoints[i].y + rightPoints[i].y) * 0.5;
          if (i === 0) ctx.moveTo(midX, midY);
          else ctx.lineTo(midX, midY);
        }
        ctx.strokeStyle = this.adjustColor(lock.color, 35);
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      // --- TEXTURE: NATURAL (Shaggy Highland Fur in Any Direction) ---
      else {
        const curve = lock.curvature || 0;
        const cp1X = x0 + ux * len * 0.4 + nx * curve * 0.4;
        const cp1Y = y0 + uy * len * 0.4 + ny * curve * 0.4;
        const cp2X = x0 + ux * len * 0.8 + nx * curve * 0.8;
        const cp2Y = y0 + uy * len * 0.8 + ny * curve * 0.8;

        ctx.beginPath();
        ctx.moveTo(x0 - nx * halfW, y0 - ny * halfW);
        ctx.bezierCurveTo(
          cp1X - nx * halfW * 0.8, cp1Y - ny * halfW * 0.8,
          cp2X - nx * halfW * 0.4, cp2Y - ny * halfW * 0.4,
          tipX, tipY
        );
        ctx.bezierCurveTo(
          cp2X + nx * halfW * 0.4, cp2Y + ny * halfW * 0.4,
          cp1X + nx * halfW * 0.8, cp1Y + ny * halfW * 0.8,
          x0 + nx * halfW, y0 + ny * halfW
        );
        ctx.closePath();

        const lockGrad = ctx.createLinearGradient(x0, y0, tipX, tipY);
        lockGrad.addColorStop(0, lock.color);
        lockGrad.addColorStop(0.7, lock.color);
        lockGrad.addColorStop(1, this.adjustColor(lock.color, -25));
        ctx.fillStyle = lockGrad;
        ctx.fill();

        ctx.strokeStyle = this.adjustColor(lock.color, -40);
        ctx.lineWidth = 1.6;
        ctx.stroke();

        if (len > 70) {
          ctx.beginPath();
          ctx.moveTo(x0 + ux * 10, y0 + uy * 10);
          ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, tipX - ux * 10, tipY - uy * 10);
          ctx.strokeStyle = this.adjustColor(lock.color, 35);
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      ctx.restore();
    });

    ctx.restore();
  }

  drawClips(ctx) {
    this.hairClips.forEach(clip => {
      ctx.save();
      ctx.translate(clip.x, clip.y);
      ctx.rotate(clip.rotation);

      if (clip.type === 'rainbow') {
        const colors = ['#ff4d6d', '#ff9900', '#ffd60a', '#4ade80', '#38bdf8', '#c084fc'];
        for (let r = 0; r < colors.length; r++) {
          ctx.beginPath();
          ctx.arc(0, 6, 20 - r * 2.8, Math.PI, 0, false);
          ctx.strokeStyle = colors[r];
          ctx.lineWidth = 3.2;
          ctx.stroke();
        }
        [[-16, 6], [16, 6]].forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.arc(cx + (cx < 0 ? 4 : -4), cy - 2, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      } else if (clip.type === 'trans') {
        const transColors = ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa'];
        ctx.beginPath();
        ctx.roundRect(-20, -10, 40, 20, 6);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        transColors.forEach((col, idx) => {
          ctx.fillStyle = col;
          ctx.fillRect(-20, -10 + idx * 4, 40, 4);
        });

        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.bezierCurveTo(-5, -3, -8, 2, 0, 8);
        ctx.bezierCurveTo(8, 2, 5, -3, 0, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
      } else if (clip.type === 'nonbinary') {
        const enbyColors = ['#fff433', '#ffffff', '#9b59d0', '#2d2d2d'];
        ctx.save();
        ctx.beginPath();
        for (let s = 0; s < 5; s++) {
          const outAng = (s / 5) * Math.PI * 2 - Math.PI / 2;
          const inAng = outAng + Math.PI / 5;
          const ox = Math.cos(outAng) * 16;
          const oy = Math.sin(outAng) * 16;
          const ix = Math.cos(inAng) * 7.5;
          const iy = Math.sin(inAng) * 7.5;
          if (s === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
          ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.clip();

        enbyColors.forEach((col, idx) => {
          ctx.fillStyle = col;
          ctx.fillRect(-18, -16 + idx * 8, 36, 8);
        });
        ctx.restore();

        ctx.beginPath();
        for (let s = 0; s < 5; s++) {
          const outAng = (s / 5) * Math.PI * 2 - Math.PI / 2;
          const inAng = outAng + Math.PI / 5;
          const ox = Math.cos(outAng) * 16;
          const oy = Math.sin(outAng) * 16;
          const ix = Math.cos(inAng) * 7.5;
          const iy = Math.sin(inAng) * 7.5;
          if (s === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
          ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (clip.type === 'strawberry') {
        ctx.beginPath();
        ctx.moveTo(0, 16);
        ctx.bezierCurveTo(-14, 6, -14, -8, 0, -8);
        ctx.bezierCurveTo(14, -8, 14, 6, 0, 16);
        ctx.fillStyle = '#e8334a';
        ctx.fill();
        ctx.strokeStyle = '#941b2c';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#fff48f';
        [[-4, -2], [4, -2], [0, 4], [-3, 8], [3, 8]].forEach(([sx, sy]) => {
          ctx.fillRect(sx, sy, 1.8, 2.5);
        });
        ctx.beginPath();
        ctx.moveTo(-10, -8);
        ctx.lineTo(0, -14);
        ctx.lineTo(10, -8);
        ctx.lineTo(0, -7);
        ctx.fillStyle = '#48ab50';
        ctx.fill();
      } else if (clip.type === 'daisy') {
        ctx.fillStyle = '#ffffff';
        for (let p = 0; p < 8; p++) {
          const ang = (p / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(Math.cos(ang) * 11, Math.sin(ang) * 11, 7, 3.5, ang, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#e0e0e0';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcf2b';
        ctx.fill();
      } else if (clip.type === 'frog') {
        ctx.beginPath();
        ctx.ellipse(0, 2, 14, 10, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#78c257';
        ctx.fill();
        ctx.strokeStyle = '#417a26';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        [[-7, -7], [7, -7]].forEach(([fx, fy]) => {
          ctx.beginPath();
          ctx.arc(fx, fy, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#78c257';
          ctx.fill();
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(fx, fy, 2, 0, Math.PI * 2);
          ctx.fillStyle = '#000000';
          ctx.fill();
        });
        ctx.beginPath();
        ctx.arc(0, 3, 6, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.strokeStyle = '#417a26';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (clip.type === 'star') {
        ctx.beginPath();
        for (let s = 0; s < 5; s++) {
          const outAng = (s / 5) * Math.PI * 2 - Math.PI / 2;
          const inAng = outAng + Math.PI / 5;
          const ox = Math.cos(outAng) * 15;
          const oy = Math.sin(outAng) * 15;
          const ix = Math.cos(inAng) * 7;
          const iy = Math.sin(inAng) * 7;
          if (s === 0) ctx.moveTo(ox, oy);
          else ctx.lineTo(ox, oy);
          ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.fillStyle = '#ffd13b';
        ctx.fill();
        ctx.strokeStyle = '#c49610';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (clip.type === 'bow') {
        ctx.fillStyle = '#f777a7';
        ctx.strokeStyle = '#ad2959';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-18, -12, -18, 12, 0, 0);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(18, -12, 18, 12, 0, 0);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#f24484';
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    });
  }

  drawGlasses(ctx) {
    if (!this.activeGlasses || this.activeGlasses === 'none') return;
    ctx.save();
    const eyeSpacing = 85;
    const eyeY = 300;

    if (this.activeGlasses === 'round_specs') {
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#241b17';
      ctx.beginPath();
      ctx.arc(400 - eyeSpacing, eyeY, 34, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(400 + eyeSpacing, eyeY, 34, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(400, eyeY - 6, 22, 1.2 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(400 - eyeSpacing - 34, eyeY);
      ctx.lineTo(260, 270);
      ctx.moveTo(400 + eyeSpacing + 34, eyeY);
      ctx.lineTo(540, 270);
      ctx.stroke();
    } else if (this.activeGlasses === 'sunglasses') {
      ctx.fillStyle = '#1c1b24';
      ctx.strokeStyle = '#f0c043';
      ctx.lineWidth = 3.5;

      ctx.beginPath();
      ctx.roundRect(400 - eyeSpacing - 38, eyeY - 20, 76, 44, [8, 8, 22, 22]);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(400 + eyeSpacing - 38, eyeY - 20, 76, 44, [8, 8, 22, 22]);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(400 - eyeSpacing + 38, eyeY - 8);
      ctx.lineTo(400 + eyeSpacing - 38, eyeY - 8);
      ctx.lineWidth = 4.5;
      ctx.strokeStyle = '#f0c043';
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 3;
      [400 - eyeSpacing, 400 + eyeSpacing].forEach(cx => {
        ctx.beginPath();
        ctx.moveTo(cx - 20, eyeY + 12);
        ctx.lineTo(cx + 10, eyeY - 12);
        ctx.stroke();
      });
    }

    ctx.restore();
  }

  drawHat(ctx) {
    if (!this.activeHat || this.activeHat === 'none') return;
    ctx.save();
    const hatX = 400;
    const hatY = 195;

    if (this.activeHat === 'rainbow_beanie') {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(hatX, hatY - 10, 112, 68, 0, Math.PI, 0);
      ctx.clip();

      const rainbowStripes = ['#c084fc', '#38bdf8', '#4ade80', '#ffd60a', '#ff9900', '#ff477e'];
      rainbowStripes.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(hatX - 120, hatY - 78 + i * 11, 240, 12);
      });
      ctx.restore();

      ctx.beginPath();
      ctx.ellipse(hatX, hatY - 10, 112, 68, 0, Math.PI, 0);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hatX, hatY - 88, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(hatX - 118, hatY - 18, 236, 28, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (this.activeHat === 'nonbinary_beanie') {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(hatX, hatY - 10, 112, 68, 0, Math.PI, 0);
      ctx.clip();

      const enbyStripes = ['#2d2d2d', '#9b59d0', '#ffffff', '#fff433'];
      enbyStripes.forEach((color, i) => {
        ctx.fillStyle = color;
        ctx.fillRect(hatX - 120, hatY - 78 + i * 17, 240, 18);
      });
      ctx.restore();

      ctx.beginPath();
      ctx.ellipse(hatX, hatY - 10, 112, 68, 0, Math.PI, 0);
      ctx.strokeStyle = '#5a3782';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hatX, hatY - 88, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#9b59d0';
      ctx.fill();
      ctx.strokeStyle = '#5a3782';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(hatX - 118, hatY - 18, 236, 28, 14);
      ctx.fillStyle = '#2d2d2d';
      ctx.fill();
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (this.activeHat === 'trans_bucket') {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(hatX - 90, hatY - 60);
      ctx.lineTo(hatX + 90, hatY - 60);
      ctx.lineTo(hatX + 110, hatY - 10);
      ctx.lineTo(hatX - 110, hatY - 10);
      ctx.closePath();
      ctx.clip();

      const transBands = ['#5bcefa', '#f5a9b8', '#ffffff', '#f5a9b8', '#5bcefa'];
      transBands.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(hatX - 120, hatY - 60 + i * 10, 240, 10);
      });
      ctx.restore();

      ctx.beginPath();
      ctx.moveTo(hatX - 90, hatY - 60);
      ctx.lineTo(hatX + 90, hatY - 60);
      ctx.lineTo(hatX + 110, hatY - 10);
      ctx.lineTo(hatX - 110, hatY - 10);
      ctx.closePath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(hatX, hatY + 5, 135, 24, 0, 0, Math.PI);
      ctx.fillStyle = '#f5a9b8';
      ctx.fill();
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 3;
      ctx.stroke();
    } else if (this.activeHat === 'beanie') {
      ctx.beginPath();
      ctx.ellipse(hatX, hatY - 10, 110, 65, 0, Math.PI, 0);
      ctx.fillStyle = '#d49b28';
      ctx.fill();
      ctx.strokeStyle = '#785208';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.roundRect(hatX - 118, hatY - 18, 236, 28, 14);
      ctx.fillStyle = '#ba8216';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hatX, hatY - 85, 24, 0, Math.PI * 2);
      ctx.fillStyle = '#f5e8c6';
      ctx.fill();
      ctx.stroke();
    } else if (this.activeHat === 'flower_crown') {
      const flowers = [
        { x: -100, color: '#f55d7a' },
        { x: -60, color: '#f7d354' },
        { x: -20, color: '#a262c9' },
        { x: 20, color: '#f55d7a' },
        { x: 60, color: '#ffffff' },
        { x: 100, color: '#f7d354' }
      ];
      ctx.beginPath();
      ctx.ellipse(hatX, hatY + 15, 120, 24, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#386629';
      ctx.lineWidth = 6;
      ctx.stroke();

      flowers.forEach(fl => {
        ctx.save();
        ctx.translate(hatX + fl.x, hatY + 10 + Math.sin(fl.x * 0.05) * 8);
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * 8, Math.sin(a) * 8, 6, 0, Math.PI * 2);
          ctx.fillStyle = fl.color;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffde59';
        ctx.fill();
        ctx.restore();
      });
    } else if (this.activeHat === 'flat_cap') {
      ctx.beginPath();
      ctx.ellipse(hatX, hatY - 15, 130, 45, 0, Math.PI, 0);
      ctx.fillStyle = '#475440';
      ctx.fill();
      ctx.strokeStyle = '#222b1d';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(hatX, hatY + 8, 120, 18, 0, 0, Math.PI);
      ctx.fillStyle = '#313b2c';
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(hatX, hatY - 55, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#222b1d';
      ctx.fill();
    } else if (this.activeHat === 'bucket_hat') {
      ctx.beginPath();
      ctx.moveTo(hatX - 90, hatY - 60);
      ctx.lineTo(hatX + 90, hatY - 60);
      ctx.lineTo(hatX + 110, hatY - 10);
      ctx.lineTo(hatX - 110, hatY - 10);
      ctx.closePath();
      ctx.fillStyle = '#8fad82';
      ctx.fill();
      ctx.strokeStyle = '#4c6942';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(hatX, hatY + 5, 135, 24, 0, 0, Math.PI);
      ctx.fillStyle = '#7a9e6d';
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  drawParticles(ctx) {
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);

      if (p.type === 'hair') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.moveTo(0, -p.len * 0.5);
        ctx.lineTo(0, p.len * 0.5);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (p.type === 'wind') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fill();
      } else if (p.type === 'steam') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.fill();
      } else if (p.type === 'water') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#57b5f2';
        ctx.fill();
      } else if (p.type === 'sparkle') {
        ctx.translate(p.x, p.y);
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ffe854';
        ctx.fill();
      } else if (p.type === 'heart') {
        ctx.translate(p.x, p.y);
        const s = (p.scale || 1) * 0.9;
        ctx.scale(s, s);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-8, -10, -18, -2, 0, 16);
        ctx.bezierCurveTo(18, -2, 8, -10, 0, 0);
        ctx.fillStyle = '#ff5479';
        ctx.fill();
      } else if (p.type === 'crumb') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color || '#e39f4d';
        ctx.fill();
      }

      ctx.restore();
    });
  }

  adjustColor(hex, amount) {
    if (!hex || hex === 'rainbow') return '#c7662c';
    let col = hex.replace('#', '');
    if (col.length === 3) col = col.split('').map(c => c + c).join('');
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
}

window.HighlandCoo = HighlandCoo;
