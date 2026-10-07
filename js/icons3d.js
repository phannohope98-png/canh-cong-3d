/* =========================================================
 * icons3d.js – Biểu tượng giao diện dạng vật thể 3D (xu, sao, tim, đầu lâu, vương miện, rương…)
 * Dựng bằng bộ khối của chars3d (toon + viền mực), chụp 96×96 rồi lưu đệm (localStorage) để lần
 * sau mở game không phải dựng lại. Nút điều khiển (dừng, phát, đóng…) vẫn là SVG cho nét.
 * ========================================================= */
(function () {
  if (!window.THREE || !window.Chars3D || !window.Art3D) return;
  const T = THREE, { part, G, add, node, mat, glow, sh } = Chars3D.kit, GOLD = '#f5c542', TAU = Math.PI * 2, S = Math.sin, C = Math.cos;
  const VER = 'icons3d-v3', SIZE = 96;
  const shape = pts => { const s = new T.Shape(); s.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) s.lineTo(pts[i], pts[i + 1]); return s; };
  const star = (r1, r2) => { const p = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; p.push(C(a) * r, S(a) * r); } return shape(p); };
  const heart = () => { const s = new T.Shape(); s.moveTo(0, -0.42); s.bezierCurveTo(-0.15, -0.28, -0.5, -0.05, -0.5, 0.18); s.bezierCurveTo(-0.5, 0.42, -0.2, 0.5, 0, 0.3); s.bezierCurveTo(0.2, 0.5, 0.5, 0.42, 0.5, 0.18); s.bezierCurveTo(0.5, -0.05, 0.15, -0.28, 0, -0.42); return s; };
  const blade = (len, w) => G.ext([-w / 2, 0, w / 2, 0, w / 2, len * 0.85, 0, len, -w / 2, len * 0.85], 0.05, 0.012);
  function sword(g, x, rz, col) {
    const s = node('sw'); s.position.x = x; s.rotation.z = rz; g.add(s);
    add(s, part(blade(0.8, 0.14), col || '#dfe6f0', { metal: 1 }), 0, -0.25, 0);
    add(s, part(G.sbox(0.38, 0.07, 0.09, 0.5), GOLD, { metal: 1 }), 0, -0.26, 0);
    add(s, part(G.cyl(0.035, 0.035, 0.22), '#5a3420'), 0, -0.4, 0);
    add(s, part(G.ball(0.055), GOLD, { metal: 1 }), 0, -0.53, 0);
  }
  const M = {
    coin() { const g = node('i'); add(g, part(G.cyl(0.5, 0.5, 0.13, 28).rotateX(Math.PI / 2), GOLD, { metal: 1 }), 0, 0, 0); add(g, part(G.torus(0.38, 0.03).rotateZ(0), sh(GOLD, -0.2), { metal: 1, ink: 0.012 }), 0, 0, 0.07); add(g, part(G.ext(star(0.22, 0.1), 0.03, 0.008), sh(GOLD, -0.15), { metal: 1, ink: 0.01 }), 0, 0, 0.07); return g; },
    star() { const g = node('i'); add(g, part(G.ext(star(0.55, 0.24), 0.12, 0.05), '#ffd23a', { metal: 1 }), 0, 0, 0); return g; },
    heart() { const g = node('i'); add(g, part(G.ext(heart(), 0.14, 0.06), '#e8384a'), 0, 0, 0); add(g, new T.Mesh(G.ball(0.08, 1.4, 0.8, 0.5), mat('#ffffff', { op: 0.7 })), -0.24, 0.24, 0.12, 0, 0, 0.5); return g; },
    skull() { const g = node('i'); add(g, part(G.ball(0.42, 1, 0.95, 0.95), '#efe6d0'), 0, 0.08, 0); add(g, part(G.sbox(0.42, 0.2, 0.36, 0.5), '#efe6d0'), 0, -0.3, 0.08); for (const x of [-0.16, 0.16]) add(g, new T.Mesh(G.ball(0.11, 0.9, 1.1, 0.5), mat('#1a1014')), x, 0.04, 0.37); add(g, new T.Mesh(G.cone(0.05, 0.1).rotateX(Math.PI), mat('#1a1014')), 0, -0.1, 0.4); return g; },
    sun() { const g = node('i'); add(g, part(G.cyl(0.3, 0.3, 0.12, 28).rotateX(Math.PI / 2), '#ffd23a', { glow: 0.35, metal: 1 }), 0, 0, 0); add(g, new T.Mesh(G.ball(0.2, 1, 1, 0.4), mat('#fff6c0', { glow: 0.8 })), 0, 0, 0.07); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, L = i % 2 ? 0.2 : 0.28; add(g, part(G.cone(0.085, L, 4), i % 2 ? '#ffb02a' : '#ffd23a', { glow: 0.3, ink: 0.012 }), C(a) * (0.36 + L / 2), S(a) * (0.36 + L / 2), 0, 0, 0, a - Math.PI / 2); } glow(g, 0, 0, 0.1, 1.6, '#ffd060', 0.55); return g; },
    gem() { const g = node('i'); add(g, part(G.oct(0.45, 1.25), '#4ad8ff', { glow: 0.3 }), 0, 0, 0, 0, 0.4, 0); return g; },
    crown() { const g = node('i'); add(g, part(G.cyl(0.42, 0.45, 0.22, 24), GOLD, { metal: 1 }), 0, -0.15, 0); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; add(g, part(G.cone(0.08, 0.32), GOLD, { metal: 1, ink: 0.012 }), S(a) * 0.4, 0.1, C(a) * 0.4); add(g, new T.Mesh(G.ball(0.045), mat(GOLD, { metal: 1 })), S(a) * 0.4, 0.28, C(a) * 0.4); } add(g, part(G.oct(0.07, 1.2), '#e0303a', { ink: 0.01 }), 0, -0.15, 0.45); return g; },
    lock() { const g = node('i'); add(g, part(G.torus(0.22, 0.06, Math.PI), '#aeb4c0', { metal: 1 }), 0, 0.12, 0); add(g, part(G.sbox(0.62, 0.48, 0.24, 0.3), GOLD, { metal: 1 }), 0, -0.18, 0); add(g, new T.Mesh(G.cyl(0.05, 0.05, 0.1).rotateX(Math.PI / 2), mat('#3a2a1a')), 0, -0.14, 0.12); return g; },
    bomb() { const g = node('i'); add(g, part(G.ball(0.4), '#3a3a48', { metal: 1 }), 0, -0.08, 0); add(g, part(G.cyl(0.12, 0.13, 0.1), '#6a6a78', { metal: 1 }), 0.18, 0.3, 0, 0, 0, -0.5); add(g, new T.Mesh(G.ball(0.08), mat('#ffb030', { glow: 1.5 })), 0.32, 0.45, 0); glow(g, 0.32, 0.45, 0.1, 0.5, '#ffb030', 0.8); return g; },
    sword(col, gl) { const g = node('i'); sword(g, 0, -0.75, col); if (gl) glow(g, 0, 0.1, 0.2, 1.4, gl, 0.55); return g; },
    armor(col) {
      col = col || '#8a6a44'; const mt = col !== '#8a6a44' ? { metal: 1 } : {}, g = node('i');
      add(g, part(G.sbox(0.7, 0.72, 0.4, 0.3), col, mt), 0, -0.05, 0);
      for (const s of [-1, 1]) add(g, part(G.ball(0.2, 1.2, 0.8, 1), sh(col, 0.08), mt), s * 0.42, 0.24, 0);
      add(g, part(G.sbox(0.74, 0.1, 0.44, 0.4), sh(col, -0.3)), 0, -0.3, 0);
      add(g, part(G.sbox(0.08, 0.5, 0.06, 0.5), GOLD, { metal: 1, ink: 0.01 }), 0, 0.02, 0.21); add(g, part(G.sbox(0.3, 0.08, 0.06, 0.5), GOLD, { metal: 1, ink: 0.01 }), 0, 0.12, 0.21);
      return g;
    },
    swords() { const g = node('i'); sword(g, -0.08, -0.7); sword(g, 0.08, 0.7); return g; },
    shield() { const g = node('i'), s = new T.Shape(); s.moveTo(-0.42, 0.45); s.lineTo(0.42, 0.45); s.quadraticCurveTo(0.45, -0.12, 0, -0.52); s.quadraticCurveTo(-0.45, -0.12, -0.42, 0.45); add(g, part(G.ext(s, 0.1, 0.03), '#2a5ad0'), 0, 0, 0); add(g, part(G.sbox(0.1, 0.72, 0.05, 0.5), GOLD, { metal: 1, ink: 0.01 }), 0, 0, 0.08); add(g, part(G.sbox(0.56, 0.1, 0.05, 0.5), GOLD, { metal: 1, ink: 0.01 }), 0, 0.15, 0.08); return g; },
    bow() { const g = node('i'); add(g, part(G.tube([[-0.1, -0.55, 0], [0.18, -0.3, 0], [0.26, 0, 0], [0.18, 0.3, 0], [-0.1, 0.55, 0]], 0.04, 16), '#c89a3a'), 0, 0, 0); add(g, new T.Mesh(G.cyl(0.008, 0.008, 1.1), mat('#f4f0e0')), -0.1, 0, 0); g.rotation.z = -0.6; return g; },
    staff() { const g = node('i'); add(g, part(G.cyl(0.04, 0.05, 1.0), '#5a3a26'), 0, -0.1, 0); add(g, part(G.oct(0.14, 1.4), '#c08aff', { glow: 0.6 }), 0, 0.5, 0); glow(g, 0, 0.5, 0.1, 0.6, '#c08aff', 0.6); g.rotation.z = -0.6; return g; },
    hammer() { const g = node('i'); add(g, part(G.cyl(0.05, 0.055, 0.9), '#6a4026'), 0, -0.1, 0); add(g, part(G.sbox(0.6, 0.3, 0.3, 0.3), '#a8adb8', { metal: 1 }), 0, 0.35, 0); for (const x of [-0.31, 0.31]) add(g, part(G.sbox(0.07, 0.34, 0.34, 0.4), GOLD, { metal: 1, ink: 0.01 }), x, 0.35, 0); g.rotation.z = -0.6; return g; },
    axe() { const g = node('i'); add(g, part(G.cyl(0.05, 0.055, 1.0), '#6a4026'), 0, -0.1, 0); add(g, part(G.ext([0.03, 0.12, 0.25, 0.3, 0.42, 0.22, 0.4, -0.02, 0.42, -0.25, 0.25, -0.22, 0.03, -0.05], 0.06, 0.015), '#c8ccd6', { metal: 1 }), 0, 0.3, 0); g.rotation.z = -0.5; return g; },
    chest() { const g = node('i'); add(g, part(G.sbox(0.8, 0.42, 0.5, 0.2), '#9a6a3a'), 0, -0.15, 0); add(g, part(G.cyl(0.25, 0.25, 0.8, 16, 1).rotateZ(Math.PI / 2).scale(1, 0.8, 1), '#b07a44'), 0, 0.06, 0); for (const x of [-0.28, 0.28]) add(g, part(G.sbox(0.08, 0.66, 0.54, 0.4), GOLD, { metal: 1, ink: 0.01 }), x, -0.06, 0); add(g, part(G.sbox(0.12, 0.14, 0.06, 0.4), GOLD, { metal: 1, ink: 0.01 }), 0, 0.02, 0.27); return g; },
    bag() { const g = node('i'); add(g, part(G.ball(0.42, 1, 0.9, 0.85), '#a8784a'), 0, -0.12, 0); add(g, part(G.cone(0.22, 0.3), '#a8784a'), 0, 0.32, 0, Math.PI); add(g, part(G.torus(0.13, 0.035).rotateX(Math.PI / 2), '#5a3420', { ink: 0.01 }), 0, 0.24, 0); add(g, new T.Mesh(G.ball(0.07), mat(GOLD, { metal: 1 })), 0.18, 0.1, 0.32); return g; },
    fire() { const g = node('i'); for (const [x, h, r, c] of [[-0.12, 0.9, 0.28, '#ff6a1a'], [0.15, 0.7, 0.24, '#ff9a2a'], [0, 0.5, 0.18, '#ffe06a']]) add(g, part(G.cone(r, h, 12), c, { glow: 0.8, ink: 0.014 }), x, h / 2 - 0.45, 0.05 + h * 0.1); glow(g, 0, 0, 0.1, 1.2, '#ff8a2a', 0.5); return g; },
    frost() { const g = node('i'); for (let i = 0; i < 6; i++) add(g, part(G.oct(0.09, 5), '#9ae6ff', { glow: 0.4, ink: 0.01 }), 0, 0, 0, 0, 0, i / 6 * Math.PI); add(g, part(G.oct(0.14, 1), '#e8f8ff', { glow: 0.6 }), 0, 0, 0.05); return g; },
    tree() { const g = node('i'); add(g, part(G.cyl(0.07, 0.09, 0.3), '#6a4426'), 0, -0.4, 0); for (const [y, r, h] of [[-0.2, 0.42, 0.4], [0.08, 0.34, 0.36], [0.32, 0.24, 0.32]]) add(g, part(G.cone(r, h, 12), '#3f9a3a'), 0, y, 0); return g; },
    tower() { const g = node('i'); add(g, part(G.cyl(0.26, 0.3, 0.7, 20), '#a8a4b4'), 0, -0.2, 0); add(g, part(G.cone(0.36, 0.42, 20), '#c04a3a'), 0, 0.36, 0); add(g, new T.Mesh(G.sbox(0.1, 0.16, 0.05, 0.5), mat('#ffd27a', { glow: 1 })), 0, -0.08, 0.28); return g; },
    glove(col) { col = col || '#8a5a32'; const mt = col === '#8a5a32' || col === '#9a6a3a' ? {} : { metal: 1 }, g = node('i'); add(g, part(G.ball(0.3, 1, 1.1, 0.7), col, mt), 0, -0.05, 0); for (let i = 0; i < 4; i++) add(g, part(G.cap(0.07, 0.24), col, mt), -0.18 + i * 0.12, 0.32, 0, 0, 0, (i - 1.5) * -0.1); add(g, part(G.cap(0.075, 0.2), col, mt), -0.32, 0.0, 0, 0, 0, 0.9); add(g, part(G.cyl(0.3, 0.32, 0.18, 16).scale(1, 1, 0.7), GOLD, { metal: 1 }), 0, -0.38, 0); return g; },
    boot(col) { col = col || '#6a4426'; const mt = col === '#6a4426' || col === '#8a6a44' ? {} : { metal: 1 }, g = node('i'); add(g, part(G.sbox(0.32, 0.7, 0.34, 0.25), col, mt), -0.08, 0.05, 0); add(g, part(G.sbox(0.62, 0.24, 0.36, 0.3), col, mt), 0.06, -0.36, 0); add(g, part(G.sbox(0.38, 0.1, 0.38, 0.4), GOLD, { metal: 1, ink: 0.01 }), -0.08, 0.36, 0); return g; },
    up() { const g = node('i'); add(g, part(G.ext([-0.2, -0.5, 0.2, -0.5, 0.2, 0, 0.45, 0, 0, 0.5, -0.45, 0, -0.2, 0], 0.14, 0.04), '#5ac83a'), 0, 0, 0); return g; },
    gear() { const g = node('i'), s = new T.Shape(), n = 8; for (let i = 0; i < n * 2; i++) { const a0 = i / (n * 2) * TAU, a1 = (i + 1) / (n * 2) * TAU, r = i % 2 ? 0.36 : 0.48; if (!i) s.moveTo(C(a0) * r, S(a0) * r); else s.lineTo(C(a0) * r, S(a0) * r); s.lineTo(C(a1) * r, S(a1) * r); } const hole = new T.Path(); hole.absarc(0, 0, 0.15, 0, TAU, true); s.holes.push(hole); add(g, part(G.ext(s, 0.14, 0.03), '#9aa0ac', { metal: 1 }), 0, 0, 0); return g; },
    book() { const g = node('i'); add(g, part(G.sbox(0.7, 0.86, 0.1, 0.2), '#8a2a3a'), 0, 0, -0.1); add(g, part(G.sbox(0.64, 0.8, 0.12, 0.2), '#f4ead0'), 0.02, 0, 0); add(g, part(G.sbox(0.7, 0.86, 0.06, 0.2), '#a83a4a'), 0, 0, 0.1); add(g, part(G.ext(star(0.14, 0.06), 0.02, 0.005), GOLD, { metal: 1, ink: 0.008 }), 0, 0.05, 0.14); return g; },
    flag() { const g = node('i'); add(g, part(G.cyl(0.03, 0.03, 1.1), '#7a4a26'), -0.3, 0, 0); add(g, part(G.ext([0, 0, 0.62, -0.06, 0.5, -0.22, 0.62, -0.42, 0, -0.38], 0.04, 0.01), '#c0302a'), -0.28, 0.5, 0); return g; }
  };
  /* ---- vật phẩm gắn trụ ---- */
  Object.assign(M, {
    helm() { const g = node('i'); add(g, part(G.ball(0.42, 1, 0.85, 1), '#b8c0cc', { metal: 1 }), 0, 0.02, 0); add(g, part(G.torus(0.42, 0.05).rotateX(Math.PI / 2), GOLD, { metal: 1, ink: 0.01 }), 0, -0.12, 0); add(g, part(G.sbox(0.1, 0.36, 0.06, 0.5), '#8a929e', { metal: 1, ink: 0.01 }), 0, -0.12, 0.42); add(g, part(G.ball(0.13, 0.6, 1.6, 1.4), '#c8302a'), 0, 0.45, -0.05); return g; },
    drum() { const g = node('i'); add(g, part(G.cyl(0.42, 0.42, 0.5, 24), '#a8502a'), 0, 0, 0); for (const y of [-0.25, 0.25]) add(g, part(G.cyl(0.44, 0.44, 0.07, 24), GOLD, { metal: 1, ink: 0.01 }), 0, y, 0); add(g, part(G.cyl(0.4, 0.4, 0.02, 24), '#f2e6c8'), 0, 0.28, 0); for (const s of [-1, 1]) add(g, part(G.cyl(0.03, 0.03, 0.7), '#6a4026'), s * 0.22, 0.5, 0.1, 0.3, 0, s * 0.5); return g; },
    quiver() { const g = node('i'); add(g, part(G.cyl(0.2, 0.17, 0.8, 16), '#8a5226'), 0, -0.1, 0); add(g, part(G.torus(0.2, 0.035).rotateX(Math.PI / 2), GOLD, { metal: 1, ink: 0.01 }), 0, 0.28, 0); for (const x of [-0.08, 0.02, 0.1]) { add(g, part(G.cyl(0.015, 0.015, 0.3), '#d8b880'), x, 0.42, 0); add(g, part(G.cone(0.05, 0.14), '#6ad06a', { ink: 0.01 }), x, 0.6, 0); } g.rotation.z = -0.4; return g; },
    feather() { const g = node('i'); add(g, part(G.ext([0, -0.55, 0.16, -0.2, 0.2, 0.2, 0.08, 0.55, -0.05, 0.3, -0.12, -0.1], 0.04, 0.01), '#f2ead8'), 0, 0, 0); add(g, part(G.cyl(0.018, 0.018, 1.0), '#8a6a44'), 0.04, 0, 0.03, 0, 0, -0.08); add(g, part(G.ext([0.02, 0.1, 0.18, 0.18, 0.14, 0.4, 0.03, 0.3], 0.045, 0.008), '#c8a060'), 0, 0, 0.01); g.rotation.z = -0.5; return g; },
    potion() { const g = node('i'); add(g, part(G.ball(0.36), '#5ad04a', { glow: 0.35 }), 0, -0.15, 0); add(g, part(G.cyl(0.11, 0.13, 0.28), '#c8e8d0'), 0, 0.26, 0); add(g, part(G.cyl(0.13, 0.12, 0.1), '#8a5a32'), 0, 0.44, 0); add(g, new T.Mesh(G.ball(0.08, 1.3, 0.8, 0.5), mat('#ffffff', { op: 0.7 })), -0.14, -0.02, 0.28); glow(g, 0, -0.15, 0.1, 0.8, '#7aff5a', 0.45); return g; },
    ring() { const g = node('i'); add(g, part(G.torus(0.34, 0.08), GOLD, { metal: 1 }), 0, -0.08, 0); add(g, part(G.oct(0.16, 1.3), '#8a3aff', { glow: 0.6, ink: 0.012 }), 0, 0.32, 0.02); glow(g, 0, 0.32, 0.1, 0.7, '#a060ff', 0.5); return g; },
    rune() { const g = node('i'); add(g, part(G.cyl(0.46, 0.46, 0.12, 6).rotateX(Math.PI / 2), '#6a6878'), 0, 0, 0); add(g, part(G.torus(0.3, 0.035), '#7fd8ff', { glow: 1 }), 0, 0, 0.07); for (let i = 0; i < 3; i++) add(g, new T.Mesh(G.sbox(0.05, 0.3, 0.04), mat('#7fd8ff', { glow: 1.2 })), 0, 0, 0.08, 0, 0, i * Math.PI / 3); glow(g, 0, 0, 0.1, 0.9, '#7fd8ff', 0.45); return g; },
    scope() { const g = node('i'); add(g, part(G.cyl(0.13, 0.17, 0.95, 16).rotateZ(Math.PI / 2), '#8a6a3a', { metal: 1 }), 0, 0, 0); for (const x of [-0.35, 0.35]) add(g, part(G.cyl(0.2, 0.2, 0.08, 16).rotateZ(Math.PI / 2), GOLD, { metal: 1, ink: 0.01 }), x, 0, 0); add(g, new T.Mesh(G.cyl(0.15, 0.15, 0.02, 16).rotateZ(Math.PI / 2), mat('#9adcff', { glow: 0.8 })), 0.5, 0, 0); g.rotation.z = 0.35; return g; },
    cannon() { const g = node('i'); add(g, part(G.cyl(0.17, 0.24, 0.95, 18).rotateZ(Math.PI / 2 - 0.4), '#4a4a58', { metal: 1 }), 0.05, 0.1, 0); add(g, part(G.torus(0.19, 0.05).rotateY(Math.PI / 2).rotateZ(-0.4), GOLD, { metal: 1, ink: 0.01 }), 0.42, 0.28, 0); add(g, part(G.cyl(0.24, 0.24, 0.1, 16).rotateX(Math.PI / 2), '#7a4a26'), -0.18, -0.25, 0.12); return g; },
    anvil() { const g = node('i'); add(g, part(G.sbox(0.86, 0.22, 0.38, 0.3), '#5a5e6a', { metal: 1 }), 0, 0.18, 0); add(g, part(G.cone(0.14, 0.32, 8).rotateZ(Math.PI / 2), '#5a5e6a', { metal: 1 }), -0.56, 0.2, 0); add(g, part(G.sbox(0.36, 0.3, 0.3, 0.3), '#4a4e58', { metal: 1 }), 0, -0.08, 0); add(g, part(G.sbox(0.62, 0.14, 0.42, 0.3), '#3a3e48', { metal: 1 }), 0, -0.3, 0); return g; },
    crystal() { const g = node('i'); add(g, part(G.oct(0.32, 1.9), '#9a7aff', { glow: 0.5 }), 0, 0.05, 0); for (const s of [-1, 1]) add(g, part(G.oct(0.16, 1.7), '#c8b0ff', { glow: 0.4, ink: 0.012 }), s * 0.3, -0.2, 0.05, 0, 0, s * 0.35); glow(g, 0, 0, 0.1, 1.0, '#a080ff', 0.5); return g; }
  });
  M.trophy = M.star;
  let store = {};
  try { store = JSON.parse(localStorage.getItem(VER) || '{}'); } catch (e) { store = {}; }
  function render(name, pa, pb) {
    const r = Art3D.renderer && Art3D.renderer(); if (!r) return null;
    Chars3D.setInk(1.5); const root = M[name](pa, pb); root.rotation.y += -0.42; root.rotation.x += 0.12;
    const scene = new T.Scene(); scene.add(new T.HemisphereLight(0xfff4e8, 0x5a4a6a, 0.9)); const k = new T.DirectionalLight(0xffffff, 1.05); k.position.set(-1.5, 3, 4); scene.add(k); scene.add(root);
    root.updateMatrixWorld(true); const b = new T.Box3().setFromObject(root), c = b.getCenter(new T.Vector3()), sz = b.getSize(new T.Vector3()), half = Math.max(sz.x, sz.y) * 0.56;
    const cam = new T.OrthographicCamera(c.x - half, c.x + half, c.y + half, c.y - half, 0.1, 50); cam.position.set(c.x, c.y, 20); cam.lookAt(c.x, c.y, 0);
    const v = new T.Vector2(); r.getSize(v); if (v.x < SIZE || v.y < SIZE) { r.setSize(Math.max(v.x, SIZE), Math.max(v.y, SIZE), false); r.getSize(v); }
    r.setViewport(0, 0, SIZE, SIZE); r.setScissor(0, 0, SIZE, SIZE); r.setScissorTest(true); r.render(scene, cam);
    const cv = document.createElement('canvas'); cv.width = cv.height = SIZE; cv.getContext('2d').drawImage(r.domElement, 0, v.y - SIZE, SIZE, SIZE, 0, 0, SIZE, SIZE);
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    return cv.toDataURL('image/png');
  }
  let dirty = false;
  window.Icons3D = {
    /** a, b: tham số mẫu (vd. màu trang bị, màu toả sáng) → mỗi biến thể lưu đệm riêng */
    url(name, a, b) {
      if (!M[name] || !Art3D.enabled || !Art3D.available()) return null;
      const id = a ? name + '|' + a + '|' + (b || '') : name;
      if (!store[id]) { try { store[id] = render(name, a, b); dirty = true; } catch (e) { return null; } if (dirty) { clearTimeout(this._t); this._t = setTimeout(() => { try { localStorage.setItem(VER, JSON.stringify(store)); } catch (e) { } }, 500); } }
      return store[id];
    },
    has: n => !!M[n]
  };
})();
