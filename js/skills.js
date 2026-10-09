/* =========================================================
 * skills.js – Kỹ năng của 4 anh hùng (đúng 1 chạm, tự nhắm mục tiêu) + hiệu ứng riêng cho từng kỹ năng
 *  Aldric  Thánh Quang Giáng Thế : trụ sáng giáng xuống, vòng sáng gây sát thương, hồi máu + ban giáp phước cho quân ta
 *  Lyra    Mưa Tên Sao Băng      : tự nhắm cụm quái đông nhất, 4 đợt mưa tên + mũi tên khổng lồ kết thúc
 *  Selene  Bão Tuyết Vĩnh Cửu    : quả cầu băng bay tới cụm quái, mở vùng bão tuyết làm chậm + sát thương, vỡ tung đóng băng
 *  Borin   Rồng Đá Địa Chấn      : nhảy vọt tới cụm quái, đập đất nứt toác, choáng + dư chấn
 * Chạm nút kỹ năng 1 lần là đủ: game tự tìm cụm quái đông nhất trong tầm; không có mục tiêu thì KHÔNG mất thời gian hồi.
 * ========================================================= */
(function () {
  const TAU = Math.PI * 2, rnd = Math.random, K = ArtKit;
  const ease = t => t * t * (3 - 2 * t), outQ = t => 1 - (1 - t) * (1 - t), cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const RY = 0.8; // nén theo chiều sâu (khớp vòng nổ của Effects)

  const Skills = {
    fx: [], zones: [],
    reset() { this.fx.length = 0; this.zones.length = 0; },

    /** cụm quái đông nhất trong tầm range quanh (x0,y0): trả về tâm cụm + số quái; null nếu không có */
    densest(x0, y0, range, r, air) {
      let best = null;
      for (const e of Enemies.list) {
        if (!e.alive || (e.flying && !air) || Math.hypot(e.x - x0, e.y - y0) > range) continue;
        let c = 0, sx = 0, sy = 0;
        for (const o of Enemies.list) if (o.alive && (air || !o.flying) && Math.hypot(o.x - e.x, (o.y - e.y) * 1.2) < r * 0.85) { const w = o.boss ? 3 : 1; c += w; sx += o.x * w; sy += o.y * w; }
        c += e.dist * 0.0004; // hoà thì chọn cụm đi xa hơn trên đường
        if (!best || c > best.c) best = { c, x: sx / Math.max(1, Math.floor(c)), y: sy / Math.max(1, Math.floor(c)), n: Math.floor(c) };
      }
      if (best) { // tâm = trung bình, rồi kéo về gần quái thật nhất để không rơi vào khoảng trống
        let near = null, nd = 1e9; for (const e of Enemies.list) if (e.alive && (air || !e.flying)) { const d = Math.hypot(e.x - best.x, e.y - best.y); if (d < nd) { nd = d; near = e; } }
        if (near && nd > 30) { best.x = best.x * 0.4 + near.x * 0.6; best.y = best.y * 0.4 + near.y * 0.6; }
      }
      return best;
    },

    /** Gọi từ Hero.cast. Trả { ok, msg }: ok = false thì KHÔNG tính thời gian hồi */
    cast(u) {
      const S = u.heroDef.skill, lvm = 1 + (u.level - 1) * CONFIG.heroPerLevel, dm = u.damage[1] / u.heroDef.damage[1] / lvm, dmg = S.damage * lvm * dm;
      if (S.id === 'holy') {
        let any = false;
        for (const e of Enemies.list) if (e.alive && Math.hypot(e.x - u.x, e.y - u.y) < S.radius * 1.5) { any = true; break; }
        if (!any) for (const o of Units.list) if (o.active && o !== u && o.hp < o.maxHp && Math.hypot(o.x - u.x, o.y - u.y) < S.radius * 1.5) { any = true; break; }
        this.fx.push({ k: 'holy', u, S, dmg, t: 0, dur: 1.6, x: u.x, y: u.y, fired: false });
        u.castT = 0.55; u.atk = 0; return { ok: true };
      }
      let tg = this.densest(u.x, u.y, S.range || 420, S.radius, S.id !== 'quake');
      if (!tg) { // không có cụm nào trong tầm → nhắm con quái gần nhất trên bản đồ (kỹ năng luôn tung được)
        let best = null, bd = 1e9; for (const e of Enemies.list) if (e.alive && (S.id !== 'quake' || !e.flying)) { const d = Math.hypot(e.x - u.x, e.y - u.y); if (d < bd) { bd = d; best = e; } }
        if (!best) return { ok: false, msg: 'Chưa có quái nào trên bản đồ' };
        tg = { x: best.x, y: best.y, n: 1 };
      }
      if (S.id === 'quake') { const dx = tg.x - u.x, dy = tg.y - u.y, d = Math.hypot(dx, dy), mx = 560; if (d > mx) { tg.x = u.x + dx / d * mx; tg.y = u.y + dy / d * mx; } }
      if (S.id === 'rain') {
        this.fx.push({ k: 'rain', S, dmg, t: 0, dur: 2.7, x: tg.x, y: tg.y, r: S.radius, vol: 0, arrows: [], big: null });
        u.castT = 0.5; u.atk = 0; u.face = tg.x >= u.x ? 1 : -1; return { ok: true };
      }
      if (S.id === 'frost') {
        this.fx.push({ k: 'orb', S, dmg, t: 0, dur: 0.45, sx: u.x + u.face * 8, sy: u.y - 34, x: tg.x, y: tg.y });
        u.castT = 0.5; u.atk = 0; u.face = tg.x >= u.x ? 1 : -1; return { ok: true };
      }
      if (S.id === 'quake') {
        u.leap = { sx: u.x, sy: u.y, tx: tg.x, ty: tg.y, t: 0, dur: 0.55, S, dmg }; u.castT = 0.55 + 0.4; u.atk = -1; u.target = null; u.tUid = -1;
        u.face = tg.x >= u.x ? 1 : -1;
        Effects.burst(u.x, u.y + 6, '#c8b890', 10, 120, 0.4, 6, 140); AudioSys.play('rage'); return { ok: true };
      }
      return { ok: false };
    },

    /** nhảy của Borin (gọi mỗi khung từ Unit.update) */
    stepLeap(u, dt) {
      const L = u.leap; if (!L) return;
      L.t += dt; const k = cl(L.t / L.dur, 0, 1);
      u.x = L.sx + (L.tx - L.sx) * ease(k); u.y = L.sy + (L.ty - L.sy) * ease(k); u.lift = Math.sin(k * Math.PI) * 105;
      u.face = L.tx >= L.sx ? 1 : -1;
      if (k >= 1) { u.leap = null; u.lift = 0; u.postX = u.x; u.postY = u.y; this.quakeLand(u, L); }
    },
    quakeLand(u, L) {
      const S = L.S, x = u.x, y = u.y;
      const hit = (r, dmg, stun) => { Combat.splash(x, y, r, dmg, 'physical'); for (const e of Enemies.list) if (e.alive && !e.flying && Math.hypot(e.x - x, (e.y - y) * 1.2) < r + e.radius) e.stunT = Math.max(e.stunT || 0, stun * (e.boss ? 0.35 : 1)); };
      hit(S.radius, L.dmg, S.stun);
      const cracks = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + (rnd() - 0.5) * 0.4, pts = [[0, 0]]; let d = 0; const len = S.radius * (0.75 + rnd() * 0.45); while (d < len) { d += 14 + rnd() * 16; const aa = a + (rnd() - 0.5) * 0.55; pts.push([Math.cos(aa) * d, Math.sin(aa) * d * RY]); } cracks.push(pts); }
      this.fx.push({ k: 'quake', S, x, y, t: 0, dur: 2.6, cracks, after: false, dmg: L.dmg, rocks: Array.from({ length: 12 }, () => ({ a: rnd() * TAU, v: 80 + rnd() * 150, up: 220 + rnd() * 220, s: 3 + rnd() * 4 })) });
      Effects.flash(x, y - 10, S.radius * 1.4, '#ffd9a0'); Effects.ring(x, y, 8, S.radius * 1.05, 0.5, '#e8d8b0', 10); Effects.ring(x, y, 4, S.radius * 0.6, 0.38, '#ffb060', 7);
      Effects.burst(x, y, '#b09a78', 26, 220, 0.7, 8, 300); Effects.burst(x, y - 6, '#6a5a48', 14, 190, 0.8, 6, 420);
      AudioSys.play('explode'); Effects.shake(15, 0.6); Effects.comic(x, y - 76, 'ĐỊA CHẤN!', '#ffb04a', true);
    },

    update(dt) {
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i]; f.t += dt;
        const fn = UPD[f.k]; if (fn) fn(f, dt, i);
        if (f.t >= f.dur || f.dead) this.fx.splice(i, 1);
      }
      for (let i = this.zones.length - 1; i >= 0; i--) { const z = this.zones[i]; z.t += dt; frostZone(z, dt); if (z.t >= z.dur) { frostShatter(z); this.zones.splice(i, 1); } }
    },
    drawGround(c, now) { for (const f of this.fx) { const fn = GRD[f.k]; if (fn) fn(f, c, now); } for (const z of this.zones) drawFrostGround(z, c, now); },
    drawSky(c, now) { for (const f of this.fx) { const fn = SKY[f.k]; if (fn) fn(f, c, now); } for (const z of this.zones) drawFrostSky(z, c, now); }
  };

  /* ================= ALDRIC – Thánh Quang Giáng Thế ================= */
  const UPD = {}, GRD = {}, SKY = {};
  UPD.holy = (f, dt) => {
    const u = f.u; f.x = u.x; f.y = u.y + u.radius * 0.5;
    if (f.t < 0.38 && rnd() < dt * 60) Effects.particle(f.x + (rnd() - 0.5) * f.S.radius * 1.6, f.y + (rnd() - 0.5) * 30, 0, -70 - rnd() * 60, 0.5, '#ffe9a0', 4); // điểm sáng bay lên khi tụ lực
    if (!f.fired && f.t >= 0.38) {
      f.fired = true; const S = f.S, x = f.x, y = f.y;
      Combat.splash(x, y, S.radius, f.dmg, 'magic', { air: true });
      for (const e of Enemies.list) if (e.alive && Math.hypot(e.x - x, (e.y - y) * 1.2) < S.radius + e.radius) { e.slowT = Math.max(e.slowT || 0, S.slowTime); e.slowMul = Math.min(e.slowMul || 1, 1 - S.slow * (e.boss ? 0.5 : 1)); }
      for (const o of Units.list) if (o.active && Math.hypot(o.x - x, o.y - y) < S.radius * 1.5) {
        o.hp = Math.min(o.maxHp, o.hp + o.maxHp * S.heal); o.ward = S.wardTime; Effects.text(o.x, o.y - 52, '+' + Math.round(o.maxHp * S.heal), '#8aff6a', 18);
        for (let i = 0; i < 5; i++) Effects.particle(o.x + (rnd() - 0.5) * 20, o.y - 10, (rnd() - 0.5) * 20, -60 - rnd() * 50, 0.8, i % 2 ? '#9affb0' : '#fff2b0', 5);
      }
      Effects.flash(x, y - 20, S.radius * 1.6, '#fff4c0'); Effects.burst(x, y - 10, '#fff0a0', 34, 240, 0.8, 6, -80); Effects.burst(x, y, '#ffffff', 14, 150, 0.5, 4, -40);
      AudioSys.play('holy'); Effects.shake(7, 0.3); Effects.comic(x, y - 82, 'THÁNH QUANG!', '#fff27a', true);
    }
  };
  GRD.holy = (f, c, now) => {
    const R = f.S.radius, t = f.t, a = t < 0.2 ? t / 0.2 : t > 1.1 ? Math.max(0, 1 - (t - 1.1) / 0.5) : 1, g = ease(cl(t / 0.38, 0, 1)), r = R * (0.45 + 0.6 * g);
    if (a <= 0) return;
    c.save(); c.translate(f.x, f.y); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a;
    const gr = c.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, 'rgba(255,240,170,0.55)'); gr.addColorStop(0.7, 'rgba(255,210,90,0.22)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
    c.fillStyle = gr; c.beginPath(); c.ellipse(0, 0, r, r * RY, 0, 0, TAU); c.fill();
    c.scale(1, RY);
    c.strokeStyle = '#ffe58a'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
    c.lineWidth = 2.4; c.strokeStyle = '#fff6d0'; c.beginPath(); c.arc(0, 0, r * 0.82, 0, TAU); c.stroke();
    c.save(); c.rotate(t * 1.6); c.fillStyle = '#fff2b0'; for (let i = 0; i < 12; i++) { c.save(); c.rotate(i / 12 * TAU); c.translate(r * 0.91, 0); c.beginPath(); c.moveTo(4, 0); c.lineTo(-3, -3.6); c.lineTo(-3, 3.6); c.closePath(); c.fill(); c.restore(); } c.restore();
    c.save(); c.rotate(-t * 1.1); c.strokeStyle = '#ffd860'; c.lineWidth = 2.6; for (let k = 0; k < 2; k++) { c.rotate(Math.PI / 3 * k); c.beginPath(); for (let i = 0; i < 3; i++) { const q = i / 3 * TAU - Math.PI / 2; c.lineTo(Math.cos(q) * r * 0.74, Math.sin(q) * r * 0.74); } c.closePath(); c.stroke(); } c.restore(); // ngôi sao 6 cánh
    c.restore();
  };
  SKY.holy = (f, c, now) => {
    const t = f.t, R = f.S.radius;
    if (t >= 0.3 && t < 1.15) { // trụ sáng giáng xuống
      const k = (t - 0.3) / 0.85, w = (t < 0.5 ? (t - 0.3) / 0.2 : 1 - ease(cl((t - 0.5) / 0.65, 0, 1))) * 26 + 4;
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = c.createLinearGradient(f.x - w, 0, f.x + w, 0); gr.addColorStop(0, 'rgba(255,210,90,0)'); gr.addColorStop(0.5, 'rgba(255,250,215,0.95)'); gr.addColorStop(1, 'rgba(255,210,90,0)');
      c.fillStyle = gr; c.fillRect(f.x - w, f.y - 760, w * 2, 760);
      c.globalAlpha = 0.28 * (1 - k); c.fillStyle = 'rgba(255,225,130,1)'; c.fillRect(f.x - w * 2.2, f.y - 760, w * 4.4, 760);
      c.globalAlpha = 0.5 * (1 - k); c.strokeStyle = '#fff6c8'; c.lineWidth = 2; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(f.x + i * w * 0.5, f.y - 760); c.lineTo(f.x + i * w * 1.1, f.y); c.stroke(); }
      K.glow(c, f.x, f.y - 8, 60 + w, '#fff2b0', 0.9 * (1 - k));
      c.restore();
    }
    if (t >= 0.38 && t < 1.0) { // vòng sáng lan ra
      const k = (t - 0.38) / 0.5, r = R * (0.1 + 1.0 * outQ(cl(k, 0, 1))), a = 1 - cl(k, 0, 1);
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(f.x, f.y); c.scale(1, RY); c.globalAlpha = a;
      c.strokeStyle = '#fff6c8'; c.lineWidth = 14 * a + 2; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke();
      c.strokeStyle = '#ffc850'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, r * 0.93, 0, TAU); c.stroke();
      c.restore();
    }
  };

  /* ================= LYRA – Mưa Tên Sao Băng ================= */
  UPD.rain = (f, dt) => {
    const S = f.S, T = [0.55, 0.9, 1.25, 1.6];
    while (f.vol < T.length && f.t >= T[f.vol]) { // mỗi đợt: 9 mũi tên rơi xiên từ trên trời
      for (let i = 0; i < 15; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * f.r * 0.95; f.arrows.push({ x: f.x + Math.cos(a) * d, y: f.y + Math.sin(a) * d * RY, t0: f.t + rnd() * 0.16, fall: 0.26 + rnd() * 0.06, done: false, stuck: 0 }); }
      f.vol++; AudioSys.play('arrow');
      f.pend = f.pend || []; f.pend.push(f.t + 0.3);
    }
    for (let i = f.pend ? f.pend.length - 1 : -1; i >= 0; i--) if (f.t >= f.pend[i]) { f.pend.splice(i, 1); Combat.splash(f.x, f.y, f.r, f.dmg * 0.19, 'physical', { air: true }); Effects.shake(2, 0.1); }
    for (const a of f.arrows) { if (!a.done && f.t >= a.t0 + a.fall) { a.done = true; a.stuck = 0.9; Effects.burst(a.x, a.y, '#e8dcb8', 3, 70, 0.3, 4, 100); Effects.hit(a.x, a.y - 2, '#fff0b0'); } if (a.stuck > 0) a.stuck -= dt; }
    if (!f.big && f.t >= 1.95) { f.big = { t0: f.t, fall: 0.38 }; AudioSys.play('rage'); }
    if (f.big && !f.big.done && f.t >= f.big.t0 + f.big.fall) {
      f.big.done = true; Combat.splash(f.x, f.y, f.r * 0.8, f.dmg * 0.24, 'physical', { air: true });
      Effects.flash(f.x, f.y - 10, f.r * 1.2, '#d8ffb0'); Effects.ring(f.x, f.y, 8, f.r * 0.9, 0.5, '#c8ff9a', 8); Effects.ring(f.x, f.y, 4, f.r * 0.5, 0.35, '#ffffff', 5); Effects.burst(f.x, f.y, '#c8ffa0', 22, 220, 0.6, 6, 200);
      Effects.shake(8, 0.35); AudioSys.play('explode'); Effects.comic(f.x, f.y - 70, 'MƯA TÊN!', '#b8ff7a', true);
    }
  };
  GRD.rain = (f, c, now) => { // dấu nhắm trên mặt đất + mũi tên cắm
    const t = f.t, a = t < 0.2 ? t / 0.2 : t > 2.2 ? Math.max(0, 1 - (t - 2.2) / 0.5) : 1, k = t < 0.5 ? 1 + (1 - ease(t / 0.5)) * 0.5 : 1, r = f.r * k;
    c.save(); c.translate(f.x, f.y); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.9; c.scale(1, RY);
    const gr = c.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, 'rgba(190,255,140,0.28)'); gr.addColorStop(1, 'rgba(190,255,140,0)'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill();
    c.strokeStyle = '#d6ffa8'; c.lineWidth = 3.4; c.setLineDash([16, 10]); c.lineDashOffset = -now * 40; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.setLineDash([]);
    c.rotate(now * 1.4); c.lineWidth = 2.4; for (let i = 0; i < 4; i++) { c.rotate(Math.PI / 2); c.beginPath(); c.moveTo(r * 0.55, -6); c.lineTo(r * 0.7, 0); c.lineTo(r * 0.55, 6); c.stroke(); }
    c.restore();
    for (const q of f.arrows) if (q.stuck > 0 || (q.done && q.stuck > -1)) { if (q.stuck <= 0) continue; c.save(); c.globalAlpha = Math.min(1, q.stuck * 2); c.translate(q.x, q.y); c.rotate(-1.2); K.line(c, 0, 0, -20, 0, '#2a1810', 4); K.line(c, 0, 0, -20, 0, '#d8b070', 2.2); K.flat(c, [-16, 0, -24, -4.5, -21, 0, -24, 4.5], '#6ad06a'); c.restore(); }
  };
  SKY.rain = (f, c, now) => {
    const ang = Math.atan2(380, 110);
    for (const a of f.arrows) {
      if (a.done || f.t < a.t0) continue; const k = (f.t - a.t0) / a.fall, x = a.x - 110 * (1 - k), y = a.y - 380 * (1 - k);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.65 * k; c.strokeStyle = '#d8ffb0'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 40, y - 138); c.lineTo(x, y); c.stroke(); c.restore();
      if (!(window.Fx3D && Fx3D.draw(c, 'arrow', x, y, ang, 1.8, { gold: true }))) { c.save(); c.translate(x, y); c.rotate(ang); K.line(c, -16, 0, 4, 0, '#2a1810', 3.4); K.line(c, -16, 0, 4, 0, '#fff6d0', 1.8); K.flat(c, [4, -3, 11, 0, 4, 3], '#fff'); c.restore(); }
    }
    if (f.big && !f.big.done) { // mũi tên khổng lồ phát sáng
      const k = (f.t - f.big.t0) / f.big.fall, x = f.x - 60 * (1 - k), y = f.y - 520 * (1 - k), ag = Math.atan2(520, 60);
      c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createLinearGradient(x - 30, y - 330, x, y); gr.addColorStop(0, 'rgba(190,255,130,0)'); gr.addColorStop(1, 'rgba(230,255,190,0.95)');
      c.strokeStyle = gr; c.lineWidth = 22; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - 36, y - 330); c.lineTo(x, y); c.stroke(); K.glow(c, x, y, 54, '#c8ff90', 0.9); c.restore();
      if (!(window.Fx3D && Fx3D.draw(c, 'arrow', x, y, ag, 3.2, { gold: true }))) { c.save(); c.translate(x, y); c.rotate(ag); K.line(c, -44, 0, 10, 0, '#fff6d0', 7); K.flat(c, [10, -9, 30, 0, 10, 9], '#fff'); c.restore(); }
    }
  };

  /* ================= SELENE – Bão Tuyết Vĩnh Cửu ================= */
  UPD.orb = (f, dt) => {
    const k = cl(f.t / f.dur, 0, 1); f.cx = f.sx + (f.x - f.sx) * ease(k); f.cy = f.sy + (f.y - f.sy) * ease(k) - Math.sin(k * Math.PI) * 90;
    if (rnd() < dt * 90) Effects.particle(f.cx + (rnd() - 0.5) * 8, f.cy + (rnd() - 0.5) * 8, (rnd() - 0.5) * 30, 20 + rnd() * 30, 0.4, rnd() < 0.5 ? '#e8fbff' : '#8fd8ff', 5);
    if (f.t >= f.dur) {
      f.dead = true; const S = f.S;
      const z = { S, x: f.x, y: f.y, r: S.radius, t: 0, dur: S.zone, dmg: f.dmg / S.ticks, tickT: 0.15, seed: rnd() * 100,
        crystals: Array.from({ length: 11 }, (_, i) => { const a = i / 11 * TAU + rnd() * 0.5, d = (0.35 + rnd() * 0.6) * S.radius * 0.92; return { x: Math.cos(a) * d, y: Math.sin(a) * d * RY, h: 22 + rnd() * 34, w: 6 + rnd() * 5, lean: (rnd() - 0.5) * 8, delay: rnd() * 0.35 }; }).sort((a, b) => a.y - b.y) };
      Skills.zones.push(z);
      Effects.flash(f.x, f.y - 10, S.radius * 1.5, '#dff6ff'); Effects.ring(f.x, f.y, 8, S.radius * 1.1, 0.55, '#bfeaff', 9); Effects.burst(f.x, f.y - 6, '#e8fbff', 30, 230, 0.8, 6, 80);
      AudioSys.play('magic'); Effects.shake(6, 0.3); Effects.comic(f.x, f.y - 80, 'BÃO TUYẾT!', '#9fe0ff', true);
    }
  };
  SKY.orb = (f, c) => {
    if (f.cx === undefined) return;
    c.save(); c.globalCompositeOperation = 'lighter'; K.glow(c, f.cx, f.cy, 30, '#8fd8ff', 0.95); K.glow(c, f.cx, f.cy, 14, '#ffffff', 1); c.restore();
    c.save(); c.translate(f.cx, f.cy); c.rotate(f.t * 9); c.fillStyle = '#f2fdff'; c.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = i % 2 ? 4 : 11; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore();
  };
  function frostZone(z, dt) {
    const S = z.S;
    z.tickT -= dt;
    if (z.tickT <= 0) {
      z.tickT += z.dur / S.ticks;
      Combat.splash(z.x, z.y, z.r, z.dmg, 'magic', { air: true }); Effects.ring(z.x, z.y, z.r * 0.3, z.r, 0.45, '#bfeaff', 4);
    }
    for (const e of Enemies.list) if (e.alive && Math.hypot(e.x - z.x, (e.y - z.y) * 1.2) < z.r + e.radius) { e.slowT = Math.max(e.slowT || 0, S.slowTime); e.slowMul = Math.min(e.slowMul || 1, 1 - S.slow * (e.boss ? 0.5 : 1)); }
    if (rnd() < dt * 50) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * z.r; Effects.particle(z.x + Math.cos(a) * d, z.y + Math.sin(a) * d * RY - 20, (rnd() - 0.5) * 30, -20 - rnd() * 40, 0.7, '#ffffff', 3); }
  }
  function frostShatter(z) {
    const S = z.S;
    for (const e of Enemies.list) if (e.alive && !e.flying && Math.hypot(e.x - z.x, (e.y - z.y) * 1.2) < z.r + e.radius) { e.stunT = Math.max(e.stunT || 0, S.freeze * (e.boss ? 0.35 : 1)); }
    Effects.flash(z.x, z.y - 10, z.r * 1.4, '#e8fbff'); Effects.ring(z.x, z.y, 6, z.r * 1.15, 0.5, '#ffffff', 8); Effects.burst(z.x, z.y - 14, '#bfeaff', 34, 260, 0.8, 7, 320);
    for (const q of z.crystals) Effects.burst(z.x + q.x, z.y + q.y - q.h * 0.5, '#d8f4ff', 3, 130, 0.7, 6, 360);
    AudioSys.play('magic'); Effects.shake(5, 0.25);
  }
  function drawFrostGround(z, c, now) {
    const t = z.t, g = outQ(cl(t / 0.35, 0, 1)), a = t > z.dur - 0.5 ? Math.max(0, (z.dur - t) / 0.5) : 1, r = z.r * g;
    c.save(); c.translate(z.x, z.y); c.globalAlpha = a;
    const gr = c.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, 'rgba(235,250,255,0.85)'); gr.addColorStop(0.6, 'rgba(190,230,250,0.62)'); gr.addColorStop(1, 'rgba(160,215,245,0)');
    c.fillStyle = gr; c.beginPath(); c.ellipse(0, 0, r, r * RY, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.6; c.save(); c.scale(1, RY); for (let i = 0; i < 6; i++) { c.save(); c.rotate(i / 6 * TAU + z.seed); c.beginPath(); c.moveTo(0, 0); c.lineTo(r * 0.92, 0); for (const p of [0.38, 0.62]) { c.moveTo(r * p, 0); c.lineTo(r * p + 10, -9); c.moveTo(r * p, 0); c.lineTo(r * p + 10, 9); } c.stroke(); c.restore(); } c.restore();
    c.strokeStyle = 'rgba(200,240,255,0.9)'; c.lineWidth = 3; c.beginPath(); c.ellipse(0, 0, r, r * RY, 0, 0, TAU); c.stroke();
    for (const q of z.crystals) { // tinh thể băng mọc lên theo thời gian (vẽ sau nền để đè lên mặt băng)
      const k = ease(cl((t - 0.1 - q.delay) / 0.3, 0, 1)); if (k <= 0) continue; const h = q.h * k, shr = t > z.dur - 0.25 ? (z.dur - t) / 0.25 : 1;
      c.save(); c.translate(q.x, q.y); c.scale(1, shr); c.fillStyle = 'rgba(30,70,110,0.25)'; c.beginPath(); c.ellipse(5, 2, q.w * 1.3, q.w * 0.5, 0, 0, TAU); c.fill();
      c.beginPath(); c.moveTo(-q.w, 0); c.lineTo(-q.w * 0.35 + q.lean * 0.5, -h * 0.62); c.lineTo(q.lean, -h); c.lineTo(q.w * 0.5 + q.lean * 0.5, -h * 0.6); c.lineTo(q.w, 0); c.closePath();
      const cg = c.createLinearGradient(-q.w, 0, q.w, -h); cg.addColorStop(0, '#6cc0ee'); cg.addColorStop(0.55, '#c8f0ff'); cg.addColorStop(1, '#ffffff'); c.fillStyle = cg; c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#2a6a98'; c.lineJoin = 'round'; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-q.w * 0.35, -h * 0.12); c.lineTo(-q.w * 0.1 + q.lean * 0.6, -h * 0.8); c.stroke(); c.restore();
    }
    c.restore();
  }
  function drawFrostSky(z, c, now) { // xoáy bão tuyết
    const t = z.t, a = t > z.dur - 0.5 ? Math.max(0, (z.dur - t) / 0.5) : Math.min(1, t / 0.4); if (a <= 0) return;
    c.save(); c.translate(z.x, z.y); c.globalAlpha = a; c.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const u = i / 26, ang = now * (1.4 + (i % 4) * 0.25) + u * TAU * 3 + z.seed, rr = z.r * (0.25 + 0.75 * ((u * 7 + now * 0.15 * (1 + (i % 3))) % 1)), h = ((u * 13 + now * (0.4 + (i % 5) * 0.1)) % 1);
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr * RY - h * 90 + 10; c.globalAlpha = a * (0.35 + 0.5 * Math.sin(h * Math.PI)); c.strokeStyle = '#ffffff'; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - Math.sin(ang) * 9, y + Math.cos(ang) * 4); c.stroke();
    }
    c.globalAlpha = a * 0.35; c.globalCompositeOperation = 'lighter'; K.glow(c, 0, -30, z.r * 0.9, '#a8e0ff', 0.55);
    c.restore();
  }

  /* ================= BORIN – Rồng Đá Địa Chấn ================= */
  UPD.quake = (f, dt) => {
    if (!f.after && f.t >= 0.45) {
      f.after = true; const S = f.S, x = f.x, y = f.y, r = S.radius * 1.3;
      Combat.splash(x, y, r, f.dmg * S.after, 'physical');
      for (const e of Enemies.list) if (e.alive && !e.flying && Math.hypot(e.x - x, (e.y - y) * 1.2) < r + e.radius) e.stunT = Math.max(e.stunT || 0, 0.9 * (e.boss ? 0.35 : 1));
      Effects.ring(x, y, 10, r, 0.5, '#d8c8a8', 8); Effects.burst(x, y, '#a08a68', 16, 200, 0.6, 7, 300); Effects.shake(8, 0.3); AudioSys.play('explode');
    }
  };
  GRD.quake = (f, c, now) => {
    const t = f.t, grow = outQ(cl(t / 0.22, 0, 1)), a = t > 1.7 ? Math.max(0, 1 - (t - 1.7) / 0.9) : 1, glow = Math.max(0, 1 - t / 1.1), R = f.S.radius;
    c.save(); c.translate(f.x, f.y); c.lineJoin = 'round'; c.lineCap = 'round'; c.globalAlpha = a;
    const gr = c.createRadialGradient(0, 0, 0, 0, 0, R * 0.8 * grow); gr.addColorStop(0, 'rgba(58,38,22,0.85)'); gr.addColorStop(0.6, 'rgba(96,72,48,0.5)'); gr.addColorStop(1, 'rgba(96,72,48,0)');
    c.fillStyle = gr; c.beginPath(); c.ellipse(0, 0, R * 0.8 * grow, R * 0.8 * grow * RY, 0, 0, TAU); c.fill();                                   // hố lõm đất nâu
    for (const pts of f.cracks) {
      const n = Math.max(2, Math.ceil(pts.length * grow));
      for (let i = 1; i < n; i++) { const w = 5.2 * (1 - i / pts.length) + 1.3; c.beginPath(); c.moveTo(pts[i - 1][0] * grow, pts[i - 1][1] * grow); c.lineTo(pts[i][0] * grow, pts[i][1] * grow); c.strokeStyle = '#24160d'; c.lineWidth = w; c.stroke();
        if (glow > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,140,40,' + (0.85 * glow).toFixed(2) + ')'; c.lineWidth = w * 0.42; c.stroke(); c.restore(); } }
    }
    for (let i = 0; i < 10; i++) { const an = i * 2.4 + 0.5, d = R * (0.35 + 0.5 * ((i * 0.37) % 1)) * grow; c.fillStyle = '#6a5a48'; c.strokeStyle = '#2a2018'; c.lineWidth = 1.4; c.beginPath(); c.ellipse(Math.cos(an) * d, Math.sin(an) * d * RY, 5 + (i % 3) * 2, 3.4 + (i % 3), 0, 0, TAU); c.fill(); c.stroke(); } // đá vụn
    c.restore();
  };
  SKY.quake = (f, c, now) => {
    const t = f.t;
    if (t < 1.2) { // bụi cuộn + đá văng
      c.save(); c.translate(f.x, f.y);
      for (const r of f.rocks) { const k = t / 1.0; if (k > 1) continue; const x = Math.cos(r.a) * r.v * k, y = Math.sin(r.a) * r.v * k * RY - (r.up * k - 330 * k * k), s = r.s; c.globalAlpha = 1 - k * 0.5; c.fillStyle = '#6a5a48'; c.strokeStyle = '#2a2018'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * 0.3, y - s); c.lineTo(x + s, y - s * 0.4); c.lineTo(x + s * 0.6, y + s * 0.7); c.closePath(); c.fill(); c.stroke(); }
      const k = cl(t / 0.9, 0, 1); c.globalAlpha = (1 - k) * 0.5; c.fillStyle = '#b8a688';
      for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, d = f.S.radius * (0.2 + 0.7 * outQ(k)); c.beginPath(); c.ellipse(Math.cos(a) * d, Math.sin(a) * d * RY - 8 - k * 14, 16 + k * 22, 11 + k * 14, 0, 0, TAU); c.fill(); }
      c.restore();
    }
  };

  window.Skills = Skills;
})();
