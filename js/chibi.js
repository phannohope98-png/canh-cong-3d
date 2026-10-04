/* =========================================================
 * chibi.js – 5 nhân vật trụ vẽ lại theo phong cách CHIBI kiểu Kingdom Rush
 * Đầu to (~45% chiều cao), thân & chân ngắn, viền mực đen dày, tô 2 tông.
 * Thiết kế theo bảng nhân vật của chủ game:
 *   Con Người: tóc nâu, giáp bạc viền vàng, áo choàng xanh, kiếm + khiên xanh thập tự vàng
 *   Elf: tóc vàng dài, tai nhọn, đồ xanh lá viền vàng, cung vàng-xanh
 *   Người Lùn: râu tóc cam to, kính phi công trên trán, giáp da nâu + vai thép, búa
 *   Phù Thủy: mũ phù thủy tím viền vàng, tóc bạc-tím dài, áo choàng tím, gậy pha lê tím
 *   Orc: da xanh, búi tóc đen, nanh, giáp da + khố đỏ, da sói trên vai, rìu
 * Gốc toạ độ = giữa hai bàn chân, nhìn sang PHẢI. P = { w: pha bước, a: tiến độ đòn, t: giây }
 * Khoá đăng ký: soldier1..4, elf1..4, dwarf1..4, mage1..4, orct1..4 (+ '_b' = nhìn từ sau)
 * ========================================================= */
(function () {
  const K = ArtKit, TAU = Math.PI * 2, INK = '#1b0f16', sh = K.shade, lerp = K.lerp;
  const P_ = K.P;

  /* ---------- bút ---------- */
  function F(g, b, col, o) {
    o = o || {};
    K.cel(g, b, col, { s: o.s === undefined ? 1.7 : o.s, h: o.h === undefined ? 0.9 : o.h, lw: o.lw === undefined ? 1.8 : o.lw,
      ink: INK, animeHeavy: true, noRim: true, dark: o.dark, light: o.light, flat: o.flat });
  }
  function limb(g, x1, y1, x2, y2, w, col) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = INK; g.lineWidth = w + 3.4; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.stroke();
    g.strokeStyle = sh(col, -0.32); g.lineWidth = w * 0.4; g.beginPath(); g.moveTo(x1 + w * 0.18, y1 + w * 0.2); g.lineTo(x2 + w * 0.18, y2 + w * 0.2); g.stroke();
  }
  function line(g, x1, y1, x2, y2, col, w) { g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  function dot(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  const blob = pts => P_.blob(pts), poly = pts => P_.poly(pts), ell = (x, y, a, b, r) => P_.ell(x, y, a, b, r), rr = (x, y, w, h, r) => P_.rr(x, y, w, h, r);
  const GOLD = '#f5c542', SKIN = '#ffd9b8';

  /* ---------- vũ khí (gốc = tay cầm, lưỡi hướng -y) ---------- */
  const W = {
    bigsword(g, t) { // kiếm lớn của kiếm sĩ
      const blade = t >= 3 ? '#f0f4fa' : '#d4dae4';
      F(g, rr(-1.4, -0.5, 2.8, 7, 1.2), '#4a2a1a', { s: 0.6, h: 0.3, lw: 1.3 });
      F(g, P_.circ(0, 7, 1.7), GOLD, { s: 0.4, h: 0.3, lw: 1.1 });
      F(g, poly([-2.8, -3, -2.8, -21, 0, -25.5, 2.8, -21, 2.8, -3]), blade, { s: 1.3, h: 0.8, lw: 1.6 });
      line(g, 0, -4, 0, -22, 'rgba(120,130,150,0.7)', 0.9); line(g, -1.2, -5, -1.2, -20, 'rgba(255,255,255,0.9)', 0.8);
      F(g, rr(-6, -4.4, 12, 3, 1.3), t >= 3 ? GOLD : '#8a8e98', { s: 0.6, h: 0.4, lw: 1.3 });
      if (t === 4) K.glow(g, 0, -14, 14, '#ffe6a0', 0.4);
    },
    greataxe(g, t) { // rìu hai tay của người Lùn
      limb(g, 0, 10, 0, -22, 2.6, '#5a3a24');
      for (const y of [4, -4]) line(g, -1.4, y, 1.4, y, '#3a2416', 1.4);
      const c = t >= 4 ? '#f2d070' : t >= 3 ? '#d8dce6' : '#aeb2bc';
      for (const s of [1, -1]) F(g, c2 => { c2.moveTo(s * 1, -24); c2.quadraticCurveTo(s * 12, -29, s * 15, -18); c2.quadraticCurveTo(s * 11, -14, s * 13, -7); c2.quadraticCurveTo(s * 6, -11, s * 1, -11); c2.closePath(); }, s > 0 ? c : sh(c, -0.12), { s: 1.6, h: 0.9, lw: 1.7 });
      line(g, 13.5, -20, 11.8, -9, 'rgba(255,255,255,0.85)', 1);
      F(g, poly([-1.6, -24, 0, -29, 1.6, -24]), '#9aa0ac', { s: 0.4, h: 0.3, lw: 1.1 });
      if (t === 4) K.glow(g, 0, -18, 14, '#ffd27a', 0.4);
    },
    knife(g) { // dao nhỏ của goblin
      F(g, rr(-0.9, -0.5, 1.8, 4, 0.8), '#4a2e1a', { s: 0.4, h: 0.2, lw: 1.1 });
      F(g, c => { c.moveTo(-1.3, -0.8); c.quadraticCurveTo(-1.8, -6, 0.8, -9.5); c.quadraticCurveTo(0.6, -5, 1.3, -0.8); c.closePath(); }, '#c8ccd4', { s: 0.6, h: 0.4, lw: 1.2 });
    },
    spear(g) { // giáo của orc cưỡi sói
      limb(g, 0, 10, 0, -26, 1.8, '#6a4426');
      F(g, poly([-2.6, -25, 0, -34, 2.6, -25, 0, -23]), '#c8ccd6', { s: 0.6, h: 0.5, lw: 1.3 });
      F(g, poly([-1.8, -22, 1.8, -22, 1.2, -19, -1.2, -19]), '#a8201a', { s: 0.3, h: 0.2, lw: 1 });
    },
    blacksword(g, t, glow, col, tt, S) { // kiếm đen khổng lồ (boss)
      const red = S && S.redBlade;
      if (red) K.glow(g, 0, -20, 22, '#ff2a1a', 0.55 + Math.sin((tt || 0) * 8) * 0.15);
      F(g, rr(-1.8, -0.5, 3.6, 9, 1.4), '#1a1418', { s: 0.6, h: 0.3, lw: 1.4 });
      F(g, P_.circ(0, 9, 2.2), '#5a1a22', { s: 0.4, h: 0.3, lw: 1.2 });
      F(g, poly([-4, -3, -4.6, -30, 0, -37, 4.6, -30, 4, -3]), '#26222e', { s: 1.6, h: 1, lw: 1.8, light: '#4a4458' });
      line(g, 0, -5, 0, -32, red ? '#ff4a2a' : '#6a3a7a', red ? 1.8 : 1);
      F(g, poly([-8.5, -5, -4, -2.4, 0, -4, 4, -2.4, 8.5, -5, 7, -1, 0, 0, -7, -1]), '#2a2430', { s: 0.6, h: 0.4, lw: 1.4 });
      for (const s of [-1, 1]) F(g, poly([s * 8.5, -5, s * 11, -9, s * 7.5, -3.5]), '#2a2430', { s: 0, h: 0.3, lw: 1.1 });
    },
    sword(g, t) {
      const blade = t >= 3 ? '#eef4ff' : '#cfd6e2';
      F(g, rr(-1.3, -0.5, 2.6, 6, 1.2), '#5a3420', { s: 0.6, h: 0.3, lw: 1.3 });
      F(g, poly([-2.4, -3, -2.4, -17, 0, -21, 2.4, -17, 2.4, -3]), blade, { s: 1.2, h: 0.8, lw: 1.5 });
      line(g, 0, -4, 0, -17.5, 'rgba(255,255,255,0.9)', 0.9);
      F(g, rr(-5.2, -4.2, 10.4, 2.8, 1.3), GOLD, { s: 0.6, h: 0.4, lw: 1.3 });
      if (t === 4) K.glow(g, 0, -12, 12, '#bfe4ff', 0.45);
    },
    shield(g, t, S) {
      const c = (S && S.shieldCol) || (t >= 2 ? '#2a5ad0' : '#8a5a32');
      F(g, c2 => { c2.moveTo(-6.5, -7); c2.lineTo(6.5, -7); c2.quadraticCurveTo(7, 3, 0, 8.5); c2.quadraticCurveTo(-7, 3, -6.5, -7); c2.closePath(); }, c, { s: 2, h: 1, lw: 1.7 });
      if (S && S.shieldCol) { g.strokeStyle = INK; g.lineWidth = 3.4; g.beginPath(); g.moveTo(-6, -6.4); g.lineTo(6, -6.4); g.quadraticCurveTo(6.5, 2.8, 0, 7.8); g.quadraticCurveTo(-6.5, 2.8, -6, -6.4); g.stroke(); g.strokeStyle = '#d8dce6'; g.lineWidth = 1.6; g.stroke(); }
      if (t >= 2) { F(g, rr(-1.1, -5, 2.2, 10.5, 0.6), GOLD, { s: 0.4, h: 0.3, lw: 1 }); F(g, rr(-4.4, -2.2, 8.8, 2.2, 0.6), GOLD, { s: 0.4, h: 0.3, lw: 1 }); }
      else { dot(g, 0, -0.5, 1.6, '#c8c8c8'); }
      if (t >= 3) { g.strokeStyle = GOLD; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-5.4, -6); g.lineTo(5.4, -6); g.quadraticCurveTo(5.8, 2.6, 0, 7.2); g.quadraticCurveTo(-5.8, 2.6, -5.4, -6); g.stroke(); }
    },
    axe(g, t) {
      limb(g, 0, 7, 0, -20, 2.3, '#5a3a24');
      const c = t >= 3 ? '#d8dce6' : '#a8aab4';
      F(g, c2 => { c2.moveTo(0.5, -20); c2.quadraticCurveTo(10, -25, 13, -16); c2.quadraticCurveTo(9.5, -12.5, 11.5, -7); c2.quadraticCurveTo(6, -10, 0.5, -10); c2.closePath(); }, c, { s: 1.6, h: 0.9, lw: 1.6 });
      if (t >= 2) F(g, c2 => { c2.moveTo(-0.5, -19); c2.quadraticCurveTo(-7, -20, -8, -15); c2.quadraticCurveTo(-6, -13, -6.8, -11); c2.quadraticCurveTo(-3, -12.5, -0.5, -12); c2.closePath(); }, sh(c, -0.1), { s: 1, h: 0.5, lw: 1.5 });
      line(g, 11.6, -18, 10.3, -9, 'rgba(255,255,255,0.85)', 0.9);
      if (t === 4) { g.save(); g.globalCompositeOperation = 'lighter'; line(g, 12, -19, 10.5, -8, 'rgba(255,80,40,0.8)', 1.4); g.restore(); }
    },
    hammer(g, t) {
      limb(g, 0, 6, 0, -14, 2, '#6a4026');
      const c = t >= 4 ? GOLD : t >= 3 ? '#c4c8d4' : '#9a9ea8';
      F(g, rr(-6.5, -21, 13, 8, 2), c, { s: 1.4, h: 0.8, lw: 1.6 });
      F(g, rr(-7.6, -20, 2.6, 6, 0.8), t >= 3 ? GOLD : '#6a6e78', { s: 0.4, h: 0.3, lw: 1.1 });
      F(g, rr(5, -20, 2.6, 6, 0.8), t >= 3 ? GOLD : '#6a6e78', { s: 0.4, h: 0.3, lw: 1.1 });
      if (t === 4) K.glow(g, 0, -17, 12, '#ffb04a', 0.5);
    },
    staff(g, t, glow, col, tt) {
      col = col || '#c08aff'; const fl = Math.sin((tt || 0) * 2.4) * 1.8 - 3; // viên đá bay lơ lửng trên gậy
      limb(g, 0, 9, 0, -22, 1.8, t >= 3 ? '#3a2a5a' : '#5a3a26');
      F(g, c2 => { c2.moveTo(-3.6, -21); c2.quadraticCurveTo(-4.6, -26, -1, -28); c2.lineTo(1, -28); c2.quadraticCurveTo(4.6, -26, 3.6, -21); c2.closePath(); }, GOLD, { s: 0.6, h: 0.4, lw: 1.2 });
      K.glow(g, 0, -27.5 + fl, 8 + glow * 9 + t, col, 0.55 + glow * 0.45);
      F(g, poly([0, -33.5 + fl, 3, -27.5 + fl, 0, -22.5 + fl, -3, -27.5 + fl]), col, { s: 0.9, h: 0.6, lw: 1.3, light: '#f4ecff' });
    },
    greatsword(g, t, glow, col) {
      K.glow(g, 0, -17, 12 + t * 2, col || '#8fd8ff', 0.3 + t * 0.1);
      F(g, rr(-1.6, -0.5, 3.2, 8, 1.4), '#3a2a4a', { s: 0.6, h: 0.3, lw: 1.3 });
      F(g, poly([-3.4, -3, -3.6, -24, 0, -30, 3.6, -24, 3.4, -3]), '#e8f4ff', { s: 1.4, h: 0.9, lw: 1.6 });
      F(g, poly([-1.2, -5, -1.2, -23, 0, -26, 1.2, -23, 1.2, -5]), col || '#9ae0ff', { s: 0, h: 0, lw: 0 });
      F(g, poly([-8, -4.6, -3, -2.2, 0, -3.6, 3, -2.2, 8, -4.6, 6, -1, 0, 0, -6, -1]), GOLD, { s: 0.6, h: 0.4, lw: 1.3 });
    },
    warhammer(g, t) {
      K.glow(g, 0, -21, 10 + t * 2, '#ff8a2a', 0.2 + t * 0.1);
      limb(g, 0, 8, 0, -16, 2.4, '#6a4026');
      F(g, rr(-8.5, -27, 17, 11.5, 2.6), '#a8adb8', { s: 1.6, h: 0.9, lw: 1.7 });
      F(g, rr(-10, -25.5, 3.6, 8.5, 1), GOLD, { s: 0.4, h: 0.3, lw: 1.2 }); F(g, rr(6.4, -25.5, 3.6, 8.5, 1), GOLD, { s: 0.4, h: 0.3, lw: 1.2 });
      dot(g, 0, -21, 1.8, '#ff7a2a');
    },
    bow(g, t, pull, noArrow) {
      const c = t >= 3 ? GOLD : '#8a5a2a', L = 15; // cung dài
      g.lineCap = 'round';
      const arc = () => { g.beginPath(); g.moveTo(-1, -L); g.quadraticCurveTo(7, -L * 0.45, 7, 0); g.quadraticCurveTo(7, L * 0.45, -1, L); };
      arc(); g.strokeStyle = INK; g.lineWidth = 4.4; g.stroke(); arc(); g.strokeStyle = c; g.lineWidth = 2.2; g.stroke();
      if (t >= 2) { arc(); g.strokeStyle = '#3fae5a'; g.lineWidth = 0.9; g.stroke(); }
      const sx = -1 - pull * 7;
      line(g, -1, -L, sx, 0, '#f4f0e0', 0.8); line(g, sx, 0, -1, L, '#f4f0e0', 0.8);
      if (!noArrow) { // mũi tên lắp sẵn
        line(g, sx, 0, sx + 15, 0, INK, 2.6); line(g, sx, 0, sx + 15, 0, '#d8b880', 1.2);
        F(g, poly([sx + 14, -2, sx + 18.5, 0, sx + 14, 2]), '#dfe6f0', { s: 0, h: 0, lw: 1 });
      }
      if (t === 4) K.glow(g, 3, 0, 12, '#c8ffb0', 0.45);
    }
  };

  /* ---------- đầu ---------- */
  function eyes(g, hx, hy, R, iris, blink, mode) {
    const ys = hy + R * 0.12;
    for (const [ex, s] of [[hx + R * 0.1, 0.82], [hx + R * 0.58, 1]]) {
      if (blink) { line(g, ex - 1.6 * s, ys + 0.5, ex + 1.6 * s, ys + 0.5, INK, 1.3); continue; }
      const w = 1.35 * s, h = mode === "fierce" ? 1.6 * s : 2.2 * s;
      g.fillStyle = INK; g.beginPath(); g.ellipse(ex, ys, w + 0.5, h + 0.5, 0, 0, TAU); g.fill();
      g.fillStyle = iris; g.beginPath(); g.ellipse(ex, ys + 0.3, w, h, 0, 0, TAU); g.fill();
      g.fillStyle = sh(iris, -0.45); g.beginPath(); g.ellipse(ex, ys - h * 0.35, w, h * 0.55, 0, Math.PI, TAU); g.fill();
      dot(g, ex - w * 0.3, ys - h * 0.3, w * 0.48, '#ffffff'); dot(g, ex + w * 0.35, ys + h * 0.45, w * 0.22, 'rgba(255,255,255,0.8)');
    }
  }
  function brows(g, hx, hy, R, col, angry) {
    g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = angry ? 1.7 : 1.2;
    g.beginPath(); g.moveTo(hx - R * 0.08, hy - R * (angry ? 0.3 : 0.32)); g.lineTo(hx + R * 0.28, hy - R * (angry ? 0.16 : 0.34)); g.stroke();
    g.beginPath(); g.moveTo(hx + R * 0.44, hy - R * (angry ? 0.16 : 0.34)); g.lineTo(hx + R * 0.82, hy - R * (angry ? 0.32 : 0.3)); g.stroke();
  }
  function headBase(g, hx, hy, R, skin, noBlush) {
    F(g, c => { c.moveTo(hx + R * 1.02, hy); c.ellipse(hx, hy, R * 1.02, R * 0.96, 0, 0, TAU); }, skin, { s: R * 0.16, h: R * 0.08, lw: 1.9 });
    if (noBlush) return; // má hồng
    g.fillStyle = 'rgba(255,110,110,0.28)'; g.beginPath(); g.ellipse(hx + R * 0.72, hy + R * 0.45, R * 0.2, R * 0.12, 0, 0, TAU); g.fill();
  }

  /* ---------- áo choàng (sau lưng) ---------- */
  function cape(g, col, sway, len, wide, front, up, tt) {
    const sw = sway * 2.2;
    if (up) { // áo choàng bay ngược lên (boss giai đoạn 2)
      const w1 = Math.sin((tt || 0) * 7) * 2, w2 = Math.sin((tt || 0) * 7 + 1.5) * 2;
      F(g, c => { c.moveTo(-4, -18); c.lineTo(4, -18); c.quadraticCurveTo(-6, -22, -16 - wide, -30 + w1); c.lineTo(-20 - wide, -24 + w2); c.lineTo(-17 - wide, -16 + w1); c.lineTo(-21 - wide, -9 + w2); c.quadraticCurveTo(-10, -9, -4, -18); c.closePath(); }, col, { s: 2.2, h: 0.8, lw: 1.7 });
      return;
    }
    F(g, c => { c.moveTo(-4, -18); c.lineTo(4, -18); c.quadraticCurveTo(3, -10, 2 - sw * 0.3, -2 + len); c.quadraticCurveTo(-4 - wide, -1 + len, -8 - wide - sw, -3 + len);
      c.quadraticCurveTo(-8 - wide * 0.6, -11, -4, -18); c.closePath(); }, col, { s: front ? 1.2 : 2.2, h: 0.8, lw: 1.7 });
    if (front) { g.strokeStyle = GOLD; g.lineWidth = 1; g.beginPath(); g.moveTo(-8 - wide - sw, -3.6 + len); g.quadraticCurveTo(-4 - wide, -1.6 + len, 2 - sw * 0.3, -2.6 + len); g.stroke(); }
  }

  /* ================== KHUNG CHUNG ================== */
  function body(g, P, S, back) {
    const tt = P.t || 0, walk = P.w >= 0, ph = walk ? P.w * TAU : 0, a = P.a;
    const swing = walk ? Math.sin(ph) : 0;
    const sw = a >= 0 ? K.swing(a) : 0;
    const blink = !walk && a < 0 && (tt % 3.9) < 0.13;
    const bw = S.bw || 6, hipY = -(S.leg || 6.5), torsoH = S.torso || 11, R = S.R || 10;
    const shY = hipY - torsoH + 2.6, hx = 0.6, hy = hipY - torsoH - R * 0.78;

    /* ---- chuyển động kiểu Kingdom Rush: nảy, co giãn, lấy đà, đầu lắc trễ nhịp ---- */
    let bob = 0, sx = 1, sy = 1, lean = 0, lx = 0, headDy = 0, headRot = 0;
    const ease = k => k * k * (3 - 2 * k);
    if (walk) {
      const s = Math.abs(Math.sin(ph)), land = Math.pow(1 - s, 3);
      bob = s * 3.4; sy = 1 - land * 0.12 + s * 0.05; sx = 1 + land * 0.1 - s * 0.03;
      lean = 0.12 + Math.sin(ph * 2) * 0.03; headDy = Math.cos(ph * 2) * 1.1; headRot = Math.sin(ph) * 0.1;
    } else if (a >= 0) {
      const m = S.kind === 'melee' ? 1 : 0.5;
      if (a < 0.38) { const k = ease(a / 0.38); sy = 1 - 0.13 * k * m; sx = 1 + 0.11 * k * m; lean = -0.24 * k * m; lx = -2.5 * k * m; }
      else if (a < 0.55) { const k = ease((a - 0.38) / 0.17); sy = 1 - 0.13 * m + 0.22 * k * m; sx = 1 + 0.11 * m - 0.17 * k * m; lean = (-0.24 + 0.56 * k) * m; lx = (-2.5 + 8.5 * k) * m; }
      else { const k = ease((a - 0.55) / 0.45); sy = 1 + 0.09 * m * (1 - k); sx = 1 - 0.06 * m * (1 - k); lean = 0.32 * m * (1 - k); lx = 6 * m * (1 - k); }
      headRot = lean * 0.5; headDy = (1 - sy) * 6;
    } else {
      const b = Math.sin(tt * 3.1); sy = 1 + b * 0.035; sx = 1 - b * 0.022; headDy = Math.sin(tt * 3.1 - 0.9) * 0.6; headRot = Math.sin(tt * 1.3) * 0.05;
    }
    if (S.still && !walk && a < 0) { sx = sy = 1; headDy = 0; headRot = 0; } // đứng bất động (boss)
    if (S.look && !walk && a < 0) headRot += Math.sin(tt * 1.6) * 0.12; // nhìn trái nhìn phải
    lean += S.hunch || 0;

    // bóng (nhỏ lại khi nhảy lên)
    K.shadow(g, lx * 0.5, 0.6, bw * 1.7 * (1 - bob * 0.04), 3.2, 0.42);
    g.save(); g.translate(lx, 0); g.scale(sx, sy);

    // ---- chân: nhấc gối cao khi bước ----
    const legW = S.legW || 4.4;
    const foot = k => { const q = ph + (k > 0 ? 0 : Math.PI); return walk ? { x: k * bw * 0.36 + Math.sin(q) * 5.2, y: -1.2 - Math.max(0, Math.cos(q)) * 3.6 } : { x: k * bw * 0.36 + (a >= 0 ? k * 1.4 : 0), y: -1.2 }; };
    { const f = foot(-1); limb(g, -bw * 0.36, hipY - bob, f.x, f.y, legW, S.legs); F(g, ell(f.x + 1.2, f.y, 3.2, 2.1), S.boots, { s: 0.8, h: 0.4, lw: 1.5 }); }
    g.save(); g.translate(0, -bob); g.rotate(lean);

    // ---- tóc dài / áo choàng phía sau ----
    if (S.aura) S.aura(g, hx, hy, R, tt + (walk ? P.w * 3 : 0));
    if (!back && S.backHair) S.backHair(g, hx, hy, R, swing, tt);
    if (!back && S.cape) cape(g, S.cape, swing, S.capeLen || 0, S.capeWide || 0, false, S.capeUp, tt);

    // ---- tay & vũ khí: tư thế theo nhân vật ----
    const shB = { x: -bw * 0.62, y: shY }, shF = { x: bw * 0.55, y: shY };
    const idle = !walk && a < 0;
    let handB, handF, wRot = 0.45, wLen = 1, wAt = null, pull = 0, glow = 0, smear = null, twoHand = !!S.twoHand, noArrow = false;
    if (S.kind === 'melee') {
      if (S.slash === 'h' && a >= 0) { // CHÉM NGANG: vung ra sau → quét ngang qua người → ra trước
        if (a < 0.38) { const k = ease(a / 0.38); handF = { x: lerp(7, shB.x - 1, k), y: lerp(shY + 6, shY + 2, k) }; wRot = lerp(0.6, -1.65, k); }
        else if (a < 0.6) { const k = (a - 0.38) / 0.22, c = Math.cos(k * Math.PI); handF = { x: lerp(shB.x - 1, 12, k), y: shY + 2 + Math.sin(k * Math.PI) * 2 }; wRot = c > 0 ? -1.65 : 1.65; wLen = Math.max(0.2, Math.abs(c)); smear = { kind: 'h', k }; }
        else { const k = ease((a - 0.6) / 0.4); handF = { x: lerp(12, 7, k), y: lerp(shY + 2, shY + 6, k) }; wRot = lerp(1.65, 0.6, k); }
      } else if (S.slash === 'stab') { // ĐÂM: rụt về rồi lao tới
        const k = a < 0 ? 0 : a < 0.4 ? -ease(a / 0.4) : a < 0.55 ? ease((a - 0.4) / 0.15) : 1 - ease((a - 0.55) / 0.45);
        handF = { x: 6 + k * 9, y: shY + 5 }; wRot = a >= 0 ? 1.57 : 1.15;
      } else if (a >= 0 || !S.idle || walk) { // BỔ XUỐNG từ trên đầu
        const rest = { x: 7, y: shY + 6 }, up = { x: 1.5, y: shY - 7 }, down = { x: 8.5, y: shY + 7.5 };
        if (sw < 0) { const k = -sw; handF = { x: lerp(rest.x, up.x, k), y: lerp(rest.y, up.y, k) }; wRot = lerp(0.45, -1.5, k); }
        else { const k = sw; handF = { x: lerp(rest.x, down.x, k), y: lerp(rest.y, down.y, k) }; wRot = lerp(0.45, 2.2, k); }
        if (a >= 0.38 && a <= 0.66) smear = { kind: 'v', k: (a - 0.38) / 0.28 };
      }
      if (idle && S.idle === 'plant') { handF = { x: bw * 0.78, y: shY + 5.5 }; wRot = Math.PI; twoHand = true; } // chống kiếm xuống đất
      if (idle && S.idle === 'beard') { // vuốt râu, rìu dựa vai
        const s = (tt % 3.4) / 3.4; wAt = { x: bw * 1.0, y: -1 }; wRot = 0.1; twoHand = false;
        if (s < 0.6) { const k = s / 0.6, kk = Math.sin(k * Math.PI); handF = { x: hx + R * 0.55 + kk * 1.2, y: hy + R * (0.7 + k * 1.1) }; }
        else handF = { x: bw * 0.62, y: shY + 7 };
      }
      if (!handF) handF = { x: 7, y: shY + 6 };
      if (walk && !wAt) { handF.x += swing * 2.6; handF.y -= Math.max(0, swing) * 1.5; wRot += swing * 0.25; }
      handB = twoHand ? { x: handF.x - Math.sin(wRot) * 4.2, y: handF.y + Math.cos(wRot) * 4.2 } : { x: shB.x + 3 - swing * 3.2, y: shB.y + 7 - Math.abs(swing) * 1.2 };
    } else if (S.kind === 'bow') {
      if (a >= 0) pull = a < 0.5 ? a / 0.5 : Math.max(0, 1 - (a - 0.5) * 5);
      else if (S.idle === 'bowcheck') { const s = tt % 4; pull = s < 0.9 ? Math.sin(s / 0.9 * Math.PI) * 0.6 : 0; noArrow = true; } // kéo thử dây cung
      handF = { x: shF.x + 7.5, y: shY + 1 }; handB = { x: shF.x + 6.5 - pull * 7.5, y: shY + 1 };
    } else { // gậy phép
      const k = a >= 0 ? Math.sin(Math.min(1, a / 0.55) * Math.PI / 2) * (a > 0.75 ? Math.max(0, (1 - a) / 0.25) : 1) : 0;
      glow = k; handF = { x: shF.x + 4 + k * 3, y: shY + 6 - k * 8 + (walk ? swing : 0) }; handB = { x: shB.x + 3 - swing * 1.4, y: shB.y + 7 };
    }
    if (back) { // nhìn từ sau: vũ khí khuất sau lưng
      if (S.weapon) { g.save(); g.translate(handF.x - 3, handF.y); g.rotate(wRot * 0.5); W[S.weapon](g, S.tier, S.kind === 'bow' ? 0 : glow, S.wcol, tt, S); g.restore(); }
    }
    if (!back) limb(g, shB.x, shB.y, handB.x, handB.y, S.armW || 3.4, S.sleeve);

    // ---- chân trước ----
    g.restore();
    { const f = foot(1); limb(g, bw * 0.36, hipY - bob, f.x, f.y, legW, S.legs); F(g, ell(f.x + 1.2, f.y, 3.2, 2.1), S.boots, { s: 0.8, h: 0.4, lw: 1.5 }); }
    g.save(); g.translate(0, -bob); g.rotate(lean);

    // ---- thân ----
    S.torsoDraw(g, bw, hipY, torsoH, back);
    if (back && S.cape) cape(g, S.cape, swing, S.capeLen || 0, S.capeWide || 0, true, S.capeUp, tt);

    // ---- đầu (lắc trễ nhịp so với thân) ----
    g.save(); g.translate(hx, hy + R * 0.8 + headDy); g.rotate(headRot); g.translate(-hx, -hy - R * 0.8);
    if (back) { S.headBack(g, hx, hy, R, swing, tt); }
    else {
      headBase(g, hx, hy, R, S.skin, S.noBlush);
      if (S.face) S.face(g, hx, hy, R, blink, tt, a);
      else { eyes(g, hx, hy, R, S.iris, blink, S.eyeMode); brows(g, hx, hy, R, S.browCol || INK, S.angry || (a >= 0 && S.kind === 'melee'));
        if (a >= 0 && S.kind === 'melee') F(g, ell(hx + R * 0.48, hy + R * 0.6, R * 0.17, R * 0.13), '#5a1a1a', { s: 0, h: 0, lw: 1 }); // hét khi chém
        else line(g, hx + R * 0.36, hy + R * 0.6, hx + R * 0.56, hy + R * 0.58, INK, 1.1); }
      S.hair(g, hx, hy, R, swing, tt);
    }
    g.restore();

    // ---- tay trước + vũ khí ----
    if (!back) {
      if (S.kind === 'bow') {
        g.save(); g.translate(handF.x, handF.y); W.bow(g, S.tier, pull, noArrow, S); g.restore();
        limb(g, shB.x + 2, shB.y, handB.x, handB.y, S.armW || 3.2, S.sleeve);
        limb(g, shF.x, shF.y, handF.x - 0.5, handF.y, S.armW || 3.2, S.sleeve);
        dot(g, handF.x - 0.5, handF.y, 1.9, S.skin); dot(g, handB.x, handB.y, 1.8, S.skin);
      } else {
        if (S.shield) { g.save(); g.translate(-bw * 0.35, shY + 7.5); g.scale(1.2, 1.2); W.shield(g, S.tier, S); g.restore(); }
        const at = wAt || handF;
        g.save(); g.translate(at.x, at.y); g.rotate(wRot); g.scale(1, wLen); if (S.wScale) g.scale(S.wScale, S.wScale); W[S.weapon](g, S.tier, glow, S.wcol, tt, S); g.restore();
        limb(g, shF.x, shF.y, handF.x, handF.y, S.armW || 3.4, S.sleeve);
        dot(g, handF.x, handF.y, (S.armW || 3.4) * 0.62, S.glove || S.skin);
        if (twoHand) dot(g, handB.x, handB.y, (S.armW || 3.4) * 0.62, S.glove || S.skin);
        if (smear && smear.kind === 'v') { // vệt chém bổ dọc
          const k = smear.k, al = Math.sin(k * Math.PI), cx = shF.x, cy = shF.y, r = 19 * (S.wScale || 1);
          g.save(); g.globalAlpha = al * 0.9;
          const gr = g.createRadialGradient(cx, cy, r - 7, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, S.smearCol || 'rgba(255,248,220,0.7)'); gr.addColorStop(1, '#ffffff');
          g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, -2.1, -2.1 + 2.6 * Math.min(1, k * 1.4)); g.arc(cx, cy, r - 6, -2.1 + 2.6 * Math.min(1, k * 1.4), -2.1, true); g.closePath(); g.fill(); g.restore();
        }
        if (smear && smear.kind === 'h') { // vệt chém ngang quét trước người
          const k = smear.k, cx = shF.x + 1, cy = shY + 3, rx = 21, ry = 7;
          g.save(); g.globalAlpha = Math.sin(Math.min(1, k * 1.2) * Math.PI) * 0.95; g.lineCap = 'round';
          g.strokeStyle = 'rgba(255,250,230,0.55)'; g.lineWidth = 7; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, Math.PI - k * Math.PI, Math.PI); g.stroke();
          g.strokeStyle = '#ffffff'; g.lineWidth = 2.6; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, Math.PI - k * Math.PI, Math.PI - k * Math.PI * 0.55); g.stroke(); g.restore();
        }
      }
    }
    g.restore();
    g.restore();
  }

  /* ================== NHÂN VẬT PHE TA ================== */
  /** Kiếm sĩ Người: cao, tóc đen, mặt nghiêm, giáp bạc, áo choàng đỏ sẫm, kiếm lớn + khiên.
   *  Đứng: chống kiếm xuống đất · Đánh: chém ngang · Bị đánh: lùi 1 bước · Cấp 4: giơ khiên tạo lá chắn */
  function HUMAN(t, o) {
    o = o || {}; const HC = o.hair || '#1e1a22', CAPE = o.cape || '#6a1218';
    const armor = o.armor || (t === 1 ? '#aab0ba' : t === 2 ? '#c2c8d2' : '#dde2ea'), trim = t >= 3 ? GOLD : '#6a6e78';
    return { tier: t, kind: 'melee', weapon: o.weapon || 'bigsword', slash: 'h', idle: 'plant', shield: o.shield !== false, shieldCol: o.shieldCol || '#8a1e24', wcol: o.wcol,
      R: o.R || 9.6, bw: 6.8, torso: 12.6, leg: 8, legW: 4.4, armW: 3.6,
      skin: SKIN, iris: o.iris || '#3a2a22', legs: '#5a5e6a', boots: t >= 3 ? '#8a94a6' : '#3a2a20', sleeve: armor, glove: '#6a6e78',
      cape: CAPE, capeLen: 2 + t, capeWide: 1.5 + t * 0.5,
      torsoDraw(g, bw, hipY, h, back) {
        F(g, rr(-bw * 0.62, hipY - h, bw * 1.24, h + 1, 3.6), armor, { s: 2, h: 1, light: '#ffffff' });
        if (!back) { // giáp ngực bạc + vạt áo đỏ sẫm
          F(g, poly([-bw * 0.36, hipY - 1, bw * 0.36, hipY - 1, bw * 0.3, hipY + 4.5, 0, hipY + 6, -bw * 0.3, hipY + 4.5]), CAPE, { s: 0.8, h: 0.4, lw: 1.4 });
          line(g, -bw * 0.1, hipY - h + 2.5, -bw * 0.2, hipY - 3, 'rgba(255,255,255,0.75)', 1.1);
          line(g, -bw * 0.5, hipY - h * 0.45, bw * 0.5, hipY - h * 0.45, sh(armor, -0.35), 1);
          if (t >= 3) { line(g, -bw * 0.45, hipY - h + 3.4, bw * 0.45, hipY - h + 3.4, GOLD, 1.3); F(g, P_.circ(0, hipY - h + 6.8, 1.4), '#c8202a', { s: 0, h: 0.3, lw: 1 }); }
        }
        F(g, rr(-bw * 0.66, hipY - 2.4, bw * 1.32, 2.8, 1), '#3a2216', { s: 0.4, h: 0.3, lw: 1.3 });
        for (const s of [-1, 1]) F(g, ell(s * bw * 0.64, hipY - h + 2.2, 3.8, 2.8), t >= 4 ? GOLD : armor, { s: 0.8, h: 0.5, lw: 1.5, light: '#ffffff' });
        if (t >= 4) line(g, -bw * 0.62, hipY - 0.6, bw * 0.62, hipY - 0.6, trim, 1);
      },
      face(g, hx, hy, R, blink) { // mặt nghiêm: mắt hẹp, mày ngang, miệng mím
        eyes(g, hx, hy + R * 0.04, R, o.iris || '#3a2a22', blink, 'fierce');
        g.lineCap = 'round'; g.strokeStyle = HC === '#1e1a22' ? INK : sh(HC, -0.5); g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(hx - R * 0.12, hy - R * 0.24); g.lineTo(hx + R * 0.3, hy - R * 0.16); g.stroke();
        g.beginPath(); g.moveTo(hx + R * 0.42, hy - R * 0.16); g.lineTo(hx + R * 0.86, hy - R * 0.26); g.stroke();
        line(g, hx + R * 0.32, hy + R * 0.62, hx + R * 0.62, hy + R * 0.6, INK, 1.2);
      },
      hair(g, hx, hy, R) {
        F(g, blob([hx - R * 1.08, hy + R * 0.3, hx - R * 1.12, hy - R * 0.62, hx - R * 0.45, hy - R * 1.16, hx + R * 0.55, hy - R * 1.1, hx + R * 1.1, hy - R * 0.5,
          hx + R * 0.95, hy - R * 0.25, hx + R * 0.55, hy - R * 0.5, hx + R * 0.2, hy - R * 0.32, hx - R * 0.15, hy - R * 0.55, hx - R * 0.45, hy - R * 0.1, hx - R * 0.6, hy + R * 0.3]), HC, { s: R * 0.16, h: R * 0.08 });
        for (const [a, b, c2] of [[-0.85, -0.95, -1.45], [-0.25, -1.1, -1.6], [0.4, -1.02, -1.45]]) F(g, poly([hx + R * (a - 0.28), hy + R * b + 2, hx + R * (a - 0.4), hy + R * c2, hx + R * (a + 0.28), hy + R * b + 2]), HC, { s: 0.6, h: 0.4, lw: 1.5 });
        line(g, hx - R * 0.4, hy - R * 0.85, hx + R * 0.3, hy - R * 0.95, HC === '#1e1a22' ? 'rgba(130,140,180,0.7)' : 'rgba(255,255,255,0.6)', 1.1);
        if (t >= 4 && !o.noCrown) F(g, poly([hx - R * 0.5, hy - R * 0.98, hx - R * 0.3, hy - R * 1.42, hx, hy - R * 1.12, hx + R * 0.3, hy - R * 1.48, hx + R * 0.5, hy - R * 1.06]), GOLD, { s: 0.6, h: 0.5, lw: 1.3 });
      },
      headBack(g, hx, hy, R) { F(g, P_.circ(hx, hy, R * 1.04), HC, { s: R * 0.2, h: R * 0.1 }); }
    };
  }
  /** Elf cung thủ: mảnh mai, tóc vàng/trắng dài, tai nhọn, giáp nhẹ xanh, cung dài, ống tên sau lưng.
   *  Đứng: kéo thử dây cung · Đánh: bắn rất nhanh */
  function ELF(t, o) {
    o = o || {}; const tunic = o.tunic || (t >= 4 ? '#5ac078' : '#3fa05a'), hairC = o.hair || (t >= 3 ? '#fff6dc' : '#f5d878');
    const longHair = (g, hx, hy, R, sw) => F(g, blob([hx - R * 0.6, hy - R * 0.9, hx - R * 1.25, hy - R * 0.1, hx - R * 1.3 - sw, hy + R * 1.6, hx - R * 0.9 - sw * 1.4, hy + R * 2.8, hx - R * 0.1, hy + R * 2.3, hx + R * 0.2, hy + R * 0.8]), hairC, { s: R * 0.18, h: R * 0.08 });
    return { tier: t, kind: 'bow', idle: 'bowcheck', R: 9.6, bw: 5, torso: 11.5, leg: 8, legW: 3.2, armW: 2.7,
      skin: SKIN, iris: '#2aa86a', legs: '#2f6a3a', boots: '#6a4a26', sleeve: tunic,
      cape: o.cape || (t >= 2 ? '#2f7a40' : null), capeLen: 1, capeWide: 1,
      backHair: longHair,
      torsoDraw(g, bw, hipY, h, back) {
        g.save(); g.translate(-bw * 0.55, hipY - h + 1); g.rotate(-0.45); F(g, rr(-2, -7, 4, 11, 1.4), '#7a4a26', { s: 0.6, h: 0.3, lw: 1.3 }); for (const x of [-1, 0.2, 1.3]) F(g, poly([x - 0.9, -7, x, -10.5, x + 0.9, -7]), t >= 4 ? '#9affc8' : '#f4f0e0', { s: 0, h: 0, lw: 0.9 }); g.restore();
        F(g, poly([-bw * 0.6, hipY - h, bw * 0.6, hipY - h, bw * 0.72, hipY + 1.5, 0, hipY + 3.5, -bw * 0.72, hipY + 1.5]), tunic, { s: 1.8, h: 0.9, light: '#c8f0a0' });
        if (!back) { line(g, 0, hipY - h + 1, 0, hipY + 3, t >= 2 ? GOLD : '#2a6a34', 1); F(g, rr(-bw * 0.62, hipY - 3.6, bw * 1.24, 2.2, 1), '#6a4a26', { s: 0.4, h: 0.3, lw: 1.2 }); }
        for (const s of [-1, 1]) F(g, c => { c.moveTo(s * bw * 0.2, hipY - h + 0.5); c.quadraticCurveTo(s * bw * 0.95, hipY - h - 1.5, s * bw * 0.85, hipY - h + 3.5); c.closePath(); }, t >= 3 ? GOLD : '#7acc6a', { s: 0.4, h: 0.3, lw: 1.2 });
      },
      hair(g, hx, hy, R) {
        F(g, blob([hx - R * 1.1, hy + R * 0.4, hx - R * 1.05, hy - R * 0.7, hx - R * 0.2, hy - R * 1.2, hx + R * 0.75, hy - R * 1.0, hx + R * 1.12, hy - R * 0.3,
          hx + R * 0.7, hy - R * 0.45, hx + R * 0.2, hy - R * 0.3, hx - R * 0.35, hy + R * 0.0, hx - R * 0.6, hy + R * 0.6]), hairC, { s: R * 0.16, h: R * 0.08 });
        F(g, poly([hx - R * 0.45, hy + R * 0.05, hx - R * 1.75, hy - R * 0.8, hx - R * 0.5, hy + R * 0.45]), SKIN, { s: 0.6, h: 0.3, lw: 1.5 });
        if (t >= 3) { line(g, hx - R * 0.6, hy - R * 0.62, hx + R * 0.95, hy - R * 0.62, GOLD, 1.3); F(g, poly([hx + R * 0.15, hy - R * 0.62, hx + R * 0.3, hy - R * 0.95, hx + R * 0.45, hy - R * 0.62]), '#7fffd0', { s: 0, h: 0.3, lw: 1 }); }
      },
      headBack(g, hx, hy, R, sw) { F(g, blob([hx - R * 1.05, hy - R * 0.3, hx - R * 0.4, hy - R * 1.1, hx + R * 0.6, hy - R * 1.05, hx + R * 1.1, hy - R * 0.2, hx + R * 0.85, hy + R * 1.6, hx - R * 0.85 - sw, hy + R * 1.7]), hairC, { s: R * 0.2, h: R * 0.1 });
        for (const s of [-1, 1]) F(g, poly([hx + s * R * 0.9, hy, hx + s * R * 1.7, hy - R * 0.7, hx + s * R * 1.0, hy + R * 0.35]), SKIN, { s: 0.5, h: 0.3, lw: 1.4 }); }
    };
  }
  /** Chiến binh Lùn: thấp, cực béo chắc, râu khổng lồ, mũ sắt, giáp nặng, rìu hai tay.
   *  Đứng: vuốt râu · Đánh: bổ rìu xuống · Kỹ năng: đập đất gây choáng */
  function DWARF(t, o) {
    o = o || {}; const steel = t >= 4 ? '#d8b860' : '#9ea4b0', beard = o.beard || '#d4581e', armor = o.armor || (t >= 3 ? '#8a92a0' : '#7a6a5a');
    return { tier: t, kind: 'melee', weapon: o.weapon || 'greataxe', twoHand: true, idle: 'beard', R: 10.2, bw: 11, torso: 9.5, leg: 3.8, legW: 5.6, armW: 4.8,
      skin: '#f8c4a0', iris: '#3a5ab8', legs: '#4a3428', boots: '#2a1c14', sleeve: armor, glove: '#3a2a20',
      torsoDraw(g, bw, hipY, h, back) {
        F(g, c => { c.moveTo(-bw * 0.6, hipY - h + 2); c.quadraticCurveTo(-bw * 0.85, hipY - h * 0.3, -bw * 0.62, hipY + 2); c.lineTo(bw * 0.62, hipY + 2); c.quadraticCurveTo(bw * 0.9, hipY - h * 0.3, bw * 0.6, hipY - h + 2); c.quadraticCurveTo(0, hipY - h - 1.5, -bw * 0.6, hipY - h + 2); c.closePath(); }, armor, { s: 2.6, h: 1.2 });
        for (const y of [hipY - h * 0.55, hipY - h * 0.2]) line(g, -bw * 0.55, y, bw * 0.55, y, sh(armor, -0.35), 1.1);
        F(g, rr(-bw * 0.7, hipY - 2.8, bw * 1.4, 3.4, 1.2), '#3a2416', { s: 0.4, h: 0.3, lw: 1.4 }); F(g, rr(-2, hipY - 3.2, 4, 4.2, 0.8), GOLD, { s: 0.3, h: 0.3, lw: 1.1 });
        for (const s of [-1, 1]) F(g, ell(s * bw * 0.62, hipY - h + 2.4, 4.6, 3.4), steel, { s: 1, h: 0.6, lw: 1.6, light: '#ffffff' });
        if (t >= 2) for (const s of [-1, 1]) for (const k of [0, 1]) dot(g, s * bw * (0.5 + k * 0.18), hipY - h + 2, 0.8, '#e8e8f0');
      },
      face(g, hx, hy, R, blink) {
        eyes(g, hx, hy - R * 0.02, R, '#3a5ab8', blink);
        g.lineCap = 'round'; g.strokeStyle = sh(beard, -0.25); g.lineWidth = 2.2;
        g.beginPath(); g.moveTo(hx - R * 0.12, hy - R * 0.3); g.lineTo(hx + R * 0.32, hy - R * 0.22); g.stroke(); g.beginPath(); g.moveTo(hx + R * 0.44, hy - R * 0.22); g.lineTo(hx + R * 0.88, hy - R * 0.3); g.stroke();
        F(g, P_.circ(hx + R * 0.52, hy + R * 0.3, R * 0.22), '#f0a080', { s: 0.6, h: 0.3, lw: 1.3 });
      },
      hair(g, hx, hy, R) {
        F(g, blob([hx - R * 0.85, hy + R * 0.1, hx - R * 0.2, hy + R * 0.55, hx + R * 0.5, hy + R * 0.5, hx + R * 1.15, hy + R * 0.1, hx + R * 1.3, hy + R * 1.1,
          hx + R * 0.9, hy + R * 2.0, hx + R * 0.25, hy + R * 2.45, hx - R * 0.5, hy + R * 1.95, hx - R * 1.0, hy + R * 0.9]), beard, { s: R * 0.22, h: R * 0.1 });
        g.strokeStyle = sh(beard, -0.25); g.lineWidth = 1.1; for (const x of [-0.1, 0.35, 0.8]) { g.beginPath(); g.moveTo(hx + R * (x - 0.1), hy + R * 0.85); g.quadraticCurveTo(hx + R * x, hy + R * 1.45, hx + R * (x - 0.2), hy + R * 2.0); g.stroke(); }
        F(g, blob([hx + R * 0.0, hy + R * 0.55, hx + R * 0.55, hy + R * 0.42, hx + R * 1.1, hy + R * 0.62, hx + R * 0.6, hy + R * 0.78]), sh(beard, 0.12), { s: 0.6, h: 0.3, lw: 1.3 });
        if (t >= 3) for (const s of [0.1, 0.7]) F(g, rr(hx + R * s - 1.6, hy + R * 1.7, 3.2, 2.2, 0.6), GOLD, { s: 0, h: 0.3, lw: 1 });
        F(g, c => { c.moveTo(hx - R * 1.08, hy - R * 0.3); c.ellipse(hx, hy - R * 0.34, R * 1.08, R * 0.92, 0, Math.PI, TAU); c.closePath(); }, steel, { s: 1.6, h: 0.9, light: '#ffffff' });
        F(g, rr(hx - R * 1.12, hy - R * 0.44, R * 2.24, R * 0.28, R * 0.1), sh(steel, -0.15), { s: 0.4, h: 0.2, lw: 1.4 });
        F(g, rr(hx + R * 0.25, hy - R * 0.45, R * 0.22, R * 0.75, R * 0.1), sh(steel, -0.1), { s: 0.3, h: 0.2, lw: 1.2 });
        if (t >= 3) for (const s of [-1, 1]) F(g, c => { c.moveTo(hx + s * R * 0.7, hy - R * 0.8); c.quadraticCurveTo(hx + s * R * 1.75, hy - R * 1.05, hx + s * R * 1.55, hy - R * 2.0); c.quadraticCurveTo(hx + s * R * 1.3, hy - R * 1.25, hx + s * R * 0.45, hy - R * 1.1); c.closePath(); }, '#f2ead6', { s: 0.8, h: 0.5, lw: 1.5 });
      },
      headBack(g, hx, hy, R) { F(g, P_.circ(hx, hy, R * 1.04), beard, { s: R * 0.2, h: R * 0.1 }); F(g, c => { c.moveTo(hx - R * 1.08, hy - R * 0.3); c.ellipse(hx, hy - R * 0.34, R * 1.08, R * 0.92, 0, Math.PI, TAU); c.closePath(); }, steel, { s: 1.6, h: 0.9 }); }
    };
  }
  /** Phù thủy: dáng nhỏ nhưng áo choàng cực lớn, mũ nhọn, gậy có viên đá phát sáng bay lơ lửng. Màu xanh tím. */
  function MAGE(t, o) {
    o = o || {}; const robe = o.robe || '#4a3ec4', hairC = o.hair || '#d8d4f8', hatC = o.hat || '#3a2ea0', trimC = o.trim || '#7fd8ff';
    const hat = (g, hx, hy, R, sw) => {
      F(g, ell(hx + R * 0.1, hy - R * 0.62, R * 1.75, R * 0.46, -0.08), hatC, { s: 1.2, h: 0.6 });
      F(g, c => { c.moveTo(hx - R * 0.8, hy - R * 0.72); c.quadraticCurveTo(hx - R * 0.2, hy - R * 2.3, hx - R * 1.1 - sw * 1.2, hy - R * 3.0); c.quadraticCurveTo(hx + R * 0.35, hy - R * 2.5, hx + R * 1.0, hy - R * 0.72); c.closePath(); }, hatC, { s: 1.6, h: 0.8 });
      F(g, c => { c.moveTo(hx - R * 0.82, hy - R * 0.86); c.quadraticCurveTo(hx + R * 0.1, hy - R * 1.08, hx + R * 1.0, hy - R * 0.86); c.lineTo(hx + R * 0.96, hy - R * 1.14); c.quadraticCurveTo(hx + R * 0.1, hy - R * 1.34, hx - R * 0.72, hy - R * 1.14); c.closePath(); }, trimC, { s: 0.4, h: 0.3, lw: 1.2 });
      for (const [x, y, r] of [[-0.35, -1.7, 1.2], [0.15, -1.5, 0.8], [-0.6, -2.3, 0.9]]) dot(g, hx + R * x, hy + R * y, r, '#fff6a0');
    };
    return { tier: t, kind: 'staff', weapon: 'staff', wcol: o.wcol || '#9ae6ff', R: 9.4, bw: 5.4, torso: 10.5, leg: 4, legW: 3,
      skin: SKIN, iris: o.iris || '#7a5ae0', legs: sh(robe, -0.3), boots: '#22183a', sleeve: robe,
      cape: o.cape || '#2a2480', capeLen: 6, capeWide: 4.5,
      backHair: (g, hx, hy, R, sw) => F(g, blob([hx - R * 0.5, hy - R * 0.9, hx - R * 1.2, hy - R * 0.1, hx - R * 1.25 - sw, hy + R * 1.5, hx - R * 0.7 - sw * 1.2, hy + R * 2.3, hx + R * 0.1, hy + R * 1.8, hx + R * 0.3, hy + R * 0.6]), hairC, { s: R * 0.18, h: R * 0.08 }),
      torsoDraw(g, bw, hipY, h, back) {
        F(g, poly([-bw * 0.6, hipY - h, bw * 0.6, hipY - h, bw * 1.75, 1, -bw * 1.75, 1]), robe, { s: 2.4, h: 1.1, light: '#8a7ef0' });
        g.save(); g.beginPath(); P_.poly([-bw * 0.6, hipY - h, bw * 0.6, hipY - h, bw * 1.75, 1, -bw * 1.75, 1])(g); g.clip();
        for (const x of [-0.8, 0, 0.8]) line(g, bw * x * 0.4, hipY - h + 3, bw * x * 1.4, 1, sh(robe, -0.3), 1.1); g.restore();
        line(g, -bw * 1.68, 0, bw * 1.68, 0, trimC, 1.6);
        F(g, ell(0, hipY - h + 1, bw * 0.95, 2.8), sh(robe, 0.1), { s: 0.6, h: 0.4, lw: 1.4 });
        if (!back) { line(g, 0, hipY - h + 3, 0, 0, trimC, 1.1); F(g, rr(-bw * 0.62, hipY - h + 6, bw * 1.24, 2, 0.8), GOLD, { s: 0.3, h: 0.3, lw: 1.1 }); if (t >= 3) F(g, poly([0, hipY - h + 2, 1.6, hipY - h + 4, 0, hipY - h + 6, -1.6, hipY - h + 4]), trimC, { s: 0, h: 0.4, lw: 1 }); }
      },
      hair(g, hx, hy, R, sw) {
        F(g, blob([hx - R * 1.05, hy + R * 0.6, hx - R * 1.0, hy - R * 0.6, hx - R * 0.1, hy - R * 0.95, hx + R * 1.05, hy - R * 0.55, hx + R * 1.1, hy + R * 0.15,
          hx + R * 0.75, hy - R * 0.25, hx + R * 0.35, hy - R * 0.4, hx - R * 0.1, hy - R * 0.1, hx - R * 0.45, hy + R * 0.9]), hairC, { s: R * 0.15, h: R * 0.08 });
        hat(g, hx, hy, R, sw);
      },
      headBack(g, hx, hy, R, sw) { F(g, blob([hx - R * 1.05, hy - R * 0.3, hx + R * 1.05, hy - R * 0.3, hx + R * 0.85, hy + R * 1.3, hx - R * 0.85 - sw, hy + R * 1.45]), hairC, { s: R * 0.2, h: R * 0.1 }); hat(g, hx, hy, R, sw); }
    };
  }
  function ORC(t) {
    const skin = '#7eb036', leather = '#6a3e26', steel = t >= 4 ? '#c8ccd6' : '#8a8e98';
    return { tier: t, kind: 'melee', weapon: 'axe', R: 10.6, bw: 8.4, torso: 12, leg: 6.5, legW: 5, armW: 4.6,
      skin, iris: '#ffcc22', eyeMode: 'fierce', angry: true, legs: '#4a2e20', boots: '#2a1a14', sleeve: skin, glove: '#4a2e20',
      torsoDraw(g, bw, hipY, h, back) {
        F(g, rr(-bw * 0.62, hipY - h, bw * 1.24, h + 1, 4.5), skin, { s: 2.2, h: 1 });
        if (!back) { line(g, -bw * 0.3, hipY - h + 4.5, bw * 0.05, hipY - h + 5.5, sh(skin, -0.3), 1); line(g, bw * 0.15, hipY - h + 4.5, bw * 0.45, hipY - h + 5.5, sh(skin, -0.3), 1); }
        line(g, -bw * 0.6, hipY - h + 1, bw * 0.55, hipY - 2, '#3a2216', 2.2);
        F(g, rr(-bw * 0.66, hipY - 3, bw * 1.32, 3.2, 1), leather, { s: 0.5, h: 0.3, lw: 1.4 });
        F(g, poly([-bw * 0.4, hipY, bw * 0.4, hipY, bw * 0.3, hipY + 5, -bw * 0.3, hipY + 5]), '#b02a24', { s: 0.6, h: 0.3, lw: 1.4 });
        if (t >= 2) F(g, ell(-bw * 0.62, hipY - h + 2.4, 4.6, 3.4), steel, { s: 1, h: 0.6, lw: 1.6 });
        if (t >= 2) F(g, ell(bw * 0.62, hipY - h + 2.4, 4, 3), leather, { s: 1, h: 0.6, lw: 1.6 });
        if (t >= 3) { // da sói trên vai
          F(g, blob([-bw * 0.95, hipY - h + 4, -bw * 0.8, hipY - h - 1.5, 0, hipY - h - 2.2, bw * 0.85, hipY - h - 1.2, bw * 0.95, hipY - h + 3, 0, hipY - h + 2]), '#8a8a92', { s: 1.2, h: 0.7, lw: 1.5, light: '#d8d8e0' });
          for (const x of [-0.6, -0.1, 0.4]) F(g, poly([bw * x, hipY - h + 1.6, bw * (x + 0.12), hipY - h + 4.2, bw * (x + 0.24), hipY - h + 1.6]), '#f2f0e8', { s: 0, h: 0, lw: 0.9 });
        }
      },
      face(g, hx, hy, R, blink) {
        eyes(g, hx, hy, R, '#ffcc22', blink, 'fierce'); brows(g, hx, hy, R, INK, true);
        // miệng + nanh
        F(g, c => { c.moveTo(hx + R * 0.05, hy + R * 0.55); c.quadraticCurveTo(hx + R * 0.5, hy + R * 0.82, hx + R * 0.95, hy + R * 0.5); c.lineTo(hx + R * 0.9, hy + R * 0.65); c.quadraticCurveTo(hx + R * 0.5, hy + R * 0.95, hx + R * 0.1, hy + R * 0.68); c.closePath(); }, '#3a1a1a', { s: 0, h: 0, lw: 1.1 });
        for (const x of [0.2, 0.78]) F(g, poly([hx + R * (x - 0.1), hy + R * 0.66, hx + R * x, hy + R * 0.2, hx + R * (x + 0.1), hy + R * 0.66]), '#fff8e0', { s: 0, h: 0, lw: 1.1 });
        // tai orc
        F(g, poly([hx - R * 0.7, hy - R * 0.1, hx - R * 1.4, hy - R * 0.45, hx - R * 0.75, hy + R * 0.35]), skin, { s: 0.6, h: 0.3, lw: 1.5 });
      },
      hair(g, hx, hy, R, sw) {
        if (t >= 4) { // mũ sừng
          F(g, c => { c.moveTo(hx - R * 1.02, hy - R * 0.15); c.ellipse(hx, hy - R * 0.2, R * 1.02, R * 0.95, 0, Math.PI, TAU); c.closePath(); }, steel, { s: 1.4, h: 0.8 });
          for (const s of [-1, 1]) F(g, c => { c.moveTo(hx + s * R * 0.75, hy - R * 0.7); c.quadraticCurveTo(hx + s * R * 1.7, hy - R * 1.0, hx + s * R * 1.5, hy - R * 2.0); c.quadraticCurveTo(hx + s * R * 1.25, hy - R * 1.2, hx + s * R * 0.5, hy - R * 1.0); c.closePath(); }, '#f2ead6', { s: 0.8, h: 0.5, lw: 1.5 });
          line(g, hx - R, hy - R * 0.2, hx + R, hy - R * 0.2, GOLD, 1.3);
        } else {
          F(g, blob([hx - R * 1.0, hy + R * 0.2, hx - R * 1.05, hy - R * 0.55, hx - R * 0.55, hy - R * 0.95, hx - R * 0.15, hy - R * 0.98, hx - R * 0.45, hy - R * 0.4, hx - R * 0.6, hy + R * 0.25]), '#2a1e22', { s: R * 0.1, h: R * 0.06 });
          line(g, hx + R * 0.1, hy - R * 0.62, hx + R * 0.7, hy - R * 0.55, sh(skin, -0.25), 1.2);
          F(g, blob([hx - R * 0.35, hy - R * 0.9, hx - R * 0.1, hy - R * 1.45, hx + R * 0.35, hy - R * 1.3, hx + R * 0.15, hy - R * 0.85]), '#2a1e22', { s: 0.8, h: 0.4, lw: 1.5 }); // búi tóc
          F(g, blob([hx - R * 0.3, hy - R * 1.2, hx - R * 1.0 - sw, hy - R * 0.9, hx - R * 1.35 - sw * 1.4, hy - R * 0.1, hx - R * 0.9, hy - R * 0.7]), '#2a1e22', { s: 0.6, h: 0.3, lw: 1.4 });
          F(g, rr(hx - R * 0.4, hy - R * 1.08, R * 0.5, R * 0.28, R * 0.1), '#b02a24', { s: 0.3, h: 0.2, lw: 1.1 });
        }
      },
      headBack(g, hx, hy, R, sw) { F(g, P_.circ(hx, hy, R * 1.03), skin, { s: R * 0.2, h: R * 0.1 }); this.hair(g, hx, hy, R, sw); }
    };
  }

  /* ================== QUÁI VẬT CHIBI ================== */
  /** Goblin: rất nhỏ, tai dài, mắt to, da xanh, dao nhỏ, chạy khom người.
   *  Đứng: nhìn trái nhìn phải · Đánh: lao tới đâm · Chết: ngã lăn vài vòng */
  function GOBLIN(o) {
    o = o || {}; const skin = o.skin || '#7cc23e', cloth = o.cloth || '#7a5232', eye = o.eye || '#ffd23a';
    return { tier: 1, kind: 'melee', weapon: 'knife', slash: 'stab', hunch: 0.28, look: true, R: 9.4, bw: 5, torso: 6.6, leg: 4.4, legW: 3, armW: 2.5,
      skin, legs: sh(skin, -0.25), boots: '#4a3020', sleeve: skin, glove: skin,
      torsoDraw(g, bw, hipY, h) {
        F(g, poly([-bw * 0.62, hipY - h, bw * 0.62, hipY - h, bw * 0.8, hipY + 2, bw * 0.3, hipY + 0.5, 0, hipY + 3, -bw * 0.4, hipY + 0.6, -bw * 0.8, hipY + 2]), cloth, { s: 1.4, h: 0.7 });
        F(g, rr(-bw * 0.66, hipY - 2.2, bw * 1.32, 1.8, 0.8), '#3a2416', { s: 0.3, h: 0.2, lw: 1.1 });
      },
      face(g, hx, hy, R, blink, tt) { // mắt to tròn, đảo trái phải
        const look = o.glow ? 0 : Math.sin((tt || 0) * 1.6) * R * 0.12;
        for (const [ex, s] of [[hx + R * 0.05, 0.85], [hx + R * 0.58, 1]]) {
          if (blink) { line(g, ex - 2.2 * s, hy + 0.5, ex + 2.2 * s, hy + 0.5, INK, 1.3); continue; }
          F(g, ell(ex, hy + R * 0.02, 2.6 * s, 3 * s), o.glow ? '#1a0e26' : '#ffffff', { s: 0, h: 0, lw: 1.4 });
          if (o.glow) K.glow(g, ex + look, hy + R * 0.05, 4, eye, 0.9);
          dot(g, ex + look + 0.5, hy + R * 0.08, 1.6 * s, eye); dot(g, ex + look + 0.6, hy + R * 0.08, 0.8 * s, INK); dot(g, ex + look - 0.2, hy - R * 0.05, 0.5, '#ffffff');
        }
        line(g, hx + R * 0.2, hy + R * 0.58, hx + R * 0.7, hy + R * 0.52, INK, 1.2);
        F(g, poly([hx + R * 0.32, hy + R * 0.56, hx + R * 0.38, hy + R * 0.76, hx + R * 0.45, hy + R * 0.55]), '#fffbe8', { s: 0, h: 0, lw: 0.8 });
      },
      hair(g, hx, hy, R) { // tai dài nhọn chìa ngang
        for (const s of [-1, 1]) F(g, c => { c.moveTo(hx + s * R * 0.7, hy - R * 0.2); c.quadraticCurveTo(hx + s * R * 1.6, hy - R * 0.55, hx + s * R * 2.15, hy - R * 0.75); c.quadraticCurveTo(hx + s * R * 1.5, hy + R * 0.05, hx + s * R * 0.75, hy + R * 0.3); c.closePath(); }, skin, { s: 0.8, h: 0.4, lw: 1.5 });
        if (!o.glow) F(g, c => { c.moveTo(hx - R * 1.0, hy - R * 0.4); c.quadraticCurveTo(hx, hy - R * 1.35, hx + R * 1.0, hy - R * 0.45); c.quadraticCurveTo(hx, hy - R * 0.75, hx - R * 1.0, hy - R * 0.4); c.closePath(); }, '#c8302a', { s: 0.6, h: 0.3, lw: 1.3 }); // khăn đỏ
      },
      headBack(g, hx, hy, R) { this.hair(g, hx, hy, R); }
    };
  }
  /** Orc (quái): da xanh xám, răng nanh nhỏ, mặt dữ nhưng dễ thương */
  function ORC_ENEMY(t) { const S = ORC(t); S.skin = S.sleeve = '#7a9a62'; S.iris = '#ff5a2a'; S.weapon = 'axe'; return S; }
  /** Kỵ Sĩ Hắc Ám (boss giữa màn): giáp đen kín người, không thấy mặt, mắt đỏ phát sáng, áo choàng đen dài, kiếm đen khổng lồ.
   *  Đứng: bất động · Đánh: chém cực mạnh · Giai đoạn 2: áo choàng bay lên, kiếm phát sáng đỏ */
  function DARKKNIGHT(p2) {
    const armor = '#2c2a36', trim = '#5a2a3a';
    return { tier: 3, kind: 'melee', weapon: 'blacksword', redBlade: p2, still: true, noBlush: true, R: 9.4, bw: 8, torso: 13.5, leg: 8.5, legW: 5, armW: 4.6, wScale: 1.15,
      skin: armor, legs: '#22202a', boots: '#16141c', sleeve: armor, glove: '#1a1820', smearCol: p2 ? 'rgba(255,60,40,0.8)' : 'rgba(180,160,220,0.6)',
      cape: '#141018', capeLen: 9, capeWide: 5, capeUp: p2,
      torsoDraw(g, bw, hipY, h, back) {
        F(g, rr(-bw * 0.62, hipY - h, bw * 1.24, h + 1, 3), armor, { s: 2.2, h: 1, light: '#4a4658' });
        if (!back) { line(g, 0, hipY - h + 2, 0, hipY - 2, trim, 1.4); line(g, -bw * 0.5, hipY - h * 0.5, bw * 0.5, hipY - h * 0.5, '#16141c', 1.2); }
        F(g, rr(-bw * 0.66, hipY - 2.4, bw * 1.32, 2.8, 1), '#16141c', { s: 0.4, h: 0.3, lw: 1.3 });
        for (const s of [-1, 1]) { F(g, ell(s * bw * 0.66, hipY - h + 2.2, 4.6, 3.2), armor, { s: 1, h: 0.5, lw: 1.6, light: '#4a4658' }); F(g, poly([s * bw * 0.66, hipY - h - 0.5, s * bw * 0.9, hipY - h - 5, s * bw * 0.42, hipY - h + 0.5]), '#3a3646', { s: 0.4, h: 0.3, lw: 1.2 }); }
      },
      face(g, hx, hy, R, blink, tt) { // mũ trụ kín: khe nhìn + mắt đỏ phát sáng
        F(g, rr(hx - R * 0.15, hy - R * 0.05, R * 1.1, R * 0.32, R * 0.12), '#0a080e', { s: 0, h: 0, lw: 1.2, flat: true });
        const pulse = 0.8 + Math.sin((tt || 0) * 3) * 0.2;
        for (const ex of [hx + R * 0.15, hx + R * 0.62]) { K.glow(g, ex, hy + R * 0.1, R * 0.7, '#ff2a1a', pulse); dot(g, ex, hy + R * 0.1, R * 0.11, '#ffd0c0'); }
        for (let i = 0; i < 3; i++) line(g, hx + R * (0.1 + i * 0.25), hy + R * 0.45, hx + R * (0.1 + i * 0.25), hy + R * 0.8, '#0a080e', 1);
      },
      hair(g, hx, hy, R) { // chóp mũ & gai
        F(g, poly([hx - R * 0.2, hy - R * 0.9, hx + R * 0.1, hy - R * 1.7, hx + R * 0.35, hy - R * 0.92]), '#3a3646', { s: 0.6, h: 0.4, lw: 1.4 });
        for (const s of [-1, 1]) F(g, poly([hx + s * R * 0.8, hy - R * 0.5, hx + s * R * 1.5, hy - R * 1.2, hx + s * R * 1.0, hy - R * 0.25]), '#3a3646', { s: 0.6, h: 0.4, lw: 1.4 });
        line(g, hx - R * 0.9, hy - R * 0.35, hx + R * 1.0, hy - R * 0.35, '#5a2a3a', 1.3);
      },
      headBack(g, hx, hy, R) { F(g, P_.circ(hx, hy, R * 1.04), armor, { s: R * 0.2, h: R * 0.1 }); this.hair(g, hx, hy, R); }
    };
  }
  /** Chúa Hắc Ám (boss cuối): khổng lồ, giáp đen, 2 mắt đỏ, vương miện đen, kiếm khổng lồ, khói bóng tối sau lưng.
   *  Giai đoạn 3: toàn thân phát sáng đỏ */
  function DARKLORD(p3) {
    const armor = p3 ? '#4a1e22' : '#26222e', trim = p3 ? '#ff4a2a' : '#8a2a3a';
    const S = DARKKNIGHT(p3); Object.assign(S, { R: 10, bw: 10, torso: 15, leg: 9, legW: 6, armW: 5.4, wScale: 1.45, still: false, skin: armor, sleeve: armor, cape: '#100c14', capeLen: 10, capeWide: 7, capeUp: false, redBlade: true });
    const baseTorso = S.torsoDraw, baseHair = S.hair;
    S.torsoDraw = function (g, bw, hipY, h, back) {
      baseTorso.call(this, g, bw, hipY, h, back);
      if (!back) { F(g, poly([-bw * 0.3, hipY - h + 3, bw * 0.3, hipY - h + 3, 0, hipY - h + 9]), trim, { s: 0, h: 0.4, lw: 1.2 }); if (p3) for (const [x1, y1, x2, y2] of [[-3, -20, 1, -14], [2, -24, -1, -17], [4, -12, 1, -8]]) line(g, x1, hipY + y1 + 10, x2, hipY + y2 + 10, '#ffb04a', 1.2); }
    };
    S.hair = function (g, hx, hy, R) { // vương miện đen
      baseHair.call(this, g, hx, hy, R);
      F(g, c => { c.moveTo(hx - R * 0.95, hy - R * 0.55); for (let i = 0; i <= 5; i++) { const x = hx - R * 0.95 + i * R * 0.39; c.lineTo(x, hy - R * (i % 2 ? 1.05 : 1.55)); } c.lineTo(hx + R * 1.0, hy - R * 0.55); c.closePath(); }, '#18141e', { s: 0.8, h: 0.5, lw: 1.6, light: '#4a4458' });
      for (const x of [-0.56, 0.22, 0.98]) dot(g, hx + R * x - R * 0.2, hy - R * 0.8, 1.3, p3 ? '#ffd040' : '#c8202a');
    };
    S.aura = function (g, hx, hy, R, tt) { // khói / năng lượng bóng tối sau lưng
      for (let i = 0; i < 7; i++) {
        const ph = (tt * 0.6 + i / 7) % 1, x = -10 + Math.sin(i * 2.3 + tt) * 10 - ph * 6, y = hy + 14 - ph * 34, r = 6 + ph * 9;
        g.globalAlpha = (1 - ph) * 0.75; F(g, P_.circ(x, y, r), p3 ? '#5a0e14' : '#1a1024', { s: r * 0.4, h: 0, lw: 0, dark: '#08040c' }); g.globalAlpha = 1;
      }
      K.glow(g, -4, hy + 4, 30, p3 ? '#ff2a1a' : '#6a1a8a', 0.4);
    };
    return S;
  }
  /** Orc cưỡi sói: orc xanh xám, nanh nhỏ, mặt dữ dễ thương, cưỡi sói lớn, cầm giáo.
   *  Đứng: sói gầm · Đánh: lao nhanh vào quái · Kỹ năng: sói tăng tốc húc mục tiêu */
  function wolfRider(g, P) {
    const tt = P.t || 0, walk = P.w >= 0, ph = walk ? P.w * TAU : 0, a = P.a;
    const fur = '#7a7680', furD = '#4a4652', belly = '#c8c0c8', skin = '#7a9a62';
    let bx = 0, by = 0, rot = 0, roar = 0;
    if (walk) { by = -Math.abs(Math.sin(ph)) * 3.2; rot = Math.sin(ph) * 0.07; }
    else if (a >= 0) { const k = a < 0.35 ? -a / 0.35 : a < 0.55 ? (a - 0.35) / 0.2 : 1 - (a - 0.55) / 0.45; bx = k * 7; rot = k * 0.12; roar = Math.max(0, k); }
    else { const s = tt % 3.2; roar = s < 0.9 ? Math.sin(s / 0.9 * Math.PI) : 0; by = -roar * 1.2; }
    K.shadow(g, 0, 0.6, 22, 4.4, 0.45);
    g.save(); g.translate(bx, by); g.rotate(rot);
    // chân sói (phi nước đại)
    const leg = (x, q, back) => { const s = walk ? Math.sin(ph + q) : 0, fx = x + s * 6, fy = -1 - Math.max(0, Math.cos(ph + q)) * (walk ? 4 : 0); limb(g, x, -12, fx, fy, 3.6, back ? furD : fur); F(g, ell(fx + 1, fy, 2.6, 1.6), '#2a2630', { s: 0.4, h: 0.2, lw: 1.2 }); };
    leg(-9, 0.6, true); leg(8, Math.PI + 0.6, true);
    // đuôi
    const tw = Math.sin(tt * 6 + ph) * 3;
    F(g, c => { c.moveTo(-15, -17); c.quadraticCurveTo(-24, -20 + tw, -27, -26 + tw); c.quadraticCurveTo(-21, -17, -14, -13); c.closePath(); }, fur, { s: 1, h: 0.5, lw: 1.6 });
    // thân sói
    F(g, blob([-17, -14, -14, -22, 0, -24, 12, -22, 17, -16, 12, -9, -2, -8, -14, -9]), fur, { s: 3, h: 1.4, lw: 2 });
    F(g, blob([-8, -10, 4, -9.5, 10, -12, 0, -12]), belly, { s: 0.6, h: 0.3, lw: 0 });
    for (const x of [-10, -5, 0]) F(g, poly([x - 2, -21, x + 1, -26, x + 3, -21]), furD, { s: 0, h: 0.3, lw: 1.1 }); // bờm
    leg(-6, Math.PI, false); leg(11, 0, false);
    // đầu sói
    g.save(); g.translate(15, -20); g.rotate(-roar * 0.35);
    F(g, poly([-2, -5, 2, -12, 4, -5]), fur, { s: 0.6, h: 0.3, lw: 1.4 }); F(g, poly([3, -5, 7, -11, 8, -4]), furD, { s: 0.6, h: 0.3, lw: 1.4 });
    F(g, blob([-4, 2, -3, -5, 5, -6, 10, -3, 15, -1, 15, 2, 8, 4, 0, 5]), fur, { s: 2, h: 1, lw: 1.8 });
    F(g, c => { c.moveTo(6, 3); c.lineTo(15, 2 + roar * 1.5); c.lineTo(14, 4 + roar * 5); c.lineTo(5, 5 + roar * 2); c.closePath(); }, roar > 0.1 ? '#7a1a22' : furD, { s: 0, h: 0, lw: 1.3 });
    if (roar > 0.1) for (const x of [8, 11, 13]) F(g, poly([x - 0.8, 2.6 + roar, x, 4.4 + roar, x + 0.8, 2.6 + roar]), '#ffffff', { s: 0, h: 0, lw: 0.6 });
    dot(g, 15, 0.2, 1.3, INK); K.glow(g, 6, -2.5, 3, '#ffd23a', 0.8); dot(g, 6, -2.5, 1.1, '#ffd23a'); dot(g, 6.3, -2.5, 0.5, INK);
    g.restore();
    // orc trên lưng sói
    const rb = walk ? Math.sin(ph * 2) * 0.8 : 0;
    g.save(); g.translate(-2, -21 + rb);
    limb(g, -2, 0, 2, 4, 3.4, '#4a2e20'); // chân kẹp
    F(g, rr(-5, -12, 10, 12, 3), '#6a3e26', { s: 1.4, h: 0.6 }); line(g, -4.5, -11, 4, -2, '#3a2216', 1.6);
    F(g, ell(-4.5, -11, 3.4, 2.4), '#8a8e98', { s: 0.6, h: 0.4, lw: 1.4 });
    // giáo: ngả về phía trước, lao tới thì đâm thẳng
    const thrust = a >= 0 ? Math.max(0, a < 0.35 ? -a : a < 0.55 ? (a - 0.35) / 0.2 : 1 - (a - 0.55) / 0.45) : 0;
    g.save(); g.translate(5 + thrust * 6, -7); g.rotate(walk ? 0.9 + Math.sin(ph) * 0.06 : a >= 0 ? lerp(0.9, 1.5, thrust) : 0.5); W.spear(g); g.restore();
    limb(g, 2, -10, 5 + thrust * 6, -7, 3, skin); dot(g, 5 + thrust * 6, -7, 2, skin);
    // đầu orc
    const hx = 1, hy = -19, R = 7.4;
    F(g, c => { c.moveTo(hx + R, hy); c.ellipse(hx, hy, R, R * 0.94, 0, 0, TAU); }, skin, { s: R * 0.16, h: R * 0.08, lw: 1.8 });
    eyes(g, hx, hy, R, '#ffcc22', false, 'fierce'); brows(g, hx, hy, R, INK, true);
    for (const x of [0.2, 0.75]) F(g, poly([hx + R * (x - 0.1), hy + R * 0.66, hx + R * x, hy + R * 0.32, hx + R * (x + 0.1), hy + R * 0.66]), '#fff8e0', { s: 0, h: 0, lw: 1 });
    line(g, hx + R * 0.05, hy + R * 0.62, hx + R * 0.9, hy + R * 0.58, INK, 1.1);
    F(g, poly([hx - R * 0.7, hy - R * 0.1, hx - R * 1.4, hy - R * 0.45, hx - R * 0.75, hy + R * 0.3]), skin, { s: 0.5, h: 0.3, lw: 1.4 });
    F(g, c => { c.moveTo(hx - R, hy - R * 0.2); c.ellipse(hx, hy - R * 0.25, R, R * 0.8, 0, Math.PI, TAU); c.closePath(); }, '#8a8e98', { s: 1, h: 0.6, lw: 1.5 }); // mũ sắt
    F(g, poly([hx - R * 0.15, hy - R * 1.0, hx, hy - R * 1.6, hx + R * 0.2, hy - R * 1.0]), '#c8302a', { s: 0, h: 0.3, lw: 1.1 });
    g.restore();
    g.restore();
  }
  /** Tỉ lệ kiểu Kingdom Rush: đầu nhỏ hơn, chân & thân dài hơn */
  function krProp(S) { S.R = (S.R || 10) * 0.84; S.leg = (S.leg || 6.5) * 1.3; S.torso = (S.torso || 11) * 1.06; S.bw = (S.bw || 6) * 1.02; return S; }
  /* ================== 4 ANH HÙNG CHIBI ================== */
  const HEROES = {
    aldric: (t, wt) => HUMAN(t, { hair: '#eef2f8', armor: '#3a5ab8', cape: '#1e3488', weapon: 'greatsword', shield: false, iris: '#3a8ad8', noCrown: true, wcol: wt >= 3 ? '#ffe680' : '#9ae0ff' }),
    lyra: (t) => ELF(t, { hair: '#6ae0c8', tunic: '#2f8a6a', cape: '#1f6a5a' }),
    selene: (t) => MAGE(t, { hair: '#f4f6ff', hat: '#2a3aa0', robe: '#3a5ac8', cape: '#22307a', wcol: '#8ad8ff', iris: '#3a8ad8' }),
    borin: (t) => DWARF(t, { beard: '#c8401e', armor: '#6a6e7a' })
  };
  function installHeroes() {
    const reg = window.ArtChars; if (!reg || !reg.heroKey) return;
    reg.heroKey = function (id, tiers) {
      tiers = tiers || [0, 0, 0, 0];
      const key = 'c_' + id + '_' + tiers.join('');
      if (!reg[key] && HEROES[id]) {
        const sum = tiers.reduce((a, b) => a + b, 0), t = Math.min(4, 2 + Math.floor(sum / 4));
        const S = HEROES[id](t, tiers[0]); S.R = 10.6; krProp(S);
        const tall = (S.leg || 6.5) + (S.torso || 11) + S.R * 1.9;
        reg[key] = { draw: (g, P) => body(g, P, S, false), box: BOX, dr: 12, head: tall * 0.75, tall, wide: 26, chibi: true };
        reg[key + '_b'] = { draw: (g, P) => body(g, P, S, true), box: BOX, dr: 12, head: tall * 0.75, tall, wide: 26, chibi: true };
      }
      return reg[key] ? key : 'soldier4';
    };
  }
  /* ================== ĐĂNG KÝ ================== */
  const MAKERS = { soldier: HUMAN, elf: ELF, dwarf: DWARF, mage: MAGE, orct: ORC };
  const BOX = [96, 96, 48, 72]; // w, h, ox, oy (gốc chân)
  function register() {
    const reg = window.ArtChars; if (!reg) return;
    Object.keys(MAKERS).forEach(name => {
      for (let t = 1; t <= 4; t++) {
        const S = krProp(MAKERS[name](t)), key = name + t, old = reg[key] || {};
        const tall = (S.leg || 6.5) + (S.torso || 11) + (S.R || 10) * 1.9;
        reg[key] = { draw: (g, P) => body(g, P, S, false), box: BOX, dr: 12, head: tall * 0.75, tall, wide: 26, chibi: true };
        reg[key + '_b'] = { draw: (g, P) => body(g, P, S, true), box: BOX, dr: 12, head: tall * 0.75, tall, wide: 26, chibi: true };
      }
    });
    if (window.Painter) Painter.clear();
  }
  /** Quái vẽ chibi (ghi đè hình vẽ cũ) */
  function registerEnemies() {
    const reg = window.ArtChars; if (!reg) return;
    const add = (key, S, box) => { krProp(S); const tall = (S.leg || 6.5) + (S.torso || 11) + (S.R || 10) * 1.9; reg[key] = { draw: (g, P) => body(g, P, S, false), box: box || BOX, dr: 12, head: tall * 0.75, tall, wide: 26, chibi: true }; };
    const BIG = [150, 150, 75, 118];
    add('goblin', GOBLIN()); add('shade', GOBLIN({ skin: '#3a2a5a', cloth: '#1a1024', eye: '#d080ff', glow: true }));
    add('orc', ORC_ENEMY(2));
    add('darkKnight', DARKKNIGHT(false), BIG); add('darkKnight2', DARKKNIGHT(true), BIG);
    add('darkLord', DARKLORD(false), BIG); add('darkLord3', DARKLORD(true), BIG);
    reg.wolfRider = { draw: wolfRider, box: [130, 100, 65, 76], dr: 12, head: 30, tall: 40, wide: 46, chibi: true };
  }
  window.Chibi = { register, MAKERS };
  register(); installHeroes(); registerEnemies();
})();
