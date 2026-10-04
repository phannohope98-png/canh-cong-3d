/* =========================================================
 * effects.js – Hạt, số sát thương, vòng nổ, rung màn hình
 * Dùng Object Pool để không tạo rác bộ nhớ liên tục.
 * ========================================================= */
(function () {
  const MAX_PARTICLES = 320, MAX_TEXTS = 60, MAX_RINGS = 40;

  // Xoá phần tử i khỏi mảng trong O(1) (đổi chỗ với phần tử cuối)
  function swapRemove(arr, i) { const last = arr.pop(); if (i < arr.length) arr[i] = last; }

  const Effects = {
    particles: [], pPool: [],
    texts: [], tPool: [],
    rings: [], rPool: [], bolts: [],
    shakeAmp: 0, shakeTime: 0, shakeX: 0, shakeY: 0,

    /* Vòng phép (Phù Thủy) hiện dưới chân quái rồi tan */
    circles: [],
    magicCircle(x, y, r) { if (this.circles.length > 12) this.circles.shift(); this.circles.push({ x, y, r, t: 0 }); },
    drawCircles(ctx) {
      for (const c of this.circles) {
        const k = c.t / 0.6, a = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8, r = c.r * (0.7 + 0.3 * Math.min(1, k * 3));
        ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.globalCompositeOperation = 'lighter'; ctx.translate(c.x, c.y); ctx.scale(1, 0.42); ctx.rotate(c.t * 2);
        ctx.strokeStyle = '#a07aff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#e0d0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); for (let i = 0; i <= 6; i++) { const q = i / 6 * Math.PI * 2 * 2; ctx.lineTo(Math.cos(q) * r * 0.72, Math.sin(q) * r * 0.72); } ctx.stroke(); // ngôi sao 6 cánh
        for (let i = 0; i < 8; i++) { const q = i / 8 * Math.PI * 2; ctx.fillStyle = '#d8c8ff'; ctx.fillRect(Math.cos(q) * r * 0.86 - 2, Math.sin(q) * r * 0.86 - 2, 4, 4); }
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, 'rgba(160,110,255,0.35)'); gr.addColorStop(1, 'rgba(160,110,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    },
    /* Chữ hiệu ứng truyện tranh kiểu Kingdom Rush: BOOM! POW! KAPOW!… */
    comics: [], comicCd: 0,
    comic(x, y, word, col, force) {
      if (!force && (this.comicCd > 0 || Math.random() > 0.35)) return;
      this.comicCd = 0.7; if (this.comics.length > 5) this.comics.shift();
      this.comics.push({ x, y, word, col: col || '#ffe14a', t: 0, rot: (Math.random() - 0.5) * 0.35 });
    },
    drawComics(ctx) {
      for (const c of this.comics) {
        const k = c.t / 0.85, pop = k < 0.15 ? 0.4 + k / 0.15 * 0.85 : k < 0.25 ? 1.25 - (k - 0.15) * 2.5 : 1;
        ctx.save(); ctx.globalAlpha = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
        ctx.translate(c.x, c.y - k * 14); ctx.rotate(c.rot); ctx.scale(pop, pop);
        // nổ sao phía sau chữ
        ctx.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, r = i % 2 ? 22 : 34; ctx.lineTo(Math.cos(a) * r * 1.5, Math.sin(a) * r * 0.75); } ctx.closePath();
        ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#1b0f16'; ctx.stroke();
        ctx.font = '900 22px "Alegreya SC", "Alegreya Sans", system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#1b0f16'; ctx.strokeText(c.word, 0, 1);
        ctx.fillStyle = c.col; ctx.fillText(c.word, 0, 1);
        ctx.restore();
      }
    },
    /* Vết trên mặt đất: cháy xém (nổ) / vết máu (quái chết) – mờ dần */
    decals: [],
    decal(x, y, r, kind) {
      if (this.decals.length >= 60) this.decals.shift();
      this.decals.push({ x, y, r, kind, t: 0, life: kind === 'scorch' ? 6 : 4, seed: Math.random() * 100 });
    },
    drawDecals(ctx) {
      for (const d of this.decals) {
        const a = Math.min(1, d.t * 8) * Math.max(0, 1 - d.t / d.life);
        if (a <= 0) continue;
        ctx.save(); ctx.globalAlpha = a;
        if (d.kind === 'scorch') {
          const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r); g.addColorStop(0, 'rgba(20,10,5,0.55)'); g.addColorStop(0.6, 'rgba(40,20,10,0.35)'); g.addColorStop(1, 'rgba(40,20,10,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = d.kind === 'goo' ? 'rgba(90,40,140,0.55)' : 'rgba(120,10,16,0.5)';
          for (let i = 0; i < 5; i++) { const s = d.seed + i * 1.7, ox = Math.sin(s) * d.r * 0.7, oy = Math.cos(s * 1.3) * d.r * 0.3, rr = d.r * (0.25 + (i === 0 ? 0.3 : Math.abs(Math.sin(s * 2.1)) * 0.2));
            ctx.beginPath(); ctx.ellipse(d.x + ox, d.y + oy, rr, rr * 0.5, 0, 0, Math.PI * 2); ctx.fill(); }
        }
        ctx.restore();
      }
    },
    /* Xác ngã xuống rồi mờ dần (kiểu Kingdom Rush) */
    corpses: [],
    corpse(type, x, y, scale, face, fly, roll) {
      if (this.corpses.length >= 40) this.corpses.shift();
      this.corpses.push({ type, x, y, scale, face: face || 1, fly: !!fly, roll: !!roll, t: 0 });
    },
    drawCorpses(ctx) {
      for (const c of this.corpses) {
        const f = Math.min(1, c.t / 0.3), e = 1 - (1 - f) * (1 - f), a = c.t < 0.75 ? 1 : Math.max(0, 1 - (c.t - 0.75) / 0.65);
        if (a <= 0) continue;
        ctx.save(); ctx.globalAlpha = a;
        const d3 = window.Art3D && Art3D.enabled && ArtChars[c.type] && ArtChars[c.type].__3d;
        if (d3) { // mô hình 3D: dùng luôn hoạt ảnh ngã của nhân vật
          const ph = Math.min(1, c.t / 0.8);
          Painter.char(ctx, c.type, c.x, c.y, c.scale, c.face, 'die', ph);
          if (c.t < 0.18) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (0.18 - c.t) / 0.18 * 0.7; Painter.char(ctx, c.type, c.x, c.y, c.scale, c.face, 'die', ph); }
          ctx.restore(); continue;
        }
        if (c.roll) { // goblin ngã lăn vài vòng
          const k = Math.min(1, c.t / 0.55), h = 10 * c.scale;
          ctx.translate(c.x - c.face * k * 34, c.y - Math.sin(k * Math.PI) * 8 - h * (1 - k) * 0.5); ctx.rotate(-c.face * (k * Math.PI * 4 + (k >= 1 ? 0 : 0)) - c.face * k * 1.42 * 0); ctx.translate(0, h * (1 - k) * 0.5);
          if (k >= 1) ctx.rotate(-c.face * 1.42);
        } else { ctx.translate(c.x, c.y + (c.fly ? e * 34 : 0)); ctx.rotate(-c.face * e * 1.42); ctx.scale(1, 1 - e * 0.12); }
        Painter.char(ctx, c.type, 0, 0, c.scale, c.face, 'idle', 0);
        if (c.t < 0.18) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (0.18 - c.t) / 0.18 * 0.7; Painter.char(ctx, c.type, 0, 0, c.scale, c.face, 'idle', 0); }
        ctx.restore();
      }
    },
    clear() {
      while (this.particles.length) this.pPool.push(this.particles.pop());
      while (this.texts.length) this.tPool.push(this.texts.pop());
      while (this.rings.length) this.rPool.push(this.rings.pop());
      this.bolts.length = 0; this.corpses.length = 0; this.decals.length = 0; this.comics.length = 0; this.circles.length = 0;
      this.shakeAmp = this.shakeTime = this.shakeX = this.shakeY = 0;
    },

    particle(x, y, vx, vy, life, color, size, gravity) {
      if (this.particles.length >= MAX_PARTICLES) return;
      const p = this.pPool.pop() || {};
      p.x = x; p.y = y; p.vx = vx; p.vy = vy; p.life = p.maxLife = life;
      p.color = color; p.size = size; p.g = gravity || 0;
      this.particles.push(p);
    },

    burst(x, y, color, count, speed, life, size, gravity) {
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2, s = speed * (0.4 + Math.random() * 0.6);
        this.particle(x, y, Math.cos(a) * s, Math.sin(a) * s, life * (0.6 + Math.random() * 0.4), color, size * (0.6 + Math.random() * 0.6), gravity);
      }
    },

    ring(x, y, r0, r1, life, color, width) {
      if (this.rings.length >= MAX_RINGS) return;
      const r = this.rPool.pop() || {};
      r.x = x; r.y = y; r.r0 = r0; r.r1 = r1; r.life = r.maxLife = life; r.color = color; r.w = width || 4; r.glow = false;
      this.rings.push(r);
    },

    text(x, y, str, color, size, crit) {
      if (this.texts.length >= MAX_TEXTS) return;
      const t = this.tPool.pop() || {};
      t.x = x + (Math.random() - 0.5) * 14; t.y = y; t.str = str; t.color = color;
      t.size = size || 20; t.crit = !!crit; t.life = t.maxLife = crit ? 1.0 : 0.8;
      this.texts.push(t);
    },

    /** Chớp sáng tròn (nổ phép) */
    flash(x, y, r, color) {
      if (this.rings.length >= MAX_RINGS) return;
      const o = this.rPool.pop() || {};
      o.x = x; o.y = y; o.r0 = r * 0.3; o.r1 = r; o.life = o.maxLife = 0.3; o.color = color; o.w = 0; o.glow = true;
      this.rings.push(o);
    },
    /** Đồng vàng bật lên khi diệt quái */
    coin(x, y, n) {
      for (let i = 0; i < Math.min(4, 1 + Math.floor(n / 10)); i++) this.particle(x + (Math.random() - 0.5) * 10, y, (Math.random() - 0.5) * 90, -160 - Math.random() * 60, 0.7, '#ffd84a', 7, 420);
      this.text(x, y - 10, '+' + n, '#ffd84a', 15);
    },
    lightning(x1, y1, x2, y2) {
      const pts = [x1, y1]; const n = 6;
      for (let i = 1; i < n; i++) { const t = i / n; pts.push(x1 + (x2 - x1) * t + (Math.random() - 0.5) * 16, y1 + (y2 - y1) * t + (Math.random() - 0.5) * 16); }
      pts.push(x2, y2); this.bolts.push({ pts, life: 0.22 });
    },
    hit(x, y, color) { this.burst(x, y, color || '#fff', 5, 120, 0.25, 4); },
    explosion(x, y, radius, color) {
      this.decal(x, y + 4, radius * 0.75, 'scorch');
      this.flash(x, y, radius * 1.3, '#ffb347');
      this.ring(x, y, radius * 0.2, radius, 0.35, color || '#ffb347', 6);
      this.burst(x, y, color || '#ff7b2e', 18, radius * 3, 0.5, 7);
      this.burst(x, y, '#ffe08a', 8, radius * 2, 0.35, 5);
    },
    death(x, y, color) {
      this.burst(x, y, color || '#c9c9c9', 12, 140, 0.5, 6, 200);
      this.ring(x, y, 4, 30, 0.3, 'rgba(255,255,255,0.8)', 3);
    },
    confetti(cx, cy, w) {
      const colors = ['#e2b45a', '#f3d28a', '#c0453a', '#e9dcc0', '#b8893f'];
      for (let i = 0; i < 120; i++) {
        this.particle(cx + (Math.random() - 0.5) * w, cy - Math.random() * 200,
          (Math.random() - 0.5) * 120, -Math.random() * 250, 2 + Math.random(), colors[i % colors.length], 7, 260);
      }
    },

    shake(amp, time) {
      if (!Save.data.settings.shake) return;
      this.shakeAmp = Math.max(this.shakeAmp, amp);
      this.shakeTime = Math.max(this.shakeTime, time);
    },

    update(dt) {
      for (let i = this.corpses.length - 1; i >= 0; i--) { const c = this.corpses[i]; c.t += dt; if (c.t > 1.6) this.corpses.splice(i, 1); }
      for (let i = this.decals.length - 1; i >= 0; i--) { const d = this.decals[i]; d.t += dt; if (d.t > d.life) this.decals.splice(i, 1); }
      for (let i = this.circles.length - 1; i >= 0; i--) { this.circles[i].t += dt; if (this.circles[i].t > 0.6) this.circles.splice(i, 1); }
      if (this.comicCd > 0) this.comicCd -= dt; for (let i = this.comics.length - 1; i >= 0; i--) { const c = this.comics[i]; c.t += dt; if (c.t > 0.85) this.comics.splice(i, 1); }
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) { this.pPool.push(p); swapRemove(this.particles, i); continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.98; if (!p.g) p.vy *= 0.98;
      }
      for (let i = this.texts.length - 1; i >= 0; i--) {
        const t = this.texts[i];
        t.life -= dt;
        if (t.life <= 0) { this.tPool.push(t); swapRemove(this.texts, i); continue; }
        t.y -= 45 * dt;
      }
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.life -= dt;
        if (r.life <= 0) { this.rPool.push(r); swapRemove(this.rings, i); }
      }
      for (let i = this.bolts.length - 1; i >= 0; i--) { this.bolts[i].life -= dt; if (this.bolts[i].life <= 0) this.bolts.splice(i, 1); }
      if (this.shakeTime > 0) {
        this.shakeTime -= dt;
        const a = this.shakeAmp * Math.min(1, this.shakeTime * 4);
        this.shakeX = (Math.random() - 0.5) * 2 * a; this.shakeY = (Math.random() - 0.5) * 2 * a;
        if (this.shakeTime <= 0) { this.shakeAmp = 0; this.shakeX = this.shakeY = 0; }
      }
    },

    draw(ctx) {
      for (let i = 0; i < this.rings.length; i++) {
        const r = this.rings[i], k = 1 - r.life / r.maxLife, rad = r.r0 + (r.r1 - r.r0) * k;
        if (r.glow) { ArtKit.glow(ctx, r.x, r.y, rad * 1.4, r.color, (1 - k) * 1.2); continue; }
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = r.color; ctx.lineWidth = r.w * (1 - k * 0.6);
        ctx.beginPath(); ctx.ellipse(r.x, r.y, rad, rad * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
      }
      for (const b of this.bolts) {
        ctx.globalAlpha = Math.min(1, b.life * 6);
        for (const [w, c] of [[6, 'rgba(160,200,255,0.5)'], [2.4, '#ffffff']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); for (let i = 0; i < b.pts.length; i += 2) i ? ctx.lineTo(b.pts[i], b.pts[i + 1]) : ctx.moveTo(b.pts[i], b.pts[i + 1]); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i], k = p.life / p.maxLife;
        ctx.globalAlpha = Math.min(1, k * 1.6);
        ctx.fillStyle = p.color;
        const s = p.size * (0.5 + k * 0.5);
        ctx.beginPath(); ctx.arc(p.x, p.y, s / 2, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    },

    drawTexts(ctx) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      for (let i = 0; i < this.texts.length; i++) {
        const t = this.texts[i], k = t.life / t.maxLife;
        const pop = t.crit ? 1 + Math.max(0, (k - 0.75)) * 3 : 1;
        ctx.globalAlpha = Math.min(1, k * 2);
        ctx.font = `800 ${Math.round(t.size * pop)}px "Alegreya Sans", system-ui, sans-serif`;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,10,30,0.85)';
        ctx.strokeText(t.str, t.x, t.y); ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    }
  };

  window.Effects = Effects;
  window.swapRemove = swapRemove;
})();
