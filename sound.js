// ===== Sound effects + background music (all made in the browser) =====

const PENTATONIC = [523, 587, 659, 784, 880, 1047]; // notes for the melody
const BASS = [131, 110, 175, 196];                  // one bass note per bar

const Sound = {
  sfxOn: Store.get('sound', true),
  musicOn: Store.get('music', true),
  volume: Store.get('mvol', 0.5),
  context: null,
  musicGain: null,
  timer: null,
  nextTime: 0,
  step: 0,

  // The browser only allows audio after the first click or key press
  getContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.musicGain = this.context.createGain();
      this.musicGain.gain.value = this.volume;
      this.musicGain.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume();
    return this.context;
  },

  tone(frequency, start, length, type, level, output) {
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(level, start + 0.02);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + length);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(start);
    oscillator.stop(start + length + 0.05);
  },

  // ----- sound effects: [frequency, delay, length] -----
  play(name) {
    if (!this.sfxOn) return;
    const ctx = this.getContext();
    const songs = {
      click: [[600, 0, 0.06]],
      drop: [[260, 0, 0.12], [180, 0.06, 0.1]],
      win: [[523, 0, 0.2], [659, 0.15, 0.2], [784, 0.3, 0.2], [1047, 0.45, 0.4]],
      lose: [[392, 0, 0.25], [330, 0.2, 0.25], [262, 0.4, 0.4]],
      draw: [[440, 0, 0.2], [392, 0.2, 0.3]],
    };
    songs[name].forEach(([frequency, delay, length]) => {
      this.tone(frequency, ctx.currentTime + delay, length, 'triangle', 0.2, ctx.destination);
    });
  },

  // ----- background music -----
  startMusic() {
    if (!this.musicOn || this.timer) return;
    this.nextTime = this.getContext().currentTime;
    this.timer = setInterval(() => this.scheduleMusic(), 120);
  },

  stopMusic() {
    clearInterval(this.timer);
    this.timer = null;
  },

  // Plays a few notes ahead of time so the tune never stutters
  scheduleMusic() {
    const now = this.context.currentTime;
    if (this.nextTime < now) this.nextTime = now;
    while (this.nextTime < now + 0.4) {
      const bar = (this.step >> 3) % 4;
      if (this.step % 4 === 0) {
        this.tone(BASS[bar], this.nextTime, 0.9, 'triangle', 0.18, this.musicGain);
      }
      if (this.step % 2 === 0 || Math.random() < 0.4) {
        const pick = (this.step * 3 + bar * 2 + Math.floor(Math.random() * 2)) % 6;
        this.tone(PENTATONIC[pick], this.nextTime, 0.35, 'sine', 0.12, this.musicGain);
      }
      this.nextTime += 0.22;
      this.step++;
    }
  },

  // ----- settings -----
  setMusic(on) {
    this.musicOn = on;
    Store.set('music', on);
    if (on) this.startMusic();
    else this.stopMusic();
    this.showLabels();
  },

  setSfx(on) {
    this.sfxOn = on;
    Store.set('sound', on);
    this.showLabels();
  },

  setVolume(value) {
    this.volume = value;
    Store.set('mvol', value);
    if (this.musicGain) this.musicGain.gain.value = value;
  },

  // Updates every music / sound button on the page (top bar and Settings page)
  showLabels() {
    const labels = {
      musicBtn: this.musicOn ? '🎵 Music on' : '🔇 Music off',
      soundBtn: this.sfxOn ? '🔊 Sound on' : '🔇 Sound off',
      musicToggle: this.musicOn ? 'Music: ON' : 'Music: OFF',
      sfxToggle: this.sfxOn ? 'Effects: ON' : 'Effects: OFF',
    };
    for (const id in labels) {
      const button = document.getElementById(id);
      if (button) button.textContent = labels[id];
    }
  },
};

document.getElementById('musicBtn').onclick = () => Sound.setMusic(!Sound.musicOn);
document.getElementById('soundBtn').onclick = () => {
  Sound.setSfx(!Sound.sfxOn);
  Sound.play('click');
};
['pointerdown', 'keydown'].forEach((name) => {
  document.addEventListener(name, () => Sound.startMusic(), { once: true });
});
Sound.showLabels();
