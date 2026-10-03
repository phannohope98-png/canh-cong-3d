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
    sword(g, t) {
      const blade = t >= 3 ? '#eef4ff' : '#cfd6e2';
      F(g, rr(-1.3, -0.5, 2.6, 6, 1.2), '#5a3420', { s: 0.6, h: 0.3, lw: 1.3 });
      F(g, poly([-2.4, -3, -2.4, -17, 0, -21, 2.4, -17, 2.4, -3]), blade, { s: 1.2, h: 0.8, lw: 1.5 });
      line(g, 0, -4, 0, -17.5, 'rgba(255,255,255,0.9)', 0.9);
      F(g, rr(-5.2, -4.2, 10.4, 2.8, 1.3), GOLD, { s: 0.6, h: 0.4, lw: 1.3 });
      if (t === 4) K.glow(g, 0, -12, 12, '#bfe4ff', 0.45);
    },
    shield(g, t) {
      const c = t >= 2 ? '#2a5ad0' : '#8a5a32';
      F(g, c2 => { c2.moveTo(-6.5, -7); c2.lineTo(6.5, -7); c2.quadraticCurveTo(7, 3, 0, 8.5); c2.quadraticCurveTo(-7, 3, -6.5, -7); c2.closePath(); }, c, { s: 2, h: 1, lw: 1.7 });
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
    staff(g, t, glow, col) {
      col = col || '#c08aff';
      limb(g, 0, 9, 0, -22, 1.8, t >= 3 ? '#3a2a5a' : '#5a3a26');
      F(g, c2 => { c2.moveTo(-3.6, -21); c2.quadraticCurveTo(-4.6, -26, -1, -28); c2.lineTo(1, -28); c2.quadraticCurveTo(4.6, -26, 3.6, -21); c2.closePath(); }, GOLD, { s: 0.6, h: 0.4, lw: 1.2 });
      K.glow(g, 0, -27.5, 8 + glow * 9 + t, col, 0.55 + glow * 0.45);
      F(g, poly([0, -33.5, 3, -27.5, 0, -22.5, -3, -27.5]), col, { s: 0.9, h: 0.6, lw: 1.3, light: '#f4ecff' });
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
    bow(g, t, pull) {
      const c = t >= 3 ? GOLD : '#8a5a2a';
      g.lineCap = 'round';
      const arc = () => { g.beginPath(); g.moveTo(-1, -12); g.quadraticCurveTo(6.5, -5, 6.5, 0); g.quadraticCurveTo(6.5, 5, -1, 12); };
      arc(); g.strokeStyle = INK; g.lineWidth = 4.4; g.stroke(); arc(); g.strokeStyle = c; g.lineWidth = 2.2; g.stroke();
      if (t >= 2) { arc(); g.strokeStyle = '#3fae5a'; g.lineWidth = 0.9; g.stroke(); }
      const sx = -1 - pull * 7;
      line(g, -1, -12, sx, 0, '#f4f0e0', 0.8); line(g, sx, 0, -1, 12, '#f4f0e0', 0.8);
      if (pull > 0.05 || pull === 0) { // mũi tên lắp sẵn
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
      const w = 1.75 * s, h = mode === 'fierce' ? 1.9 * s : 2.9 * s;
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
  function headBase(g, hx, hy, R, skin) {
    F(g, c => { c.moveTo(hx + R * 1.02, hy); c.ellipse(hx, hy, R * 1.02, R * 0.96, 0, 0, TAU); }, skin, { s: R * 0.16, h: R * 0.08, lw: 1.9 });
    // má hồng
    g.fillStyle = 'rgba(255,110,110,0.28)'; g.beginPath(); g.ellipse(hx + R * 0.72, hy + R * 0.45, R * 0.2, R * 0.12, 0, 0, TAU); g.fill();
  }

  /* ---------- áo choàng (sau lưng) ---------- */
  function cape(g, col, sway, len, wide, front) {
    const sw = sway * 2.2;
    F(g, c => { c.moveTo(-4, -18); c.lineTo(4, -18); c.quadraticCurveTo(3, -10, 2 - sw * 0.3, -2 + len); c.quadraticCurveTo(-4 - wide, -1 + len, -8 - wide - sw, -3 + len);
      c.quadraticCurveTo(-8 - wide * 0.6, -11, -4, -18); c.closePath(); }, col, { s: front ? 1.2 : 2.2, h: 0.8, lw: 1.7 });
    if (front) { g.strokeStyle = GOLD; g.lineWidth = 1; g.beginPath(); g.moveTo(-8 - wide - sw, -3.6 + len); g.quadraticCurveTo(-4 - wide, -1.6 + len, 2 - sw * 0.3, -2.6 + len); g.stroke(); }
  }

  /* ================== KHUNG CHUNG ================== */
  function body(g, P, S, back) {
    const tt = P.t || 0, walk = P.w >= 0, ph = walk ? P.w * TAU : 0, a = P.a;
    const bob = walk ? Math.abs(Math.sin(ph)) * 1.7 : Math.sin(tt * 2.6) * 0.35;
    const legA = walk ? Math.sin(ph) * 0.62 : 0, swing = walk ? Math.sin(ph) : 0;
    const sw = a >= 0 ? K.swing(a) : 0, lean = (S.ranged ? 0 : sw * 0.07) + (walk ? 0.05 : 0);
    const blink = !walk && a < 0 && (tt % 3.9) < 0.13;
    const bw = S.bw || 6, hipY = -(S.leg || 6.5), torsoH = S.torso || 11, R = S.R || 10;
    const shY = hipY - torsoH + 2.6, hx = 0.6, hy = hipY - torsoH - R * 0.78;

    // bóng
    K.shadow(g, 0, 0.6, bw * 1.7, 3.2, 0.42);

    // ---- chân ----
    const legW = S.legW || 4.4;
    for (const k of [-1, 1]) {
      const ang = legA * k, hxp = k * bw * 0.36, fx = hxp + Math.sin(ang) * 4.6, fy = -1.2 - Math.max(0, Math.sin(ang * k * k)) * (k > 0 ? 1.4 : 0);
      if (k < 0) { limb(g, hxp, hipY - bob, fx, fy, legW, S.legs); F(g, ell(fx + 1.2, fy, 3.2, 2.1), S.boots, { s: 0.8, h: 0.4, lw: 1.5 }); }
    }
    g.save(); g.translate(0, -bob); g.rotate(lean);

    // ---- tóc dài / áo choàng phía sau ----
    if (!back && S.backHair) S.backHair(g, hx, hy, R, swing, tt);
    if (!back && S.cape) cape(g, S.cape, swing, S.capeLen || 0, S.capeWide || 0, false);

    // ---- tay sau (khiên / dây cung) ----
    const shB = { x: -bw * 0.62, y: shY }, shF = { x: bw * 0.55, y: shY };
    let handB, handF, wRot = 0.45, pull = 0, glow = 0;
    if (S.kind === 'melee') {
      const rest = { x: 7, y: shY + 6 }, up = { x: 1.5, y: shY - 7 }, down = { x: 8.5, y: shY + 7.5 };
      if (sw < 0) { const k = -sw; handF = { x: lerp(rest.x, up.x, k), y: lerp(rest.y, up.y, k) }; wRot = lerp(0.45, -1.5, k); }
      else { const k = sw; handF = { x: lerp(rest.x, down.x, k), y: lerp(rest.y, down.y, k) }; wRot = lerp(0.45, 2.2, k); }
      if (walk) { handF.x += swing * 1.2; wRot += swing * 0.12; }
      handB = { x: shB.x + 3 - swing * 1.4, y: shB.y + 7 };
    } else if (S.kind === 'bow') {
      pull = a >= 0 ? (a < 0.5 ? a / 0.5 : Math.max(0, 1 - (a - 0.5) * 5)) : 0.0;
      handF = { x: shF.x + 7.5, y: shY + 1 }; handB = { x: shF.x + 6.5 - pull * 7.5, y: shY + 1 };
    } else { // staff
      const k = a >= 0 ? Math.sin(Math.min(1, a / 0.55) * Math.PI / 2) * (a > 0.75 ? Math.max(0, (1 - a) / 0.25) : 1) : 0;
      glow = k; handF = { x: shF.x + 4 + k * 3, y: shY + 6 - k * 8 + (walk ? swing : 0) }; handB = { x: shB.x + 3 - swing * 1.4, y: shB.y + 7 };
    }
    if (back) { // nhìn từ sau: vũ khí khuất sau lưng
      if (S.weapon) { g.save(); g.translate(handF.x - 3, handF.y); g.rotate(wRot * 0.5); W[S.weapon](g, S.tier, S.kind === 'bow' ? 0 : glow); g.restore(); }
    }
    if (!back) limb(g, shB.x, shB.y, handB.x, handB.y, S.armW || 3.4, S.sleeve);
    if (!back && S.kind === 'bow') { /* tay sau kéo dây – vẽ sau cung */ }

    // ---- chân trước ----
    g.restore();
    { const k = 1, ang = legA, hxp = bw * 0.36, fx = hxp + Math.sin(ang) * 4.6, fy = -1.2 - Math.max(0, Math.sin(ang)) * 1.4;
      limb(g, hxp, hipY - bob, fx, fy, legW, S.legs); F(g, ell(fx + 1.2, fy, 3.2, 2.1), S.boots, { s: 0.8, h: 0.4, lw: 1.5 }); }
    g.save(); g.translate(0, -bob); g.rotate(lean);

    // ---- thân ----
    S.torsoDraw(g, bw, hipY, torsoH, back);
    if (back && S.cape) cape(g, S.cape, swing, S.capeLen || 0, S.capeWide || 0, true);

    // ---- đầu ----
    if (back) { S.headBack(g, hx, hy, R, swing, tt); }
    else {
      headBase(g, hx, hy, R, S.skin);
      if (S.face) S.face(g, hx, hy, R, blink, tt, a);
      else { eyes(g, hx, hy, R, S.iris, blink, S.eyeMode); brows(g, hx, hy, R, S.browCol || INK, S.angry); line(g, hx + R * 0.36, hy + R * 0.6, hx + R * 0.56, hy + R * 0.58, INK, 1.1); }
      S.hair(g, hx, hy, R, swing, tt);
    }

    // ---- tay trước + vũ khí ----
    if (!back) {
      if (S.kind === 'bow') {
        g.save(); g.translate(handF.x, handF.y); W.bow(g, S.tier, pull); g.restore();
        limb(g, shB.x + 2, shB.y, handB.x, handB.y, S.armW || 3.2, S.sleeve);
        limb(g, shF.x, shF.y, handF.x - 0.5, handF.y, S.armW || 3.2, S.sleeve);
        dot(g, handF.x - 0.5, handF.y, 1.9, S.skin); dot(g, handB.x, handB.y, 1.8, S.skin);
      } else {
        if (S.shield) { g.save(); g.translate(-bw * 0.35, shY + 7.5); g.scale(1.15, 1.15); W.shield(g, S.tier); g.restore(); }
        g.save(); g.translate(handF.x, handF.y); g.rotate(wRot); W[S.weapon](g, S.tier, glow, S.wcol); g.restore();
        limb(g, shF.x, shF.y, handF.x, handF.y, S.armW || 3.4, S.sleeve);
        dot(g, handF.x, handF.y, (S.armW || 3.4) * 0.62, S.glove || S.skin);
        // vệt chém khi bổ xuống
        if (S.kind === 'melee' && a >= 0.38 && a <= 0.66) {
          const k = (a - 0.38) / 0.28, al = Math.sin(k * Math.PI);
          g.save(); g.globalAlpha = al * 0.9; const cx = shF.x, cy = shF.y, r = 19;
          const gr = g.createRadialGradient(cx, cy, r - 7, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.6, 'rgba(255,248,220,0.7)'); gr.addColorStop(1, '#ffffff');
          g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, -2.1, -2.1 + 2.6 * Math.min(1, k * 1.4)); g.arc(cx, cy, r - 6, -2.1 + 2.6 * Math.min(1, k * 1.4), -2.1, true); g.closePath(); g.fill(); g.restore();
        }
      }
    }
    g.restore();
  }

  /* ================== 5 NHÂN VẬT ================== */
  function HUMAN(t, o) {
    o = o || {}; const HC = o.hair || '#7a4a26', CAPE = o.cape || '#2a52c8';
    const armor = o.armor || (t === 1 ? '#8a6640' : t === 2 ? '#a6aebb' : '#d4dae6'), trim = t >= 3 ? GOLD : '#6a6e78';
    return { tier: t, kind: 'melee', weapon: o.weapon || 'sword', shield: o.shield !== false, wcol: o.wcol, R: 10, bw: 6.2, torso: 11, leg: 6.5,
      skin: SKIN, iris: o.iris || '#3a6ad8', legs: t === 1 ? '#6a4a30' : '#7a8290', boots: t >= 3 ? '#8a94a6' : '#4a3020', sleeve: armor, glove: t >= 3 ? '#c8d0dc' : '#8a6a44',
      cape: t >= 2 || o.cape ? CAPE : null, capeLen: t >= 3 ? 2 : 0, capeWide: t >= 4 ? 3 : 1.5,
      torsoDraw(g, bw, hipY, h, back) {
        F(g, rr(-bw * 0.62, hipY - h, bw * 1.24, h + 1, 3.6), armor, { s: 2, h: 1 });
        if (!back && t >= 2) F(g, poly([-bw * 0.38, hipY - h + 3, bw * 0.38, hipY - h + 3, bw * 0.3, hipY + 2.5, 0, hipY + 4, -bw * 0.3, hipY + 2.5]), CAPE, { s: 0.8, h: 0.4, lw: 1.4 });
        if (!back && t >= 3) { line(g, -bw * 0.3, hipY - h + 3.4, bw * 0.3, hipY - h + 3.4, GOLD, 1.2); F(g, P_.circ(0, hipY - h + 6.5, 1.3), GOLD, { s: 0, h: 0.3, lw: 1 }); }
        F(g, rr(-bw * 0.66, hipY - 2.4, bw * 1.32, 2.8, 1), '#4a2e1a', { s: 0.4, h: 0.3, lw: 1.3 });
        for (const s of [-1, 1]) if (t >= 2) F(g, ell(s * bw * 0.62, hipY - h + 2.2, 3.4, 2.6), t >= 4 ? GOLD : armor, { s: 0.8, h: 0.5, lw: 1.5 });
        if (t >= 4) line(g, -bw * 0.62, hipY - 0.6, bw * 0.62, hipY - 0.6, trim, 1);
      },
      hair(g, hx, hy, R) {
        F(g, blob([hx - R * 1.08, hy + R * 0.2, hx - R * 1.1, hy - R * 0.6, hx - R * 0.4, hy - R * 1.18, hx + R * 0.5, hy - R * 1.15, hx + R * 1.12, hy - R * 0.55,
          hx + R * 0.95, hy - R * 0.2, hx + R * 0.62, hy - R * 0.46, hx + R * 0.35, hy - R * 0.08, hx + R * 0.1, hy - R * 0.5, hx - R * 0.25, hy - R * 0.05, hx - R * 0.55, hy + R * 0.25]), HC, { s: R * 0.16, h: R * 0.08 });
        if (o.spiky) for (const [a, b, c2] of [[-0.9, -1.0, -1.6], [-0.3, -1.15, -1.75], [0.35, -1.1, -1.6]]) F(g, poly([hx + R * (a - 0.3), hy + R * b + 2, hx + R * (a - 0.45), hy + R * c2, hx + R * (a + 0.3), hy + R * b + 2]), HC, { s: 0.8, h: 0.5, lw: 1.5 });
        line(g, hx - R * 0.3, hy - R * 0.85, hx + R * 0.35, hy - R * 0.95, 'rgba(255,220,170,0.6)', 1.1);
        if (t >= 4) { F(g, poly([hx - R * 0.5, hy - R * 0.98, hx - R * 0.3, hy - R * 1.45, hx, hy - R * 1.12, hx + R * 0.3, hy - R * 1.5, hx + R * 0.5, hy - R * 1.08]), GOLD, { s: 0.6, h: 0.5, lw: 1.3 }); dot(g, hx, hy - R * 1.2, 1, '#4ac0ff'); }
      },
      headBack(g, hx, hy, R) { F(g, P_.circ(hx, hy, R * 1.04), HC, { s: R * 0.2, h: R * 0.1 }); }
    };
  }
  function ELF(t, o) {
    o = o || {}; const tunic = o.tunic || (t >= 4 ? '#e8efe0' : '#3f9a50'), hairC = o.hair || (t >= 3 ? '#fff0a8' : '#f5d060');
    const longHair = (g, hx, hy, R, sw) => F(g, blob([hx - R * 0.6, hy - R * 0.9, hx - R * 1.25, hy - R * 0.1, hx - R * 1.3 - sw, hy + R * 1.4, hx - R * 0.9 - sw * 1.4, hy + R * 2.5, hx - R * 0.1, hy + R * 2.1, hx + R * 0.2, hy + R * 0.8]), hairC, { s: R * 0.18, h: R * 0.08 });
    return { tier: t, kind: 'bow', R: 10, bw: 5.6, torso: 11, leg: 7, legW: 3.8, armW: 3,
      skin: SKIN, iris: '#2aa86a', legs: '#2f6a3a', boots: '#6a4a26', sleeve: o.tunic || (t >= 4 ? '#f2f6ea' : '#3f9a50'),
      cape: o.cape || (t >= 2 ? '#2f7a40' : null), capeLen: 1, capeWide: 1,
      backHair: longHair,
      torsoDraw(g, bw, hipY, h, back) {
        F(g, poly([-bw * 0.6, hipY - h, bw * 0.6, hipY - h, bw * 0.75, hipY + 1.5, 0, hipY + 3.5, -bw * 0.75, hipY + 1.5]), tunic, { s: 1.8, h: 0.9 });
        if (!back) { line(g, 0, hipY - h + 1, 0, hipY + 3, t >= 2 ? GOLD : '#2a6a34', 1); F(g, rr(-bw * 0.62, hipY - 3.6, bw * 1.24, 2.4, 1), '#6a4a26', { s: 0.4, h: 0.3, lw: 1.2 }); }
        if (t >= 3) for (const s of [-1, 1]) F(g, ell(s * bw * 0.6, hipY - h + 2, 2.8, 2), GOLD, { s: 0.6, h: 0.4, lw: 1.3 });
        // ống tên
        if (back || t >= 1) { g.save(); g.translate(-bw * 0.5, hipY - h + 1); g.rotate(-0.4); F(g, rr(-1.8, -6, 3.6, 9, 1.2), '#7a4a26', { s: 0.6, h: 0.3, lw: 1.2 }); for (const x of [-0.8, 0.8]) F(g, poly([x - 0.9, -6, x, -9, x + 0.9, -6]), '#f4f0e0', { s: 0, h: 0, lw: 0.9 }); g.restore(); }
      },
      hair(g, hx, hy, R) {
                F(g, blob([hx - R * 1.1, hy + R * 0.4, hx - R * 1.05, hy - R * 0.7, hx - R * 0.2, hy - R * 1.2, hx + R * 0.75, hy - R * 1.0, hx + R * 1.12, hy - R * 0.3,
          hx + R * 0.7, hy - R * 0.45, hx + R * 0.2, hy - R * 0.3, hx - R * 0.35, hy + R * 0.0, hx - R * 0.6, hy + R * 0.6]), hairC, { s: R * 0.16, h: R * 0.08 });
        F(g, poly([hx - R * 0.45, hy + R * 0.05, hx - R * 1.6, hy - R * 0.75, hx - R * 0.5, hy + R * 0.45]), SKIN, { s: 0.6, h: 0.3, lw: 1.5 });
        if (t >= 3) { line(g, hx - R * 0.6, hy - R * 0.62, hx + R * 0.95, hy - R * 0.62, GOLD, 1.3); F(g, poly([hx + R * 0.15, hy - R * 0.62, hx + R * 0.3, hy - R * 0.95, hx + R * 0.45, hy - R * 0.62]), '#7fffd0', { s: 0, h: 0.3, lw: 1 }); }
      },
      headBack(g, hx, hy, R, sw) { F(g, blob([hx - R * 1.05, hy - R * 0.3, hx - R * 0.4, hy - R * 1.1, hx + R * 0.6, hy - R * 1.05, hx + R * 1.1, hy - R * 0.2, hx + R * 0.85, hy + R * 1.35, hx - R * 0.85 - sw, hy + R * 1.5]), hairC, { s: R * 0.2, h: R * 0.1 });
        for (const s of [-1, 1]) F(g, poly([hx + s * R * 0.9, hy, hx + s * R * 1.6, hy - R * 0.6, hx + s * R * 1.0, hy + R * 0.35]), SKIN, { s: 0.5, h: 0.3, lw: 1.4 }); }
    };
  }
  function DWARF(t, o) {
    o = o || {}; const leather = o.leather || '#7a5232', steel = t >= 4 ? GOLD : '#9aa2b0', beard = o.beard || '#e2662a';
    return { tier: t, kind: 'melee', weapon: o.weapon || 'hammer', helmet: o.helmet, R: 10.4, bw: 8, torso: 9.5, leg: 4.6, legW: 4.8, armW: 4,
      skin: '#f8c4a0', iris: '#3a6ad8', legs: '#5a3a26', boots: '#2e1e14', sleeve: leather, glove: '#4a3020',
      torsoDraw(g, bw, hipY, h, back) {
        F(g, rr(-bw * 0.62, hipY - h, bw * 1.24, h + 1.5, 4.5), leather, { s: 2.2, h: 1 });
        line(g, -bw * 0.55, hipY - h + 1, bw * 0.4, hipY - 1, '#4a2e1a', 1.6);
        F(g, rr(-bw * 0.66, hipY - 2.6, bw * 1.32, 3, 1), '#3a2416', { s: 0.4, h: 0.3, lw: 1.3 }); F(g, rr(-1.6, hipY - 2.9, 3.2, 3.6, 0.6), GOLD, { s: 0.3, h: 0.3, lw: 1 });
        if (t >= 2) for (const s of [-1, 1]) F(g, ell(s * bw * 0.6, hipY - h + 2, 4, 3), steel, { s: 1, h: 0.6, lw: 1.5 });
        if (t >= 3 && !back) F(g, rr(-bw * 0.35, hipY - h + 3, bw * 0.7, 4.5, 1.5), steel, { s: 0.8, h: 0.5, lw: 1.3 });
      },
      face(g, hx, hy, R, blink) {
        eyes(g, hx, hy - R * 0.08, R, '#3a6ad8', blink);
        g.lineCap = 'round'; g.strokeStyle = '#a8401a'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx - R * 0.1, hy - R * 0.36); g.lineTo(hx + R * 0.85, hy - R * 0.4); g.stroke();
        F(g, P_.circ(hx + R * 0.55, hy + R * 0.32, R * 0.2), '#f0a080', { s: 0.6, h: 0.3, lw: 1.3 }); // mũi to
      },
      hair(g, hx, hy, R) {
        // râu to che cằm và ngực
        F(g, blob([hx - R * 0.75, hy + R * 0.1, hx - R * 0.2, hy + R * 0.55, hx + R * 0.5, hy + R * 0.5, hx + R * 1.1, hy + R * 0.1, hx + R * 1.2, hy + R * 0.9,
          hx + R * 0.8, hy + R * 1.7, hx + R * 0.2, hy + R * 2.1, hx - R * 0.5, hy + R * 1.6, hx - R * 0.9, hy + R * 0.8]), beard, { s: R * 0.2, h: R * 0.1 });
        g.strokeStyle = '#b0461a'; g.lineWidth = 1; for (const x of [0, 0.4, 0.8]) { g.beginPath(); g.moveTo(hx + R * (x - 0.1), hy + R * 0.8); g.quadraticCurveTo(hx + R * x, hy + R * 1.3, hx + R * (x - 0.2), hy + R * 1.7); g.stroke(); }
        F(g, blob([hx + R * 0.05, hy + R * 0.55, hx + R * 0.55, hy + R * 0.42, hx + R * 1.05, hy + R * 0.6, hx + R * 0.6, hy + R * 0.75]), sh(beard, 0.1), { s: 0.6, h: 0.3, lw: 1.3 }); // ria
        F(g, blob([hx - R * 1.05, hy + R * 0.3, hx - R * 1.0, hy - R * 0.65, hx - R * 0.2, hy - R * 1.12, hx + R * 0.75, hy - R * 0.95, hx + R * 1.0, hy - R * 0.55, hx + R * 0.1, hy - R * 0.6, hx - R * 0.55, hy + R * 0.1]), beard, { s: R * 0.15, h: R * 0.08 });
        // kính phi công
        F(g, rr(hx - R * 0.9, hy - R * 0.85, R * 1.85, R * 0.32, R * 0.15), '#4a3020', { s: 0.4, h: 0.2, lw: 1.2 });
        for (const x of [-0.15, 0.55]) { F(g, P_.circ(hx + R * x, hy - R * 0.7, R * 0.3), t >= 4 ? GOLD : '#a07a40', { s: 0.6, h: 0.4, lw: 1.4 }); F(g, P_.circ(hx + R * x, hy - R * 0.7, R * 0.19), '#8ae0ff', { s: 0.5, h: 0.5, lw: 1, light: '#e8fbff' }); }
        if (o.helmet) {
          F(g, c => { c.moveTo(hx - R * 1.06, hy - R * 0.35); c.ellipse(hx, hy - R * 0.38, R * 1.06, R * 0.86, 0, Math.PI, TAU); c.closePath(); }, '#a8b0bc', { s: 1.4, h: 0.8 });
          line(g, hx - R * 1.05, hy - R * 0.38, hx + R * 1.05, hy - R * 0.38, GOLD, 1.6);
          for (const s of [-1, 1]) F(g, c => { c.moveTo(hx + s * R * 0.7, hy - R * 0.85); c.quadraticCurveTo(hx + s * R * 1.8, hy - R * 1.1, hx + s * R * 1.6, hy - R * 2.1); c.quadraticCurveTo(hx + s * R * 1.3, hy - R * 1.3, hx + s * R * 0.45, hy - R * 1.15); c.closePath(); }, '#f2ead6', { s: 0.8, h: 0.5, lw: 1.5 });
        }
      },
      headBack(g, hx, hy, R) { F(g, P_.circ(hx, hy, R * 1.04), beard, { s: R * 0.2, h: R * 0.1 }); F(g, rr(hx - R * 1.05, hy - R * 0.85, R * 2.1, R * 0.32, R * 0.15), '#4a3020', { s: 0.4, h: 0.2, lw: 1.2 }); }
    };
  }
  function MAGE(t, o) {
    o = o || {}; const robe = o.robe || '#5a3ac0', hairC = o.hair || '#d8d0f4', hatC = o.hat || '#4a2ea8';
    const hat = (g, hx, hy, R, sw) => {
      F(g, ell(hx + R * 0.1, hy - R * 0.62, R * 1.55, R * 0.42, -0.08), hatC, { s: 1.2, h: 0.6 });
      F(g, c => { c.moveTo(hx - R * 0.75, hy - R * 0.72); c.quadraticCurveTo(hx - R * 0.2, hy - R * 2.0, hx - R * 0.9 - sw * 1.2, hy - R * 2.6); c.quadraticCurveTo(hx + R * 0.3, hy - R * 2.2, hx + R * 0.95, hy - R * 0.72); c.closePath(); }, hatC, { s: 1.6, h: 0.8 });
      F(g, c => { c.moveTo(hx - R * 0.78, hy - R * 0.86); c.quadraticCurveTo(hx + R * 0.1, hy - R * 1.08, hx + R * 0.96, hy - R * 0.86); c.lineTo(hx + R * 0.92, hy - R * 1.12); c.quadraticCurveTo(hx + R * 0.1, hy - R * 1.32, hx - R * 0.68, hy - R * 1.12); c.closePath(); }, GOLD, { s: 0.4, h: 0.3, lw: 1.2 });
      if (t >= 3) { dot(g, hx - R * 0.3, hy - R * 1.6, 1.2, '#fff6a0'); dot(g, hx + R * 0.15, hy - R * 1.45, 0.8, '#fff6a0'); }
    };
    return { tier: t, kind: 'staff', weapon: 'staff', wcol: o.wcol, R: 10, bw: 5.8, torso: 12, leg: 5, legW: 3.4,
      skin: SKIN, iris: o.iris || '#9a5ae0', legs: '#2a1a4a', boots: '#2a1a3a', sleeve: robe,
      cape: o.cape || (t >= 2 ? '#3a2280' : null), capeLen: 3, capeWide: 2,
      backHair: (g, hx, hy, R, sw) => F(g, blob([hx - R * 0.5, hy - R * 0.9, hx - R * 1.2, hy - R * 0.1, hx - R * 1.25 - sw, hy + R * 1.5, hx - R * 0.7 - sw * 1.2, hy + R * 2.3, hx + R * 0.1, hy + R * 1.8, hx + R * 0.3, hy + R * 0.6]), hairC, { s: R * 0.18, h: R * 0.08 }),
      torsoDraw(g, bw, hipY, h, back) {
        F(g, poly([-bw * 0.55, hipY - h, bw * 0.55, hipY - h, bw * 1.05, hipY + 3.5, -bw * 1.05, hipY + 3.5]), robe, { s: 2, h: 1 });
        if (t >= 2) line(g, -bw * 1.0, hipY + 3, bw * 1.0, hipY + 3, GOLD, 1.2);
        if (!back) { line(g, 0, hipY - h + 1, 0, hipY + 3, GOLD, 1); F(g, rr(-bw * 0.6, hipY - h + 5.5, bw * 1.2, 2, 0.8), GOLD, { s: 0.3, h: 0.3, lw: 1.1 }); if (t >= 4) F(g, poly([0, hipY - h + 1.5, 1.4, hipY - h + 3.2, 0, hipY - h + 4.9, -1.4, hipY - h + 3.2]), '#c08aff', { s: 0, h: 0.4, lw: 1 }); }
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

  /* ================== 4 ANH HÙNG CHIBI ================== */
  const HEROES = {
    aldric: (t, wt) => HUMAN(t, { hair: '#eef2f8', spiky: true, armor: '#3a5ab8', cape: '#1e3488', weapon: 'greatsword', shield: false, iris: '#3a8ad8', wcol: wt >= 3 ? '#ffe680' : '#9ae0ff' }),
    lyra: (t) => ELF(t, { hair: '#6ae0c8', tunic: '#2f8a6a', cape: '#1f6a5a' }),
    selene: (t) => MAGE(t, { hair: '#f4f6ff', hat: '#2a3aa0', robe: '#3a5ac8', cape: '#22307a', wcol: '#8ad8ff', iris: '#3a8ad8' }),
    borin: (t) => DWARF(t, { beard: '#c8401e', helmet: true, weapon: 'warhammer', leather: '#6a4a3a' })
  };
  function installHeroes() {
    const reg = window.ArtChars; if (!reg || !reg.heroKey) return;
    reg.heroKey = function (id, tiers) {
      tiers = tiers || [0, 0, 0, 0];
      const key = 'c_' + id + '_' + tiers.join('');
      if (!reg[key] && HEROES[id]) {
        const sum = tiers.reduce((a, b) => a + b, 0), t = Math.min(4, 2 + Math.floor(sum / 4));
        const S = HEROES[id](t, tiers[0]); S.R = 10.6;
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
        const S = MAKERS[name](t), key = name + t, old = reg[key] || {};
        const tall = (S.leg || 6.5) + (S.torso || 11) + (S.R || 10) * 1.9;
        reg[key] = { draw: (g, P) => body(g, P, S, false), box: BOX, dr: 12, head: tall * 0.75, tall, wide: 26, chibi: true };
        reg[key + '_b'] = { draw: (g, P) => body(g, P, S, true), box: BOX, dr: 12, head: tall * 0.75, tall, wide: 26, chibi: true };
      }
    });
    if (window.Painter) Painter.clear();
  }
  window.Chibi = { register, MAKERS };
  register(); installHeroes();
})();
