/* =========================================================
 * audio.js – Âm thanh
 * Mặc định dùng âm thanh TỔNG HỢP bằng Web Audio (không cần file).
 * Khai báo đường dẫn file trong CONFIG.audioFiles để thay bằng âm thật.
 * ========================================================= */
(function () {
  const AudioSys = {
    ctx: null, master: null, sfxGain: null, musicGain: null,
    buffers: {}, lastPlay: {}, musicTimer: null, musicStep: 0, musicSource: null,
    musicOn: true, soundOn: true, currentMusic: null,

    /** Gọi trong sự kiện chạm đầu tiên (iOS bắt buộc) */
    unlock() {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.8; this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.6; this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.22; this.musicGain.connect(this.master);
      this.loadFiles();
      if (this.currentMusic) this.playMusic(this.currentMusic);
      if (this.ambTheme) this.playAmbient(this.ambTheme);
    },

    loadFiles() {
      const files = CONFIG.audioFiles || {};
      Object.keys(files).forEach(name => {
        const url = files[name];
        if (!url) return;
        fetch(url).then(r => r.arrayBuffer()).then(b => this.ctx.decodeAudioData(b))
          .then(buf => { this.buffers[name] = buf; }).catch(() => { /* giữ âm tổng hợp */ });
      });
    },

    setMusic(on) { this.musicOn = on; if (on) { if (this.currentMusic) this.playMusic(this.currentMusic); } else this.stopMusic(true); },
    setSound(on) { this.soundOn = on; if (!on) this.stopAmbient(true); else if (this.ambTheme) this.playAmbient(this.ambTheme); },

    /* ---------- Hiệu ứng âm thanh ---------- */
    play(name) {
      if (!this.soundOn || !this.ctx) return;
      const now = this.ctx.currentTime;
      if (this.lastPlay[name] && now - this.lastPlay[name] < 0.05) return; // chống dồn tiếng
      this.lastPlay[name] = now;
      if (this.buffers[name]) { this.playBuffer(this.buffers[name], this.sfxGain); return; }
      const fn = SYNTH[name];
      if (fn) fn(this, now);
    },

    playBuffer(buf, dest, loop) {
      const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = !!loop; s.connect(dest); s.start(); return s;
    },

    tone(type, f0, f1, dur, vol, t, dest) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(dest || this.sfxGain); o.start(t); o.stop(t + dur + 0.02);
    },

    noise(dur, vol, t, freq, q) {
      const c = this.ctx;
      if (!this._noise) {
        const b = c.createBuffer(1, c.sampleRate, c.sampleRate), ch = b.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
        this._noise = b;
      }
      const s = c.createBufferSource(); s.buffer = this._noise;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1000; f.Q.value = q || 1;
      const g = c.createGain();
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(this.sfxGain); s.start(t); s.stop(t + dur + 0.02);
    },

    /* ---------- Nhạc nền ---------- */
    playMusic(kind) {
      this.currentMusic = kind;
      if (!this.ctx || !this.musicOn) return;
      this.stopMusic(false);
      if (this.buffers.music) { this.musicSource = this.playBuffer(this.buffers.music, this.musicGain, true); return; }
      const pattern = MUSIC[kind] || (kind.indexOf('battle') === 0 ? MUSIC.battle : MUSIC.menu);
      this.musicStep = 0;
      const stepDur = pattern.tempo;
      let next = this.ctx.currentTime + 0.05;
      // Bộ lập lịch đơn giản: lên lịch trước ~0.3s
      this.musicTimer = setInterval(() => {
        if (!this.ctx) return;
        while (next < this.ctx.currentTime + 0.3) {
          const i = this.musicStep % pattern.melody.length;
          const m = pattern.melody[i], b = pattern.bass[i % pattern.bass.length];
          if (m) this.tone(pattern.lead || 'triangle', m, m, stepDur * (pattern.sus || 0.9), pattern.lv || 0.35, next, this.musicGain);
          if (b) this.tone(pattern.low || 'sine', b, b, stepDur * 1.8, 0.5, next, this.musicGain);
          if (pattern.pad && i % 8 === 0) this.tone('sine', pattern.pad[(i / 8) % pattern.pad.length], pattern.pad[(i / 8) % pattern.pad.length], stepDur * 8, 0.12, next, this.musicGain);
          this.musicStep++; next += stepDur;
        }
      }, 100);
    },

    /* ---------- Tiếng môi trường theo vùng (gió, chim, dung nham…) ---------- */
    playAmbient(theme) {
      this.ambTheme = theme;
      if (!this.ctx || !this.soundOn) return;
      this.stopAmbient(true);
      const c = this.ctx, A = AMB[theme] || AMB.forest, out = c.createGain(); out.gain.value = 0; out.connect(this.master);
      out.gain.linearRampToValueAtTime(A.vol, c.currentTime + 2);
      if (!this._noiseLoop) { const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), ch = b.getChannelData(0); let br = 0; for (let i = 0; i < ch.length; i++) { br = br * 0.97 + (Math.random() * 2 - 1) * 0.03; ch[i] = (Math.random() * 2 - 1) * 0.5 + br * 6; } this._noiseLoop = b; }
      const nodes = [];
      for (const L of A.layers) { // lớp nhiễu lọc + dao động chậm (gió / ầm ì)
        const s = c.createBufferSource(); s.buffer = this._noiseLoop; s.loop = true;
        const f = c.createBiquadFilter(); f.type = L.type; f.frequency.value = L.f; f.Q.value = L.q || 0.7;
        const g = c.createGain(); g.gain.value = L.v;
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = L.lfo; lg.gain.value = L.v * 0.8; lfo.connect(lg); lg.connect(g.gain);
        if (L.sweep) { const lf2 = c.createOscillator(), lg2 = c.createGain(); lf2.frequency.value = L.lfo * 0.7; lg2.gain.value = L.sweep; lf2.connect(lg2); lg2.connect(f.frequency); lf2.start(); nodes.push(lf2); }
        s.connect(f); f.connect(g); g.connect(out); s.start(); lfo.start(); nodes.push(s, lfo);
      }
      if (A.drone) for (const fr of A.drone) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = fr; g.gain.value = 0.05; o.connect(g); g.connect(out); o.start(); nodes.push(o); }
      this.amb = { out, nodes, timer: setInterval(() => { if (!this.soundOn || !A.event) return; if (Math.random() < A.rate) A.event(this, c.currentTime, out); }, 250) };
    },
    stopAmbient(keep) {
      if (!keep) this.ambTheme = null;
      const a = this.amb; if (!a) return; this.amb = null; clearInterval(a.timer);
      try { a.out.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6); } catch (e) { }
      setTimeout(() => { a.nodes.forEach(n => { try { n.stop(); } catch (e) { } }); try { a.out.disconnect(); } catch (e) { } }, 700);
    },
    stopMusic(clearKind) {
      if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
      if (this.musicSource) { try { this.musicSource.stop(); } catch (e) {} this.musicSource = null; }
      if (clearKind) { /* giữ currentMusic để bật lại */ }
    }
  };

  // Nốt nhạc (Hz) – ngũ cung Rê thứ cho không khí fantasy
  const N = { D3: 146.8, F3: 174.6, G3: 196, A3: 220, C4: 261.6, D4: 293.7, F4: 349.2, G4: 392, A4: 440, C5: 523.3, D5: 587.3 };
  const MUSIC = {
    menu: { tempo: 0.32,
      melody: [N.D4, 0, N.F4, N.G4, N.A4, 0, N.G4, N.F4, N.D4, 0, N.C4, N.D4, N.F4, 0, 0, 0],
      bass: [N.D3, 0, 0, 0, N.A3, 0, 0, 0, N.F3, 0, 0, 0, N.G3, 0, 0, 0] },
    battle: { tempo: 0.2,
      melody: [N.D4, N.D4, N.F4, N.D4, N.G4, N.F4, N.D4, 0, N.A4, N.G4, N.F4, N.G4, N.A4, 0, N.C5, N.A4],
      bass: [N.D3, 0, N.D3, 0, N.F3, 0, N.F3, 0, N.G3, 0, N.G3, 0, N.A3, 0, N.A3, 0] }
  };

  /* Nhạc trận riêng từng vùng */
  const Hz = (n) => 440 * Math.pow(2, (n - 69) / 12); // số MIDI → Hz
  const seq = s => s.map(n => n ? Hz(n) : 0);
  Object.assign(MUSIC, {
    battle_forest: MUSIC.battle,
    battle_castle: { tempo: 0.22, lead: 'square', lv: 0.16, sus: 0.6, pad: seq([60, 67]),
      melody: seq([67, 0, 67, 69, 71, 0, 72, 71, 69, 0, 67, 0, 64, 65, 67, 0]), bass: seq([48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 57, 0, 55, 0, 50, 0]) },
    battle_desert: { tempo: 0.21, lead: 'sawtooth', lv: 0.12, sus: 0.7,
      melody: seq([62, 63, 66, 67, 69, 0, 67, 66, 63, 62, 0, 63, 66, 0, 62, 0]), bass: seq([38, 0, 38, 45, 38, 0, 38, 45, 39, 0, 39, 46, 38, 0, 38, 0]) },
    battle_ice: { tempo: 0.3, lead: 'sine', lv: 0.4, sus: 1.6, pad: seq([57, 62, 64]),
      melody: seq([81, 0, 76, 0, 79, 0, 74, 0, 81, 0, 83, 79, 76, 0, 0, 0]), bass: seq([45, 0, 0, 0, 50, 0, 0, 0, 52, 0, 0, 0, 47, 0, 0, 0]) },
    battle_lava: { tempo: 0.19, lead: 'sawtooth', lv: 0.13, sus: 0.5, low: 'triangle',
      melody: seq([50, 0, 53, 50, 56, 0, 55, 53, 50, 0, 49, 50, 56, 55, 53, 0]), bass: seq([26, 26, 0, 26, 32, 0, 31, 0, 26, 26, 0, 26, 29, 0, 32, 0]) },
    battle_chaos: { tempo: 0.27, lead: 'triangle', lv: 0.3, sus: 1.4, pad: seq([48, 54]),
      melody: seq([72, 0, 76, 0, 78, 74, 0, 70, 72, 0, 66, 0, 68, 0, 74, 0]), bass: seq([36, 0, 0, 42, 0, 0, 40, 0, 36, 0, 0, 34, 0, 0, 38, 0]) }
  });
  /* Tiếng môi trường: lớp nhiễu lọc (gió, ầm ì) + sự kiện ngẫu nhiên (chim, chuông, sủi bọt) */
  const chirp = (a, t, out) => { const f = 2400 + Math.random() * 1800; for (let i = 0; i < 2 + (Math.random() * 3 | 0); i++) a.tone('sine', f, f * 1.25, 0.07, 0.05, t + i * 0.1, out); };
  const AMB = {
    forest: { vol: 0.9, layers: [{ type: 'bandpass', f: 600, q: 0.5, v: 0.05, lfo: 0.12, sweep: 200 }], rate: 0.18, event: chirp },
    castle: { vol: 0.8, layers: [{ type: 'bandpass', f: 500, q: 0.6, v: 0.04, lfo: 0.1 }], rate: 0.05, event: (a, t, out) => { const f = 523 * (Math.random() < 0.5 ? 1 : 0.75); a.tone('sine', f, f, 2.2, 0.035, t, out); a.tone('sine', f * 2.01, f * 2.01, 1.4, 0.015, t, out); } },
    desert: { vol: 1, layers: [{ type: 'bandpass', f: 420, q: 0.8, v: 0.09, lfo: 0.08, sweep: 180 }, { type: 'highpass', f: 3000, q: 0.5, v: 0.012, lfo: 0.2 }], rate: 0.02, event: (a, t) => a.noise(1.2, 0.03, t, 1800, 2) },
    ice: { vol: 1, layers: [{ type: 'bandpass', f: 900, q: 2.5, v: 0.08, lfo: 0.15, sweep: 500 }, { type: 'lowpass', f: 300, q: 0.5, v: 0.05, lfo: 0.07 }], rate: 0.03, event: (a, t, out) => a.tone('sine', 1400, 2100, 1.5, 0.012, t, out) },
    lava: { vol: 1, layers: [{ type: 'lowpass', f: 140, q: 0.7, v: 0.3, lfo: 0.1 }], rate: 0.35, event: (a, t, out) => { const f = 70 + Math.random() * 90; a.tone('sine', f, f * 2.2, 0.12, 0.09, t, out); } },
    chaos: { vol: 0.9, layers: [{ type: 'bandpass', f: 300, q: 4, v: 0.06, lfo: 0.05, sweep: 120 }], drone: [55, 55.7, 82.4], rate: 0.06, event: (a, t, out) => a.tone('triangle', 880, 440, 1.8, 0.02, t, out) }
  };

  // Âm thanh tổng hợp (placeholder)
  const SYNTH = {
    click:   (a, t) => a.tone('sine', 660, 880, 0.07, 0.3, t),
    arrow:   (a, t) => { a.noise(0.08, 0.25, t, 3000, 2); a.tone('triangle', 900, 500, 0.06, 0.08, t); },
    magic:   (a, t) => { a.tone('sine', 400, 1200, 0.25, 0.18, t); a.tone('triangle', 800, 1600, 0.2, 0.08, t + 0.03); },
    orc:     (a, t) => { a.tone('square', 140, 60, 0.12, 0.18, t); a.noise(0.08, 0.25, t, 400, 1); },
    hit:     (a, t) => a.noise(0.05, 0.15, t, 1500, 1),
    cannon:  (a, t) => { a.noise(0.25, 0.35, t, 500, 0.8); a.tone('sine', 140, 50, 0.25, 0.3, t); },
    holy:    (a, t) => { [660, 880, 1320].forEach((f, i) => a.tone('sine', f, f * 1.02, 0.5, 0.12, t + i * 0.06)); },
    sell:    (a, t) => { a.tone('sine', 900, 1400, 0.12, 0.14, t); a.tone('sine', 1400, 1800, 0.1, 0.1, t + 0.08); },
    life:    (a, t) => { a.tone('square', 300, 150, 0.2, 0.12, t); },
    sword:   (a, t) => { a.noise(0.07, 0.2, t, 4200, 3); a.tone('triangle', 1400, 700, 0.07, 0.07, t); },
    death:   (a, t) => a.tone('sawtooth', 300, 80, 0.18, 0.1, t),
    gold:    (a, t) => { a.tone('sine', 1200, 1200, 0.06, 0.12, t); a.tone('sine', 1800, 1800, 0.08, 0.1, t + 0.05); },
    build:   (a, t) => { a.tone('square', 200, 120, 0.1, 0.15, t); a.tone('square', 260, 160, 0.1, 0.12, t + 0.1); },
    explode: (a, t) => { a.noise(0.4, 0.5, t, 300, 0.7); a.tone('sine', 120, 40, 0.35, 0.3, t); },
    ice:     (a, t) => { a.noise(0.5, 0.2, t, 5000, 3); a.tone('sine', 1500, 600, 0.4, 0.08, t); },
    rage:    (a, t) => { a.tone('sawtooth', 110, 220, 0.4, 0.2, t); a.tone('square', 90, 180, 0.4, 0.1, t); },
    gateHit: (a, t) => { a.noise(0.15, 0.3, t, 250, 1); a.tone('square', 90, 60, 0.12, 0.12, t); },
    boss:    (a, t) => { a.tone('sawtooth', 70, 50, 1.2, 0.35, t); a.tone('sawtooth', 105, 75, 1.2, 0.2, t + 0.1); a.noise(1, 0.2, t, 200, 0.5); },
    wave:    (a, t) => { a.tone('triangle', 440, 440, 0.15, 0.2, t); a.tone('triangle', 660, 660, 0.25, 0.2, t + 0.15); },
    victory: (a, t) => { [523, 659, 784, 1047].forEach((f, i) => a.tone('triangle', f, f, 0.3, 0.25, t + i * 0.13)); },
    defeat:  (a, t) => { [392, 349, 311, 262].forEach((f, i) => a.tone('sawtooth', f, f * 0.98, 0.35, 0.12, t + i * 0.22)); },
    error:   (a, t) => a.tone('square', 200, 150, 0.12, 0.12, t)
  };

  window.AudioSys = AudioSys;
})();
