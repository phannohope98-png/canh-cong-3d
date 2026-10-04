/* =========================================================
 * fx3d.js – Đạn & phép vẽ từ mô hình 3D: mũi tên (ta / quái), tinh thể phép, bom, thiên thạch
 * Mỗi loại chụp 1 sprite theo độ phân giải (Art3D.sprite) rồi xoay/đặt bằng canvas 2D.
 * ========================================================= */
(function () {
  if (!window.Art3D || !window.Chars3D || !window.Towers3D) return;
  const T = THREE, { part, G, add, node, mat, glow } = Chars3D.kit, U = Towers3D.U;
  const fletch = (g, col, x) => { for (const r of [0, Math.PI / 2]) add(g, part(G.ext([0, 0, -U(5), U(3.6), -U(4), 0, -U(5), -U(3.6)], 0.006, 0.002), col, { ink: 0.006, ds: true }), x, 0, 0, r, 0, 0); };
  const MAKE = {
    arrow(o) {
      const g = node('root');
      add(g, part(G.cyl(U(0.9), U(0.9), U(19), 6).rotateZ(Math.PI / 2), o.dark ? '#5a3a20' : '#d8b070', { ink: 0.008 }), -U(2), 0, 0);
      add(g, part(G.cone(U(2.2), U(6), 6).rotateZ(-Math.PI / 2), o.dark ? '#a8ff77' : o.gold ? '#ffe070' : '#eef3f8', { metal: 1, ink: 0.008, glow: o.dark || o.gold ? 0.8 : 0 }), U(9.5), 0, 0);
      fletch(g, o.dark ? '#3a2a2a' : '#6ad06a', -U(10));
      return g;
    },
    bolt() { const g = node('root'); add(g, part(G.oct(U(6), 1.6), '#6ac8ff', { glow: 0.5, ink: 0.01 }), 0, 0, 0); add(g, part(G.oct(U(3.5), 1.6), '#e8f8ff', { glow: 0.9, ink: 0.006 }), 0, 0, 0, 0, 0, Math.PI / 2); return g; },
    bomb() {
      const g = node('root');
      add(g, part(G.ball(U(7), 1, 1, 1, 14), '#3a3a44', { metal: 1 }), 0, 0, 0);
      add(g, part(G.cyl(U(2.4), U(2.6), U(2.5), 8), '#5a5a66', { metal: 1, ink: 0.008 }), U(2.5), U(6.4), 0, 0, 0, -0.4);
      add(g, part(G.tube([[U(3), U(7.5), 0], [U(4.5), U(10), 0], [U(3.5), U(12), 0]], U(0.6), 6), '#c8a060', { ink: 0.006 }), 0, 0, 0);
      return g;
    },
    meteor() {
      const g = node('root');
      add(g, part(new T.DodecahedronGeometry(U(10), 0).scale(1, 0.9, 1), '#4a2a1a'), 0, 0, 0, 0.4, 0.7, 0);
      for (const [x, y, r] of [[-3, 2, 0.5], [3, -2, -0.6], [0, 5, 1.2]]) add(g, new T.Mesh(G.sbox(U(1.2), U(7), U(1)), mat('#ffb04a', { glow: 1.8 })), U(x), U(y), U(9.2), 0, 0, r);
      glow(g, 0, 0, 0, 1.0, '#ff8a2a', 0.6);
      return g;
    }
  };
  const cache = new Map();
  function sprite(kind, o, ppu) {
    const key = kind + JSON.stringify(o || {}) + '@' + ppu;
    let sp = cache.get(key);
    if (sp === undefined) { Chars3D.setInk(1.0); sp = MAKE[kind] ? Art3D.sprite(MAKE[kind](o || {}), ppu) : null; cache.set(key, sp); }
    return sp;
  }
  window.Fx3D = {
    /** vẽ tại (x,y), xoay angle (rad), phóng scale; trả false nếu không vẽ được (dùng bản 2D) */
    draw(ctx, kind, x, y, angle, scale, o) {
      if (!Art3D.enabled || !Art3D.available()) return false;
      const res = (window.Painter && Painter.res) || 1, s = scale || 1, ppu = Math.min(4, Math.max(0.5, Math.ceil(res * s * 2) / 2));
      const sp = sprite(kind, o, ppu); if (!sp) return false;
      if (kind === 'bolt') ArtKit.dot(ctx, x, y, 3.4, '#e8f8ff');
      ctx.save(); ctx.translate(x, y); if (angle) ctx.rotate(angle); if (s !== 1) ctx.scale(s, s);
      ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h); ctx.restore();
      return true;
    },
    /** Cờ 3D vải bay (8 khung): gốc cột tại (x,y), cao h đv, dir = hướng bay (±1) */
    flag(ctx, x, y, h, col, t, dir, emblem) {
      if (!Art3D.enabled || !Art3D.available()) return false;
      const fr = Math.floor((((t || 0) * 6 / (Math.PI * 2)) % 1 + 1) % 1 * 8), res = (window.Painter && Painter.res) || 1, s = 1, hb = Math.max(8, Math.round(h / 4) * 4);
      const ppu = Math.min(4, Math.max(0.5, Math.ceil(res * s * 2) / 2)), key = 'flag' + col + (emblem || '') + fr + '/' + hb + '@' + ppu;
      let sp = cache.get(key);
      if (sp === undefined) {
        Chars3D.setInk(1.0);
        const g = node('root'), HY = Towers3D.HY, ph = fr / 8 * Math.PI * 2;
        const PH = HY(hb); add(g, part(G.cyl(U(0.9), U(1.1), PH, 6), '#7a4a26', { ink: 0.008 }), 0, PH / 2, 0);
        add(g, part(G.ball(U(1.8), 1, 1, 1, 8), '#f5c542', { metal: 1, ink: 0.008 }), 0, PH + U(1.5), 0);
        const geo = new T.PlaneGeometry(U(16), HY(9), 10, 3), p = geo.attributes.position;
        for (let i = 0; i < p.count; i++) { const f = p.getX(i) / U(16) + 0.5; p.setXYZ(i, f * U(16) * (1 - 0.06 * f), p.getY(i) + S(ph + f * 3) * U(1.2) * f, S(ph + f * 3) * U(2.6) * f); }
        geo.computeVertexNormals();
        add(g, part(geo, col, { ds: true, ink: 0.008 }), U(0.5), PH - HY(4.8), 0);
        if (emblem) add(g, part(G.oct(U(2.6), 1.2).scale(1, 1, 0.3), emblem, { ink: 0.006 }), U(8), PH - HY(4.8) + S(ph + 1.5) * U(0.6), S(ph + 1.5) * U(1.3) + U(0.6));
        sp = Art3D.sprite(g, ppu); cache.set(key, sp);
      }
      if (!sp) return false;
      ctx.save(); ctx.translate(x, y); ctx.scale((dir || 1) * s, s); ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h); ctx.restore();
      return true;
    },
    clear() { cache.clear(); }
  };
  const S = Math.sin;
})();
