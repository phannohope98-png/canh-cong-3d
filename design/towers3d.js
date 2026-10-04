/* =========================================================
 * towers3d.js – 4 trụ × 4 cấp dựng 3D (đá / gỗ to chắc, viền mực kiểu Kingdom Rush)
 * Dùng chung bộ dựng hình của chars3d.js (Chars3D.kit). Gốc = tâm ô xây trên mặt đất, mặt trước +Z.
 * Đơn vị: 1 m = 40 đv game theo chiều ngang; chiều cao quy đổi theo góc nhìn (EL) để sàn trên đỉnh
 * khớp đúng chỗ nhân vật đứng của bản 2D (ARCH_TOP, MAGE_TOP… trong art-towers.js).
 * API: Towers3D.build(type, tier) → Group tĩnh
 * ========================================================= */
(function () {
  'use strict';
  if (!window.THREE || !window.Chars3D || !Chars3D.kit) return;
  const T = THREE, { part, G, add, node, mat, glow, sh } = Chars3D.kit, GOLD = Chars3D.kit.GOLD;
  const TAU = Math.PI * 2, S = Math.sin, C = Math.cos, EL = 0.34;
  const U = v => v / 40, HY = v => v / (40 * Math.cos(EL));

  /* ---------- khối dựng ---------- */
  function footing(g, rx, col) {
    add(g, part(G.cyl(U(rx), U(rx) + 0.03, 0.08, 28), col, { tex: 'flag' }), 0, 0.04, 0);
    const n = Math.round(rx / 2.4);
    for (let i = 0; i < n; i++) { const a = i / n * TAU; add(g, part(G.sbox(0.14, 0.08, 0.11, 0.45), i % 2 ? '#b8b2a6' : '#a09a8e', { ink: 0.014 }), S(a) * U(rx), 0.07, C(a) * U(rx), 0, a, 0); }
  }
  function tower(g, y0, y1, r0, r1, col, o) {
    add(g, part(G.cyl(r1, r0, y1 - y0, 26), col, Object.assign({ tex: 'brick' }, o)), 0, (y0 + y1) / 2, 0);
  }
  const rAt = (y0, y1, r0, r1) => y => r0 + (r1 - r0) * Math.max(0, Math.min(1, (y - y0) / (y1 - y0)));
  function onCyl(g, obj, r, y, a) { obj.position.set(S(a) * r, y, C(a) * r); obj.rotation.y = a; g.add(obj); return obj; }
  function win(g, r, y, a, w, h, col) {
    const f = node('win');
    add(f, part(G.sbox(w + 0.05, h + 0.05, 0.05, 0.4), '#5a4a3a', { ink: 0.014 }), 0, 0, 0);
    add(f, new T.Mesh(G.sbox(w, h, 0.04, 0.5), mat(col || '#ffd27a', { glow: 1.1 })), 0, 0, 0.012);
    add(f, new T.Mesh(G.sbox(w, 0.015, 0.045), mat('#3a2a1a')), 0, 0, 0.016);
    return onCyl(g, f, r, y, a);
  }
  function door(g, r, y, a, w, h, col) {
    const s = new T.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); s.lineTo(-w / 2, 0);
    const f = node('door');
    add(f, part(G.ext(s, 0.05, 0.01), col, { tex: 'wood.f' }), 0, 0, 0);
    for (const x of [-w * 0.18, w * 0.18]) add(f, new T.Mesh(G.sbox(0.012, h * 0.8, 0.055), mat(sh(col, -0.35))), x, h * 0.42, 0);
    add(f, new T.Mesh(G.ball(0.02), mat(GOLD, { metal: 1 })), w * 0.3, h * 0.45, 0.03);
    return onCyl(g, f, r, y, a);
  }
  function banner(g, r, y, a, w, h, col, emblem) {
    const f = node('banner');
    add(f, part(G.ext([-w / 2, 0, w / 2, 0, w / 2, -h, 0, -h * 0.78, -w / 2, -h], 0.018, 0.004), col), 0, 0, 0);
    add(f, part(G.cyl(0.014, 0.014, w + 0.08).rotateZ(Math.PI / 2), '#6a4426', { ink: 0.008 }), 0, 0.01, 0.01);
    if (emblem) add(f, part(G.oct(w * 0.2, 1.25).scale(1, 1, 0.35), emblem, { metal: 1, ink: 0.008 }), 0, -h * 0.4, 0.016);
    return onCyl(g, f, r + 0.012, y, a);
  }
  function planks(g, y, rx, col) {
    col = col || '#9a6a3a'; const R = U(rx);
    add(g, part(G.cyl(R, R * 0.96, 0.08, 26), col, { tex: 'wood' }), 0, y - 0.04, 0);
    for (let i = -2; i <= 2; i++) { const x = i * R * 0.34; add(g, new T.Mesh(G.sbox(0.012, 0.004, 2 * Math.sqrt(R * R - x * x) * 0.98), mat(sh(col, -0.35))), x, y + 0.001, 0); }
  }
  function beam(g, a, b, r, col) {
    const A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]), d = B.clone().sub(A), L = d.length();
    const m = part(G.cyl(r, r, L, 8), col, { ink: 0.014, tex: 'wood' });
    m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(m); return m;
  }
  function merlons(g, y, r, col, n) {
    for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU; add(g, part(G.sbox(0.2, 0.16, 0.14, 0.3), col, { ink: 0.016, tex: 'stone.f' }), S(a) * r, y + 0.08, C(a) * r, 0, a, 0); }
  }
  function house(g, x, z, w, h, d, wall, roof, roofH, o) {
    o = o || {}; h *= 1.2; roofH *= 0.7;
    add(g, part(G.sbox(w, h, d, 0.12), wall, { tex: o.wall || 'plaster' }), x, h / 2, z);
    const hd = d / 2 + 0.07;
    add(g, part(G.ext([-hd, 0, hd, 0, 0, roofH], w + 0.12, 0.012).rotateY(Math.PI / 2), roof, { tex: o.roof || 'tile.f' }), x, h - 0.02, z);
    add(g, part(G.cyl(0.03, 0.03, w + 0.16).rotateZ(Math.PI / 2), sh(roof, -0.25), { ink: 0.012 }), x, h + roofH - 0.02, z);
  }
  function stakes(g, rx, from, to, n, col) {
    for (let i = 0; i < n; i++) { const a = from + (to - from) * i / (n - 1), r = U(rx); add(g, part(G.cyl(0.035, 0.04, 0.32, 8), col, { ink: 0.012, tex: 'bark' }), S(a) * r, 0.16, C(a) * r); add(g, part(G.cone(0.035, 0.1, 8), sh(col, 0.1), { ink: 0.012 }), S(a) * r, 0.37, C(a) * r); }
  }
  const leafShape = (w, h) => G.ext([0, 0, w * 0.5, h * 0.4, 0, h, -w * 0.5, h * 0.4], 0.02, 0.006);

  /* =================== TRỤ CUNG (ELF) =================== */
  const ARCH_TOP = [0, 50, 60, 66, 74];
  function ARCHER(t) {
    const g = node('root'), H = HY(ARCH_TOP[t]), wood = '#8a5a32', wood2 = '#7a4a26';
    if (t === 1) {
      footing(g, 30, '#8a8494');
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) beam(g, [x * 0.42, 0.06, z * 0.36], [x * 0.3, H - 0.04, z * 0.26], 0.045, wood);
      for (const z of [0.3, -0.3]) { beam(g, [-0.4, 0.25, z], [0.33, H * 0.72, z * 0.9], 0.025, wood2); beam(g, [0.4, 0.25, z], [-0.33, H * 0.72, z * 0.9], 0.025, wood2); }
      planks(g, H, 31);
    } else if (t === 2) {
      footing(g, 32, '#8a8494');
      const top = HY(26); tower(g, 0.04, top, U(30), U(28), '#9a96a6');
      banner(g, U(28.6), top - 0.06, 0, 0.26, 0.36, '#2f8a40', GOLD);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) beam(g, [x * 0.45, top, z * 0.38], [x * 0.33, H - 0.04, z * 0.28], 0.045, wood);
      for (const z of [0.32, -0.32]) { beam(g, [-0.42, top + 0.12, z], [0.36, H * 0.86, z * 0.9], 0.022, wood2); beam(g, [0.42, top + 0.12, z], [-0.36, H * 0.86, z * 0.9], 0.022, wood2); }
      planks(g, H, 31);
    } else {
      const four = t === 4, y1 = HY(four ? 72 : 64), r0 = U(four ? 30 : 29), r1 = U(four ? 25 : 26), col = four ? '#eef0f2' : '#a8a4b4', R = rAt(0.04, y1, r0, r1);
      footing(g, four ? 34 : 32, four ? '#c8ccd6' : '#8a8494');
      tower(g, 0.04, y1, r0, r1, col);
      const wc = four ? '#9affc8' : '#ffd27a';
      win(g, R(y1 * 0.42), y1 * 0.42, -0.35, 0.14, 0.24, wc); win(g, R(y1 * 0.62), y1 * 0.62, 0.4, 0.14, 0.24, wc);
      if (four) win(g, R(y1 * 0.82), y1 * 0.82, 0, 0.13, 0.22, wc);
      door(g, R(0.06), 0.06, 0, 0.3, 0.42, four ? '#3f9a50' : '#7a5232');
      for (const s of [-1, 1]) banner(g, R(y1 - 0.18), y1 - 0.1, s * 0.62, 0.22, four ? 0.5 : 0.44, '#2f8a40', GOLD);
      if (four) {
        for (const y of [HY(14), HY(46)]) add(g, part(G.torus(R(y) + 0.01, 0.03).rotateX(Math.PI / 2), GOLD, { metal: 1, ink: 0.012 }), 0, y, 0);
        for (const s of [-1, 1]) add(g, part(leafShape(0.26, 0.62), '#4ab85a'), s * (r1 + 0.05), y1 - 0.1, 0, 0, 0, -s * 0.45);
      } else for (const [a, y] of [[-0.9, 0.25], [-0.7, 0.5], [-1.0, 0.9], [0.8, 0.35], [0.95, 1.2], [0.6, 1.5]]) add(g, part(G.ball(0.1, 1.2, 0.8, 0.6), '#4aa83a', { ink: 0.012 }), S(a) * (R(y) + 0.02), y, C(a) * (R(y) + 0.02), 0, a, 0);
      planks(g, H, 32, four ? '#d8c088' : '#7a5232');
    }
    return g;
  }

  /* =================== TRỤ PHÁP (PHÙ THỦY) =================== */
  const MAGE_TOP = [0, 48, 60, 70, 80];
  function MAGE(t) {
    const g = node('root'), H = HY(MAGE_TOP[t]), stone = t >= 4 ? '#8a7ab8' : t >= 3 ? '#7e7898' : '#8e8a9e';
    const r0 = U(26 + (t > 2 ? 2 : 0)), r1 = U(20 + (t > 2 ? 1 : 0)), R = rAt(0.04, H, r0, r1);
    footing(g, 30, '#7a7488');
    tower(g, 0.04, H - 0.05, r0, r1, stone);
    add(g, part(G.cyl(r1 + 0.04, r1 + 0.02, 0.08, 24), '#5a4a8a'), 0, H - 0.04, 0);
    const ry = H * 0.42;
    add(g, part(G.torus(R(ry) + 0.012, 0.028).rotateX(Math.PI / 2), '#8a5ad8', { glow: 0.5, ink: 0.012 }), 0, ry, 0);
    for (let i = 0; i < 5; i++) { const a = -0.9 + i * 0.45; onCyl(g, part(G.oct(0.045, 1.4).scale(1, 1, 0.4), '#c08aff', { glow: 1, ink: 0.008 }), R(ry) + 0.035, ry, a); }
    door(g, R(0.06), 0.06, 0, 0.28, 0.4, '#5a3a8a');
    if (t >= 2) { win(g, R(H * 0.68), H * 0.68, 0.45, 0.12, 0.22, '#c890ff'); win(g, R(H * 0.78), H * 0.78, -0.4, 0.12, 0.22, '#c890ff'); }
    if (t >= 2) for (const s of [-1, 1]) banner(g, R(H - 0.25), H - 0.18, s * 0.75, 0.2, 0.4, '#5a3ac0', GOLD);
    if (t >= 3) for (const s of [-1, 1]) { add(g, part(G.oct(0.12, 2.6), '#9a6ae8', { glow: 0.5, ink: 0.014 }), s * 0.78, 0.32, 0.1, 0, 0, s * 0.15); add(g, part(G.oct(0.07, 2.2), '#b48aff', { glow: 0.5, ink: 0.012 }), s * 0.9, 0.2, -0.05, 0, 0, s * 0.4); }
    if (t >= 4) add(g, part(G.torus(R(H - 0.12) + 0.01, 0.028).rotateX(Math.PI / 2), GOLD, { metal: 1, ink: 0.012 }), 0, H - 0.12, 0);
    return g;
  }

  /* =================== TRẠI LÍNH (CON NGƯỜI) =================== */
  function BARRACKS(t) {
    const g = node('root');
    footing(g, 36, t >= 3 ? '#9a96a6' : '#8a8494');
    if (t === 1) {
      stakes(g, 36, Math.PI * 0.55, Math.PI * 1.45, 9, '#9a6a3a');
      house(g, -0.05, -0.05, U(42), HY(22), U(32), '#b8864e', '#d8b050', HY(18), { wall: 'wood.f', roof: 'straw.f' });
      for (let i = 1; i < 4; i++) add(g, new T.Mesh(G.sbox(U(42) + 0.01, 0.012, U(32) + 0.01), mat('#8a5a32')), -0.05, HY(22) * i / 4, -0.05);
      door(g, U(16) - 0.05, 0.0, 0, 0.3, 0.4, '#7a5232');
    } else if (t === 2) {
      house(g, -0.05, -0.05, U(46), HY(26), U(34), '#c8c0b4', '#c04a3a', HY(20), { wall: 'brick.f' });
      add(g, part(G.sbox(0.14, 0.42, 0.14, 0.3), '#8a8494'), U(16), HY(26) + 0.3, -0.12);
      for (const x of [-0.36, 0.26]) win(g, U(17) - 0.05, HY(14), 0, 0.13, 0.2).position.x = x;
      door(g, U(17) - 0.05, 0.0, 0, 0.3, 0.44, '#7a5232');
    } else {
      const four = t === 4, wall = four ? '#e4e2ea' : '#c8c4cc', W = U(four ? 50 : 46), h = HY(four ? 36 : 32), th = HY(four ? 46 : 40);
      house(g, 0, -0.05, W, h, U(34), wall, '#8a1e24', HY(16), { wall: 'stone.f' });
      for (const s of [-1, 1]) {
        const x = s * (W / 2 + U(2)), tw = node('turret'); tw.position.x = x; g.add(tw);
        tower(tw, 0.02, th, U(10), U(9), wall);
        add(tw, part(G.cone(U(12), HY(four ? 24 : 20), 20), '#8a1e24', { tex: 'tile' }), 0, th + HY(four ? 24 : 20) / 2, 0);
        add(tw, part(G.sbox(0.04, 0.05, 0.04), GOLD, { metal: 1, ink: 0.008 }), 0, th + HY(four ? 24 : 20) + 0.02, 0);
        win(tw, U(9.6), HY(18), 0, 0.09, 0.18);
      }
      if (four) add(g, part(G.sbox(W + 0.02, 0.045, U(34) + 0.02, 0.5), GOLD, { metal: 1, ink: 0.012 }), 0, h - 0.04, -0.05);
      banner(g, U(17) - 0.05, h - 0.06, 0, 0.26, 0.34, '#8a1e24', GOLD);
      door(g, U(17) - 0.05, 0.0, 0, 0.34, 0.48, '#7a5232');
    }
    return g;
  }

  /* =================== SẢNH NGƯỜI LÙN =================== */
  function DWARFHALL(t) {
    const g = node('root'), rock = '#8a8290';
    footing(g, 36, '#7a7480');
    if (t === 1) {
      for (const [x, y, z, r, sy] of [[0, 0.25, -0.1, 0.72, 0.62], [-0.45, 0.18, 0.05, 0.4, 0.6], [0.45, 0.2, 0.0, 0.42, 0.7], [0.1, 0.55, -0.25, 0.42, 0.7]]) add(g, part(G.ball(r, 1, sy, 0.85, 14), x === 0 && y < 0.3 ? rock : sh(rock, 0.06), { tex: 'rock' }), x, y, z);
      add(g, new T.Mesh(G.sbox(0.42, 0.5, 0.12, 0.3), mat('#1c1218')), 0, 0.25, 0.5);
      for (const s of [-1, 1]) beam(g, [s * 0.26, 0.04, 0.55], [s * 0.26, 0.56, 0.55], 0.045, '#7a4a26');
      beam(g, [-0.34, 0.56, 0.56], [0.34, 0.56, 0.56], 0.05, '#8a5a32');
      for (const s of [-1, 1]) { const p = node('pick'); p.position.set(0, HY(32), 0.45); p.rotation.z = s * 0.7; g.add(p); add(p, part(G.cyl(0.02, 0.02, 0.4, 8), '#7a4a26', { ink: 0.01 }), 0, 0, 0); add(p, part(G.cone(0.03, 0.26, 8).rotateZ(Math.PI / 2), '#aeb2bc', { metal: 1, ink: 0.01 }), 0, 0.2, 0); }
    } else if (t === 2) {
      house(g, 0, -0.05, U(46), HY(24), U(34), '#9a92a0', '#6a5a52', HY(14), { wall: 'stone.f' });
      add(g, part(G.cyl(0.11, 0.11, 0.45, 12), '#7a7480'), U(18), HY(24) + 0.3, -0.15);
      win(g, U(17) - 0.05, HY(12), 0, 0.14, 0.2, '#ff9a3a').position.x = 0.36;
      add(g, part(G.sbox(0.3, 0.12, 0.16, 0.4), '#4a4a56', { metal: 1 }), -0.62, 0.22, 0.5);
      add(g, part(G.sbox(0.14, 0.16, 0.12, 0.4), '#3a3a44'), -0.62, 0.1, 0.5);
      door(g, U(17) - 0.05, 0.0, 0, 0.3, 0.42, '#6a4426').position.x = -0.15;
    } else {
      const four = t === 4, top = HY(four ? 52 : 44), stone = four ? '#9a96a8' : '#8e8a96', R = rAt(0.04, top, U(33), U(30));
      tower(g, 0.04, top, U(33), U(30), stone);
      add(g, part(G.cyl(U(30), U(30), 0.06, 26), '#5a5a66'), 0, top, 0);
      merlons(g, top, U(29), stone, 9);
      for (const s of [-1, 1]) { win(g, R(HY(24)), HY(24), s * 0.65, 0.13, 0.22, '#ff9a3a'); banner(g, R(top - 0.2), top - 0.14, s * 0.7, 0.22, 0.4, four ? '#a8481e' : '#7a3a1e', GOLD); }
      const fy = top - HY(14), fr = R(fy) + 0.03;
      onCyl(g, part(G.ball(0.17, 1, 1, 0.6), sh(stone, 0.08)), fr, fy, 0);
      onCyl(g, part(G.ball(0.17, 1, 1.15, 0.55), sh(stone, -0.08)), fr, fy - 0.2, 0);
      for (const x of [-0.06, 0.06]) { const e = onCyl(g, new T.Mesh(G.ball(0.025), mat('#ff9a3a', { glow: 1.8 })), fr + 0.09, fy + 0.03, 0); e.position.x = x; }
      door(g, R(0.06), 0.06, 0, 0.38, 0.5, '#6a4426');
      if (four) {
        for (const y of [HY(12), top - 0.1]) add(g, part(G.torus(R(y) + 0.01, 0.03).rotateX(Math.PI / 2), GOLD, { metal: 1, ink: 0.012 }), 0, y, 0);
        for (const s of [-1, 1]) add(g, part(G.tube([[s * 0.5, top - 0.05, 0], [s * 1.05, top + 0.12, 0], [s * 1.0, top + 0.75, -0.1]], 0.07, 14), '#f2ead6'), 0, 0, 0);
      }
    }
    return g;
  }

  /** Ô xây trống: bãi đất nện viền đá + biển gỗ */
  function PLOT() {
    const g = node('root');
    add(g, part(G.cyl(U(40), U(41), 0.06, 32), '#9a7448', { ink: 0.02, tex: 'rock' }), 0, 0.03, 0);
    for (const [x, z, r] of [[-0.4, 0.2, 0.05], [0.3, -0.25, 0.04], [0.1, 0.4, 0.035], [-0.2, -0.4, 0.04], [0.55, 0.15, 0.03]]) add(g, new T.Mesh(G.ball(r, 1, 0.4, 1, 8), mat('#7a5634')), x, 0.065, z);
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; add(g, part(G.sbox(0.17, 0.1, 0.12, 0.45), i % 2 ? '#b8b2a6' : '#a09a8e', { ink: 0.014 }), S(a) * U(40), 0.06, C(a) * U(40), 0, a, 0); }
    beam(g, [0.66, 0.04, -0.2], [0.66, 0.62, -0.2], 0.03, '#7a4a26');
    add(g, part(G.sbox(0.5, 0.3, 0.05, 0.25), '#c8965a', { tex: 'wood.f' }), 0.66, 0.66, -0.17);
    add(g, new T.Mesh(G.sbox(0.24, 0.035, 0.06), mat('#5a3418')), 0.66, 0.68, -0.15); add(g, new T.Mesh(G.sbox(0.035, 0.18, 0.06), mat('#5a3418')), 0.66, 0.68, -0.15);
    g.name = 'root'; return g;
  }
  const MAKERS = { archer: ARCHER, mage: MAGE, barracks: BARRACKS, artillery: DWARFHALL };
  function build(type, tier) { const f = MAKERS[type]; if (!f) return null; const r = f(Math.max(1, Math.min(4, tier || 1))); r.name = 'root'; return r; }

  // đưa vào Xưởng 3D (nhóm "Công trình")
  const pal = (...a) => a.map(([c, l]) => ({ c, l }));
  const DEFS = [
    ['archer', 'Trụ Elf', 'Tháp gỗ → tháp đá dây leo → tháp trắng viền vàng, cửa sổ ngọc', pal(['#8a5a32', 'Gỗ'], ['#a8a4b4', 'Đá'], ['#eef0f2', 'Đá trắng'], ['#2f8a40', 'Cờ lá'])],
    ['mage', 'Trụ Phù Thủy', 'Tháp đá tím có vòng chữ phép phát sáng, pha lê tím ở chân (cấp 3+)', pal(['#8e8a9e', 'Đá'], ['#8a5ad8', 'Vòng phép'], ['#5a3ac0', 'Cờ'], ['#9a6ae8', 'Pha lê'])],
    ['barracks', 'Trại Lính', 'Nhà gỗ mái rơm → nhà gạch mái đỏ → lâu đài 2 tháp mái nhọn', pal(['#b8864e', 'Gỗ'], ['#c8c4cc', 'Tường'], ['#8a1e24', 'Mái đỏ'], ['#f5c542', 'Vàng'])],
    ['artillery', 'Sảnh Người Lùn', 'Cửa hầm mỏ → lò rèn đá → sảnh tròn có mặt đá râu dài, sừng vàng', pal(['#8a8290', 'Đá núi'], ['#6a5a52', 'Mái'], ['#ff9a3a', 'Lửa lò'], ['#f2ead6', 'Sừng'])]
  ];
  DEFS.forEach(([type, name, desc, palette]) => Chars3D.list.push({ id: 'tower_' + type, name, group: 'Công trình', role: 'Trụ · 4 cấp', tiers: 4, tierName: 'Cấp trụ', desc, palette,
    make: t => ({ rig: { root: build(type, t), n: {}, o: {} }, anim: { kind: 'static' } }) }));

  window.Towers3D = { build, plot: PLOT, U, HY, kit: { footing, tower, rAt, onCyl, win, door, banner, planks, beam, merlons, house, stakes, leafShape } };
})();
