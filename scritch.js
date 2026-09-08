// scritch.js - Petting, Scritching & Snack Feeding Station
class CooScritch {
  constructor(coo, canvas) {
    this.coo = coo;
    this.canvas = canvas;
    this.enabled = false;
    this.serotonin = 25;
    this.snackCount = 0;
    this.activeSnack = null;
    this.draggedSnack = null;

    this.initEventListeners();
  }

  enable() {
    this.enabled = true;
    this.canvas.className = 'tool-pet';
    this.updateSerotoninUI();
  }

  disable() {
    this.enabled = false;
  }

  initEventListeners() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        clientX: e.clientX,
        clientY: e.clientY
      };
    };

    let isScratching = false;
    let lastX = 0, lastY = 0;

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      isScratching = true;
      const pos = getPos(e);
      lastX = pos.x;
      lastY = pos.y;
      this.checkScritch(pos.x, pos.y);
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      const pos = getPos(e);
      this.coo.setLookTarget(pos.x, pos.y);

      if (isScratching) {
        const dist = Math.hypot(pos.x - lastX, pos.y - lastY);
        if (dist > 8) {
          this.checkScritch(pos.x, pos.y);
          lastX = pos.x;
          lastY = pos.y;
        }
      }
    });

    const stopScritch = () => {
      if (isScratching) {
        isScratching = false;
        setTimeout(() => {
          if (!this.coo.chewingTimer) this.coo.isSquinting = false;
        }, 500);
      }
    };
    window.addEventListener('mouseup', stopScritch);
    this.canvas.addEventListener('mouseleave', stopScritch);

    // Touch events
    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.enabled || e.touches.length === 0) return;
      const pos = getPos(e.touches[0]);
      this.checkScritch(pos.x, pos.y);
      e.preventDefault();
    }, { passive: false });
  }

  checkScritch(x, y) {
    let zone = null;

    // Chin scritch
    if (y > 380 && y < 480 && Math.abs(x - 400) < 110) {
      zone = 'chin';
    }
    // Ears scritch
    else if ((x < 310 || x > 490) && y > 210 && y < 320) {
      zone = 'ears';
    }
    // Forehead scritch (between horns)
    else if (y > 170 && y < 270 && Math.abs(x - 400) < 100) {
      zone = 'forehead';
    }

    if (zone) {
      this.coo.scritchReaction(zone);
      this.addSerotonin(1.2);

      // Play audio periodically
      if (Math.random() < 0.2) {
        if (zone === 'chin') window.cooAudio.playPurr();
        else if (zone === 'ears') window.cooAudio.playMoo();
        else window.cooAudio.playPurr();
      }

      // Spawn floating hearts
      if (Math.random() < 0.35) {
        this.coo.particles.push({
          x: x + (Math.random() - 0.5) * 30,
          y: y - 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -2 - Math.random() * 2,
          scale: 0.8 + Math.random() * 0.6,
          life: 1.0,
          decay: 1.0,
          type: 'heart'
        });
      }
    }
  }

  feedSnack(type, treatElem) {
    if (!this.enabled) return;

    // Trigger mouth opening and chewing
    this.coo.chew();
    window.cooAudio.playCrunch();
    this.snackCount++;
    this.addSerotonin(12);

    // Crumb particle colors by treat type
    const colors = {
      apple: '#ff3344',
      clover: '#41b34e',
      croissant: '#e8a946',
      watermelon: '#ff4f69',
      flower: '#ffd13b'
    };
    const crumbColor = colors[type] || '#e39f4d';

    for (let i = 0; i < 14; i++) {
      this.coo.particles.push({
        x: 400 + (Math.random() - 0.5) * 45,
        y: 410 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -1 + Math.random() * 4,
        radius: 3 + Math.random() * 4,
        life: 1.0,
        decay: 1.5,
        type: 'crumb',
        color: crumbColor
      });
    }

    // Little floating heart
    this.coo.particles.push({
      x: 400,
      y: 360,
      vx: 0,
      vy: -2.5,
      scale: 1.2,
      life: 1.0,
      decay: 0.8,
      type: 'heart'
    });

    const counter = document.getElementById('snack-counter');
    if (counter) {
      counter.textContent = `Snacks Eaten: ${this.snackCount} 🍎`;
    }
  }

  addSerotonin(amt) {
    this.serotonin = Math.min(100, this.serotonin + amt);
    this.updateSerotoninUI();
  }

  updateSerotoninUI() {
    const bar = document.getElementById('serotonin-fill');
    const label = document.getElementById('serotonin-label');
    if (bar) bar.style.width = `${this.serotonin}%`;
    if (label) {
      if (this.serotonin < 40) label.textContent = 'Cozy Status: Content & Fluffy';
      else if (this.serotonin < 75) label.textContent = 'Cozy Status: Extremely Happy Cow';
      else label.textContent = 'Cozy Status: 100% Pure Bliss & Nirvana ✨';
    }
  }
}

window.CooScritch = CooScritch;
