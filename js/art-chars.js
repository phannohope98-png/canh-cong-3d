/* =========================================================
 * art-chars.js – Nhân vật phong cách anime (bản vẽ lại hoàn toàn)
 * Gốc toạ độ = điểm giữa hai chân, nhìn sang PHẢI.
 * P = { w: pha bước 0..1 (-1 = đứng), a: tiến độ đòn 0..1 (-1), t: giây }
 * Mỗi nhân vật được thiết kế theo chiều cao mục tiêu (đơn vị thế giới)
 * so với đường đi rộng 66: yêu tinh ~32, lính ~40, orc ~44, anh hùng ~48,
 * troll ~64, vua troll ~96. Gameplay/hitbox không đổi.
 * ========================================================= */
(function () {
  const K = ArtKit, shade = K.shade, mix = K.mix, lerp = K.lerp, TAU = Math.PI * 2;
  const INKC = '#1a0e26';
  const inkOf = c => mix(c, INKC, 0.74);

  /* ---------------- Bút vẽ cơ bản ---------------- */
  function F(g, build, col, o) {
    o = o || {};
    K.cel(g, build, col, { s: o.s === undefined ? 1.5 : o.s, h: o.h === undefined ? 0.75 : o.h, lw: o.lw === undefined ? 1.0 : o.lw,
      ink: o.ink || inkOf(col), animeHeavy: true, noRim: o.noRim, dark: o.dark, light: o.light });
  }
  const poly = pts => K.P.poly(pts);
  const blob = pts => K.P.blob(pts);
  const ell = (x, y, rx, ry, r) => K.P.ell(x, y, rx, ry, r);
  const circ = (x, y, r) => K.P.circ(x, y, r);
  function line(g, x1, y1, x2, y2, col, w) { g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  function dot(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  /** Chi (tay/chân) dạng đường gấp khúc có viền + mảng sáng tối */
  function limb(g, pts, w, col) {
    const path = () => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); };
    g.lineCap = 'round'; g.lineJoin = 'round';
    path(); g.strokeStyle = inkOf(col); g.lineWidth = w + 2; g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.stroke();
    g.save(); g.translate(w * 0.2, w * 0.18); path(); g.strokeStyle = shade(col, -0.3); g.lineWidth = w * 0.42; g.stroke(); g.restore();
    g.save(); g.translate(-w * 0.22, -w * 0.2); path(); g.strokeStyle = shade(col, 0.32); g.lineWidth = w * 0.24; g.stroke(); g.restore();
  }
  function shadowE(g, rx, ry, a) { K.shadow(g, 0, 0.5, rx, ry, a === undefined ? 0.42 : a); }
  function smear(g, cx, cy, r, a0, a1, col, alpha, w) {
    if (alpha <= 0) return;
    g.save(); g.globalAlpha *= alpha;
    g.beginPath(); g.arc(cx, cy, r, a0, a1); g.arc(cx, cy, r - w, a1, a0, true); g.closePath();
    const gr = g.createRadialGradient(cx, cy, r - w, cx, cy, r);
    gr.addColorStop(0, K.alpha(col, 0)); gr.addColorStop(0.7, K.alpha(col, 0.55)); gr.addColorStop(1, '#ffffff');
    g.fillStyle = gr; g.fill(); g.restore();
  }

  /* ---------------- Vũ khí (cầm ở gốc, lưỡi hướng lên -y) ---------------- */
  const WEAPON = {
    sword(g, col) {
      F(g, K.P.rr(-1.1, -1, 2.2, 6, 1), '#5a3420', { s: 0.6, h: 0.3, lw: 0.8 });
      F(g, circ(0, 5.6, 1.5), '#f2c14e', { s: 0.5, h: 0.3, lw: 0.8 });
      F(g, poly([-2.1, -2.5, -2.1, -15, 0, -18.5, 2.1, -15, 2.1, -2.5]), col, { s: 1.1, h: 0.7, lw: 0.9 });
      line(g, 0, -3.5, 0, -15.5, 'rgba(255,255,255,0.85)', 0.7);
      F(g, K.P.rr(-4.6, -3.6, 9.2, 2.4, 1.1), '#f2c14e', { s: 0.6, h: 0.4, lw: 0.8 });
    },
    greatsword(g, col, glow) {
      K.glow(g, 0, -15, 14 + glow * 10, '#8fd8ff', 0.35 + glow * 0.5);
      F(g, K.P.rr(-1.4, -1, 2.8, 8, 1.2), '#3a2a4a', { s: 0.6, h: 0.3, lw: 0.9 });
      F(g, circ(0, 7.6, 2), '#7fd4ff', { s: 0.6, h: 0.5, lw: 0.8 });
      F(g, poly([-3.2, -3, -3.4, -22, 0, -28, 3.4, -22, 3.2, -3]), col, { s: 1.4, h: 0.9, lw: 1 });
      F(g, poly([-1.1, -5, -1.1, -21, 0, -24, 1.1, -21, 1.1, -5]), '#bfeaff', { s: 0, h: 0, lw: 0 });
      F(g, poly([-7.5, -4.6, -3, -2.2, 0, -3.6, 3, -2.2, 7.5, -4.6, 6, -1.2, 0, -0.2, -6, -1.2]), '#f2c14e', { s: 0.7, h: 0.5, lw: 0.9 });
      F(g, circ(0, -2.6, 1.3), '#4ac0ff', { s: 0, h: 0.4, lw: 0.6 });
    },
    dagger(g, col) {
      F(g, K.P.rr(-1, -1, 2, 5, 0.8), '#4a2e1a', { s: 0.5, h: 0.3, lw: 0.8 });
      F(g, g2 => { g2.moveTo(-1.8, -1.6); g2.quadraticCurveTo(-2.6, -8, 1.8, -12.5); g2.quadraticCurveTo(0.4, -7, 1.8, -1.6); g2.closePath(); }, col, { s: 0.8, h: 0.5, lw: 0.8 });
      F(g, K.P.rr(-3.2, -2.6, 6.4, 1.8, 0.8), '#8a6a3a', { s: 0.4, h: 0.3, lw: 0.7 });
    },
    cleaver(g, col) {
      F(g, K.P.rr(-1.2, -1, 2.4, 6.5, 1), '#4a2e1a', { s: 0.6, h: 0.3, lw: 0.9 });
      F(g, poly([-2, -1.5, -2.4, -15, 1, -19, 7.5, -17.5, 6, -12, 7.2, -8, 4.6, -3, 2.5, -1.5]), col, { s: 1.4, h: 0.8, lw: 1 });
      line(g, 6.6, -16.5, 6.6, -4.5, 'rgba(255,255,255,0.7)', 0.7);
      dot(g, 1, -14, 0.9, inkOf(col)); dot(g, 1, -9, 0.9, inkOf(col));
    },
    axe(g, col) {
      limb(g, [0, 7, 0, -22], 2, '#3a2a22');
      F(g, g2 => { g2.moveTo(0.5, -22); g2.quadraticCurveTo(8, -26, 11.5, -19); g2.quadraticCurveTo(8.5, -15.5, 10.5, -10); g2.quadraticCurveTo(6, -12, 0.5, -13); g2.closePath(); }, col, { s: 1.4, h: 0.8, lw: 1 });
      F(g, g2 => { g2.moveTo(-0.5, -21); g2.quadraticCurveTo(-6, -22, -7.5, -17); g2.quadraticCurveTo(-5.5, -15, -6.5, -12.5); g2.quadraticCurveTo(-3, -14, -0.5, -14.5); g2.closePath(); }, shade(col, -0.1), { s: 1, h: 0.5, lw: 1 });
      g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,70,40,0.75)'; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(9.2, -23.6); g.quadraticCurveTo(12, -19.5, 10, -12); g.stroke(); g.restore();
      F(g, poly([-1.4, -24.5, 0, -28, 1.4, -24.5]), '#9aa0ac', { s: 0.4, h: 0.3, lw: 0.8 });
    },
    club(g, col) {
      F(g, blob([-1.6, 5, 1.6, 5, 4.6, -10, 5, -22, 0, -25, -5, -21, -4.4, -9]), col, { s: 2.2, h: 1.1, lw: 1.1 });
      g.save(); g.strokeStyle = shade(col, -0.35); g.lineWidth = 0.9;
      for (const y of [-8, -15]) { g.beginPath(); g.moveTo(-4.4, y); g.quadraticCurveTo(0, y + 1.5, 4.6, y - 0.6); g.stroke(); }
      g.restore();
      for (const [x, y, d] of [[-4.6, -18, -1], [4.8, -16, 1], [-4.2, -10, -1], [4.5, -8, 1]]) F(g, poly([x, y - 1.3, x + d * 3, y, x, y + 1.3]), '#e6dcc4', { s: 0, h: 0, lw: 0.7 });
      F(g, poly([-1.3, -24, 0, -27.5, 1.3, -24]), '#e6dcc4', { s: 0, h: 0, lw: 0.7 });
      F(g, ell(0.5, -18, 3.2, 1.8), '#6a8a3a', { s: 0.6, h: 0.3, lw: 0.6 });
    },
    pillar(g, col, glow) {
      F(g, K.P.rr(-2, -2, 4, 9, 1.4), '#4a3a30', { s: 0.6, h: 0.4, lw: 1 });
      F(g, poly([-5, -2, -6.5, -26, -2, -31, 4.5, -30, 6.8, -24, 5.2, -2]), col, { s: 2.2, h: 1.1, lw: 1.1 });
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55 + glow * 0.45; g.strokeStyle = '#ff7a3a'; g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(-2, -8); g.lineTo(1, -12); g.lineTo(-1.5, -16); g.lineTo(2, -21); g.moveTo(2.6, -6); g.lineTo(3.4, -10); g.stroke(); g.restore();
      K.glow(g, 0, -15, 12, '#ff6a2a', 0.25 + glow * 0.4);
    },
    hammer(g, col) {
      limb(g, [0, 6, 0, -14], 1.6, '#7a4c2a');
      F(g, K.P.rr(-5.5, -19, 11, 6.5, 1.6), col, { s: 1, h: 0.6, lw: 0.9 });
    },
    warhammer(g, col, glow) {
      K.glow(g, 0, -20, 12 + glow * 8, '#ff8a2a', 0.25 + glow * 0.5);
      limb(g, [0, 8, 0, -16], 2.2, '#6a4026');
      F(g, K.P.rr(-8, -26, 16, 11, 2.4), col, { s: 1.6, h: 0.9, lw: 1 });
      F(g, K.P.rr(-9.4, -24.5, 3.4, 8, 1), '#f2c14e', { s: 0.4, h: 0.3, lw: 0.8 });
      F(g, K.P.rr(6, -24.5, 3.4, 8, 1), '#f2c14e', { s: 0.4, h: 0.3, lw: 0.8 });
      F(g, poly([-1.5, -26, 0, -30, 1.5, -26]), '#c8ccd6', { s: 0.3, h: 0.3, lw: 0.7 });
      dot(g, 0, -20.5, 1.5, '#ff7a2a');
    },
    scimitar(g, col) {
      F(g, K.P.rr(-1, -1, 2, 5.5, 0.8), '#5a3a1a', { s: 0.5, h: 0.3, lw: 0.8 });
      F(g, g2 => { g2.moveTo(-1.8, -1.6); g2.quadraticCurveTo(-3.2, -12, 3.6, -17.5); g2.quadraticCurveTo(0.8, -10, 1.8, -1.6); g2.closePath(); }, col, { s: 0.9, h: 0.5, lw: 0.9 });
      F(g, K.P.rr(-3.4, -2.8, 6.8, 1.9, 0.8), '#e8b24a', { s: 0.4, h: 0.3, lw: 0.7 });
    },
    bone(g, col) {
      F(g, K.P.rr(-1.1, -1, 2.2, 5.5, 1), '#6a5a4a', { s: 0.5, h: 0.3, lw: 0.8 });
      F(g, poly([-2, -2.5, -2.4, -14, 0, -19, 2.4, -14, 2, -2.5]), col, { s: 1.1, h: 0.7, lw: 0.9 });
      line(g, 0, -4, 0, -15, 'rgba(120,255,220,0.7)', 0.8);
      F(g, K.P.rr(-4.4, -3.4, 8.8, 2.2, 1), '#8a8478', { s: 0.5, h: 0.3, lw: 0.8 });
    },
    none() {}
  };

  /* ---------------- Mắt anime ---------------- */
  function eye(g, x, y, w, h, iris, mode, blink, far) {
    const fw = far ? w * 0.78 : w;
    if (blink) { g.strokeStyle = INKC; g.lineWidth = 0.75; g.beginPath(); g.moveTo(x - fw, y + 0.3); g.quadraticCurveTo(x, y + h * 0.45, x + fw, y + 0.2); g.stroke(); return; }
    if (mode === 'glow') {
      K.glow(g, x, y, w * 3.4, iris, 0.85);
      g.fillStyle = iris; g.beginPath(); g.ellipse(x, y, fw, h * 0.55, 0, 0, TAU); g.fill();
      g.fillStyle = '#fff8d8'; g.beginPath(); g.ellipse(x + fw * 0.2, y - h * 0.08, fw * 0.45, h * 0.24, 0, 0, TAU); g.fill();
      return;
    }
    const hh = mode === 'fierce' ? h * 0.66 : h;
    g.save();
    g.fillStyle = '#fffaf2'; g.beginPath();
    if (mode === 'fierce') { g.moveTo(x - fw, y - hh * 0.55); g.lineTo(x + fw, y - hh * 0.05); g.quadraticCurveTo(x + fw * 0.6, y + hh * 0.85, x - fw * 0.4, y + hh * 0.7); g.closePath(); }
    else g.ellipse(x, y, fw, hh, 0, 0, TAU);
    g.fill(); g.clip();
    const ix = x + fw * 0.2, gr = g.createLinearGradient(0, y - hh, 0, y + hh);
    gr.addColorStop(0, shade(iris, -0.6)); gr.addColorStop(0.55, iris); gr.addColorStop(1, shade(iris, 0.45));
    g.fillStyle = gr; g.beginPath(); g.ellipse(ix, y + hh * 0.08, fw * 0.82, hh * 0.92, 0, 0, TAU); g.fill();
    g.fillStyle = shade(iris, -0.75);
    if (mode === 'slit') { g.beginPath(); g.ellipse(ix, y + hh * 0.1, fw * 0.16, hh * 0.7, 0, 0, TAU); g.fill(); }
    else { g.beginPath(); g.ellipse(ix + fw * 0.05, y + hh * 0.05, fw * 0.36, hh * 0.42, 0, 0, TAU); g.fill(); }
    g.restore();
    dot(g, ix - fw * 0.28, y - hh * 0.36, Math.max(0.45, fw * 0.36), '#ffffff');
    dot(g, ix + fw * 0.32, y + hh * 0.42, Math.max(0.25, fw * 0.17), 'rgba(255,255,255,0.85)');
    g.strokeStyle = INKC; g.lineCap = 'round'; g.lineWidth = mode === 'fierce' ? 1.05 : 0.95;
    g.beginPath();
    if (mode === 'fierce') { g.moveTo(x - fw * 1.1, y - hh * 0.75); g.lineTo(x + fw * 1.15, y - hh * 0.1); }
    else { g.moveTo(x - fw * 1.05, y - hh * 0.25); g.quadraticCurveTo(x - fw * 0.2, y - hh * 1.25, x + fw * 1.1, y - hh * 0.55); g.lineTo(x + fw * 1.45, y - hh * 0.25); }
    g.stroke();
  }

  /* ---------------- Tóc ---------------- */
  function hairBack(g, hx, hy, R, sp, sway) {
    const c = sp.hairCol;
    if (sp.hair === 'long') {
      F(g, g2 => { g2.moveTo(hx - R * 0.2, hy - R * 0.9); g2.quadraticCurveTo(hx - R * 1.5, hy - R * 0.6, hx - R * 1.35 - sway, hy + R * 1.5);
        g2.lineTo(hx - R * 0.95 - sway * 0.7, hy + R * 1.15); g2.lineTo(hx - R * 0.8 - sway * 0.8, hy + R * 1.75); g2.lineTo(hx - R * 0.45 - sway * 0.5, hy + R * 1.0);
        g2.quadraticCurveTo(hx + R * 0.1, hy, hx - R * 0.2, hy - R * 0.9); g2.closePath(); }, shade(c, -0.12), { s: 1.4, h: 0.4 });
    } else if (sp.hair === 'spiky' || sp.hair === 'hero') {
      const n = sp.hair === 'hero' ? 1.3 : 1;
      F(g, poly([hx - R * 0.2, hy - R * 1.05, hx - R * 1.5 * n - sway * 0.4, hy - R * 0.55, hx - R * 1.05, hy - R * 0.25, hx - R * 1.6 * n - sway, hy + R * 0.25,
        hx - R * 1.0, hy + R * 0.45, hx - R * 1.3 * n - sway, hy + R * 1.05, hx - R * 0.55, hy + R * 0.7, hx - R * 0.2, hy]), shade(c, -0.1), { s: 1.3, h: 0.4 });
    } else if (sp.hair === 'tuft') {
      F(g, poly([hx - R * 0.4, hy - R * 0.95, hx - R * 1.35 - sway, hy - R * 0.75, hx - R * 0.95, hy - R * 0.4]), shade(c, -0.1), { s: 0.6, h: 0.3 });
    }
  }
  function hairFront(g, hx, hy, R, sp, sway) {
    const c = sp.hairCol;
    if (!sp.hair || sp.hair === 'none') return;
    if (sp.hair === 'tuft') { F(g, poly([hx - R * 0.5, hy - R * 0.85, hx + R * 0.1, hy - R * 1.55 - sway * 0.2, hx + R * 0.2, hy - R * 0.9, hx + R * 0.75, hy - R * 1.3, hx + R * 0.55, hy - R * 0.7]), c, { s: 0.8, h: 0.4 }); return; }
    const tipY = hy - R * 0.02;
    F(g, g2 => {
      g2.moveTo(hx - R * 1.06, hy + R * 0.4);
      g2.quadraticCurveTo(hx - R * 1.22, hy - R * 1.3, hx + R * 0.15, hy - R * 1.22);
      g2.quadraticCurveTo(hx + R * 1.18, hy - R * 1.05, hx + R * 1.08, hy - R * 0.05);
      g2.lineTo(hx + R * 0.86, hy - R * 0.36); g2.lineTo(hx + R * 0.7, tipY + R * 0.12);
      g2.lineTo(hx + R * 0.45, hy - R * 0.42); g2.lineTo(hx + R * 0.18, tipY);
      g2.lineTo(hx - R * 0.05, hy - R * 0.45); g2.lineTo(hx - R * 0.32, tipY - R * 0.05);
      g2.lineTo(hx - R * 0.45, hy - R * 0.35);
      g2.lineTo(hx - R * 0.62, hy + R * 0.85); g2.lineTo(hx - R * 0.86, hy + R * 0.3);
      g2.closePath();
    }, c, { s: 1.2, h: 0.6 });
    g.save(); g.globalAlpha = 0.75; g.strokeStyle = shade(c, 0.55); g.lineWidth = 1.1; g.lineCap = 'round';
    g.beginPath(); g.arc(hx - R * 0.05, hy - R * 0.1, R * 0.92, -2.55, -1.75); g.stroke();
    g.beginPath(); g.arc(hx - R * 0.05, hy - R * 0.1, R * 0.92, -1.55, -1.15); g.stroke();
    g.restore();
    if (sp.hair === 'hero' || sp.hair === 'spiky')
      F(g, poly([hx - R * 0.2, hy - R * 1.12, hx - R * 0.05 + sway * 0.2, hy - R * 1.7, hx + R * 0.35, hy - R * 1.1]), c, { s: 0.5, h: 0.3, lw: 0.9 });
  }

  /* ---------------- Mũ / giáp đầu ---------------- */
  function headgear(g, hx, hy, R, sp, t, sway) {
    const k = sp.gear, col = sp.gearCol;
    if (!k) return;
    if (k === 'cap') {
      F(g, g2 => { g2.moveTo(hx - R * 1.08, hy - R * 0.2); g2.quadraticCurveTo(hx - R * 1.0, hy - R * 1.32, hx + R * 0.15, hy - R * 1.26); g2.quadraticCurveTo(hx + R * 1.12, hy - R * 1.12, hx + R * 1.08, hy - R * 0.4); g2.closePath(); }, col, { s: 1.4, h: 0.6 });
      F(g, K.P.rr(hx - R * 1.15, hy - R * 0.5, R * 2.35, R * 0.3, 1), shade(col, -0.12), { s: 0.5, h: 0.3, lw: 0.9 });
    } else if (k === 'helm' || k === 'crest' || k === 'knight') {
      F(g, g2 => { g2.moveTo(hx - R * 1.12, hy - R * 0.08); g2.quadraticCurveTo(hx - R * 1.15, hy - R * 1.38, hx + R * 0.1, hy - R * 1.35); g2.quadraticCurveTo(hx + R * 1.2, hy - R * 1.25, hx + R * 1.12, hy - R * 0.4); g2.lineTo(hx + R * 0.95, hy - R * 0.35); g2.lineTo(hx - R * 0.6, hy - R * 0.38); g2.lineTo(hx - R * 0.72, hy + R * 0.25); g2.closePath(); }, col, { s: 1.8, h: 0.9 });
      g.save(); g.globalAlpha = 0.8; line(g, hx - R * 0.5, hy - R * 1.05, hx + R * 0.15, hy - R * 1.18, '#ffffff', 0.9); g.restore();
      F(g, K.P.rr(hx - R * 0.95, hy - R * 0.55, R * 2.05, R * 0.26, 1), shade(col, -0.15), { s: 0.4, h: 0.3, lw: 0.8 });
      if (k === 'crest') F(g, g2 => { g2.moveTo(hx - R * 0.9, hy - R * 1.1); g2.quadraticCurveTo(hx - R * 0.2, hy - R * 2.0, hx + R * 0.7, hy - R * 1.35); g2.quadraticCurveTo(hx - R * 0.1, hy - R * 1.5, hx - R * 0.9, hy - R * 1.1); g2.closePath(); }, sp.plumeCol || '#3d6fc0', { s: 0.8, h: 0.5 });
      if (k === 'knight') {
        const pc = sp.plumeCol || '#e04848';
        F(g, g2 => { g2.moveTo(hx + R * 0.1, hy - R * 1.3); g2.quadraticCurveTo(hx - R * 0.4, hy - R * 2.3, hx - R * 1.4 - sway, hy - R * 1.75); g2.quadraticCurveTo(hx - R * 1.9 - sway * 1.4, hy - R * 1.0, hx - R * 1.6 - sway * 1.2, hy - R * 0.4); g2.quadraticCurveTo(hx - R * 1.1, hy - R * 1.2, hx + R * 0.1, hy - R * 1.3); g2.closePath(); }, pc, { s: 1.2, h: 0.6 });
        F(g, poly([hx - R * 0.95, hy - R * 0.75, hx - R * 1.6, hy - R * 1.25, hx - R * 1.35, hy - R * 0.85, hx - R * 1.75, hy - R * 0.7, hx - R * 1.05, hy - R * 0.45]), '#f2c14e', { s: 0.4, h: 0.3, lw: 0.8 });
      }
    } else if (k === 'horned') {
      for (const s of [-1, 1]) F(g, g2 => { const bx = hx + s * R * 0.75; g2.moveTo(bx - s * R * 0.2, hy - R * 0.9); g2.quadraticCurveTo(bx + s * R * 0.9, hy - R * 1.2, bx + s * R * 0.9, hy - R * 2.1); g2.quadraticCurveTo(bx + s * R * 0.4, hy - R * 1.35, bx - s * R * 0.25, hy - R * 1.35); g2.closePath(); }, '#e8dcc0', { s: 0.8, h: 0.4 });
      F(g, g2 => { g2.moveTo(hx - R * 1.12, hy - R * 0.1); g2.quadraticCurveTo(hx - R * 1.15, hy - R * 1.38, hx + R * 0.1, hy - R * 1.35); g2.quadraticCurveTo(hx + R * 1.2, hy - R * 1.25, hx + R * 1.12, hy - R * 0.35); g2.lineTo(hx + R * 0.85, hy - R * 0.2); g2.lineTo(hx + R * 0.55, hy - R * 0.5); g2.lineTo(hx + R * 0.3, hy - R * 0.15); g2.lineTo(hx - R * 0.65, hy - R * 0.4); g2.lineTo(hx - R * 0.75, hy + R * 0.3); g2.closePath(); }, col, { s: 1.6, h: 0.8 });
      F(g, poly([hx - R * 0.1, hy - R * 1.32, hx + R * 0.15, hy - R * 1.85, hx + R * 0.42, hy - R * 1.3]), shade(col, 0.15), { s: 0.4, h: 0.3, lw: 0.8 });
    } else if (k === 'hood') {
      F(g, g2 => { g2.moveTo(hx - R * 1.25, hy + R * 0.9); g2.quadraticCurveTo(hx - R * 1.4, hy - R * 1.4, hx + R * 0.2, hy - R * 1.32); g2.quadraticCurveTo(hx + R * 1.2, hy - R * 1.2, hx + R * 1.2, hy - R * 0.1);
        g2.lineTo(hx + R * 0.95, hy - R * 0.15); g2.quadraticCurveTo(hx + R * 0.6, hy - R * 0.95, hx - R * 0.35, hy - R * 0.55); g2.quadraticCurveTo(hx - R * 0.7, hy + R * 0.1, hx - R * 0.6, hy + R * 0.95); g2.closePath(); }, col, { s: 1.6, h: 0.8 });
    } else if (k === 'wizard') {
      F(g, ell(hx, hy - R * 0.62, R * 1.55, R * 0.36), shade(col, -0.05), { s: 0.8, h: 0.4 });
      F(g, g2 => { g2.moveTo(hx - R * 0.95, hy - R * 0.68); g2.quadraticCurveTo(hx - R * 0.4, hy - R * 2.0, hx - R * 0.9 - sway * 1.2, hy - R * 2.6); g2.quadraticCurveTo(hx + R * 0.4, hy - R * 2.1, hx + R * 0.98, hy - R * 0.68); g2.closePath(); }, col, { s: 1.4, h: 0.7 });
      F(g, K.P.rr(hx - R * 0.95, hy - R * 0.95, R * 1.92, R * 0.3, 0.8), sp.trim || '#f2c14e', { s: 0.3, h: 0.25, lw: 0.8 });
      g.save(); g.translate(hx + R * 0.15, hy - R * 1.45); g.fillStyle = '#fff3b0'; g.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.7 : 1.7; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      g.closePath(); g.fill(); g.restore();
    } else if (k === 'bandana') {
      F(g, g2 => { g2.moveTo(hx - R * 1.05, hy - R * 0.15); g2.quadraticCurveTo(hx - R * 1.0, hy - R * 1.3, hx + R * 0.15, hy - R * 1.25); g2.quadraticCurveTo(hx + R * 1.1, hy - R * 1.1, hx + R * 1.05, hy - R * 0.45); g2.quadraticCurveTo(hx, hy - R * 0.62, hx - R * 1.05, hy - R * 0.15); g2.closePath(); }, col, { s: 1.2, h: 0.6 });
      F(g, poly([hx - R * 0.95, hy - R * 0.55, hx - R * 1.9 - sway, hy - R * 0.85 + sway * 0.4, hx - R * 1.75 - sway, hy - R * 0.2, hx - R * 0.95, hy - R * 0.2]), shade(col, -0.08), { s: 0.6, h: 0.3, lw: 0.9 });
      dot(g, hx + R * 0.2, hy - R * 0.85, 0.7, '#fff6dc'); dot(g, hx - R * 0.4, hy - R * 0.95, 0.7, '#fff6dc');
    } else if (k === 'crown') {
      F(g, poly([hx - R * 0.95, hy - R * 0.9, hx - R * 1.15, hy - R * 1.9, hx - R * 0.5, hy - R * 1.35, hx, hy - R * 2.15, hx + R * 0.5, hy - R * 1.35, hx + R * 1.15, hy - R * 1.9, hx + R * 0.95, hy - R * 0.9]), '#f2c14e', { s: 1, h: 0.6 });
      K.glow(g, hx, hy - R * 1.2, R * 0.7, '#ff4040', 0.6);
      F(g, circ(hx, hy - R * 1.2, R * 0.2), '#e0303a', { s: 0.3, h: 0.3, lw: 0.7 });
    } else if (k === 'goggles') {
      F(g, K.P.rr(hx - R * 1.1, hy - R * 0.85, R * 2.2, R * 0.38, 1), '#5a3a22', { s: 0.4, h: 0.3, lw: 0.8 });
      for (const ox of [-0.15, 0.55]) { F(g, circ(hx + R * ox, hy - R * 0.68, R * 0.32), '#c89a3a', { s: 0.4, h: 0.3, lw: 0.8 }); F(g, circ(hx + R * ox, hy - R * 0.68, R * 0.2), '#8fd8ff', { s: 0, h: 0.2, lw: 0.5 }); }
    } else if (k === 'aviator') { // mũ da + kính phi công (Người Lùn)
      F(g, g2 => { g2.moveTo(hx - R * 1.1, hy - R * 0.1); g2.quadraticCurveTo(hx - R * 1.15, hy - R * 1.34, hx + R * 0.1, hy - R * 1.3); g2.quadraticCurveTo(hx + R * 1.18, hy - R * 1.2, hx + R * 1.1, hy - R * 0.45); g2.lineTo(hx - R * 0.2, hy - R * 0.5); g2.lineTo(hx - R * 0.7, hy + R * 0.2); g2.closePath(); }, col, { s: 1.5, h: 0.8 });
      F(g, K.P.rr(hx - R * 1.1, hy - R * 0.92, R * 2.2, R * 0.3, 1), '#3a2418', { s: 0.4, h: 0.3, lw: 0.8 });
      for (const ox of [-0.1, 0.62]) { F(g, circ(hx + R * ox, hy - R * 0.78, R * 0.34), '#d8a23a', { s: 0.4, h: 0.4, lw: 0.9 }); F(g, circ(hx + R * ox, hy - R * 0.78, R * 0.22), '#9fe8ff', { s: 0, h: 0.3, lw: 0.5, light: '#ffffff' }); }
    } else if (k === 'horns') {
      for (const s of [-1, 1]) F(g, g2 => { const bx = hx + s * R * 0.6; g2.moveTo(bx - s * R * 0.25, hy - R * 1.0); g2.quadraticCurveTo(bx + s * R * 0.9, hy - R * 1.2, bx + s * R * 0.7, hy - R * 2.1); g2.quadraticCurveTo(bx + s * R * 0.25, hy - R * 1.3, bx - s * R * 0.3, hy - R * 1.2); g2.closePath(); }, col, { s: 0.8, h: 0.4 });
    } else if (k === 'flame') {
      const fl = Math.sin(t * 9) * 0.25;
      K.glow(g, hx, hy - R * 1.3, R * 1.8, '#ff7a2a', 0.5);
      F(g, g2 => { g2.moveTo(hx - R * 0.8, hy - R * 0.8); g2.quadraticCurveTo(hx - R * 1.1, hy - R * 1.7, hx - R * 0.3 + fl, hy - R * 2.5); g2.quadraticCurveTo(hx - R * 0.1, hy - R * 1.6, hx + R * 0.35, hy - R * 2.1 - fl); g2.quadraticCurveTo(hx + R * 0.5, hy - R * 1.4, hx + R * 1.0, hy - R * 1.7); g2.quadraticCurveTo(hx + R * 0.9, hy - R * 1.0, hx + R * 0.8, hy - R * 0.7); g2.closePath(); }, '#ff7a1a', { s: 0.8, h: 0.8, lw: 0.9, light: '#ffd84a' });
      F(g, g2 => { g2.moveTo(hx - R * 0.35, hy - R * 0.9); g2.quadraticCurveTo(hx - R * 0.2, hy - R * 1.6, hx + R * 0.1, hy - R * 1.85 + fl); g2.quadraticCurveTo(hx + R * 0.4, hy - R * 1.3, hx + R * 0.45, hy - R * 0.9); g2.closePath(); }, '#ffd23a', { s: 0, h: 0, lw: 0 });
    } else if (k === 'leaves') {
      for (const [ox, oy, r2] of [[-0.7, -1.05, 0.6], [0.7, -1.05, 0.62], [0, -1.35, 0.78], [-0.2, -1.75, 0.5]]) F(g, g2 => { g2.moveTo(hx + R * ox - R * r2, hy + R * oy); g2.quadraticCurveTo(hx + R * ox, hy + R * (oy - r2 * 1.6), hx + R * ox + R * r2, hy + R * oy); g2.quadraticCurveTo(hx + R * ox, hy + R * (oy + r2 * 0.7), hx + R * ox - R * r2, hy + R * oy); g2.closePath(); }, col, { s: 0.8, h: 0.5, lw: 0.9 });
    } else if (k === 'circlet') {
      line(g, hx - R * 1.0, hy - R * 0.62, hx + R * 1.0, hy - R * 0.5, col, 1.1);
      K.glow(g, hx + R * 0.1, hy - R * 0.66, R * 0.55, sp.gemCol || '#7fffd0', 0.8);
      F(g, poly([hx + R * 0.1, hy - R * 0.95, hx + R * 0.32, hy - R * 0.64, hx + R * 0.1, hy - R * 0.4, hx - R * 0.12, hy - R * 0.64]), sp.gemCol || '#7fffd0', { s: 0, h: 0.4, lw: 0.7, light: '#ffffff' });
    }
  }

  /* ---------------- Khiên ---------------- */
  function shield(g, x, y, s, sh) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const kite = c => { c.moveTo(-6, -7); c.quadraticCurveTo(0, -9, 6, -7); c.lineTo(6, 0); c.quadraticCurveTo(5, 7, 0, 11); c.quadraticCurveTo(-5, 7, -6, 0); c.closePath(); };
    if (sh.kite) F(g, kite, sh.col, { s: 1.6, h: 0.8, lw: 1.1 });
    else F(g, circ(0, 1, 6.6), sh.col, { s: 1.6, h: 0.8, lw: 1.1 });
    if (sh.rim) { g.strokeStyle = sh.rim; g.lineWidth = 1.2; g.beginPath(); if (sh.kite) { g.save(); g.translate(0, 0.6); g.scale(0.78, 0.8); kite(g); g.restore(); } else g.arc(0, 1, 5, 0, TAU); g.stroke(); }
    if (sh.boss) F(g, circ(0, 1, 2), sh.rim || '#c8ccd6', { s: 0.5, h: 0.4, lw: 0.7 });
    if (sh.mark) sh.mark(g, 0, 1);
    g.restore();
  }
  const markCross = (g, x, y) => { line(g, x, y - 4, x, y + 4.6, '#f2c14e', 1.5); line(g, x - 3.2, y - 1, x + 3.2, y - 1, '#f2c14e', 1.5); };
  const markTree = (g, x, y) => { dot(g, x, y - 1.2, 2.2, '#f4f1e6'); line(g, x, y, x, y + 4, '#f4f1e6', 1.1); };
  const markSkull = (g, x, y) => { dot(g, x, y - 0.6, 2.4, '#d8ccb0'); dot(g, x - 0.9, y - 0.8, 0.6, '#2a1a1a'); dot(g, x + 0.9, y - 0.8, 0.6, '#2a1a1a'); };

  /* =====================================================
   * KHUNG NGƯỜI ANIME
   * ===================================================== */
  function humanoid(g, P, sp) {
    const mv = P.w >= 0, ph = mv ? P.w * TAU : 0, s = Math.sin(ph), c = Math.cos(ph), t = P.t || 0;
    const R = sp.R || 9.2, LL = sp.leg || 11.5, TH = sp.torso || 12.5, bk = sp.bulk || 1;
    const atk = P.a >= 0, sg = K.swing(P.a);
    const bob = mv ? Math.abs(s) * 1.3 - 0.4 : Math.sin(t * 2.4) * 0.35;
    const breathe = mv ? 0 : Math.sin(t * 2.4) * 0.25;
    const lean = (mv ? 0.07 : 0) + (atk ? (sg < 0 ? -0.06 * -sg : 0.12 * sg) : 0) + (sp.hunch || 0);
    const hipY = -LL + bob, chestY = hipY - TH - breathe;
    const hw = 5.4 * bk, cw = 7.4 * bk * (sp.chest || 1);
    const sway = mv ? s * 1.4 : Math.sin(t * 1.7) * 0.8;
    const blink = !mv && !atk && (t % 2.618) > 2.2;
    const up = fn => { g.save(); g.translate(0, hipY); g.rotate(lean); g.translate(0, -hipY); fn(); g.restore(); };

    shadowE(g, 12 * bk, 3.6 * bk);
    if (sp.float) g.translate(0, -sp.float - Math.sin(t * 4) * 1.6);

    const hx = 1.2 * bk + (sp.headX || 0), hy = chestY - R * 0.92 - (sp.neck || 0.6);
    up(() => {
      if (sp.wings) { // cánh dơi (quỷ)
        const fl = Math.sin(t * 8) * 0.18 + (mv ? 0.1 : 0);
        for (const sd of [0, 1]) F(g, g2 => { const x0 = -cw * 0.3, y0 = chestY + 2, sc = sd ? 0.78 : 1, dx = (sd ? 4 : 0);
          g2.moveTo(x0 + dx, y0); g2.quadraticCurveTo(x0 - 6 * sc, y0 - 12 * sc - fl * 8, x0 - 17 * sc, y0 - 14 * sc - fl * 12); g2.lineTo(x0 - 13 * sc, y0 - 7 * sc); g2.lineTo(x0 - 17 * sc, y0 - 3 * sc);
          g2.lineTo(x0 - 11 * sc, y0 - 0.5); g2.lineTo(x0 - 12 * sc, y0 + 5 * sc); g2.lineTo(x0 - 5 * sc, y0 + 2); g2.closePath(); }, sd ? shade(sp.wings, -0.2) : sp.wings, { s: 1.4, h: 0.6, lw: 0.9 });
      }
      if (sp.cape) {
        const fl = mv ? 2.5 + s * 1.5 : Math.sin(t * 2) * 0.9 + (atk ? -2 * sg : 0);
        F(g, g2 => { g2.moveTo(-cw * 0.4, chestY + 1); g2.quadraticCurveTo(-cw - 4 - fl, chestY + TH * 0.5, -cw - 5 - fl * 1.6, hipY + LL * 0.75);
          g2.lineTo(-cw - 2 - fl * 1.2, hipY + LL * 0.55); g2.lineTo(-cw + 0.5 - fl, hipY + LL * 0.85); g2.lineTo(-1, hipY + 1); g2.closePath(); }, sp.cape, { s: 2, h: 0.6, dark: shade(sp.cape, -0.42) });
      }
      hairBack(g, hx, hy, R, sp, sway);
    });

    // tay sau
    const shY = chestY + 2.2;
    up(() => {
      if (sp.shield || sp.weapon === 'bow' || sp.weapon === 'staff') return;
      const a = mv ? -s * 0.6 : 0.15, L = 8.6 * (sp.arm || 1);
      const ex = -cw * 0.55 + Math.sin(a) * L * 0.5, ey = shY + Math.cos(a) * L * 0.5, hx2 = -cw * 0.55 + Math.sin(a + 0.25) * L, hy2 = shY + Math.cos(a + 0.25) * L;
      limb(g, [-cw * 0.55, shY, ex, ey, hx2, hy2], 3.2 * bk, shade(sp.sleeve || sp.top, -0.12));
      F(g, circ(hx2, hy2, 1.9 * bk), shade(sp.glove || sp.skin, -0.1), { s: 0.4, h: 0.2, lw: 0.8 });
    });

    // chân
    const leg = (side) => {
      const sgn = side ? 1 : -1, a = mv ? sgn * s * 0.55 : 0, lift = mv ? Math.max(0, sgn * c) * 2.6 : 0;
      const hipX = (side ? 2.2 : -2.2) * bk, fx = hipX * 0.7 + Math.sin(a) * LL * 0.95, fy = -lift;
      const kx = (hipX + fx) / 2 + 1.2 + lift * 0.5, ky = (hipY + fy) / 2 - lift * 0.3;
      const col = side ? sp.legs : shade(sp.legs, -0.16), bc = side ? sp.boots : shade(sp.boots, -0.14);
      limb(g, [hipX, hipY, kx, ky, fx, fy - 2.4], 3.8 * Math.min(bk, 1.5), col);
      F(g, g2 => { g2.moveTo(fx - 2.4 * bk, fy - 3.8); g2.lineTo(fx + 1.2 * bk, fy - 4.2); g2.quadraticCurveTo(fx + 4.4 * bk, fy - 2.2, fx + 4.2 * bk, fy + 0.2); g2.lineTo(fx - 2.6 * bk, fy + 0.3); g2.closePath(); }, bc, { s: 0.9, h: 0.5, lw: 0.9 });
    };
    leg(0); leg(1);

    up(() => {
      if (sp.skirt) F(g, g2 => { g2.moveTo(-hw - 0.5, hipY - 1.5); g2.lineTo(hw + 0.5, hipY - 1.5); g2.lineTo(hw + 2 + (mv ? s * 0.6 : 0), hipY + 4.6); g2.lineTo(-hw - 2 + (mv ? s * 0.6 : 0), hipY + 4.6); g2.closePath(); }, sp.skirt, { s: 1.2, h: 0.5, lw: 0.9 });
      F(g, g2 => { g2.moveTo(-hw, hipY + 1); g2.lineTo(-cw, chestY + 3.5); g2.quadraticCurveTo(-cw + 0.5, chestY - 0.6, 0, chestY - 0.8); g2.quadraticCurveTo(cw - 0.5, chestY - 0.6, cw, chestY + 3.5); g2.lineTo(hw, hipY + 1); g2.quadraticCurveTo(0, hipY + 2.6, -hw, hipY + 1); g2.closePath(); }, sp.top, { s: 2, h: 0.9 });
      if (sp.chestPlate) F(g, g2 => { g2.moveTo(-cw * 0.62, chestY + 1.6); g2.quadraticCurveTo(0, chestY - 0.2, cw * 0.72, chestY + 1.6); g2.quadraticCurveTo(cw * 0.75, chestY + TH * 0.6, 0.6, chestY + TH * 0.68); g2.quadraticCurveTo(-cw * 0.62, chestY + TH * 0.6, -cw * 0.62, chestY + 1.6); g2.closePath(); }, sp.chestPlate, { s: 1.2, h: 0.7, lw: 0.9 });
      if (sp.tabard) F(g, poly([-2.6, chestY + 2, 3.2, chestY + 2, 3.8, hipY + 6.5, 0.6, hipY + 8.2, -3.2, hipY + 6.5]), sp.tabard, { s: 1, h: 0.5, lw: 0.9 });
      if (sp.emblem) sp.emblem(g, 0.4, chestY + TH * 0.42);
      if (sp.ribs) { g.save(); g.globalAlpha = 0.9; for (let i = 0; i < 3; i++) { const yy = chestY + 3.2 + i * 2.6; g.strokeStyle = sp.ribs; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-cw * 0.55, yy); g.quadraticCurveTo(0.5, yy + 1.8, cw * 0.6, yy); g.stroke(); } line(g, 0.4, chestY + 1.4, 0.4, hipY, sp.ribs, 1); g.restore(); }
      if (sp.wrap) { g.save(); g.strokeStyle = sp.wrap; g.lineWidth = 1.1; g.globalAlpha = 0.9; for (let i = 0; i < 6; i++) { const yy = chestY + 1.5 + i * (TH * 0.17); g.beginPath(); g.moveTo(-cw * 0.9, yy + 2); g.lineTo(cw * 0.9, yy - 1.5); g.stroke(); } g.strokeStyle = 'rgba(60,40,20,0.35)'; g.lineWidth = 0.6; for (let i = 0; i < 6; i++) { const yy = chestY + 2.3 + i * (TH * 0.17); g.beginPath(); g.moveTo(-cw * 0.9, yy + 2); g.lineTo(cw * 0.9, yy - 1.5); g.stroke(); } g.restore(); }
      if (sp.cracks) { g.save(); const fl = 0.7 + Math.sin(t * 4) * 0.3; g.globalCompositeOperation = 'lighter'; g.globalAlpha = fl; g.strokeStyle = sp.cracks; g.lineWidth = 1.2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-cw * 0.5, chestY + 3); g.lineTo(-cw * 0.15, chestY + 6); g.lineTo(-cw * 0.35, chestY + 9); g.lineTo(0, hipY + 2);
        g.moveTo(cw * 0.55, chestY + 2); g.lineTo(cw * 0.2, chestY + 5.5); g.lineTo(cw * 0.45, chestY + 9); g.stroke(); K.glow(g, 0, chestY + TH * 0.45, cw * 1.3, sp.cracks, 0.28); g.restore(); }
      if (sp.collar) F(g, g2 => { g2.moveTo(-cw * 0.7, chestY + 0.6); g2.quadraticCurveTo(0, chestY + 4.2, cw * 0.75, chestY + 0.6); g2.quadraticCurveTo(0, chestY - 1.2, -cw * 0.7, chestY + 0.6); g2.closePath(); }, sp.collar, { s: 0.6, h: 0.4, lw: 0.9 });
      if (sp.belt) { F(g, K.P.rr(-hw - 0.4, hipY - 1.9, hw * 2 + 0.8, 2.6, 1), sp.belt, { s: 0.6, h: 0.3, lw: 0.9 }); F(g, K.P.rr(-0.6, hipY - 2.2, 2.6, 3.2, 0.6), '#f2c14e', { s: 0.3, h: 0.3, lw: 0.7 }); }
      if (sp.quiver) { g.save(); g.translate(-cw * 0.6, chestY + 3); g.rotate(-0.5); F(g, K.P.rr(-2, -4, 4, 12, 1.4), '#7a4a26', { s: 0.6, h: 0.3, lw: 0.9 }); for (let i = 0; i < 3; i++) line(g, -1 + i, -4, -1.5 + i * 1.2, -7.5, '#e8e2cc', 0.8); g.restore(); }
      if (sp.pauldron) for (const sd of [-1, 1]) F(g, g2 => { const px = sd * (cw - 0.8); g2.moveTo(px - 4 * bk, chestY + 3); g2.quadraticCurveTo(px - 3.4 * bk, chestY - 2.6, px + 0.4, chestY - 2.4); g2.quadraticCurveTo(px + 4.2 * bk, chestY - 1.6, px + 4 * bk, chestY + 3); g2.quadraticCurveTo(px, chestY + 1.6, px - 4 * bk, chestY + 3); g2.closePath(); }, sd < 0 ? shade(sp.pauldron, -0.12) : sp.pauldron, { s: 1.2, h: 0.6, lw: 0.9 });
      if (sp.spikes) for (const sd of [-1, 1]) F(g, poly([sd * (cw - 1) - 1.6, chestY - 1.8, sd * (cw - 1) + sd * 0.5, chestY - 6, sd * (cw - 1) + 1.6, chestY - 1.6]), '#c8ccd6', { s: 0.3, h: 0.3, lw: 0.7 });

      // đầu
      if (sp.ears === 'goblin' || sp.ears === 'orc') {
        const L2 = sp.ears === 'goblin' ? 1.25 : 0.7, droop = mv ? s * 0.6 : Math.sin(t * 2) * 0.3;
        F(g, poly([hx - R * 0.55, hy - R * 0.25, hx - R * (0.95 + L2), hy - R * (0.55 + L2 * 0.25) + droop, hx - R * 0.6, hy + R * 0.25]), sp.skin, { s: 0.8, h: 0.4, lw: 0.9 });
        F(g, poly([hx - R * 0.65, hy - R * 0.12, hx - R * (0.85 + L2 * 0.8), hy - R * (0.45 + L2 * 0.2) + droop, hx - R * 0.66, hy + R * 0.12]), '#e8a0a0', { s: 0, h: 0, lw: 0 });
      }
      const headP = c2 => { c2.moveTo(hx - R, hy); c2.bezierCurveTo(hx - R, hy - R * 1.36, hx + R, hy - R * 1.36, hx + R * 0.98, hy - R * 0.1);
        c2.bezierCurveTo(hx + R * 1.0, hy + R * 0.5, hx + R * (sp.jaw ? 0.9 : 0.62), hy + R * 0.98, hx + R * 0.18, hy + R * (sp.jaw ? 1.05 : 1.0));
        c2.bezierCurveTo(hx - R * 0.55, hy + R * 1.0, hx - R, hy + R * 0.62, hx - R, hy); c2.closePath(); };
      F(g, headP, sp.skin, { s: R * 0.16, h: R * 0.06, lw: 1 });
      if (sp.ears === 'elf') F(g, poly([hx - R * 0.5, hy - R * 0.05, hx - R * 1.7, hy - R * 0.85, hx - R * 0.55, hy + R * 0.4]), sp.skin, { s: 0.6, h: 0.3, lw: 0.9 });
      const ey = hy + R * 0.18, e1 = hx + R * 0.06, e2 = hx + R * 0.66;
      const ew = R * (sp.eyeW || 0.2), eh = R * (sp.eyeH || 0.3), mode = sp.eyeMode || 'cute';
      if (sp.blush) { K.glow(g, e1 - R * 0.05, ey + eh * 1.5, R * 0.36, '#ff7a8a', 0.5); K.glow(g, e2 + R * 0.12, ey + eh * 1.45, R * 0.26, '#ff7a8a', 0.45); }
      eye(g, e1, ey, ew, eh, sp.iris || '#3a7ad8', mode, blink, false);
      eye(g, e2, ey, ew, eh, sp.iris || '#3a7ad8', mode, blink, true);
      if (sp.brows) { const by = ey - eh * (mode === 'fierce' ? 1.0 : 1.45); line(g, e1 - ew * 1.2, by - (sp.brows > 1 ? 1.3 : 0.6), e1 + ew * 1.1, by + 0.5, INKC, 1.0); line(g, e2 - ew * 0.9, by + 0.5, e2 + ew * 1.1, by - (sp.brows > 1 ? 1.3 : 0.6), INKC, 1.0); }
      const mx = hx + R * 0.4, my = hy + R * 0.66, shout = atk && P.a > 0.3 && P.a < 0.8;
      if (sp.mouth === 'grin') { F(g, g2 => { g2.moveTo(mx - R * 0.42, my - R * 0.08); g2.quadraticCurveTo(mx, my + R * (shout ? 0.5 : 0.28), mx + R * 0.5, my - R * 0.15); g2.closePath(); }, '#5a1a24', { s: 0, h: 0, lw: 0.7 }); for (let i = 0; i < 3; i++) F(g, poly([mx - R * 0.3 + i * R * 0.27, my - R * 0.07, mx - R * 0.18 + i * R * 0.27, my + R * 0.12, mx - R * 0.06 + i * R * 0.27, my - R * 0.08]), '#fffbe8', { s: 0, h: 0, lw: 0.4 }); }
      else if (sp.tusks) { if (shout) F(g, ell(mx, my + R * 0.06, R * 0.25, R * 0.2), '#4a1420', { s: 0, h: 0, lw: 0.7 }); else line(g, mx - R * 0.3, my, mx + R * 0.32, my - R * 0.05, INKC, 0.8); for (const ox of [-0.32, 0.3]) F(g, poly([mx + R * ox - R * 0.09, my + R * 0.02, mx + R * ox, my - R * 0.42, mx + R * ox + R * 0.1, my + R * 0.02]), '#fff6dc', { s: 0, h: 0, lw: 0.6 }); }
      else if (shout) F(g, ell(mx, my, R * 0.16, R * 0.18), '#a03040', { s: 0, h: 0, lw: 0.6 });
      else { g.strokeStyle = shade(sp.skin, -0.55); g.lineWidth = 0.65; g.beginPath(); g.moveTo(mx - R * 0.17, my); g.quadraticCurveTo(mx, my + R * 0.1, mx + R * 0.18, my - R * 0.02); g.stroke(); }
      if (sp.teeth) { g.fillStyle = '#1a0e26'; g.fillRect(mx - R * 0.45, my - R * 0.1, R * 0.95, R * 0.34); g.fillStyle = sp.teeth; for (let i = 0; i < 5; i++) g.fillRect(mx - R * 0.42 + i * R * 0.2, my - R * 0.1, R * 0.12, R * 0.34); }
      if (sp.nose) F(g, poly([hx + R * 0.82, hy + R * 0.18, hx + R * 1.28, hy + R * 0.55, hx + R * 0.86, hy + R * 0.62]), shade(sp.skin, -0.06), { s: 0.4, h: 0, lw: 0.8 });
      if (sp.scar) line(g, e1 - R * 0.25, ey - eh * 1.8, e1 + R * 0.2, ey + eh * 1.6, shade(sp.skin, -0.45), 0.8);
      if (sp.beard) {
        F(g, g2 => { g2.moveTo(hx - R * 0.55, hy + R * 0.2); g2.quadraticCurveTo(hx + R * 0.2, hy + R * 0.55, hx + R * 1.0, hy + R * 0.25); g2.quadraticCurveTo(hx + R * 1.05, hy + R * 1.3, hx + R * 0.2, hy + R * 1.75); g2.quadraticCurveTo(hx - R * 0.6, hy + R * 1.2, hx - R * 0.55, hy + R * 0.2); g2.closePath(); }, sp.beard, { s: 1, h: 0.5, lw: 0.9 });
        line(g, mx - R * 0.25, my - R * 0.05, mx + R * 0.3, my - R * 0.08, shade(sp.beard, -0.5), 0.7);
      }
      if (sp.headWrap) { g.save(); g.beginPath(); headP(g); g.clip(); g.strokeStyle = sp.headWrap; g.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const yy = hy - R * 0.85 + i * R * 0.42; g.beginPath(); g.moveTo(hx - R * 1.1, yy + R * 0.2); g.lineTo(hx + R * 1.1, yy - R * 0.25); g.stroke(); } g.restore(); eye(g, e1, ey, ew, eh, sp.iris || '#3a7ad8', mode, blink, false); eye(g, e2, ey, ew, eh, sp.iris || '#3a7ad8', mode, blink, true); }
      hairFront(g, hx, hy, R, sp, sway);
      headgear(g, hx, hy, R, sp, t, sway);
    });

    if (sp.shield) up(() => {
      const ox = mv ? s * 0.6 : 0;
      shield(g, cw * 0.2 + ox - (atk && sg < 0 ? 1 : 0), chestY + TH * 0.6, (sp.shieldS || 1) * bk, sp.shield);
    });

    // tay trước + vũ khí
    up(() => {
      const sx = cw * 0.65, sy = shY;
      if (sp.weapon === 'bow') return bowArms(g, P, sp, sx, sy, bk);
      if (sp.weapon === 'staff') {
        const cast = atk ? Math.sin(Math.min(1, P.a) * Math.PI) : 0, hx2 = sx + 4.5 + cast * 2, hy2 = sy + 5.5 - cast * 7 + (mv ? s * 0.6 : 0);
        limb(g, [sx, sy, (sx + hx2) / 2 + 0.6, (sy + hy2) / 2 + 1.2, hx2, hy2], 3 * bk, sp.sleeve || sp.top);
        g.save(); g.translate(hx2, hy2 + 1); g.rotate(0.12 - cast * 0.3); staff(g, sp.orb || '#7fd4ff', cast, sp.staffCol || '#7a4c2a'); g.restore();
        F(g, circ(hx2, hy2, 2 * bk), sp.glove || sp.skin, { s: 0.4, h: 0.2, lw: 0.8 });
        return;
      }
      const walkA = mv ? s * 0.45 : 0;
      const A = atk ? (sg < 0 ? lerp(0.55, 3.3, -sg) : lerp(0.55, 1.65, sg)) : 0.55 + walkA;
      const phi = atk ? (sg < 0 ? lerp(0.3, -1.25, -sg) : lerp(0.3, 2.35, sg)) : 0.3 + walkA * 0.4 + (sp.restPhi || 0);
      const L = 8.8 * (sp.arm || 1) * bk;
      const elx = sx + Math.sin(A - 0.35) * L * 0.5, ely = sy + Math.cos(A - 0.35) * L * 0.5;
      const hx2 = sx + Math.sin(A) * L, hy2 = sy + Math.cos(A) * L;
      limb(g, [sx, sy, elx, ely, hx2, hy2], 3.4 * bk, sp.sleeve || sp.top);
      if (sp.bracer) F(g, circ((elx + hx2) / 2, (ely + hy2) / 2, 1.9 * bk), sp.bracer, { s: 0.5, h: 0.3, lw: 0.8 });
      g.save(); g.translate(hx2, hy2); g.rotate(phi); const ws = sp.wScale || 1; g.scale(ws, ws);
      const glow = atk ? Math.sin(Math.min(1, P.a) * Math.PI) : 0;
      if (sp.weaponGlow) K.glow(g, 0, -13, 16, sp.weaponGlow, 0.45 + glow * 0.4);
      (WEAPON[sp.weapon] || WEAPON.none)(g, sp.weaponCol || '#dfe6f0', glow); g.restore();
      F(g, circ(hx2, hy2, 2.2 * bk), sp.glove || sp.skin, { s: 0.5, h: 0.3, lw: 0.8 });
      if (atk && P.a > 0.36 && P.a < 0.8) {
        const k = 1 - Math.abs(P.a - 0.55) / 0.25, rr = (L + 17 * (sp.wScale || 1) * (sp.weapon === 'greatsword' ? 1.5 : 1));
        smear(g, sx, sy, rr, -1.7, 0.45, sp.smear || '#bfe8ff', Math.max(0, k) * 0.7, rr * 0.26);
      }
    });
  }

  function staff(g, orb, cast, wood) {
    limb(g, [0, 10, 0.5, -10, 0, -22], 1.8, wood);
    F(g, g2 => { g2.moveTo(-0.2, -21); g2.quadraticCurveTo(-5, -24, -3, -30); g2.quadraticCurveTo(-2.2, -26, 0.4, -25); g2.quadraticCurveTo(3, -26, 2.4, -30); g2.quadraticCurveTo(5, -24, 0.6, -21); g2.closePath(); }, '#c8a050', { s: 0.6, h: 0.4, lw: 0.8 });
    K.glow(g, 0, -27, 7 + cast * 8, orb, 0.75 + cast * 0.25);
    F(g, circ(0, -27, 2.8), orb, { s: 0.8, h: 0.8, lw: 0.8, light: '#ffffff' });
  }

  function bowArms(g, P, sp, sx, sy, bk) {
    const a = P.a, pull = a < 0 ? 0 : (a < 0.5 ? a / 0.5 : Math.max(0, 1 - (a - 0.5) / 0.12));
    const bx = sx + 8.4, by = sy + 1.2;
    limb(g, [sx, sy, sx + 4.2, sy + 1.4, bx, by], 3 * bk, sp.sleeve || sp.top);
    g.save(); g.translate(bx - 1, by);
    const bc = sp.bowCol || '#8a5a2a', path = c2 => { c2.moveTo(-1.5, -12.5); c2.quadraticCurveTo(5.5, -9, 2.4, 0); c2.quadraticCurveTo(5.5, 9, -1.5, 12.5); };
    g.lineCap = 'round'; g.beginPath(); path(g); g.strokeStyle = inkOf(bc); g.lineWidth = 3.4; g.stroke(); g.strokeStyle = bc; g.lineWidth = 1.8; g.stroke();
    g.strokeStyle = shade(bc, 0.45); g.lineWidth = 0.6; g.stroke();
    const px = -4 - pull * 7;
    g.strokeStyle = '#fbf3dc'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(-1.5, -12.5); g.lineTo(px, 0); g.lineTo(-1.5, 12.5); g.stroke();
    if (pull > 0.05 && a < 0.5) { line(g, px, 0, 9, 0, '#d9b878', 1.1); F(g, poly([8, -1.6, 12, 0, 8, 1.6]), '#e8edf2', { s: 0, h: 0, lw: 0.6 }); K.glow(g, 11, 0, 4 + pull * 3, sp.arrowGlow || '#bfffd0', pull * 0.7); }
    g.restore();
    const hx = bx - 1 + px;
    limb(g, [sx - 1.2, sy + 0.8, (sx + hx) / 2, by - 1.5, hx, by], 2.8 * bk, shade(sp.sleeve || sp.top, -0.05));
    F(g, circ(bx, by, 1.8), sp.glove || sp.skin, { s: 0.3, h: 0.2, lw: 0.7 });
    F(g, circ(hx, by, 1.7), sp.glove || sp.skin, { s: 0.3, h: 0.2, lw: 0.7 });
  }


  /* =====================================================
   * ĐỊNH NGHĨA NHÂN VẬT
   * 5 nhân vật trụ (theo bảng thiết kế): Con Người · Elf · Người Lùn · Phù Thủy · Orc
   * ===================================================== */
  const SKIN = '#ffe0c8', GOLD = '#f2c14e';

  /* ---- CON NGƯỜI (Trụ Thành): tóc nâu, giáp xanh-bạc, áo choàng xanh, kiếm + khiên chữ thập ---- */
  const HUMAN = [
    { skin: SKIN, hair: 'spiky', hairCol: '#6a4426', iris: '#3a7ad8', gear: 'cap', gearCol: '#8a6a44', top: '#8a7a5a', sleeve: '#6a7a9a', tabard: '#3d6fc0', legs: '#4a4a5a', boots: '#4a3020', belt: '#5a3a22', skirt: '#6a7a9a', weapon: 'sword', weaponCol: '#dfe6f0', shield: { col: '#b07a42', rim: '#6b4426', boss: true, mark: markCross }, blush: true },
    { skin: SKIN, hair: 'spiky', hairCol: '#6a4426', iris: '#3a7ad8', gear: 'helm', gearCol: '#aab4c4', top: '#8f9aae', sleeve: '#7d889c', tabard: '#3d6fc0', legs: '#3d4a66', boots: '#4a3020', belt: '#5a3a22', skirt: '#7d889c', weapon: 'sword', shield: { col: '#3d6fc0', rim: '#e6ebf2', mark: markCross }, blush: true },
    { skin: SKIN, hair: 'spiky', hairCol: '#6a4426', iris: '#3a7ad8', top: '#b9c2d2', chestPlate: '#d6dde8', sleeve: '#a0a9ba', tabard: '#2f5cb4', pauldron: '#d6dde8', legs: '#2f3d5c', boots: '#3a2a1c', belt: '#4a2e1a', skirt: '#a0a9ba', cape: '#2f5cb4', weapon: 'sword', shield: { col: '#2f5cb4', rim: GOLD, kite: true, mark: markCross }, blush: true },
    { skin: SKIN, hair: 'spiky', hairCol: '#6a4426', iris: '#3a7ad8', gear: 'circlet', gearCol: GOLD, gemCol: '#6ab0ff', top: '#dfe4ec', chestPlate: '#eef2f8', sleeve: '#c9d0dc', tabard: '#2a58c0', pauldron: GOLD, legs: '#2a3550', boots: '#c9d0dc', belt: '#8a5a22', skirt: '#c9d0dc', cape: '#2a4fb8', collar: GOLD, weapon: 'sword', weaponCol: '#f4f8ff', shield: { col: '#2a58c0', rim: GOLD, kite: true, mark: markCross }, bulk: 1.05, blush: true, bracer: GOLD }
  ];

  /* ---- ELF (Trụ Cung): tóc vàng dài, váy giáp xanh lá + vàng, tai nhọn, cung rồng, ống tên ---- */
  const ELF = tier => ({ skin: SKIN, hair: 'long', hairCol: tier > 2 ? '#fff0b0' : '#f2cc60', iris: '#2aa86a', ears: 'elf', gear: tier > 2 ? 'circlet' : null, gearCol: GOLD, gemCol: '#7fffd0',
    top: tier > 2 ? '#f2eedc' : '#3f8a4a', sleeve: tier > 2 ? '#e2dac0' : '#367a40', tabard: tier > 2 ? '#3f8a4a' : '#d8c070', legs: tier > 2 ? '#d8d0b8' : '#4a6a3a', boots: tier > 2 ? '#8a6a3a' : '#6b4a2a', belt: '#6b4a2a',
    weapon: 'bow', bowCol: tier > 2 ? '#e8c060' : '#8a5a2a', arrowGlow: tier > 3 ? '#bfffe8' : '#fff3c0', cape: tier > 1 ? (tier > 2 ? '#2f8a54' : '#2f7040') : null, quiver: true, blush: true, R: 9.4, glove: '#a8783a' });

  /* ---- PHÙ THỦY (Trụ Pháp): mũ nhọn tím, tóc bạc-tím dài, áo choàng tím viền vàng, trượng pha lê ---- */
  const MAGE = tier => {
    const robe = ['#4a3a98', '#5a3ab8', '#6a3ac8', '#7a42d8'][tier - 1];
    return { skin: SKIN, hair: 'long', hairCol: '#dcd4f2', iris: '#b07aff', gear: 'wizard', gearCol: robe, trim: GOLD,
      top: robe, sleeve: shade(robe, -0.08), tabard: GOLD, collar: tier > 1 ? '#f4f1e6' : null, legs: shade(robe, -0.2), boots: '#3a2a4a', skirt: shade(robe, -0.05), belt: '#4a2e5a',
      weapon: 'staff', orb: tier > 2 ? '#d8a8ff' : '#9ad8ff', cape: tier > 1 ? '#2a2060' : null, blush: true, R: 9.4, glove: '#f4f1e6' };
  };

  /* ---- NGƯỜI LÙN (Trụ Pháo): râu cam đỏ, kính phi công, giáp da nâu, đại pháo ---- */
  const DWARF = tier => ({ skin: '#f6c4a0', hair: 'none', iris: '#3a6ad8', gear: 'aviator', gearCol: '#6a4a30', top: tier > 1 ? '#4a3022' : '#6a4a30', sleeve: '#5a3a28', legs: '#4a3a2a', boots: '#2a1c14', belt: '#3a2418', beard: '#d0521e', weapon: 'hammer', weaponCol: '#8a8e9a',
    bulk: 1.28, leg: 8.5, torso: 11, R: 9.6, nose: true, brows: 1, blush: true, glove: '#3a2a22',
    chestPlate: tier > 1 ? '#8a6a44' : null, pauldron: tier > 2 ? '#8a8e9a' : null, spikes: tier > 3, cape: tier > 3 ? '#8a2a1a' : null, bracer: tier > 2 ? GOLD : null });

  /* ---- ORC (Trụ Thủ): da xanh olive, tóc đen, ngà, giáp da + vai đầu sói, rìu chiến ---- */
  const ORCT = tier => ({ skin: '#7aa22e', hair: 'spiky', hairCol: '#1a1418', iris: '#f2c030', eyeMode: 'fierce', eyeW: 0.22, eyeH: 0.3, ears: 'orc', brows: 2, tusks: true, jaw: true, scar: tier > 1,
    gear: tier === 2 ? 'bandana' : tier > 2 ? 'horned' : null, gearCol: tier === 2 ? '#a83a2a' : tier === 3 ? '#8a8a82' : GOLD,
    top: '#5a3a28', chestPlate: tier > 1 ? (tier > 2 ? '#8a8a82' : '#7a5a3a') : null, sleeve: '#6a9a28', tabard: tier > 1 ? '#a83a2a' : null, legs: '#4a3a2a', boots: '#3a2a1c', belt: '#2a1a14', skirt: '#e8e0cc',
    pauldron: tier > 1 ? '#8a8a82' : '#7a5a3a', spikes: tier > 2, weapon: 'axe', weaponCol: tier > 2 ? '#c8ccd4' : '#a8acb4', bulk: 1.28 + tier * 0.03, chest: 1.12, R: 9, hunch: 0.04, smear: '#ffd0a0', bracer: tier > 2 ? GOLD : '#7a5a3a', glove: '#3a2a22' });

  /* ---- ANH HÙNG: mỗi người một khung, trang bị đổi màu/hiệu ứng ---- */
  const HERO_BASE = {
    aldric: { skin: SKIN, hair: 'hero', hairCol: '#e6ecf6', iris: '#3aa0ff', top: '#2a4a9a', chestPlate: '#f2f5fa', sleeve: '#2a3a7a', collar: GOLD, pauldron: GOLD, legs: '#232a4a', boots: '#e8ecf4', belt: '#6a4420', skirt: '#2a4a9a', cape: '#1f3a8a', weapon: 'greatsword', weaponCol: '#eaf6ff', bulk: 1.08, blush: true, glove: '#3a3a5a', bracer: GOLD, smear: '#9fe0ff', R: 9.6,
      emblem: (g, x, y) => { F(g, poly([x, y - 2.6, x + 2.2, y, x, y + 2.6, x - 2.2, y]), '#4ac0ff', { s: 0.3, h: 0.4, lw: 0.6 }); } },
    lyra: { skin: SKIN, hair: 'long', hairCol: '#8af0c8', iris: '#2ab8a0', ears: 'elf', gear: 'circlet', gearCol: GOLD, gemCol: '#7fffd0', top: '#2a6a5a', sleeve: '#245a4c', tabard: '#f4f1e6', legs: '#d8d0b8', boots: '#6b4a2a', belt: '#6b4a2a',
      weapon: 'bow', bowCol: '#e8c060', arrowGlow: '#bfffe8', cape: '#2a8a6a', quiver: true, blush: true, R: 9.4, glove: '#8a5a2a', pauldron: '#3a8a7a' },
    selene: { skin: SKIN, hair: 'long', hairCol: '#e8f0ff', iris: '#5ab8ff', gear: 'wizard', gearCol: '#2a3a7a', trim: '#c8e0ff', top: '#2a3a7a', sleeve: '#243268', tabard: '#aee0ff', collar: '#f4f8ff', legs: '#1a2450', boots: '#2a2a4a', skirt: '#2a3a7a', belt: '#4a5a9a',
      weapon: 'staff', orb: '#aef0ff', staffCol: '#8aa0c8', cape: '#1a2860', blush: true, R: 9.4, glove: '#dfe8ff' },
    borin: { skin: '#f6c4a0', hair: 'none', iris: '#3a6ad8', gear: 'horned', gearCol: '#8a8e9a', beard: '#b83a1a', top: '#5a3a2a', chestPlate: '#8a8e9a', sleeve: '#4a3022', pauldron: '#c8903a', legs: '#3a2a22', boots: '#2a1c14', belt: '#4a2e1a', skirt: '#5a3a2a',
      weapon: 'warhammer', weaponCol: '#9aa0b0', bulk: 1.45, leg: 8.5, torso: 11, R: 9.6, nose: true, brows: 2, glove: '#3a2a22', bracer: '#c8903a', cape: '#8a2a1a', spikes: true }
  };
  const HERO_H = { aldric: 48, lyra: 44, selene: 46, borin: 40 };
  /** Trang bị → spec: tiers = [vũ khí, găng, giáp, giày] mỗi ô 0..3 */
  function heroSpec(id, tiers) {
    const sp = Object.assign({}, HERO_BASE[id]), E = window.CONFIG.equipment, w = tiers[0], gl = tiers[1], ar = tiers[2], bo = tiers[3];
    if (w > 0) {
      const it = E.weapon.items[w - 1];
      if (sp.weapon === 'bow') sp.bowCol = it.col; else if (sp.weapon === 'staff') { sp.staffCol = it.col; sp.orb = w === 3 ? '#fff0a0' : w === 2 ? '#e8f4ff' : sp.orb; } else sp.weaponCol = it.col;
      if (it.glow) sp.weaponGlow = it.glow;
    }
    if (gl > 0) { const it = E.gloves.items[gl - 1]; sp.glove = it.col; if (gl > 1) sp.bracer = gl === 3 ? GOLD : '#c8d0dc'; }
    if (ar > 0) { const it = E.armor.items[ar - 1]; if (!sp.chestPlate || id !== 'aldric') sp.chestPlate = it.col; if (ar > 1) sp.pauldron = ar === 3 ? GOLD : it.col; if (ar === 3) sp.collar = GOLD; }
    if (bo > 0) sp.boots = E.boots.items[bo - 1].col;
    return sp;
  }

  const ENEMY = {
    goblin: { skin: '#8cc04a', hair: 'none', iris: '#ffd23a', eyeMode: 'slit', eyeW: 0.24, eyeH: 0.32, ears: 'goblin', brows: 2, mouth: 'grin', nose: true, gear: 'bandana', gearCol: '#c8382a',
      top: '#8a5a34', sleeve: '#8cc04a', legs: '#8cc04a', boots: '#5a3a1a', belt: '#4a2e1a', skirt: '#6a4a2a', weapon: 'dagger', weaponCol: '#c8ccd6', R: 10.2, leg: 8, torso: 9.5, bulk: 0.88, hunch: 0.08 },
    orc: { skin: '#5f7f50', hair: 'tuft', hairCol: '#1a1a1a', iris: '#ff3a2a', eyeMode: 'fierce', eyeW: 0.22, eyeH: 0.3, ears: 'orc', brows: 2, tusks: true, jaw: true, gear: 'helm', gearCol: '#4a4a56',
      top: '#3a3440', chestPlate: '#4a4452', sleeve: '#5f7f50', tabard: '#8a1a22', legs: '#3a3036', boots: '#2a1e14', belt: '#2a1a1a', skirt: '#4a3a3a', pauldron: '#5a5a66', spikes: true, weapon: 'cleaver', weaponCol: '#aab0bc', bulk: 1.18, chest: 1.12, R: 9, scar: true, hunch: 0.05, smear: '#ffd0a0' },
    orcArcher: { skin: '#6a8a4a', hair: 'tuft', hairCol: '#1a1810', iris: '#ff5a2a', eyeMode: 'fierce', eyeW: 0.22, eyeH: 0.3, ears: 'orc', brows: 2, tusks: true, gear: 'hood', gearCol: '#3a2a3a',
      top: '#4a3a3a', sleeve: '#6a8a4a', legs: '#3a3036', boots: '#2a1e14', belt: '#2a1a1a', skirt: '#3a2a3a', weapon: 'bow', bowCol: '#4a2a1a', arrowGlow: '#ff8a5a', quiver: true, bulk: 1.05, R: 9 },
    blackOrc: { skin: '#4a6040', hair: 'none', iris: '#ff2a1a', eyeMode: 'glow', eyeW: 0.24, eyeH: 0.3, ears: 'orc', brows: 2, tusks: true, jaw: true, gear: 'horned', gearCol: '#3a3a48',
      top: '#2e2e3a', chestPlate: '#454556', sleeve: '#3a3a48', tabard: '#8a1a1a', legs: '#26222a', boots: '#3a3a48', belt: '#1a1418', skirt: '#3a3a48', pauldron: '#3a3a48', spikes: true,
      weapon: 'axe', weaponCol: '#8a909c', shield: { col: '#3a3a48', rim: '#a02020', kite: true, mark: markSkull }, bulk: 1.3, chest: 1.12, R: 9, smear: '#ff8a6a' },
    troll: { skin: '#8aa0a8', hair: 'tuft', hairCol: '#4a5a3a', iris: '#ffc43a', eyeMode: 'fierce', eyeW: 0.2, eyeH: 0.28, brows: 2, tusks: true, jaw: true, nose: true,
      top: '#7a9098', sleeve: '#8aa0a8', legs: '#7a9098', boots: '#5a6a70', belt: '#5a3a22', skirt: '#7a5a3a', weapon: 'club', weaponCol: '#8a5a32', bulk: 1.75, chest: 1.18, R: 8.2, leg: 10, torso: 15, arm: 1.3, wScale: 1.25, hunch: 0.14, headX: 2.5, smear: '#e8dcc0' },
    trollKing: { skin: '#7890a8', hair: 'none', iris: '#ff5a2a', eyeMode: 'glow', eyeW: 0.22, eyeH: 0.3, brows: 2, tusks: true, jaw: true, nose: true, gear: 'crown',
      top: '#5a6e86', chestPlate: '#6a7e96', sleeve: '#7890a8', legs: '#5a6e86', boots: '#4a5a6a', belt: '#3a2418', skirt: '#7a1a2a', tabard: '#7a1a2a', pauldron: GOLD, spikes: true, cape: '#5a1020',
      weapon: 'pillar', weaponCol: '#7a7480', bulk: 1.95, chest: 1.2, R: 8.4, leg: 10.5, torso: 16, arm: 1.35, wScale: 1.45, hunch: 0.1, headX: 2.5, smear: '#ffb080',
      emblem: (g, x, y) => { K.glow(g, x, y, 5, '#ff6a2a', 0.8); F(g, poly([x, y - 2.6, x + 2, y, x, y + 2.6, x - 2, y]), '#ff8a3a', { s: 0, h: 0.4, lw: 0.6 }); } },
    /* ---- quái theo vùng ---- */
    treant: { skin: '#7a5a38', hair: 'none', iris: '#9aff6a', eyeMode: 'glow', eyeW: 0.22, eyeH: 0.3, brows: 2, jaw: true, gear: 'leaves', gearCol: '#4f9a3a', top: '#6a4a2c', sleeve: '#7a5a38', legs: '#6a4a2c', boots: '#4a3420', belt: '#3a6a2a', skirt: '#4f8a3a', pauldron: '#4f9a3a',
      weapon: 'club', weaponCol: '#6a4a2c', bulk: 1.7, chest: 1.2, R: 8.4, leg: 10, torso: 15, arm: 1.3, wScale: 1.25, hunch: 0.12, headX: 2.5, smear: '#a8e070', mouth: 'grin' },
    skeleton: { skin: '#e8e2d0', hair: 'none', iris: '#6af0d0', eyeMode: 'glow', eyeW: 0.24, eyeH: 0.3, teeth: '#f4eed8', gear: 'helm', gearCol: '#6a6a78', top: '#d8d0bc', chestPlate: '#5a5a6a', ribs: '#8a8478', sleeve: '#e8e2d0', legs: '#e8e2d0', boots: '#8a8478', belt: '#4a3a2a', skirt: '#3a2a4a', tabard: '#3a2a4a',
      weapon: 'bone', weaponCol: '#dcd6c0', shield: { col: '#4a4a58', rim: '#8a8478', kite: true, mark: markSkull }, bulk: 0.98, R: 9.2, smear: '#aef0e0' },
    deathKnight: { skin: '#8a90a8', hair: 'none', iris: '#6ae0ff', eyeMode: 'glow', eyeW: 0.24, eyeH: 0.3, gear: 'knight', gearCol: '#2a2a3a', plumeCol: '#6a4ae0', top: '#1e1e2a', chestPlate: '#34344a', sleeve: '#2a2a3a', pauldron: '#34344a', spikes: true, legs: '#1a1a24', boots: '#2a2a3a', tabard: '#4a2a7a', cape: '#3a1a5a',
      belt: '#1a1418', skirt: '#2a2a3a', weapon: 'greatsword', weaponCol: '#8a9ac8', bulk: 1.38, chest: 1.15, R: 9, wScale: 0.92, smear: '#a08aff' },
    bandit: { skin: '#e0b48a', hair: 'spiky', hairCol: '#2a1a10', iris: '#3a2a1a', eyeMode: 'fierce', eyeW: 0.2, eyeH: 0.28, brows: 2, mouth: 'grin', gear: 'bandana', gearCol: '#e8e0c8', top: '#8a5a3a', sleeve: '#e8d8b0', legs: '#c8b080', boots: '#6a4a2a', belt: '#a83a2a', skirt: '#a83a2a',
      weapon: 'scimitar', weaponCol: '#e0e4ec', bulk: 0.98, R: 9.2, scar: true, smear: '#fff0c0' },
    mummy: { skin: '#d8c8a0', hair: 'none', iris: '#5aff9a', eyeMode: 'glow', eyeW: 0.22, eyeH: 0.28, wrap: '#ece0c0', headWrap: '#e8dcb8', top: '#d8c8a0', sleeve: '#d8c8a0', legs: '#d8c8a0', boots: '#c8b890', belt: '#8a6a3a', cape: '#cdbf98',
      weapon: 'none', bulk: 1.15, arm: 1.15, R: 9, hunch: 0.1, leg: 11, smear: '#e8dcb8' },
    iceGolem: { skin: '#9ad8f0', hair: 'none', iris: '#e8ffff', eyeMode: 'glow', eyeW: 0.24, eyeH: 0.3, brows: 2, jaw: true, gear: 'horns', gearCol: '#d8f4ff', top: '#7ac0e0', chestPlate: '#bfe8fa', sleeve: '#8ad0ee', legs: '#7ac0e0', boots: '#5aa0c8', belt: '#5a90b8', skirt: '#9ad8f0', pauldron: '#d8f4ff', spikes: true, cracks: '#aef0ff',
      weapon: 'none', bulk: 1.9, chest: 1.2, R: 8.4, leg: 10, torso: 15.5, arm: 1.35, hunch: 0.1, headX: 2.5, smear: '#d8f4ff' },
    imp: { skin: '#d83a2a', hair: 'none', iris: '#ffd23a', eyeMode: 'slit', eyeW: 0.25, eyeH: 0.32, ears: 'goblin', brows: 2, mouth: 'grin', teeth: '#fff4d0', gear: 'flame', wings: '#a82020', top: '#7a1a1a', sleeve: '#d83a2a', legs: '#d83a2a', boots: '#4a1a14', belt: '#3a1010', skirt: '#7a1a1a',
      weapon: 'dagger', weaponCol: '#ffb04a', R: 10, leg: 7, torso: 8.5, bulk: 0.82, float: 14, smear: '#ffb04a' },
    magmaGolem: { skin: '#4a3a3a', hair: 'none', iris: '#ffd23a', eyeMode: 'glow', eyeW: 0.24, eyeH: 0.3, brows: 2, jaw: true, gear: 'horns', gearCol: '#2a2020', top: '#3a2c2c', chestPlate: '#5a4a48', sleeve: '#4a3a3a', legs: '#3a2c2c', boots: '#2a2020', belt: '#6a3a1a', skirt: '#3a2c2c', pauldron: '#6a5a58', spikes: true, cracks: '#ff7a2a',
      weapon: 'none', bulk: 2.0, chest: 1.2, R: 8.6, leg: 10, torso: 16, arm: 1.4, hunch: 0.1, headX: 2.5, smear: '#ff9a4a' },
    voidling: { skin: '#6a4aa8', hair: 'none', iris: '#ff6aff', eyeMode: 'glow', eyeW: 0.24, eyeH: 0.3, ears: 'goblin', brows: 2, teeth: '#e8d8ff', gear: 'horns', gearCol: '#3a2a5a', top: '#2a1e4a', sleeve: '#6a4aa8', legs: '#2a1e4a', boots: '#1a1230', belt: '#4a2a7a', skirt: '#2a1e4a', cracks: '#c880ff',
      weapon: 'dagger', weaponCol: '#c8a0ff', R: 9.8, leg: 8.5, torso: 10, bulk: 0.9, hunch: 0.06, smear: '#d8b0ff' },
    voidWalker: { skin: '#8a6ad8', hair: 'long', hairCol: '#1a1030', iris: '#ff8aff', eyeMode: 'glow', eyeW: 0.22, eyeH: 0.3, gear: 'horned', gearCol: '#3a2a68', top: '#241640', chestPlate: '#3a2a68', sleeve: '#2c1e54', legs: '#241640', boots: '#1a1230', belt: '#5a3aa0', skirt: '#241640', pauldron: '#5a3aa0', spikes: true, cape: '#2a1a4a', cracks: '#c880ff',
      weapon: 'staff', orb: '#d890ff', staffCol: '#3a2a68', bulk: 1.15, R: 9, leg: 12, smear: '#d8b0ff' },
    voidLord: { skin: '#5a3a98', hair: 'none', iris: '#ff5aff', eyeMode: 'glow', eyeW: 0.22, eyeH: 0.3, brows: 2, tusks: true, jaw: true, gear: 'horned', gearCol: '#2a1a4a', top: '#1e1038', chestPlate: '#3a2268', sleeve: '#4a2a88', legs: '#1e1038', boots: '#2a1a4a', belt: '#6a3aa0', skirt: '#4a1a6a', tabard: '#4a1a6a', pauldron: '#b070ff', spikes: true, cape: '#4a1a6a', cracks: '#d890ff',
      weapon: 'pillar', weaponCol: '#6a4ab0', bulk: 2.0, chest: 1.2, R: 8.4, leg: 10.5, torso: 16, arm: 1.35, wScale: 1.45, hunch: 0.1, headX: 2.5, smear: '#e0a0ff',
      emblem: (g, x, y) => { K.glow(g, x, y, 6, '#d070ff', 0.9); F(g, poly([x, y - 2.8, x + 2.2, y, x, y + 2.8, x - 2.2, y]), '#f0a0ff', { s: 0, h: 0.4, lw: 0.6 }); } }
  };
  /* ---------------- Sói Warg ---------------- */
  function warg(g, P, pal) {
    pal = pal || {};
    const mv = P.w >= 0, ph = mv ? P.w * TAU : 0, t = P.t || 0;
    const bob = mv ? Math.sin(ph * 2) * 1.4 : Math.sin(t * 2.4) * 0.4;
    const F1 = pal.f1 || '#6a5a6a', FD = pal.fd || '#4a3c4c', BELLY = pal.belly || '#b8a8b0', bite = P.a >= 0 ? Math.sin(Math.min(1, P.a * 1.3) * Math.PI) : 0;
    const lunge = bite * 3;
    shadowE(g, 20, 4.4);
    g.save(); g.translate(lunge, 0);
    const legF = (x, off, col) => { const a = mv ? Math.sin(ph + off) * 0.75 : 0, l = mv ? Math.max(0, Math.cos(ph + off)) * 3 : 0;
      const fx = x + Math.sin(a) * 9, fy = -l;
      limb(g, [x, -12 + bob, x + Math.sin(a) * 4 + 1.5, -6.5 - l * 0.4, fx, fy - 1.6], 3.6, col);
      F(g, ell(fx + 1.3, fy - 1, 2.8, 1.7), shade(col, -0.18), { s: 0.4, h: 0.2, lw: 0.8 }); };
    legF(9, 2.4, FD); legF(-11, 0.6, FD);
    const tw = mv ? Math.sin(ph * 2) * 2 : Math.sin(t * 3) * 1.5;
    F(g, g2 => { g2.moveTo(-14, -19 + bob); g2.quadraticCurveTo(-24, -24 + bob + tw, -30, -18 + bob + tw * 1.4); g2.quadraticCurveTo(-24, -17 + bob, -15, -14 + bob); g2.closePath(); }, F1, { s: 1.2, h: 0.6 });
    F(g, g2 => { g2.moveTo(-17, -13 + bob); g2.quadraticCurveTo(-20, -24 + bob, -6, -26 + bob); g2.quadraticCurveTo(8, -29 + bob, 15, -22 + bob); g2.quadraticCurveTo(17, -13 + bob, 8, -10 + bob); g2.quadraticCurveTo(-4, -8 + bob, -17, -13 + bob); g2.closePath(); }, F1, { s: 2.4, h: 1 });
    F(g, g2 => { g2.moveTo(-10, -11 + bob); g2.quadraticCurveTo(0, -8.5 + bob, 9, -11 + bob); g2.quadraticCurveTo(2, -13 + bob, -10, -11 + bob); g2.closePath(); }, BELLY, { s: 0, h: 0, lw: 0.6 });
    for (let i = 0; i < 6; i++) F(g, poly([-13 + i * 4.6, -25 + bob - i * 0.3, -10.5 + i * 4.6, -31 + bob - (i % 2) * 2 - i * 0.4, -8 + i * 4.6, -25.5 + bob - i * 0.4]), FD, { s: 0, h: 0, lw: 0.8 });
    legF(7, 0, F1); legF(-9, 3, F1);
    const hb = bob - lunge * 0.2;
    F(g, g2 => { g2.moveTo(12, -15 + hb + bite); g2.lineTo(25, -15 + hb + bite * 3); g2.lineTo(24.5, -12.5 + hb + bite * 3); g2.lineTo(13, -11 + hb); g2.closePath(); }, '#d8c8c8', { s: 0.5, h: 0.3, lw: 0.8 });
    if (bite > 0.1) { g.fillStyle = '#5a1a24'; g.beginPath(); g.moveTo(14, -15 + hb); g.lineTo(25, -16.5 + hb - bite); g.lineTo(25, -15 + hb + bite * 3); g.closePath(); g.fill(); }
    F(g, g2 => { g2.moveTo(9, -24 + hb); g2.quadraticCurveTo(13, -31 + hb, 19, -27 + hb - bite); g2.lineTo(27, -20 + hb - bite); g2.quadraticCurveTo(28, -16.5 + hb - bite, 24, -16 + hb - bite); g2.lineTo(13, -15 + hb); g2.quadraticCurveTo(8, -17 + hb, 9, -24 + hb); g2.closePath(); }, F1, { s: 1.8, h: 0.8 });
    F(g, poly([11, -27 + hb, 12.5, -35 + hb, 16, -28.5 + hb]), FD, { s: 0.6, h: 0.3, lw: 0.8 });
    F(g, poly([13.5, -28 + hb, 16, -34 + hb, 18, -27.5 + hb]), F1, { s: 0.6, h: 0.3, lw: 0.8 });
    dot(g, 27.2, -19.6 + hb - bite, 1.3, INKC);
    eye(g, 18.6, -23.2 + hb, 1.6, 1.6, pal.eye || '#ffb030', 'glow', false, false);
    for (const x of [17, 21]) F(g, poly([x, -16.3 + hb, x + 1.2, -16.3 + hb, x + 0.6, -13.6 + hb]), '#ffffff', { s: 0, h: 0, lw: 0.4 });
    g.restore();
  }

  /* ---------------- Bóng ma bay ---------------- */
  function wraith(g, P) {
    const t = P.t || 0, ph = P.w >= 0 ? P.w * TAU : t * 2, fly = -15 + Math.sin(ph) * 2.4, a = P.a;
    shadowE(g, 10, 3, 0.25);
    const wv = Math.sin(t * 5 + ph) * 1.8, wv2 = Math.cos(t * 4.3 + ph) * 1.8;
    g.save(); g.globalAlpha *= 0.94;
    K.glow(g, 0, fly - 14, 22, '#8a5aff', 0.35);
    F(g, g2 => { g2.moveTo(-10, fly - 10); g2.quadraticCurveTo(-11, fly - 26, 1, fly - 30); g2.quadraticCurveTo(11, fly - 27, 11, fly - 10);
      g2.lineTo(9 + wv, fly + 6); g2.lineTo(5, fly + 1); g2.lineTo(2 - wv2, fly + 9); g2.lineTo(-1.5, fly + 1.5); g2.lineTo(-5 + wv, fly + 7); g2.lineTo(-7, fly); g2.lineTo(-12 + wv2, fly + 3); g2.closePath(); },
      '#4a3a78', { s: 2.4, h: 1, dark: '#22163e' });
    F(g, g2 => { g2.moveTo(-5.5, fly - 15); g2.quadraticCurveTo(-6, fly - 26, 2, fly - 27); g2.quadraticCurveTo(9.5, fly - 25, 8.5, fly - 14); g2.quadraticCurveTo(2, fly - 10, -5.5, fly - 15); g2.closePath(); }, '#140c24', { s: 0, h: 0, lw: 0.8 });
    eye(g, 0.6, fly - 19, 1.5, 1.9, '#b8f0ff', 'glow', false, false);
    eye(g, 5.4, fly - 19, 1.3, 1.7, '#b8f0ff', 'glow', false, false);
    g.strokeStyle = '#9aa0b8'; g.lineWidth = 0.8; for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(-6 + i * 3.2, fly - 8 + Math.sin(i + t * 3) * 0.6, 1.4, 0.9, 0, 0, TAU); g.stroke(); }
    const r = a >= 0 ? K.swing(a) : 0, ang = r < 0 ? lerp(0.3, -1.4, -r) : lerp(0.3, 1.9, r);
    g.save(); g.translate(7, fly - 14); g.rotate(ang);
    limb(g, [0, 0, 4, 4], 2.2, '#3a2c64');
    g.save(); g.translate(4, 4); limb(g, [0, 9, 0, -14], 1.3, '#5a4a3a');
    F(g, g2 => { g2.moveTo(0, -14); g2.quadraticCurveTo(10, -16, 14, -9); g2.quadraticCurveTo(8, -12, 0.4, -11.5); g2.closePath(); }, '#d8e0f0', { s: 0.6, h: 0.4, lw: 0.8 });
    g.restore(); g.restore();
    if (a >= 0.38 && a < 0.8) smear(g, 7, fly - 14, 20, -1.0, 1.2, '#b8a8ff', 0.7 * (1 - Math.abs(a - 0.58) / 0.22), 5);
    g.restore();
  }


  /* ---------------- Bọ cạp cát ---------------- */
  function scorpion(g, P) {
    const mv = P.w >= 0, ph = mv ? P.w * TAU : 0, t = P.t || 0, a = P.a;
    const bob = mv ? Math.sin(ph * 2) * 0.7 : Math.sin(t * 2.4) * 0.3;
    const sting = a >= 0 ? Math.sin(Math.min(1, a * 1.2) * Math.PI) : 0;
    const C = '#c8782a', CD = '#8a4a1a';
    shadowE(g, 19, 4.4);
    for (let i = 0; i < 4; i++) for (const side of [0, 1]) {
      const sw = mv ? Math.sin(ph + i * 1.57 + side * 0.9) * 3.2 : 0, x0 = -8 + i * 5, col = side ? shade(CD, 0.1) : shade(CD, -0.25);
      limb(g, [x0, -7 + bob, x0 + (side ? 5 : -4) + sw, -10 + bob, x0 + (side ? 8 : -7) + sw * 1.5, -0.5], 1.7, col);
    }
    const tw = Math.sin(t * 3) * 1.1 + (mv ? Math.sin(ph * 2) * 1.2 : 0);
    const tail = [[-14, -10 + bob], [-23, -13 + bob], [-27, -22 + tw * 0.3], [-21, -30 + tw * 0.6 + sting * 2], [-11 + sting * 14, -33 + tw + sting * 6]];
    for (let i = 0; i < tail.length - 1; i++) limb(g, [tail[i][0], tail[i][1], tail[i + 1][0], tail[i + 1][1]], 5.2 - i * 0.7, i % 2 ? shade(C, -0.08) : C);
    const tp = tail[4];
    K.glow(g, tp[0] + 4, tp[1] + 3, 6 + sting * 5, '#9aff6a', 0.5 + sting * 0.4);
    F(g, poly([tp[0] - 2, tp[1] - 2.5, tp[0] + 7, tp[1] + 4.5, tp[0] - 1.5, tp[1] + 2.5]), '#f4e6c8', { s: 0.3, h: 0.3, lw: 0.8 });
    F(g, ell(-3, -9 + bob, 15, 8), C, { s: 2.2, h: 1.1, lw: 1.1 });
    g.strokeStyle = 'rgba(70,30,10,0.55)'; g.lineWidth = 0.9;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-11 + i * 5.2, -15 + bob); g.quadraticCurveTo(-10 + i * 5.2, -9 + bob, -11 + i * 5.2, -2.5 + bob); g.stroke(); }
    F(g, ell(11, -10 + bob, 7.5, 6), shade(C, 0.06), { s: 1.4, h: 0.8, lw: 1 });
    for (const sd of [-1, 1]) {
      const cy = -9 + bob + sd * 3.2;
      limb(g, [15, cy, 21, cy - 1 + sd * 2], 3.2, CD);
      F(g, g2 => { g2.moveTo(20, cy - 3 + sd * 2); g2.quadraticCurveTo(28, cy - 6 + sd * 2, 29, cy + 1 + sd * 2); g2.quadraticCurveTo(26, cy + 1 + sd * 2, 21, cy + 3 + sd * 2); g2.closePath(); }, C, { s: 1, h: 0.6, lw: 0.9 });
    }
    dot(g, 13, -13 + bob, 1.3, '#ff4a2a'); dot(g, 15.5, -12 + bob, 1.1, '#ff4a2a');
  }

  /* ---------------- Rồng lửa bay ---------------- */
  function drake(g, P) {
    const t = P.t || 0, ph = P.w >= 0 ? P.w * TAU : t * 2.4, fly = -34 + Math.sin(ph * 0.5) * 2.5, a = P.a, br = a >= 0 ? Math.sin(Math.min(1, a) * Math.PI) : 0;
    const R = '#c8381e', RD = '#7a1a10', BEL = '#f2c068';
    shadowE(g, 14, 3.4, 0.22);
    const wing = far => {
      const fa = Math.sin(ph) * 0.7 - 0.1;
      g.save(); g.translate(far ? -3 : 1, fly - 8); g.rotate(-0.35 + fa * (far ? 0.85 : 1));
      const col = far ? shade(RD, -0.15) : RD;
      F(g, g2 => { g2.moveTo(0, 0); g2.lineTo(-5, -17); g2.lineTo(-11, -31); g2.quadraticCurveTo(-17, -21, -21, -27); g2.quadraticCurveTo(-23, -12, -30, -15); g2.quadraticCurveTo(-26, -3, -35, -3); g2.quadraticCurveTo(-18, 5, -6, 7); g2.closePath(); }, col, { s: 1.4, h: 0.6, lw: 0.9, light: shade(col, 0.4) });
      line(g, 0, 0, -11, -31, shade(R, -0.1), 1.4); line(g, 0, 0, -21, -27, shade(R, -0.1), 1.1); line(g, 0, 0, -30, -15, shade(R, -0.1), 1);
      g.restore();
    };
    wing(true);
    const tw = Math.sin(t * 3) * 3 + Math.sin(ph) * 1.5;
    F(g, g2 => { g2.moveTo(-8, fly - 2); g2.quadraticCurveTo(-20, fly + 4 + tw * 0.4, -29, fly + 7 + tw); g2.lineTo(-33, fly + 3 + tw); g2.lineTo(-34, fly + 11 + tw); g2.lineTo(-28, fly + 10 + tw); g2.quadraticCurveTo(-18, fly + 9, -7, fly + 3); g2.closePath(); }, R, { s: 1.6, h: 0.8, lw: 1 });
    for (const lx of [-3, 7]) limb(g, [lx, fly + 3, lx + 2, fly + 9, lx + 5, fly + 11], 2.4, shade(R, -0.18));
    F(g, g2 => { g2.moveTo(-11, fly - 1); g2.quadraticCurveTo(-11, fly - 12, 2, fly - 12); g2.quadraticCurveTo(14, fly - 12, 15, fly - 2); g2.quadraticCurveTo(9, fly + 8, -3, fly + 7); g2.quadraticCurveTo(-11, fly + 6, -11, fly - 1); g2.closePath(); }, R, { s: 2.2, h: 1, lw: 1.1 });
    F(g, g2 => { g2.moveTo(-6, fly + 3); g2.quadraticCurveTo(2, fly + 7, 11, fly + 1); g2.quadraticCurveTo(3, fly + 9, -6, fly + 3); g2.closePath(); }, BEL, { s: 0, h: 0, lw: 0.6 });
    for (let i = 0; i < 4; i++) F(g, poly([-8 + i * 5, fly - 11, -6 + i * 5, fly - 15, -4 + i * 5, fly - 11]), RD, { s: 0, h: 0, lw: 0.7 });
    limb(g, [10, fly - 6, 16, fly - 13, 20, fly - 18], 6.4, R);
    const hb = -br * 1.5;
    F(g, g2 => { g2.moveTo(17, fly - 22); g2.quadraticCurveTo(24, fly - 26, 30, fly - 21 + hb); g2.quadraticCurveTo(34, fly - 18 + hb, 31, fly - 15 + hb); g2.lineTo(22, fly - 14); g2.quadraticCurveTo(15, fly - 15, 17, fly - 22); g2.closePath(); }, R, { s: 1.4, h: 0.8, lw: 1 });
    F(g, poly([18, fly - 22, 12, fly - 29, 22, fly - 24]), '#f4e6c8', { s: 0.3, h: 0.3, lw: 0.7 });
    F(g, poly([22, fly - 24, 19, fly - 31, 27, fly - 24]), '#f4e6c8', { s: 0.3, h: 0.3, lw: 0.7 });
    eye(g, 24, fly - 20, 1.7, 1.7, '#ffe03a', 'glow', false, false);
    if (br > 0.1) { K.glow(g, 33, fly - 14, 12 + br * 10, '#ff8a2a', br); F(g, poly([31, fly - 15, 42, fly - 12 - br * 2, 36, fly - 9, 31, fly - 12]), '#ffd84a', { s: 0, h: 0, lw: 0 }); }
    wing(false);
  }

  /* =====================================================
   * ĐĂNG KÝ – chiều cao mục tiêu (đv thế giới, khi scale = 1)
   * ===================================================== */
  function designHeight(sp) { const R = sp.R || 9.2; return (sp.leg || 11.5) + (sp.torso || 12.5) + (sp.neck || 0.6) + R * 0.92 + R * 1.3; }
  const reg = {};
  const radius = k => (window.CONFIG && CONFIG.enemies[k]) ? CONFIG.enemies[k].radius : 14;
  function addH(key, spec, target, dr, room) {
    const sz = target / designHeight(spec), r = room || 1.42;
    const oy = Math.ceil(target * r), w = Math.ceil(target * (spec.wScale ? 2.4 : 2.0)), h = Math.ceil(oy + target * 0.28);
    reg[key] = { draw: (g, P) => { g.save(); g.scale(sz, sz); humanoid(g, P, spec); g.restore(); }, box: [w, h, Math.ceil(w / 2), oy], dr, head: target * 0.72, tall: target };
  }
  /* 5 nhân vật trụ, mỗi người 4 cấp */
  HUMAN.forEach((s, i) => addH('soldier' + (i + 1), s, 40 + i, 12 * 1.05));
  [1, 2, 3, 4].forEach(i => { addH('elf' + i, ELF(i), 30, 12); addH('mage' + i, MAGE(i), 32, 12, 1.6); addH('dwarf' + i, DWARF(i), 26, 12); addH('orct' + i, ORCT(i), 34, 12, 1.5); });
  /* Anh hùng + trang bị: đăng ký khi cần */
  function heroKey(id, tiers) {
    tiers = tiers || [0, 0, 0, 0]; const key = 'h_' + id + '_' + tiers.join('');
    if (!reg[key]) addH(key, heroSpec(id, tiers), HERO_H[id], (CONFIG.heroes[id] || {}).radius || 15, 1.55);
    return key;
  }
  Object.keys(HERO_BASE).forEach(id => heroKey(id));
  /* Quái */
  const EH = { goblin: [32], orc: [44], orcArcher: [42], blackOrc: [50, 1.55], troll: [64, 1.5], trollKing: [96, 1.5], treant: [62, 1.5], skeleton: [42], deathKnight: [54, 1.55],
    bandit: [38], mummy: [44], iceGolem: [64, 1.5], imp: [28, 1.9], magmaGolem: [70, 1.5], voidling: [34], voidWalker: [50, 1.5], voidLord: [100, 1.5] };
  Object.keys(EH).forEach(k => addH(k, ENEMY[k], EH[k][0], radius(k), EH[k][1]));
  const WARGP = { frostWolf: { f1: '#d4e4f2', fd: '#8aa8c8', belly: '#f4faff', eye: '#6ae0ff' } };
  reg.warg = { draw: (g, P) => { g.save(); g.scale(1.25, 1.25); warg(g, P); g.restore(); }, box: [104, 66, 50, 52], dr: radius('warg'), head: 30, tall: 40, wide: 78 };
  reg.frostWolf = { draw: (g, P) => { g.save(); g.scale(1.25, 1.25); warg(g, P, WARGP.frostWolf); g.restore(); }, box: [104, 66, 50, 52], dr: radius('frostWolf'), head: 30, tall: 40, wide: 78 };
  reg.wraith = { draw: (g, P) => { g.save(); g.scale(1.15, 1.15); wraith(g, P); g.restore(); }, box: [90, 80, 40, 66], dr: radius('wraith'), head: 36, tall: 44 };
  reg.scorpion = { draw: (g, P) => { g.save(); g.scale(1.2, 1.2); scorpion(g, P); g.restore(); }, box: [110, 76, 54, 58], dr: radius('scorpion'), head: 22, tall: 40, wide: 84 };
  reg.drake = { draw: (g, P) => { g.save(); g.scale(1.45, 1.45); drake(g, P); g.restore(); }, box: [150, 120, 80, 100], dr: radius('drake'), head: 56, tall: 72, wide: 100 };
  reg.heroKey = heroKey;
  reg.hero = reg.h_aldric_0000;
  window.ArtChars = reg;
})();
