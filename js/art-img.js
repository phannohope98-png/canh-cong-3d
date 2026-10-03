/* =========================================================
 * art-img.js – Dùng ẢNH ART ANIME thật (assets/art/*.png) cho 5 nhân vật trụ.
 * Con Người · Elf · Người Lùn · Phù Thủy · Orc – cắt từ bảng thiết kế gốc.
 * Mỗi nhân vật có 4 góc nhìn (front/side/back/q34) và 4 khuôn mặt (face1..4).
 * Sprite trong trận = góc 3/4 + chuyển động giả lập (nhún, nghiêng, lao tới).
 * Nếu ảnh không tải được, game tự dùng hình vẽ vector cũ.
 * ========================================================= */
(function () {
  const K = ArtKit, TAU = Math.PI * 2;
  const CH = { human: 'soldier', elf: 'elf', dwarf: 'dwarf', witch: 'mage', orc: 'orct' };       // ảnh → khoá nhân vật trong game
  const KEY2IMG = { soldier: 'human', elf: 'elf', dwarf: 'dwarf', mage: 'witch', orct: 'orc' };
  const FACES_LEFT = { human: true, elf: true, dwarf: true, witch: true, orc: false };        // ảnh gốc quay mặt sang trái → lật để quay phải
  const SIZE = { human: 46, elf: 42, dwarf: 31, witch: 44, orc: 44 };                          // chiều cao (đv thế giới) ở cấp 1
  const TIER = [0, 1, 1.05, 1.1, 1.18];
  const VIEWS = ['front', 'side', 'back', 'q34'];

  const ArtImg = {
    img: {}, ready: false, CH, KEY2IMG, VIEWS,
    load() {
      return new Promise(res => {
        const list = [];
        Object.keys(CH).forEach(n => { VIEWS.forEach(v => list.push(n + '_' + v)); for (let i = 1; i <= 4; i++) list.push(n + '_face' + i); });
        let left = list.length, fin = false;
        const done = () => { if (fin) return; if (--left <= 0) finish(); };
        const finish = () => { if (fin) return; fin = true; this.ready = true; this.install(); this.preloadBgs(); res(); };
        list.forEach(k => { const im = new Image(); im.onload = () => { this.img[k] = im; done(); }; im.onerror = done; im.src = (window.ART_BASE || 'assets/art/') + k + '.png'; });
        setTimeout(finish, 7000);
      });
    },
    has(n) { return !!this.img[n]; },
    /** Ảnh nền trận (jpg lớn): tải khi cần, gọi cb khi xong. Trả ảnh nếu đã sẵn sàng. */
    bgs: {},
    bg(name, cb) {
      let im = this.bgs[name];
      if (im) { if (im.complete && im.naturalWidth) return im; if (cb) im._cbs.push(cb); return null; }
      im = new Image(); im._cbs = cb ? [cb] : [];
      im.onload = () => { const l = im._cbs; im._cbs = []; l.forEach(f => f(im)); };
      im.src = (window.ART_BASE || 'assets/art/') + name + '.jpg'; this.bgs[name] = im;
      return null;
    },
    preloadBgs() { (CONFIG.levels || []).forEach(L => L.bg && this.bg(L.bg.img)); },
    /** 'elf3' → { n:'elf', tier:3 } */
    parse(type) { const m = /^(soldier|elf|dwarf|mage|orct)(\d)$/.exec(type || ''); return m ? { n: KEY2IMG[m[1]], tier: +m[2] } : null; },

    install() {
      const reg = window.ArtChars; if (!reg) return;
      Object.keys(CH).forEach(n => {
        const base = this.img[n + '_q34']; if (!base) return;
        const aspect = base.width / base.height;
        for (let t = 1; t <= 4; t++) {
          const key = CH[n] + t, old = reg[key]; if (!old) continue;
          const h = SIZE[n] * TIER[t], w = h * aspect, flip = FACES_LEFT[n], img = base, melee = n === 'human' || n === 'orc';
          // Hoạt ảnh kiểu Kingdom Rush cho ảnh tĩnh: nhún bước, co giãn, lấy đà – lao chém – vệt chém, giật khi bắn
          const draw = (g, P) => {
            const tt = P.t || 0, a = P.a, mv = P.w >= 0;
            let ox = 0, oy = 0, rot = 0, sx = 1, sy = 1, smear = -1, charge = -1;
            if (mv) {
              const ph = P.w * TAU, step = Math.abs(Math.sin(ph)), land = 1 - step;
              oy = -step * h * 0.075; rot = 0.06 + Math.sin(ph) * 0.07; sy = 1 - land * 0.08; sx = 1 + land * 0.05;
            } else if (a >= 0 && melee) {
              if (a < 0.38) { const k = a / 0.38; rot = -0.22 * k; sx = 1 + 0.06 * k; sy = 1 - 0.08 * k; ox = -h * 0.07 * k; }
              else if (a < 0.6) { const k = (a - 0.38) / 0.22; rot = -0.22 + 0.55 * k; ox = h * (-0.07 + 0.25 * k); sy = 0.92 + 0.14 * k; sx = 1.06 - 0.1 * k; smear = k; }
              else { const k = (a - 0.6) / 0.4; rot = 0.33 * (1 - k); ox = h * 0.18 * (1 - k); sy = 1.06 - 0.06 * k; sx = 0.96 + 0.04 * k; if (k < 0.45) smear = 1 - k / 0.45 * 0.6; }
            } else if (a >= 0) {
              if (a < 0.5) { const k = a / 0.5; rot = -0.1 * k; sx = 1 - 0.04 * k; sy = 1 + 0.04 * k; charge = k; }
              else { const k = (a - 0.5) / 0.5, r = Math.max(0, 1 - k * 1.6); ox = -h * 0.08 * r; rot = 0.08 * r; sx = 1 + 0.06 * r; sy = 1 - 0.06 * r; charge = r * 0.6; }
            } else { const b = Math.sin(tt * 2.4); sy = 1 + b * 0.02; sx = 1 - b * 0.012; rot = Math.sin(tt * 1.7) * 0.015; }
            K.shadow(g, ox * 0.6, 1, w * 0.46 * (1 + oy / h), h * 0.07, 0.4);
            if (t === 4) K.glow(g, ox, -h * 0.5, h * 0.62, '#ffe27a', 0.28 + Math.sin(tt * 3) * 0.06);
            g.save(); g.translate(ox, oy); g.rotate(rot); g.scale(sx, sy);
            if (flip) g.scale(-1, 1);
            g.drawImage(img, -w / 2, -h, w, h);
            g.restore();
            if (smear > 0) { // vệt chém hình lưỡi liềm trước mặt
              g.save(); g.translate(ox + w * 0.1, -h * 0.48); g.rotate(rot * 0.6);
              const r = h * 0.44, a0 = -1.5 + (1 - Math.min(1, smear)) * 0.5;
              g.globalAlpha = Math.min(1, smear) * 0.85;
              const gr = g.createLinearGradient(0, -r, 0, r); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, '#fffbe6'); gr.addColorStop(1, 'rgba(255,240,200,0.2)');
              g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, a0, 1.1); g.arc(-r * 0.18, 0, r * 0.84, 1.1, a0, true); g.closePath(); g.fill();
              g.restore();
            }
            if (charge > 0) { // tụ lực khi bắn: sáng đầu gậy / dây cung / nòng pháo
              const col = n === 'witch' ? '#c8a0ff' : n === 'dwarf' ? '#ffb060' : '#d8ffb0';
              K.glow(g, ox + w * 0.32, -h * (n === 'witch' ? 0.86 : 0.55), h * (0.16 + charge * 0.14), col, 0.25 + charge * 0.55);
            }
          };
          const bw = w * 1.8 + h * 0.9, box = [Math.ceil(bw), Math.ceil(h * 1.45), Math.ceil(bw / 2), Math.ceil(h * 1.3)];
          reg[key] = { draw, box, dr: old.dr, head: h * 0.78, tall: h, sprite: true };
        }
      });
      if (window.Painter) Painter.clear();
    },

    /** Vẽ chân dung vào canvas giao diện; trả true nếu dùng ảnh thật */
    portrait(canvas, type, opts) {
      const p = this.parse(type); if (!p) return false;
      opts = opts || {};
      const g = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
      g.clearRect(0, 0, W, H); g.imageSmoothingQuality = 'high';
      if (opts.head) {
        const im = this.img[p.n + '_face' + Math.max(1, Math.min(4, p.tier))]; if (!im) return false;
        const z = Math.max(1, (opts.zoom || 1) / 1.5), sc = Math.max(W / im.width, H / im.height) * z, w = im.width * sc, h = im.height * sc;
        g.drawImage(im, (W - w) / 2, (H - h) / 2, w, h); return true;
      }
      const im = this.img[p.n + '_' + (opts.view || 'front')]; if (!im) return false;
      const sc = Math.min(W / im.width, H / im.height) * 0.98, w = im.width * sc, h = im.height * sc;
      g.drawImage(im, (W - w) / 2, H - h - 1, w, h); return true;
    },
    src(name) { return (window.ART_BASE || 'assets/art/') + name + '.png'; }
  };
  window.ArtImg = ArtImg;
})();
