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
        const finish = () => { if (fin) return; fin = true; this.ready = true; this.install(); res(); };
        list.forEach(k => { const im = new Image(); im.onload = () => { this.img[k] = im; done(); }; im.onerror = done; im.src = (window.ART_BASE || 'assets/art/') + k + '.png'; });
        setTimeout(finish, 7000);
      });
    },
    has(n) { return !!this.img[n]; },
    /** 'elf3' → { n:'elf', tier:3 } */
    parse(type) { const m = /^(soldier|elf|dwarf|mage|orct)(\d)$/.exec(type || ''); return m ? { n: KEY2IMG[m[1]], tier: +m[2] } : null; },

    install() {
      const reg = window.ArtChars; if (!reg) return;
      Object.keys(CH).forEach(n => {
        const base = this.img[n + '_q34']; if (!base) return;
        const aspect = base.width / base.height;
        for (let t = 1; t <= 4; t++) {
          const key = CH[n] + t, old = reg[key]; if (!old) continue;
          const h = SIZE[n] * TIER[t], w = h * aspect, flip = FACES_LEFT[n], img = base;
          const draw = (g, P) => {
            const mv = P.w >= 0, ph = mv ? P.w * TAU : 0, tt = P.t || 0, a = P.a;
            const sg = a >= 0 ? K.swing(a) : 0;
            const bob = mv ? Math.abs(Math.sin(ph)) * h * 0.06 : Math.sin(tt * 2.4) * h * 0.012;
            const rot = (mv ? Math.sin(ph) * 0.06 : Math.sin(tt * 1.7) * 0.012) + sg * 0.2;
            K.shadow(g, 0, 1, w * 0.46, h * 0.07, 0.4);
            if (t === 4) K.glow(g, 0, -h * 0.5, h * 0.62, '#ffe27a', 0.28 + Math.sin(tt * 3) * 0.06);
            g.save(); g.translate(sg * h * 0.1, -bob + h * 0.02); g.rotate(rot);
            if (flip) g.scale(-1, 1);
            g.drawImage(img, -w / 2, -h, w, h);
            g.restore();
          };
          reg[key] = { draw, box: [Math.ceil(w * 1.8), Math.ceil(h * 1.4), Math.ceil(w * 0.9), Math.ceil(h * 1.25)], dr: old.dr, head: h * 0.78, tall: h, sprite: true };
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
