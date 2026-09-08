// salon.js - Hair Salon Tools & Interaction Logic
class CooSalon {
  constructor(coo, canvas) {
    this.coo = coo;
    this.canvas = canvas;
    this.enabled = true; // Mode gate
    this.activeTool = 'scissors';
    this.selectedColor = '#f58aa8';
    this.selectedClip = 'rainbow';
    this.isMouseDown = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.combSoundThrottle = 0;

    this.initEventListeners();
  }

  enable() {
    this.enabled = true;
    this.updateCursor();
  }

  disable() {
    this.enabled = false;
    this.isMouseDown = false;
    if (this.activeTool === 'blowdryer') {
      window.cooAudio.stopDryer();
    }
  }

  setTool(tool) {
    if (this.activeTool === 'blowdryer' && tool !== 'blowdryer') {
      window.cooAudio.stopDryer();
    }
    this.activeTool = tool;
    if (this.enabled) {
      this.updateCursor();
    }
  }

  updateCursor() {
    if (this.enabled) {
      this.canvas.className = `tool-${this.activeTool}`;
    }
  }

  regrow() {
    window.cooAudio.playSpritz();
    window.cooAudio.playSparkle();
    this.coo.regrowHair();

    const pop = document.createElement('div');
    pop.className = 'snip-pop';
    pop.textContent = '🌱 Fluffy Hair Regrown!';
    const rect = this.canvas.getBoundingClientRect();
    pop.style.left = `${rect.left + rect.width * 0.5}px`;
    pop.style.top = `${rect.top + rect.height * 0.35}px`;
    document.body.appendChild(pop);
    setTimeout(() => pop.remove(), 700);
  }

  initEventListeners() {
    const getCanvasPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return; // Prevent salon tools while in Treats & Scritches
      this.isMouseDown = true;
      const pos = getCanvasPos(e);
      this.lastMouseX = pos.x;
      this.lastMouseY = pos.y;
      this.applyTool(pos.x, pos.y, 0, 0, true);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = getCanvasPos(e);
      this.coo.setLookTarget(pos.x, pos.y);

      if (!this.enabled) return; // Prevent salon tools while in Treats & Scritches

      const dx = pos.x - this.lastMouseX;
      const dy = pos.y - this.lastMouseY;

      if (this.isMouseDown) {
        this.applyTool(pos.x, pos.y, dx, dy, false);
      }
      this.lastMouseX = pos.x;
      this.lastMouseY = pos.y;
    });

    const handleUp = () => {
      if (this.isMouseDown && this.activeTool === 'blowdryer') {
        window.cooAudio.stopDryer();
      }
      this.isMouseDown = false;
    };
    window.addEventListener('mouseup', handleUp);
    this.canvas.addEventListener('mouseleave', handleUp);

    // Touch Support
    this.canvas.addEventListener('touchstart', (e) => {
      if (!this.enabled || e.touches.length === 0) return;
      const touch = e.touches[0];
      const pos = getCanvasPos(touch);
      this.isMouseDown = true;
      this.lastMouseX = pos.x;
      this.lastMouseY = pos.y;
      this.applyTool(pos.x, pos.y, 0, 0, true);
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.enabled || !this.isMouseDown || e.touches.length === 0) return;
      const touch = e.touches[0];
      const pos = getCanvasPos(touch);
      const dx = pos.x - this.lastMouseX;
      const dy = pos.y - this.lastMouseY;
      this.applyTool(pos.x, pos.y, dx, dy, false);
      this.lastMouseX = pos.x;
      this.lastMouseY = pos.y;
      e.preventDefault();
    }, { passive: false });

    this.canvas.addEventListener('touchend', handleUp);
  }

  applyTool(x, y, dx, dy, isClick) {
    if (!this.enabled) return;

    if (this.activeTool === 'scissors') {
      const snipped = this.coo.snipAt(x, y, 42);
      if (snipped) {
        window.cooAudio.playSnip();
        this.triggerCutEffect(x, y);
      }
    } else if (this.activeTool === 'comb') {
      if (Math.abs(dx) > 1.0 || Math.abs(dy) > 1.0) {
        const moved = this.coo.combLockAt(x, y, dx, dy, 55);
        if (moved && Date.now() - this.combSoundThrottle > 140) {
          window.cooAudio.playComb();
          this.combSoundThrottle = Date.now();
        }
      }
    } else if (this.activeTool === 'straightener') {
      const straightened = this.coo.straightenAt(x, y, 55);
      if (straightened && (isClick || Math.random() < 0.2)) {
        window.cooAudio.playSizzle();
      }
    } else if (this.activeTool === 'curler') {
      const waved = this.coo.waveAt(x, y, 55);
      if (waved && (isClick || Math.random() < 0.2)) {
        window.cooAudio.playSizzle();
      }
    } else if (this.activeTool === 'blowdryer') {
      this.coo.blowdry();
      window.cooAudio.startDryer();
    } else if (this.activeTool === 'dye') {
      if (isClick) {
        this.coo.dyeHair(this.selectedColor, x, 75);
        window.cooAudio.playSpritz();
        for (let i = 0; i < 8; i++) {
          this.coo.particles.push({
            x: x + (Math.random() - 0.5) * 35,
            y: y + (Math.random() - 0.5) * 35,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            radius: 5 + Math.random() * 8,
            life: 0.6,
            decay: 2.0,
            type: 'crumb',
            color: this.selectedColor === 'rainbow' ? '#ff6b8b' : this.selectedColor
          });
        }
      }
    } else if (this.activeTool === 'clips') {
      if (isClick) {
        let clickedClipIdx = -1;
        this.coo.hairClips.forEach((clip, idx) => {
          if (Math.hypot(x - clip.x, y - clip.y) < 24) {
            clickedClipIdx = idx;
          }
        });

        if (clickedClipIdx >= 0) {
          this.coo.removeClip(clickedClipIdx);
          window.cooAudio.playSnip();
        } else {
          if (Math.hypot(x - 400, y - 300) < 210) {
            this.coo.addClip(this.selectedClip, x, y);
            window.cooAudio.playButtonPop();
          }
        }
      }
    }
  }

  triggerCutEffect(x, y) {
    const cutElem = document.createElement('div');
    cutElem.className = 'snip-pop';
    cutElem.textContent = '✂️ snip!';
    const rect = this.canvas.getBoundingClientRect();
    const screenX = rect.left + (x / this.canvas.width) * rect.width;
    const screenY = rect.top + (y / this.canvas.height) * rect.height;
    cutElem.style.left = `${screenX}px`;
    cutElem.style.top = `${screenY}px`;
    document.body.appendChild(cutElem);
    setTimeout(() => cutElem.remove(), 600);
  }
}

window.CooSalon = CooSalon;
