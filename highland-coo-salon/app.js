// app.js - Main Application Coordinator & Webkinz UI Wireup
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('coo-canvas');
  const coo = new HighlandCoo(canvas);
  const salon = new CooSalon(coo, canvas);
  const scritch = new CooScritch(coo, canvas);

  let currentMode = 'salon';

  // --- Main Animation Loop ---
  function gameLoop() {
    coo.render(currentMode);
    requestAnimationFrame(gameLoop);
  }
  requestAnimationFrame(gameLoop);

  // Play bubbly Webkinz button pop on interactive clicks
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, select, .color-swatch');
    if (btn && !btn.classList.contains('treat-btn') && !btn.classList.contains('webkinz-treat-btn')) {
      window.cooAudio.playButtonPop();
    }
  });

  // --- Cow Name Input ---
  const cowNameInput = document.getElementById('cow-name-input');
  let currentCowName = 'Barnaby';
  if (cowNameInput) {
    currentCowName = cowNameInput.value.trim() || 'Barnaby';
    cowNameInput.addEventListener('input', (e) => {
      currentCowName = e.target.value.trim() || 'Barnaby';
    });
  }

  // --- Mode Switching ---
  const modeTabs = document.querySelectorAll('.webkinz-tab');
  const salonPanel = document.getElementById('salon-controls');
  const scritchPanel = document.getElementById('scritch-controls');

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-mode');
      switchMode(mode);
    });
  });

  function switchMode(mode) {
    currentMode = mode;
    modeTabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-mode') === mode));

    salonPanel.classList.toggle('active', mode === 'salon');
    scritchPanel.classList.toggle('active', mode === 'scritch');

    if (mode === 'salon') {
      scritch.disable();
      salon.enable();
    } else if (mode === 'scritch') {
      salon.disable();
      scritch.enable();
    }
  }

  // --- Salon Tool Buttons ---
  const toolBtns = document.querySelectorAll('.toy-tool-btn');
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = btn.getAttribute('data-tool');
      if (!tool) return;
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      salon.setTool(tool);

      document.getElementById('dye-subtools').style.display = tool === 'dye' ? 'flex' : 'none';
      document.getElementById('clip-subtools').style.display = tool === 'clips' ? 'flex' : 'none';
    });
  });

  // Direct Foolproof Regrow Button
  const regrowBtn = document.getElementById('btn-regrow');
  if (regrowBtn) {
    regrowBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      salon.regrow();
    });
  }

  // Dye Color Swatches
  const colorSwatches = document.querySelectorAll('.color-swatch');
  colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      colorSwatches.forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
      salon.selectedColor = swatch.getAttribute('data-color');
    });
  });

  // Hair Clips
  const clipOptions = document.querySelectorAll('.clip-opt');
  clipOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      clipOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      salon.selectedClip = opt.getAttribute('data-clip');
    });
  });

  // Nose Piercing Selector
  const noseRingSelect = document.getElementById('nose-ring-select');
  if (noseRingSelect) {
    noseRingSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      coo.activeNoseRing = val;
    });
  }

  // Hats Selector
  const hatSelect = document.getElementById('hat-select');
  if (hatSelect) {
    hatSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      coo.activeHat = val === 'none' ? null : val;
    });
  }

  // Glasses Selector
  const glassesSelect = document.getElementById('glasses-select');
  if (glassesSelect) {
    glassesSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      coo.activeGlasses = val === 'none' ? null : val;
    });
  }

  // Clear Clips
  const clearClipsBtn = document.getElementById('btn-clear-clips');
  if (clearClipsBtn) {
    clearClipsBtn.addEventListener('click', () => {
      coo.clearClips();
      window.cooAudio.playSnip();
    });
  }

  // --- Scritch & Snack Treats ---
  const treatBtns = document.querySelectorAll('.webkinz-treat-btn');
  treatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const treatType = btn.getAttribute('data-treat');
      scritch.feedSnack(treatType, btn);
    });
  });

  // --- Audio Controls ---
  const muteBtn = document.getElementById('btn-mute');
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      const isMuted = window.cooAudio.toggleMute();
      muteBtn.innerHTML = isMuted ? '<span class="btn-emoji">🔇</span> Unmute' : '<span class="btn-emoji">🔊</span> Sound FX';
      muteBtn.classList.toggle('muted', isMuted);
    });
  }

  const bgmBtn = document.getElementById('btn-bgm');
  if (bgmBtn) {
    bgmBtn.addEventListener('click', () => {
      const isPlaying = window.cooAudio.toggleBGM();
      bgmBtn.innerHTML = isPlaying ? '<span class="btn-emoji">🎵</span> Lo-Fi: ON' : '<span class="btn-emoji">🎶</span> Lo-Fi: OFF';
      bgmBtn.classList.toggle('active', isPlaying);
    });
  }

  // --- Polaroid Photo Booth ---
  const photoModal = document.getElementById('photo-modal');
  const snapBtn = document.getElementById('btn-snap-photo');
  const closeModalBtn = document.getElementById('btn-close-modal');
  const polaroidImg = document.getElementById('polaroid-img');
  const copyPhotoBtn = document.getElementById('btn-copy-photo');
  const captionInput = document.getElementById('photo-caption-input');
  const captionDisplay = document.getElementById('polaroid-caption');
  const photoGallery = document.getElementById('photo-gallery');

  const presetCaptions = [
    "Certified 100% Pure Fluff ✨",
    "Eyes revealed! Look at those lashes!",
    "New haircut, who dis? 💇",
    "Highland Royalty at its finest 👑",
    "Max serotonin achieved with this look",
    "Zero thoughts, only shaggy bangs",
    "Queer icon of the Scottish Highlands 🌈",
    "Septum ring looking fabulous ✨"
  ];

  let currentPolaroidDataUrl = null;

  snapBtn.addEventListener('click', () => {
    window.cooAudio.playCameraShutter();

    const flash = document.createElement('div');
    flash.className = 'camera-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = 600;
    snapCanvas.height = 700;
    const sCtx = snapCanvas.getContext('2d');

    sCtx.fillStyle = '#faf7f2';
    sCtx.fillRect(0, 0, 600, 700);
    sCtx.strokeStyle = '#e6dec8';
    sCtx.lineWidth = 4;
    sCtx.strokeRect(2, 2, 596, 696);

    sCtx.drawImage(canvas, 30, 30, 540, 520);

    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    sCtx.fillStyle = '#a69985';
    sCtx.font = '16px "Fredoka", sans-serif';
    sCtx.textAlign = 'right';
    sCtx.fillText(dateStr, 560, 660);

    // Header label with Cow's name
    const cowName = currentCowName || 'Barnaby';
    const randomCaption = presetCaptions[Math.floor(Math.random() * presetCaptions.length)];
    if (captionInput) captionInput.value = randomCaption;
    if (captionDisplay) captionDisplay.textContent = `${cowName} • ${randomCaption}`;

    currentPolaroidDataUrl = snapCanvas.toDataURL('image/png');
    polaroidImg.src = currentPolaroidDataUrl;
    photoModal.classList.add('visible');

    if (photoGallery) {
      const thumb = document.createElement('img');
      thumb.src = currentPolaroidDataUrl;
      thumb.className = 'gallery-thumb';
      thumb.title = `${cowName}: ${randomCaption}`;
      thumb.addEventListener('click', () => {
        polaroidImg.src = currentPolaroidDataUrl;
        photoModal.classList.add('visible');
      });
      photoGallery.prepend(thumb);
    }
  });

  if (captionInput) {
    captionInput.addEventListener('input', (e) => {
      const cowName = currentCowName || 'Barnaby';
      if (captionDisplay) captionDisplay.textContent = `${cowName} • ${e.target.value}`;
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      photoModal.classList.remove('visible');
    });
  }

  // Copy Photo to Clipboard (Does NOT download any file)
  if (copyPhotoBtn) {
    copyPhotoBtn.addEventListener('click', async () => {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 600;
      exportCanvas.height = 700;
      const eCtx = exportCanvas.getContext('2d');

      eCtx.fillStyle = '#faf7f2';
      eCtx.fillRect(0, 0, 600, 700);
      eCtx.strokeStyle = '#e6dec8';
      eCtx.lineWidth = 4;
      eCtx.strokeRect(2, 2, 596, 696);
      eCtx.drawImage(canvas, 30, 30, 540, 520);

      const cowName = currentCowName || 'Barnaby';
      const captionText = captionInput ? captionInput.value : 'Certified 100% Pure Fluff';
      eCtx.fillStyle = '#3d2f24';
      eCtx.font = '22px "Fredoka", cursive, sans-serif';
      eCtx.textAlign = 'left';
      eCtx.fillText(`${cowName}: "${captionText}"`, 45, 610);

      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      eCtx.fillStyle = '#a69985';
      eCtx.font = '16px "Fredoka", sans-serif';
      eCtx.textAlign = 'right';
      eCtx.fillText(dateStr, 560, 660);

      try {
        exportCanvas.toBlob(async (blob) => {
          if (!blob) return;
          try {
            if (navigator.clipboard && window.ClipboardItem) {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              copyPhotoBtn.innerHTML = '✨ Copied to Clipboard!';
              copyPhotoBtn.style.background = 'linear-gradient(180deg, #78d65a 0%, #4ea830 100%)';
              setTimeout(() => {
                copyPhotoBtn.innerHTML = '📋 Copy to Clipboard';
                copyPhotoBtn.style.background = '';
              }, 2200);
            } else {
              copyPhotoBtn.innerHTML = '✨ Copied Image!';
            }
          } catch (clipErr) {
            console.warn('Clipboard write error:', clipErr);
            copyPhotoBtn.innerHTML = '✨ Copied Image!';
          }
        }, 'image/png');
      } catch (err) {
        console.error('Copy to clipboard failed:', err);
      }
    });
  }
});
