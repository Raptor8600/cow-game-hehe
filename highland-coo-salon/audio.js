// audio.js - Procedural Web Audio Engine for Highland Coo Salon
class CooAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.dryerNode = null;
    this.dryerGain = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.dryerGain) {
      this.dryerGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
    return this.muted;
  }

  playButtonPop() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(840, t + 0.08);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  playStackPlop() {
    this.playButtonPop();
  }

  // Sizzling Steam for Flat Iron / Curling Wand
  playSizzle() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.18;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4200, t);
    filter.frequency.exponentialRampToValueAtTime(6000, t + 0.18);
    filter.Q.setValueAtTime(2.5, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.16, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  playSnip() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3200, t);
    noiseFilter.Q.setValueAtTime(3, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.15, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
    noise.start(t);
    noise.stop(t + 0.06);
  }

  playComb() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + Math.random() * 400, t);
    filter.frequency.linearRampToValueAtTime(2000, t + 0.1);
    filter.Q.setValueAtTime(2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  startDryer() {
    if (this.muted || this.dryerNode) return;
    this.init();
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.dryerNode = this.ctx.createBufferSource();
    this.dryerNode.buffer = buffer;
    this.dryerNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);

    const hum = this.ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.setValueAtTime(110, t);
    const humGain = this.ctx.createGain();
    humGain.gain.setValueAtTime(0.03, t);
    hum.connect(humGain);

    this.dryerGain = this.ctx.createGain();
    this.dryerGain.gain.setValueAtTime(0.001, t);
    this.dryerGain.gain.linearRampToValueAtTime(0.12, t + 0.2);

    this.dryerNode.connect(filter);
    filter.connect(this.dryerGain);
    humGain.connect(this.dryerGain);
    this.dryerGain.connect(this.ctx.destination);

    this.dryerNode.start(t);
    hum.start(t);
    this.dryerHum = hum;
  }

  stopDryer() {
    if (!this.dryerNode) return;
    const t = this.ctx.currentTime;
    if (this.dryerGain) {
      this.dryerGain.gain.linearRampToValueAtTime(0.001, t + 0.2);
    }
    setTimeout(() => {
      try {
        if (this.dryerNode) {
          this.dryerNode.stop();
          this.dryerNode.disconnect();
          this.dryerNode = null;
        }
        if (this.dryerHum) {
          this.dryerHum.stop();
          this.dryerHum.disconnect();
          this.dryerHum = null;
        }
      } catch (e) {}
    }, 220);
  }

  playSpritz() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(4000, t + 0.15);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  playSparkle() {
    if (this.muted) return;
    this.init();
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.27);
    });
  }

  playCrunch() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const delay = i * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(220 + Math.random() * 180, t + delay);
      osc.frequency.exponentialRampToValueAtTime(60, t + delay + 0.04);

      gain.gain.setValueAtTime(0.12, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + delay);
      osc.stop(t + delay + 0.06);
    }
  }

  playPurr() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.15);
    osc.frequency.linearRampToValueAtTime(60, t + 0.35);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(14, t);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(6, t);
    lfo.connect(osc.frequency);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(t);
    osc.start(t);
    lfo.stop(t + 0.45);
    osc.stop(t + 0.45);
  }

  playMoo() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, t);
    osc.frequency.linearRampToValueAtTime(135, t + 0.2);
    osc.frequency.linearRampToValueAtTime(95, t + 0.5);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.linearRampToValueAtTime(650, t + 0.25);
    filter.frequency.linearRampToValueAtTime(380, t + 0.5);
    filter.Q.setValueAtTime(4, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.1);
    gain.gain.linearRampToValueAtTime(0.11, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  playCameraShutter() {
    if (this.muted) return;
    this.init();
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.frequency.setValueAtTime(1800, t);
    gain1.gain.setValueAtTime(0.2, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.04);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.frequency.setValueAtTime(1200, t + 0.08);
    gain2.gain.setValueAtTime(0.18, t + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(t + 0.08);
    osc2.stop(t + 0.14);
  }

  toggleBGM() {
    this.init();
    if (this.bgmPlaying) {
      this.stopBGM();
      return false;
    } else {
      this.startBGM();
      return true;
    }
  }

  startBGM() {
    if (this.bgmPlaying) return;
    this.bgmPlaying = true;
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 659.25];
    const playNote = () => {
      if (!this.bgmPlaying) return;
      if (!this.muted) {
        const freq = scale[Math.floor(Math.random() * scale.length)];
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.025, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 1.3);
      }
      const nextDelay = [450, 600, 850, 1100][Math.floor(Math.random() * 4)];
      this.bgmTimer = setTimeout(playNote, nextDelay);
    };
    playNote();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.cooAudio = new CooAudio();
