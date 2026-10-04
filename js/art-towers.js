/* =========================================================
 * art-towers.js – 5 trụ × 4 cấp, vẽ theo phong cách Kingdom Rush
 * Công trình đá/gỗ to chắc, viền mực đen dày, tô khối hình trụ (sáng trái – tối phải),
 * gạch, ngói, cửa sổ sáng đèn, cờ bay. Nhân vật chibi đứng trên trụ, nhỏ gọn.
 * static(g, tier): phần đứng yên (vẽ 1 lần vào bộ đệm)
 * fx(g, tier, t, st, env): phần chuyển động mỗi khung (nhân vật, cờ, lửa, pha lê…)
 * Gốc toạ độ = tâm ô xây trên mặt đất. y âm = lên trên.
 * ========================================================= */
(function () {
  const K = ArtKit, TAU = Math.PI * 2, INK = '#1b0f16', sh = K.shade, GOLD = '#f5c542', P_ = K.P;
  const CH = 0.74; // tỉ lệ nhân vật trên trụ

  /* ---------------- bút & hình khối ---------------- */
  function F(g, b, col, o) {
    o = o || {};
    K.cel(g, b, col, { s: o.s === undefined ? 1.8 : o.s, h: o.h === undefined ? 1 : o.h, lw: o.lw === undefined ? 1.9 : o.lw, ink: INK, animeHeavy: true, noRim: true, dark: o.dark, light: o.light, flat: o.flat });
  }
  const poly = p => P_.poly(p), rr = (x, y, w, h, r) => P_.rr(x, y, w, h, r), ell = (x, y, a, b) => P_.ell(x, y, a, b), circ = (x, y, r) => P_.circ(x, y, r);
  function line(g, x1, y1, x2, y2, col, w) { g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  function dot(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  function outline(g, build, w) { g.beginPath(); build(g); g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = w || 1.9; g.stroke(); }
  function hGrad(g, x0, x1, col) { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, sh(col, 0.28)); gr.addColorStop(0.35, col); gr.addColorStop(0.8, sh(col, -0.22)); gr.addColorStop(1, sh(col, -0.38)); return gr; }
  const RY = 0.36; // độ dẹt elip (góc nhìn 3/4 từ trên xuống)

  /** Thân trụ tròn có gạch. rx0 ở đáy, rx1 ở đỉnh (thuôn) */
  function cyl(g, cx, y0, y1, rx0, rx1, col, o) {
    o = o || {}; rx1 = rx1 || rx0;
    const body = c => { c.moveTo(cx - rx1, y1); c.lineTo(cx - rx0, y0); c.ellipse(cx, y0, rx0, rx0 * RY, 0, Math.PI, 0, true); c.lineTo(cx + rx1, y1); c.ellipse(cx, y1, rx1, rx1 * RY, 0, 0, Math.PI, true); c.closePath(); };
    g.save(); g.beginPath(); body(g); g.fillStyle = hGrad(g, cx - rx0, cx + rx0, col); g.fill(); g.clip();
    if (o.bricks !== false) { // hàng gạch
      const rowH = o.rowH || 7; g.lineWidth = 0.9; g.strokeStyle = K.alpha(sh(col, -0.55), 0.55);
      for (let y = y0 - rowH, r = 0; y > y1 + 1; y -= rowH, r++) {
        const k = (y - y0) / (y1 - y0), rx = rx0 + (rx1 - rx0) * k;
        g.beginPath(); g.ellipse(cx, y, rx, rx * RY, 0, 0, Math.PI); g.stroke();
        for (let i = 0; i < 6; i++) { const a = (i + (r % 2) * 0.5) / 6 * Math.PI + 0.12; const x = cx + Math.cos(a) * rx, yy = y + Math.sin(a) * rx * RY; g.beginPath(); g.moveTo(x, yy); g.lineTo(x, yy + rowH); g.stroke(); }
      }
      // vệt sáng bên trái
      g.fillStyle = 'rgba(255,250,230,0.12)'; g.fillRect(cx - rx0, y1 - 10, rx0 * 0.35, y0 - y1 + 20);
    }
    g.restore();
    outline(g, body, o.lw);
    if (o.cap !== false) F(g, ell(cx, y1, rx1, rx1 * RY), o.capCol || sh(col, 0.12), { s: 1.2, h: 0.6, lw: 1.6 });
  }
  /** Vòng lỗ châu mai trên đỉnh trụ */
  function merlons(g, cx, y, rx, col, n) {
    n = n || 7;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI - i / n * Math.PI, x = cx + Math.cos(a) * rx * 0.94, yy = y + Math.sin(a) * rx * RY * 0.94;
      F(g, rr(x - 3.6, yy - 7, 7.2, 8, 1.2), i < n / 2 ? sh(col, 0.08) : sh(col, -0.08), { s: 1, h: 0.6, lw: 1.5 });
    }
  }
  /** Mái nón lợp ngói */
  function cone(g, cx, y, rx, h, col, o) {
    o = o || {};
    const b = c => { c.moveTo(cx - rx, y); c.quadraticCurveTo(cx - rx * 0.35, y - h * 0.45, cx, y - h); c.quadraticCurveTo(cx + rx * 0.35, y - h * 0.45, cx + rx, y); c.ellipse(cx, y, rx, rx * RY, 0, 0, Math.PI, false); c.closePath(); };
    g.save(); g.beginPath(); b(g); g.fillStyle = hGrad(g, cx - rx, cx + rx, col); g.fill(); g.clip();
    g.strokeStyle = K.alpha(sh(col, -0.5), 0.5); g.lineWidth = 0.9;
    for (let k = 0.2; k < 1; k += 0.2) { const yy = y - h * (1 - k) * 0.98, r = rx * k; g.beginPath(); g.ellipse(cx, yy + h * 0.02, r, r * RY, 0, 0, Math.PI); g.stroke(); }
    g.restore(); outline(g, b);
    if (o.tip) { line(g, cx, y - h, cx, y - h - 7, INK, 3); line(g, cx, y - h, cx, y - h - 7, GOLD, 1.4); dot(g, cx, y - h - 7.5, 2, GOLD); }
  }
  /** Cửa sổ vòm sáng đèn */
  function win(g, x, y, w, h, glow) {
    F(g, c => { c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h + w / 2); c.arc(x, y - h + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, y); c.closePath(); }, glow || '#ffd060', { s: 0, h: 0, lw: 1.5, flat: true });
    if (glow !== '#20141c') K.glow(g, x, y - h / 2, w * 1.4, glow || '#ffb040', 0.35);
    line(g, x, y - 0.5, x, y - h + 1, K.alpha(INK, 0.7), 0.9);
  }
  /** Cửa gỗ vòm */
  function door(g, x, y, w, h, col, open) {
    const b = c => { c.moveTo(x - w / 2, y); c.lineTo(x - w / 2, y - h + w / 2); c.arc(x, y - h + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w / 2, y); c.closePath(); };
    F(g, b, '#2a1810', { s: 0, h: 0, lw: 1.8, flat: true });
    if (!open) { g.save(); g.beginPath(); b(g); g.clip(); F(g, rr(x - w / 2, y - h, w, h, 0), col || '#8a5a32', { s: 1.2, h: 0.6, lw: 0 }); for (let i = 1; i < 3; i++) line(g, x - w / 2 + w * i / 3, y - h, x - w / 2 + w * i / 3, y, K.alpha(INK, 0.5), 0.9); line(g, x - w / 2, y - h * 0.35, x + w / 2, y - h * 0.35, '#4a4a52', 1.4); dot(g, x + w * 0.28, y - h * 0.45, 1, GOLD); g.restore(); outline(g, b, 1.8); }
  }
  /** Bậc móng đá + cỏ quanh chân trụ */
  function footing(g, rx, col, grass) {
    K.shadow(g, 3, 4, rx * 1.25, rx * 0.5, 0.45);
    cyl(g, 0, 4, -3, rx, rx, col || '#8a8494', { rowH: 7, capCol: sh(col || '#8a8494', 0.1) });
    if (grass !== false) for (let i = 0; i < 9; i++) { const a = Math.PI * (0.05 + i / 8 * 0.9), x = Math.cos(a) * rx * 1.02, y = 4 + Math.sin(a) * rx * RY; F(g, poly([x - 3, y + 1, x - 1.5, y - 4, x, y, x + 1.5, y - 5, x + 3, y + 1]), i % 2 ? '#5aa83a' : '#4a9030', { s: 0, h: 0.5, lw: 1.1 }); }
    for (const [x, r] of [[-rx * 0.95, 4], [rx * 0.9, 3.4]]) F(g, ell(x, 5, r, r * 0.7), '#9a96a2', { s: 1, h: 0.5, lw: 1.3 });
  }
  /** Cờ nhỏ có cán (động) */
  function flag(g, x, y, h, col, t, dir) {
    dir = dir || 1;
    line(g, x, y, x, y - h, INK, 3); line(g, x, y, x, y - h, '#7a4a26', 1.5); dot(g, x, y - h - 1, 1.8, GOLD);
    F(g, c => { c.moveTo(x, y - h + 1); for (let i = 1; i <= 6; i++) { const f = i / 6; c.lineTo(x + dir * f * 16, y - h + 1 + Math.sin(t * 6 + f * 3) * 2.2 * f); } for (let i = 6; i >= 0; i--) { const f = i / 6; c.lineTo(x + dir * f * 14, y - h + 10 + Math.sin(t * 6 + f * 3 + 0.4) * 2.2 * f); } c.closePath(); }, col, { s: 1.2, h: 0.6, lw: 1.5 });
  }
  /** Băng rôn treo tường (tĩnh) */
  function banner(g, x, y, w, h, col, emblem) {
    F(g, rr(x - w / 2 - 1.5, y - 1.5, w + 3, 3, 1), '#7a4a26', { s: 0.4, h: 0.3, lw: 1.3 });
    F(g, poly([x - w / 2, y, x + w / 2, y, x + w / 2, y + h, x, y + h - w * 0.4, x - w / 2, y + h]), col, { s: 1.2, h: 0.6, lw: 1.5 });
    line(g, x - w / 2 + 1, y + 2, x + w / 2 - 1, y + 2, GOLD, 1);
    if (emblem) emblem(g, x, y + h * 0.42);
  }
  /** Ván gỗ (sàn tròn) */
  function planks(g, cx, y, rx, col) {
    const b = ell(cx, y, rx, rx * RY);
    F(g, b, col || '#a0703e', { s: 2, h: 1, lw: 1.8 });
    g.save(); g.beginPath(); b(g); g.clip(); g.strokeStyle = K.alpha(INK, 0.35); g.lineWidth = 0.9;
    for (let x = cx - rx; x < cx + rx; x += 6) { g.beginPath(); g.moveTo(x, y - rx); g.lineTo(x + 4, y + rx); g.stroke(); } g.restore();
    // mép ván dày
    const edge = c => { c.moveTo(cx - rx, y); c.ellipse(cx, y, rx, rx * RY, 0, Math.PI, 0, true); c.lineTo(cx + rx, y + 3.5); c.ellipse(cx, y + 3.5, rx, rx * RY, 0, 0, Math.PI, false); c.closePath(); };
    F(g, edge, sh(col || '#a0703e', -0.25), { s: 0.6, h: 0.3, lw: 1.6 });
  }
  function rail(g, cx, y, rx, col) {
    const c = col || '#7a4a26';
    for (let i = 0; i <= 8; i++) { const a = Math.PI - i / 8 * Math.PI, x = cx + Math.cos(a) * rx, yy = y + Math.sin(a) * rx * RY; line(g, x, yy, x, yy - 7, INK, 3.4); line(g, x, yy, x, yy - 7, c, 1.8); }
    g.beginPath(); g.ellipse(cx, y - 7, rx, rx * RY, 0, 0, Math.PI); g.strokeStyle = INK; g.lineWidth = 3.6; g.stroke(); g.strokeStyle = c; g.lineWidth = 2; g.stroke();
  }
  function post(g, x0, y0, x1, y1, w, col) { line(g, x0, y0, x1, y1, INK, w + 3.2); line(g, x0, y0, x1, y1, col, w); line(g, x0 - w * 0.2, y0, x1 - w * 0.2, y1, sh(col, 0.3), w * 0.3); }
  function stakes(g, rx, y, col, n) {
    for (let i = 0; i <= n; i++) { const a = Math.PI - i / n * Math.PI, x = Math.cos(a) * rx, yy = y + Math.sin(a) * rx * RY; F(g, poly([x - 2.6, yy, x - 2.6, yy - 9, x, yy - 14, x + 2.6, yy - 9, x + 2.6, yy]), i < n / 2 ? sh(col, 0.1) : col, { s: 0.8, h: 0.4, lw: 1.4 }); }
  }
  /** Nhà 3/4: mặt trước + mặt hông + mái 2 dốc */
  function house(g, x, y, w, h, d, wall, roof, o) {
    o = o || {};
    const sx = x + w / 2, dy = d * 0.5;
    // hông
    F(g, poly([sx, y, sx + d, y - dy, sx + d, y - h - dy, sx, y - h]), sh(wall, -0.25), { s: 1, h: 0.4 });
    // trước
    g.save(); F(g, rr(x - w / 2, y - h, w, h, 0), wall, { s: 1.6, h: 0.8 });
    if (o.bricks) { g.beginPath(); g.rect(x - w / 2, y - h, w, h); g.clip(); g.strokeStyle = K.alpha(sh(wall, -0.55), 0.5); g.lineWidth = 0.9; for (let yy = y - 6, r = 0; yy > y - h; yy -= 6, r++) { line(g, x - w / 2, yy, x + w / 2, yy, g.strokeStyle, 0.9); for (let xx = x - w / 2 + (r % 2) * 5; xx < x + w / 2; xx += 10) line(g, xx, yy, xx, yy + 6, g.strokeStyle, 0.9); } }
    if (o.planks) { g.beginPath(); g.rect(x - w / 2, y - h, w, h); g.clip(); for (let xx = x - w / 2 + 5; xx < x + w / 2; xx += 5) line(g, xx, y - h, xx, y, K.alpha(INK, 0.35), 0.9); }
    g.restore(); outline(g, rr(x - w / 2, y - h, w, h, 0));
    // mái
    const rh = o.roofH || h * 0.75, ov = 3;
    F(g, poly([x, y - h - rh, x + d, y - h - rh - dy, sx + d + ov, y - h - dy + 1, sx + ov, y - h + 1]), sh(roof, -0.15), { s: 1.2, h: 0.5 });
    F(g, poly([x - w / 2 - ov, y - h + 1, x, y - h - rh, sx + ov, y - h + 1]), roof, { s: 1.4, h: 0.7 });
    g.save(); g.beginPath(); P_.poly([x, y - h - rh, x + d, y - h - rh - dy, sx + d + ov, y - h - dy + 1, sx + ov, y - h + 1])(g); g.clip(); g.strokeStyle = K.alpha(sh(roof, -0.5), 0.55); g.lineWidth = 0.9;
    for (let k = 0.2; k < 1; k += 0.2) { g.beginPath(); g.moveTo(x + (sx + ov - x) * k, y - h - rh + (rh + 1) * k); g.lineTo(x + d + (sx + ov - x) * k, y - h - rh - dy + (rh + 1) * k); g.stroke(); }
    g.restore();
    if (o.gable) o.gable(g, x, y - h - rh * 0.35);
  }
  const skull = (g, x, y, s) => { s = s || 1; F(g, c => { c.moveTo(x + 3.4 * s, y); c.arc(x, y, 3.4 * s, 0, TAU); }, '#f2ead6', { s: 0.6, h: 0.3, lw: 1.2 }); F(g, rr(x - 2 * s, y + 2 * s, 4 * s, 2.4 * s, 0.6), '#f2ead6', { s: 0, h: 0, lw: 1 }); dot(g, x - 1.3 * s, y, 1 * s, INK); dot(g, x + 1.3 * s, y, 1 * s, INK); };
  const cross = (g, x, y) => { F(g, rr(x - 0.9, y - 3.5, 1.8, 7, 0.5), GOLD, { s: 0, h: 0.3, lw: 0.9 }); F(g, rr(x - 2.8, y - 1.6, 5.6, 1.8, 0.5), GOLD, { s: 0, h: 0.3, lw: 0.9 }); };
  const leaf = (g, x, y) => F(g, c => { c.moveTo(x, y - 3.5); c.quadraticCurveTo(x + 3, y, x, y + 3.5); c.quadraticCurveTo(x - 3, y, x, y - 3.5); c.closePath(); }, GOLD, { s: 0, h: 0.3, lw: 0.9 });
  const rune = (g, x, y) => { F(g, poly([x, y - 3.5, x + 2.6, y, x, y + 3.5, x - 2.6, y]), '#c08aff', { s: 0, h: 0.4, lw: 0.9 }); };

  /* ================= TRỤ CUNG (ELF) ================= */
  const ARCH_TOP = [0, -50, -60, -66, -74];
  function archerStatic(g, t) {
    if (t === 1) {
      footing(g, 30, '#8a8494');
      for (const s of [-1, 1]) post(g, s * 15, -2, s * 12, -50, 3, '#6a4426');
      for (const s of [-1, 1]) post(g, s * 25, 2, s * 22, -48, 3.6, '#8a5a32');
      post(g, -23, -10, 21, -36, 2, '#7a4a26'); post(g, 23, -10, -21, -36, 2, '#7a4a26');
      planks(g, 0, -50, 31);
    } else if (t === 2) {
      footing(g, 32, '#8a8494');
      cyl(g, 0, -2, -26, 30, 28, '#9a96a6');
      banner(g, 0, -22, 11, 15, '#2f8a40', leaf);
      for (const s of [-1, 1]) post(g, s * 21, -26, s * 19, -58, 3.4, '#8a5a32');
      post(g, -19, -32, 18, -52, 1.8, '#7a4a26'); post(g, 19, -32, -18, -52, 1.8, '#7a4a26');
      planks(g, 0, -60, 31);
    } else if (t === 3) {
      footing(g, 32, '#8a8494');
      cyl(g, 0, -2, -64, 29, 26, '#a8a4b4');
      win(g, -9, -30, 6, 10); win(g, 11, -42, 6, 10);
      door(g, 0, -2, 12, 17, '#7a5232');
      for (const s of [-1, 1]) banner(g, s * 20, -56, 9, 18, '#2f8a40', leaf);
      // dây leo
      for (const [x, y] of [[-25, -10], [-22, -20], [-26, -36], [22, -14], [24, -48]]) F(g, ell(x, y, 4.2, 3), '#4aa83a', { s: 0.8, h: 0.4, lw: 1.2 });
      planks(g, 0, -66, 32, '#7a5232');
    } else {
      footing(g, 34, '#c8ccd6');
      cyl(g, 0, -2, -72, 30, 25, '#eef0f2', { capCol: '#f8f8f8' });
      for (const y of [-14, -46]) { g.beginPath(); g.ellipse(0, y, 29 - (-y) * 0.06, (29 - (-y) * 0.06) * RY, 0, 0.1, Math.PI - 0.1); g.strokeStyle = INK; g.lineWidth = 3.6; g.stroke(); g.strokeStyle = GOLD; g.lineWidth = 2; g.stroke(); }
      win(g, -9, -24, 6, 11, '#9affc8'); win(g, 10, -34, 6, 11, '#9affc8'); win(g, 0, -56, 6, 10, '#9affc8');
      door(g, 0, -2, 12, 17, '#3f9a50');
      for (const s of [-1, 1]) { banner(g, s * 22, -66, 9, 20, '#2f8a40', leaf); F(g, c => { c.moveTo(s * 26, -70); c.quadraticCurveTo(s * 40, -88, s * 30, -100); c.quadraticCurveTo(s * 34, -84, s * 22, -72); c.closePath(); }, '#4ab85a', { s: 1, h: 0.6, lw: 1.5 }); }
      planks(g, 0, -74, 32, '#d8c088');
    }
  }
  function archerFx(g, t, time, st, env) {
    const top = ARCH_TOP[t], f = st.face || 1, a = st.a === undefined ? -1 : st.a;
    if (t === 4) { K.glow(g, 0, top - 52, 18, '#9affc8', 0.5 + Math.sin(time * 3) * 0.15); F(g, poly([0, top - 62, 5, top - 52, 0, top - 42, -5, top - 52]), '#7fffd0', { s: 0.8, h: 0.6, lw: 1.4, light: '#e8fff6' }); }
    const k = st.k || 0;
    env.char('elf' + t, -9, top + 1, f, k % 2 ? -1 : a, time + 0.7);
    env.char('elf' + t, 9, top + 3, f, k % 2 ? a : -1, time);
    rail(g, 0, top, 32, t === 4 ? GOLD : '#7a4a26');
    flag(g, -30, top - 2, 26, '#2f8a40', time, -1);
  }

  /* ================= TRỤ PHÁP (PHÙ THỦY) ================= */
  const MAGE_TOP = [0, -48, -60, -70, -80];
  function mageStatic(g, t) {
    const stone = t >= 4 ? '#8a7ab8' : t >= 3 ? '#7e7898' : '#8e8a9e';
    footing(g, 30, '#7a7488');
    const top = MAGE_TOP[t];
    cyl(g, 0, -2, top, 26 + (t > 2 ? 2 : 0), 20 + (t > 2 ? 1 : 0), stone, { capCol: '#5a4a8a' });
    // vòng chữ phép
    const ry = top * 0.42; g.beginPath(); g.ellipse(0, ry, 24, 24 * RY, 0, 0.1, Math.PI - 0.1); g.strokeStyle = INK; g.lineWidth = 4.4; g.stroke(); g.strokeStyle = '#8a5ad8'; g.lineWidth = 2.6; g.stroke();
    for (let i = 0; i < 4; i++) { const a = 0.4 + i * 0.75; rune(g, Math.cos(a) * 23, ry + Math.sin(a) * 23 * RY); }
    door(g, 0, -2, 11, 16, '#5a3a8a');
    if (t >= 2) { win(g, 10, top * 0.68, 5.5, 10, '#c890ff'); win(g, -9, top * 0.78, 5.5, 10, '#c890ff'); }
    if (t >= 2) for (const s of [-1, 1]) banner(g, s * 17, top + 8, 8, 16, '#5a3ac0', (gg, x, y) => F(gg, poly([x, y - 3, x + 2, y, x, y + 3, x - 2, y]), GOLD, { s: 0, h: 0.3, lw: 0.9 }));
    if (t >= 3) for (const s of [-1, 1]) { F(g, poly([s * 30, 4, s * 27, -14, s * 32, -24, s * 36, -12, s * 34, 4]), '#9a6ae8', { s: 1, h: 0.8, lw: 1.5, light: '#e0ccff' }); }
    if (t >= 4) { g.beginPath(); g.ellipse(0, top + 3, 21, 21 * RY, 0, 0.1, Math.PI - 0.1); g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = GOLD; g.lineWidth = 1.8; g.stroke(); }
  }
  function mageFx(g, t, time, st, env) {
    const top = MAGE_TOP[t], f = st.face || 1, a = st.a === undefined ? -1 : st.a, cast = a >= 0 ? Math.sin(Math.min(1, a) * Math.PI) : 0;
    if (t >= 3) for (let i = 0; i < (t === 4 ? 4 : 3); i++) { // đá / pha lê bay quanh
      const ang = time * 1.4 + i / (t === 4 ? 4 : 3) * TAU, x = Math.cos(ang) * 30, y = top * 0.55 + Math.sin(ang) * 30 * RY - 6 + Math.sin(time * 2 + i) * 2;
      if (Math.sin(ang) < 0) { F(g, poly([x, y - 5, x + 3.5, y, x, y + 5, x - 3.5, y]), t === 4 ? '#c08aff' : '#6a6480', { s: 0.8, h: 0.6, lw: 1.3, light: '#f0e0ff' }); }
    }
    K.glow(g, 0, top - 10, 22 + cast * 10, '#a060ff', 0.25 + cast * 0.5);
    env.char('mage' + t, 0, top + 2, f, a, time);
    if (t >= 3) for (let i = 0; i < (t === 4 ? 4 : 3); i++) {
      const ang = time * 1.4 + i / (t === 4 ? 4 : 3) * TAU, x = Math.cos(ang) * 30, y = top * 0.55 + Math.sin(ang) * 30 * RY - 6 + Math.sin(time * 2 + i) * 2;
      if (Math.sin(ang) >= 0) { K.glow(g, x, y, 8, '#c08aff', 0.5); F(g, poly([x, y - 5, x + 3.5, y, x, y + 5, x - 3.5, y]), t === 4 ? '#c08aff' : '#6a6480', { s: 0.8, h: 0.6, lw: 1.3, light: '#f0e0ff' }); }
    }
    for (let i = 0; i < 3; i++) { const p = (time * 0.6 + i / 3) % 1; K.glow(g, Math.sin(i * 2.3 + time) * 16, top * 0.4 - p * 40, 3, '#d8b0ff', (1 - p) * 0.8); }
  }

  /* ================= TRỤ PHÁO (NGƯỜI LÙN) ================= */
  const ART_Y = [0, -14, -22, -26, -30];
  function artilleryStatic(g, t) {
    if (t === 1) {
      footing(g, 32, '#8a8494');
      planks(g, 0, -10, 34, '#9a6a3a');
      for (const [x, y] of [[-22, -16], [-14, -19], [-18, -22]]) F(g, circ(x, y, 3.6), '#3a3a44', { s: 0.8, h: 0.6, lw: 1.3 }); // đạn
      F(g, rr(16, -22, 12, 9, 2), '#7a5232', { s: 1, h: 0.5, lw: 1.5 }); line(g, 16, -18, 28, -18, '#4a4a52', 1.4); // thùng thuốc
    } else {
      const stone = t === 4 ? '#7a7484' : '#9a96a6', top = ART_Y[t] + 4;
      footing(g, 35, '#8a8494');
      cyl(g, 0, -2, top, 35, 34, stone, { capCol: t === 4 ? '#5a4a3a' : '#8a7a62', rowH: 6 });
      merlons(g, 0, top, 35, stone, 8);
      if (t >= 3) { F(g, rr(-8, top + 10, 16, 8, 2), '#3a3036', { s: 0.6, h: 0.3, lw: 1.5 }); K.glow(g, 0, top + 14, 9, '#ff8a2a', 0.6); }
      if (t >= 2) banner(g, -20, top + 6, 9, 13, '#c0502a', (gg, x, y) => F(gg, poly([x - 2.5, y + 2, x, y - 3, x + 2.5, y + 2]), GOLD, { s: 0, h: 0.3, lw: 0.9 }));
      if (t === 4) { for (const y of [top + 2, -6]) { g.beginPath(); g.ellipse(0, y, 34, 34 * RY, 0, 0.1, Math.PI - 0.1); g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = GOLD; g.lineWidth = 1.8; g.stroke(); } cyl(g, 24, top - 2, top - 26, 4, 4, '#4a4248', { bricks: false }); }
      for (const [x, y] of [[-24, top - 4], [-17, top - 6]]) F(g, circ(x, y, 3.6), '#3a3a44', { s: 0.8, h: 0.6, lw: 1.3 });
    }
  }
  function artilleryFx(g, t, time, st, env) {
    const y = ART_Y[t], f = st.face || 1, a = st.a === undefined ? -1 : st.a;
    const rec = a >= 0.48 && a < 0.8 ? Math.sin((a - 0.48) / 0.32 * Math.PI) : 0;
    if (t === 4) for (let i = 0; i < 2; i++) { const p = (time * 0.5 + i * 0.5) % 1; K.glow(g, 24 + p * 6, y - 30 - p * 30, 6 + p * 8, '#d8d0c8', (1 - p) * 0.5); }
    // súng cối / đại bác (xoay theo hướng bắn, giật lùi)
    g.save(); g.translate(4, y - 4); g.scale(f, 1); g.rotate(-0.75 + rec * 0.15); g.translate(-rec * 4, 0);
    const bc = t === 4 ? GOLD : t === 3 ? '#4a4a56' : t === 2 ? '#c08a3a' : '#5a5a66', L = 18 + t * 3, R = 8 + t;
    F(g, rr(-5, -R, L, R * 2, R * 0.8), bc, { s: 1.6, h: 0.9, lw: 1.8 });
    F(g, ell(L - 5, 0, 2.8, R + 1.4), sh(bc, -0.1), { s: 0.6, h: 0.4, lw: 1.6 });
    F(g, ell(L - 4.4, 0, 1.6, R * 0.6), '#1a1218', { s: 0, h: 0, lw: 0.8, flat: true });
    for (const x of [1, L * 0.5]) line(g, x, -R, x, R, sh(bc, -0.4), 1.4);
    g.restore();
    F(g, rr(-6, y - 6, 20, 8, 2.4), '#6a4426', { s: 1, h: 0.5, lw: 1.6 }); // giá
    for (const x of [-3, 11]) { F(g, circ(x, y + 2, 4.2), '#4a3022', { s: 0.8, h: 0.4, lw: 1.5 }); dot(g, x, y + 2, 1.2, GOLD); }
    if (rec > 0.6) K.glow(g, 4 + f * 18, y - 22, 14, '#ffd060', rec);
    env.char('dwarf' + t, -20 * f, y + 1, f, a, time);
  }

  /* ================= TRẠI LÍNH (CON NGƯỜI) ================= */
  function barracksStatic(g, t) {
    footing(g, 36, t >= 3 ? '#9a96a6' : '#8a8494');
    if (t === 1) {
      stakes(g, 36, 2, '#9a6a3a', 10);
      house(g, -2, -2, 42, 22, 16, '#b8864e', '#d8b050', { planks: true, roofH: 18 });
      door(g, -2, -2, 12, 16, '#7a5232', true);
    } else if (t === 2) {
      house(g, -2, -2, 46, 26, 18, '#c8c0b4', '#c04a3a', { bricks: true, roofH: 20 });
      cyl(g, 22, -40, -52, 3.6, 3.6, '#8a8494', { bricks: false }); // ống khói
      win(g, -15, -12, 6, 9); win(g, 11, -12, 6, 9);
      door(g, -2, -2, 12, 18, '#7a5232', true);
    } else {
      const wall = t === 4 ? '#e4e2ea' : '#c8c4cc', W = t === 4 ? 50 : 46;
      house(g, 0, -2, W, t === 4 ? 36 : 32, 18, wall, '#2a52c8', { bricks: true, roofH: 16 });
      for (const s of [-1, 1]) { const x = s * (W / 2 + 2); cyl(g, x, 2, t === 4 ? -46 : -40, 10, 9, wall, { rowH: 6 }); cone(g, x, t === 4 ? -46 : -40, 12, t === 4 ? 24 : 20, '#2a52c8', { tip: true }); win(g, x, -18, 4.5, 8); }
      if (t === 4) { g.beginPath(); g.moveTo(-W / 2, -36); g.lineTo(W / 2, -36); g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = GOLD; g.lineWidth = 1.8; g.stroke(); }
      banner(g, 0, t === 4 ? -32 : -30, 10, 13, '#2a52c8', cross);
      door(g, 0, -2, 14, 19, '#7a5232', true);
    }
  }
  function barracksFx(g, t, time, st) {
    const open = (st.door || 0) > 0;
    const dx = t >= 3 ? 0 : -2, dw = t >= 3 ? 14 : 12, dh = t >= 3 ? 19 : t === 2 ? 18 : 16;
    if (!open) door(g, dx, -2, dw, dh, t === 1 ? '#8a5a32' : '#7a5232', false);
    else K.glow(g, dx, -10, 12, '#ffd080', 0.5);
    if (t <= 2) flag(g, t === 1 ? 18 : 20, t === 1 ? -26 : -44, 18, '#2a52c8', time);
    else for (const s of [-1, 1]) flag(g, s * 27, t === 4 ? -76 : -66, 12, s < 0 ? '#2a52c8' : '#f2f2f8', time + s, s);
  }

  /* ================= HANG CHIẾN BINH (ORC) ================= */
  const ORC_TOP = [0, -40, -46, -54, -62];
  function orcStatic(g, t) {
    footing(g, 36, '#6a5a52');
    if (t === 1) {
      stakes(g, 36, 2, '#8a5a32', 10);
      // lều da
      const b = c => { c.moveTo(-26, -2); c.quadraticCurveTo(-12, -24, 0, -46); c.quadraticCurveTo(12, -24, 26, -2); c.ellipse(0, -2, 26, 26 * RY, 0, 0, Math.PI, false); c.closePath(); };
      g.save(); g.beginPath(); b(g); g.fillStyle = hGrad(g, -26, 26, '#a8784a'); g.fill(); g.clip(); for (const x of [-12, 0, 12]) line(g, x * 0.2, -44, x * 1.9, 6, K.alpha(INK, 0.4), 1); line(g, -20, -18, 20, -18, '#6a4426', 1.6); g.restore(); outline(g, b);
      for (const s of [-1, 1]) post(g, s * 3, -42, s * 9, -54, 2, '#6a4426');
      F(g, c => { c.moveTo(-7, -2); c.lineTo(0, -22); c.lineTo(7, -2); c.closePath(); }, '#1c1018', { s: 0, h: 0, lw: 1.6, flat: true });
      skull(g, 0, -30, 1.1);
    } else if (t === 2) {
      stakes(g, 36, 2, '#7a5a3a', 10);
      house(g, 0, -2, 46, 22, 18, '#8a5a32', '#5a3a26', { planks: true, roofH: 18 });
      for (const s of [-1, 1]) F(g, c => { c.moveTo(s * 2, -40); c.quadraticCurveTo(s * 16, -46, s * 20, -60); c.quadraticCurveTo(s * 12, -50, s * 2, -46); c.closePath(); }, '#f2ead6', { s: 0.8, h: 0.5, lw: 1.5 });
      skull(g, 0, -30, 1.2);
    } else {
      const stone = t === 4 ? '#4a4048' : '#6a6070';
      stakes(g, 37, 2, '#5a4a40', 12);
      cyl(g, 0, -2, ORC_TOP[t] + 8, 30, 27, stone, { capCol: '#3a3036' });
      merlons(g, 0, ORC_TOP[t] + 8, 27, stone, 7);
      for (const s of [-1, 1]) banner(g, s * 17, -40 - (t - 3) * 6, 9, 18, '#a8201a', (gg, x, y) => skull(gg, x, y, 0.7));
      skull(g, 0, -34 - (t - 3) * 6, 1.4);
      if (t === 4) for (const s of [-1, 1]) F(g, c => { c.moveTo(s * 12, ORC_TOP[4] + 2); c.quadraticCurveTo(s * 40, ORC_TOP[4] - 6, s * 34, ORC_TOP[4] - 38); c.quadraticCurveTo(s * 28, ORC_TOP[4] - 14, s * 8, ORC_TOP[4] - 6); c.closePath(); }, '#f2ead6', { s: 1, h: 0.6, lw: 1.7 });
    }
    // cửa hang
    const dw = t >= 3 ? 16 : 14;
    if (t >= 2) { F(g, c => { c.moveTo(-dw / 2, -2); c.lineTo(-dw / 2, -12); c.arc(0, -12, dw / 2, Math.PI, 0); c.lineTo(dw / 2, -2); c.closePath(); }, '#1c1018', { s: 0, h: 0, lw: 1.8, flat: true }); for (let i = -2; i <= 2; i++) F(g, poly([i * 3 - 1.4, -12 - Math.sqrt(Math.max(0, 1 - (i * 3 / (dw / 2)) ** 2)) * dw / 2 + 1, i * 3, -10, i * 3 + 1.4, -12 - Math.sqrt(Math.max(0, 1 - (i * 3 / (dw / 2)) ** 2)) * dw / 2 + 1]), '#f2ead6', { s: 0, h: 0, lw: 0.9 }); }
  }
  function orcFx(g, t, time, st, env) {
    const top = ORC_TOP[t];
    K.glow(g, 0, -8, 12, '#ff6a2a', 0.35 + Math.sin(time * 5) * 0.1 + ((st.door || 0) > 0 ? 0.4 : 0));
    if (t >= 3) for (const s of [-1, 1]) { // chậu lửa
      const bx = s * 34, by = top + 4;
      post(g, bx, by + 22, bx, by + 2, 2.4, '#4a3a2a'); F(g, rr(bx - 5, by - 4, 10, 6, 2), '#3a3036', { s: 0.8, h: 0.4, lw: 1.4 });
      K.glow(g, bx, by - 10, 14, '#ff8a2a', 0.6 + Math.sin(time * 9 + s) * 0.2);
      F(g, c => { c.moveTo(bx - 4, by - 4); c.quadraticCurveTo(bx - 5, by - 11 - Math.sin(time * 8 + s) * 2, bx, by - 17); c.quadraticCurveTo(bx + 5, by - 11, bx + 4, by - 4); c.closePath(); }, '#ff8a1a', { s: 0, h: 0.8, lw: 1.1, light: '#ffe060' });
    }
    flag(g, t === 1 ? 10 : 22, t === 1 ? -52 : top + (t >= 3 ? 0 : 10), 18, '#a8201a', time);
  }

  window.ArtTowers = {
    archer:    { static: archerStatic,    fx: archerFx,    box: [130, 230, 65, 205] },
    barracks:  { static: barracksStatic,  fx: barracksFx,  box: [130, 150, 65, 125] },
    mage:      { static: mageStatic,      fx: mageFx,      box: [130, 230, 65, 205] },
    artillery: { static: artilleryStatic, fx: artilleryFx, box: [130, 130, 65, 100] },
    orc:       { static: orcStatic,       fx: orcFx,       box: [130, 170, 65, 145] },
    ARCH_TOP, MAGE_TOP, ART_Y, ORC_TOP, CH,
    H: { F, cyl, cone, house, win, door, merlons, banner, flag, planks, rail, post, stakes, footing, outline, hGrad, line, dot, skull, cross, poly, rr, ell, circ, RY }
  };
})();
