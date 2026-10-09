/* =========================================================
 * units.js – Quân ta: lính doanh trại & anh hùng
 * Lính: ra 1 lần khi xây, chết thì hồi sinh tại trụ, rảnh thì tự hồi máu.
 * Anh hùng: chạm để chọn, chạm đường để di chuyển, có kỹ năng Thánh Quang.
 * ========================================================= */
(function () {
  const tmp = {}; let uid = 0;

  class Unit {
    constructor(o) {
      Object.assign(this, { uid: ++uid, face: 1, walk: 0, atk: -1, cd: 0.3, idleT: Math.random() * 3, flash: 0, stun: 0, alpha: 1,
        target: null, tUid: -1, scan: 0, moving: false, state: 'post', calm: 0, hits: 0, hitT: 0, shieldT: 0 }, o);
    }
    get active() { return this.state === 'post' || this.state === 'move'; }
    get alive() { return this.active; }

    moveTo(gx, gy, dt) {
      const dx = gx - this.x, dy = gy - this.y, d = Math.hypot(dx, dy);
      if (d < 1.5) { this.moving = false; return true; }
      const step = Math.min(d, this.speed * dt);
      this.x += dx / d * step; this.y += dy / d * step;
      if (Math.abs(dx) > 0.8) this.face = dx > 0 ? 1 : -1;
      this.dvx = dx / d; this.dvy = dy / d;
      this.moving = true; this.walk += step / 32;
      return d - step < 1.5;
    }

    update(dt) {
      if (this.flash > 0) this.flash -= dt;
      if (this.hitT > 0) this.hitT -= dt; if (this.popT > 0) this.popT -= dt; if (this.ward > 0) this.ward -= dt;
      if (this.shieldT > 0) this.shieldT -= dt;
      if (this.special === 'shieldwall' && this.active) { this.shieldCd = (this.shieldCd || 0) - dt; if (this.shieldCd <= 0 && this.hp < this.maxHp * 0.5) { this.shieldCd = 12; this.shieldT = 3; Effects.comic(this.x, this.y - 40, 'KHIÊN!', '#ffe14a', true); Effects.ring(this.x, this.y - 10, 6, 28, 0.4, '#ffe58a', 4); } }
      this.idleT += dt;
      if (this.state === 'dead') { this.respawnT -= dt; if (this.respawnT <= 0) this.respawn(); return; }
      if (this.alpha < 1) this.alpha = Math.min(1, this.alpha + dt * 3);
      if (this.stun > 0) { this.stun -= dt; this.moving = false; return; }
      if (this.isHero) Hero.tick(this, dt);

      // đòn đánh
      this.cd -= dt;
      if (this.atk >= 0) {
        const prev = this.atk; this.atk += dt / this.atkDur();
        const t = this.target;
        // chỉ trúng khi mục tiêu còn sống và vẫn trong tầm (tránh chém trúng con ở xa sau khi đổi mục tiêu)
        if (prev < 0.5 && this.atk >= 0.5 && t && t.alive && t.uid === this.tUid && Math.hypot(t.x - this.x, t.y - this.y) <= this.reachOf(t) + 14) {
          if (this.range) { Combat.fire(this.proj, this.x + this.face * 9, this.y - 26, t, { damage: this.damage, type: this.dtype || 'physical' }); AudioSys.play(this.proj === 'bolt' ? 'magic' : 'arrow'); }
          else {
            Combat.hitEnemy(t, this.damage, 'physical'); Effects.comic(t.x + this.face * 6, t.y - 44, ['POW!', 'BAM!', 'KAPOW!', 'SHUNT!', 'WHAM!'][(Math.random() * 5) | 0], ['#ffe14a', '#ff7a4a', '#7ae0ff'][(Math.random() * 3) | 0]); AudioSys.play(this.tower && this.tower.type === 'orc' ? 'orc' : 'sword'); Effects.hit(t.x - this.face * 4, t.y - t.height * 0.5, '#fff2c0');
            if (this.special === 'slam' && ++this.hits % 4 === 0) { // chiến binh Lùn đập đất
              Combat.splash(t.x, t.y, 58, [this.damage[0] * 0.6, this.damage[1] * 0.6], 'physical');
              for (const e of Enemies.list) if (e.alive && !e.flying && !e.boss && Math.hypot(e.x - t.x, (e.y - t.y) * 1.25) < 58 + e.radius) e.stunT = Math.max(e.stunT || 0, 1.2);
              Effects.ring(t.x, t.y, 8, 62, 0.4, '#e8d8b0', 6); Effects.burst(t.x, t.y, '#a89878', 16, 160, 0.5, 6, 260); Effects.shake(5, 0.2); Effects.comic(t.x, t.y - 50, 'RẦM!', '#ffb04a', true); AudioSys.play('explode');
            }
            if (this.special === 'stun' && ++this.hits % 3 === 0 && !t.boss) { t.stunT = Math.max(t.stunT || 0, 1.0); Effects.comic(t.x, t.y - 50, 'BONK!', '#ffe14a', true); Effects.ring(t.x, t.y, 6, 30, 0.3, '#ffe58a', 3); }
          }
        }
        if (this.atk >= 1) this.atk = -1;
      }
      // đang tung kỹ năng (nhảy / giơ vũ khí): đứng yên, không đánh thường
      if (this.castT > 0) { this.castT -= dt; this.moving = false; if (this.leap) Skills.stepLeap(this, dt); return; }
      // người chơi ra lệnh di chuyển (anh hùng / dời cờ) → bỏ mục tiêu
      if (this.state === 'move') {
        if (this.moveTo(this.postX, this.postY, dt)) this.state = 'post';
        return;
      }
      this.scan -= dt;
      const t = this.target;
      // giữ mục tiêu đang đánh (không đổi giữa nhát chém); quét lại khi mất mục tiêu hoặc định kỳ khi đang rảnh tay
      const lost = !t || !t.alive || t.uid !== this.tUid || (t.flying && !this.air) || Math.hypot(t.x - this.postX, t.y - this.postY) > this.engage + t.radius + 60;
      if (lost || (this.scan <= 0 && this.atk < 0)) { this.scan = 0.3; this.pick(lost ? null : t); }
      const e = this.target;
      if (e) {
        this.calm = 0;
        const dx = e.x - this.x, dy = e.y - this.y, d = Math.hypot(dx, dy) || 0.01, reach = this.reachOf(e);
        if (d > reach) { if (this.atk < 0) this.moveTo(e.x - dx / d * (reach - 2), e.y - dy / d * (reach - 2), dt); }
        else { this.moving = false; if (Math.abs(dx) > 2) this.face = dx >= 0 ? 1 : -1; if (this.cd <= 0 && this.atk < 0) { this.atk = 0; this.cd = this.rate; } }
      } else {
        if (this.atk < 0) this.moveTo(this.postX, this.postY, dt);
        this.calm += dt;
        if (this.calm > 1.5 && this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.regen * dt);
      }
    }

    reachOf(e) { return this.range ? this.range - 10 : e.radius + this.radius + 4; }
    /** thời gian 1 nhát đánh: theo tốc đánh (đánh nhanh thì vung nhanh), không dài hơn nhịp đánh */
    atkDur() { return Math.max(0.22, Math.min(0.45, this.rate * 0.55)); }
    /** Chọn quái gần vị trí canh: ưu tiên con đang đánh mình, rồi con chưa ai chặn. keep: mục tiêu hiện tại (được cộng điểm để khỏi đổi qua lại) */
    pick(keep) {
      const R = this.engage, cx = this.postX, cy = this.postY;
      let best = null, bs = Infinity;
      for (const e of Enemies.list) {
        if (!e.alive || (e.flying && !this.air)) continue;
        if (e !== keep && Math.hypot(e.x - cx, e.y - cy) > R + e.radius) continue;
        let taken = 0; for (const u of Units.list) if (u !== this && u.active && u.tUid === e.uid) taken++;
        let sc = Math.hypot(e.x - this.x, e.y - this.y) + taken * 55 - e.dist * 0.02;
        if (e.blocker === this) sc -= 400; if (e === keep) sc -= 40;
        if (sc < bs) { bs = sc; best = e; }
      }
      this.target = best; this.tUid = best ? best.uid : -1;
    }

    respawn() {
      this.hp = this.maxHp; this.state = 'post'; this.alpha = 0; this.popT = 0.4; this.target = null; this.atk = -1; this.stun = 0;
      if (this.isHero) { this.x = this.postX; this.y = this.postY; Effects.ring(this.x, this.y, 6, 50, 0.5, '#ffe58a', 5); }
      else { this.x = this.tower.x; this.y = this.tower.y + 12; this.tower.anim.door = 0.6; }
    }

    get drawY() { return this.y; }
    draw(ctx, time) {
      if (this.state === 'dead') return;
      const fy = this.y + this.radius * 0.5;
      ctx.globalAlpha = this.alpha * (this.temp ? Math.max(0, Math.min(1, this.life)) : 1);
      if (this.isHero) {
        ArtKit.shadow(ctx, this.x, fy, 22, 7, 0.25);
        const hs = Game.heroSel === this.heroIdx; ctx.strokeStyle = hs ? '#ffe58a' : this.heroIdx ? 'rgba(140,220,255,0.6)' : 'rgba(255,229,138,0.55)'; ctx.lineWidth = hs ? 3 : 2;
        ctx.beginPath(); ctx.ellipse(this.x, fy, 20, 7.5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      const mode = this.atk >= 0 ? 'atk' : this.moving ? 'walk' : 'idle';
      // ảnh art có 8 hướng 3D (hoặc 4 góc 2D): đi lên → quay lưng, đi ngang → nghiêng, đi xuống → quay mặt
      let art = this.art, face = this.face;
      const aim = mode === 'walk' ? Math.atan2(this.dvy || 0, this.dvx || 0) : this.target && this.target.alive !== false ? Math.atan2(this.target.y - this.y, this.target.x - this.x) : (this.face > 0 ? 0.35 : Math.PI - 0.35);
      const dk = (window.Anim && Anim.dirKey(art, aim, this)) || (window.Art3D && Art3D.dirKey && Art3D.dirKey(art, aim)); // 3D: 8 hướng thật, có trễ để không giật
      if (dk) { art = dk; face = 1; }
      else if (mode === 'walk') { const v = this.dvy || 0, s = v < -0.55 ? '_b' : v > 0.6 ? '_f' : Math.abs(this.dvx || 0) > 0.8 ? '_s' : ''; if (s && ArtChars[art + s]) art += s; }
      const ph = mode === 'atk' ? this.atk : mode === 'walk' ? this.walk : this.idleT;
      const P = Anim.pose(this, mode, mode === 'atk' ? this.atk : this.walk, mode === 'walk' ? (Math.cos(aim) >= 0 ? 1 : -1) : this.face, time); if (this.lift) { P.dy -= this.lift; P.sy *= 1 + this.lift * 0.0016; P.sx *= 1 - this.lift * 0.0009; }
      if (this.ward > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ArtKit.glow(ctx, this.x, fy - 16 * (CONFIG.unitScale || 1), 24, '#ffe58a', Math.min(0.55, this.ward * 0.5) * (0.75 + Math.sin(time * 6) * 0.25)); ctx.restore(); }
      Anim.begin(ctx, this.x, fy, P);
      Painter.char(ctx, art, this.x, fy, this.scale, face, mode, ph);
      if (this.flash > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(0.6, this.flash * 6); Painter.char(ctx, art, this.x, fy, this.scale, face, mode, ph); ctx.restore(); }
      ctx.restore();
      if (this.shieldT > 0) { // lá chắn khiên vàng
        const k = Math.min(1, this.shieldT * 3), s = (CONFIG.unitScale || 1);
        ctx.save(); ctx.globalAlpha = 0.55 * k; ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(this.x, fy - 14 * s, 4, this.x, fy - 14 * s, 26 * s); gr.addColorStop(0, 'rgba(255,230,120,0)'); gr.addColorStop(0.75, 'rgba(255,220,90,0.35)'); gr.addColorStop(1, 'rgba(255,245,180,0.9)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(this.x, fy - 14 * s, 22 * s, 26 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      if (this.stun > 0) for (let i = 0; i < 3; i++) { const a = time * 5 + i * 2.1; ArtKit.dot(ctx, this.x + Math.cos(a) * 9, fy - 46 + Math.sin(a) * 3, 2, '#ffe58a'); }
      ctx.globalAlpha = 1;
    }
    drawBar(ctx) {
      if (this.state === 'dead' || this.hp >= this.maxHp) return;
      hpBar(ctx, this.x, this.y + this.radius * 0.5 - (this.isHero ? 62 : 48) * (CONFIG.unitScale || 1), this.isHero ? 30 : 20, this.hp / this.maxHp, '#6ad04a');
    }
  }

  /* ---------------- Anh hùng (4 nhân vật, mang trang bị) ---------------- */
  const Hero = {
    create(map, id, idx) {
      idx = idx || 0; id = id || Progress.selectedHero(); const H = CONFIG.heroes[id], lv = Progress.heroLevel(id), m = 1 + (lv - 1) * CONFIG.heroPerLevel, gm = Progress.gearMods(id);
      const art = ArtChars.heroKey(id, Progress.wornTiers(id)), p = map.paths[0].pointAt(map.paths[0].length - 190 - idx * 56, {}); p.x += (p.nx || 0) * idx * 26; p.y += (p.ny || 0) * idx * 26;
      const hp = Math.round(H.hp * m * (1 + gm.hp)), dm = m * (1 + gm.dmg);
      const u = new Unit({ isHero: true, heroIdx: idx, heroId: id, heroDef: H, art, radius: H.radius, scale: H.radius / ArtChars[art].dr * (CONFIG.unitScale || 1) * 1.1, x: p.x, y: p.y, postX: p.x, postY: p.y,
        maxHp: hp, hp, damage: [H.damage[0] * dm, H.damage[1] * dm], armor: Math.min(0.8, H.armor + gm.arm), rate: H.attackRate / (1 + gm.rate),
        speed: H.speed * (1 + gm.spd), regen: H.regen, engage: 80, level: lv, skillCd: 0, range: H.range || 0, proj: H.proj, air: !!H.air, dtype: H.type, fx: null });
      return u;
    },
    tick(u, dt) {
      if (u.skillCd > 0) u.skillCd -= dt;
      u.engage = u.state === 'post' ? (u.range ? u.range + 20 : 135) : 0; // anh hùng cận chiến tự lao ra đánh quái trong ~135
    },
    moveHero(u, x, y) {
      if (u.state === 'dead') return;
      u.postX = x; u.postY = y; u.state = 'move'; u.target = null; u.tUid = -1; u.atk = -1;
      Effects.ring(x, y, 4, 26, 0.4, '#ffe58a', 3);
    },
    /** Chạm nút kỹ năng: Skills tự nhắm mục tiêu; không có mục tiêu thì không mất thời gian hồi. Trả { ok, msg } */
    cast(u) {
      if (u.state === 'dead') return { ok: false, msg: 'Anh hùng đang hồi sinh' };
      if (u.skillCd > 0) return { ok: false, msg: 'Kỹ năng đang hồi' };
      const r = Skills.cast(u);
      if (r.ok) { u.skillCd = u.heroDef.skill.cooldown; Effects.ring(u.x, u.y, 6, 46, 0.4, '#ffffff', 4); }
      return r;
    }
  };

  const Units = {
    list: [], hero: null,
    heroes: [],
    clear() { this.list.length = 0; this.hero = null; this.heroes = []; },
    /** đưa 1–2 anh hùng đã chọn ra trận (Units.hero = tướng chính, giữ cho mã cũ) */
    addHero(map) { this.heroes = Progress.selectedHeroes().map((id, i) => Hero.create(map, id, i)); this.heroes.forEach(h => this.list.push(h)); this.hero = this.heroes[0]; return this.hero; },
    count(towerType) { let n = 0; for (const u of this.list) if (u.active && !u.isHero && (!towerType || (u.tower && u.tower.type === towerType))) n++; return n; },

    /** Doanh trại vừa xây: tạo lính 1 lần */
    createFor(T) {
      for (let i = 0; i < T.def.soldiers; i++) this.list.push(new Unit({ tower: T, idx: i, x: T.x, y: T.y + 12, alpha: 0, radius: 12, speed: 95, rate: 1.0, engage: T.def.engage }));
      this.refresh(T, true); this.placePosts(T);
    },
    refresh(T, full) {
      const lv = T.def.levels[T.level - 1], M = Items.mods(T.type), hb = (1 + Progress.bonus(T.type, 'hp')) * (1 + M.hp), db = (1 + Progress.bonus(T.type, 'damage')) * (1 + M.damage);
      const sh = M.list[1], art = sh && ArtChars[lv.art + 's' + sh.r] ? lv.art + 's' + sh.r : lv.art; // có Khiên gắn trụ → lính cầm khiên (màu theo bậc)
      for (const u of this.list) if (u.tower === T) {
        const r = full || !u.maxHp ? 1 : u.hp / u.maxHp;
        u.maxHp = Math.round(lv.hp * hb); u.hp = Math.max(1, Math.round(u.maxHp * r)); u.damage = [lv.damage[0] * db, lv.damage[1] * db];
        u.armor = Math.min(0.85, lv.armor + M.armor); u.rate = (lv.rate || 1) / (1 + M.rate); u.block = M.block; u.art = art; u.special = lv.special; u.scale = 12 / ArtChars[art].dr * 1.05 * (CONFIG.unitScale || 1); u.regen = u.maxHp * 0.08;
      }
    },
    remove(T) { for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i].tower === T) this.list.splice(i, 1); },
    placePosts(T) {
      const path = Game.map.paths[T.rallyPath], L = path.length; let k = 0;
      const n = T.def.soldiers || 3, offs = n === 1 ? [[0, 0]] : n === 2 ? [[-13, -11], [13, 11]] : [[0, 0], [-20, -10], [20, 10]];
      for (const u of this.list) {
        if (u.tower !== T) continue;
        const o = offs[k % offs.length], p = path.pointAt(Math.max(30, Math.min(L - 30, T.rallyDist + o[0])), tmp);
        u.postX = p.x + p.nx * o[1] * 1.4; u.postY = p.y + p.ny * o[1] * 1.4;
        if (u.state === 'post' && !u.target) u.state = 'move';
        k++;
      }
    },
    kill(u) {
      if (!u.active) return;
      u.state = 'dead'; u.target = null; u.tUid = -1; u.atk = -1; u.leap = null; u.lift = 0; u.castT = 0; u.ward = 0;
      u.respawnT = u.respawnMax = u.isHero ? u.heroDef.respawn : u.tower ? u.tower.def.respawn * (1 - Math.min(0.6, Items.mods(u.tower.type).respawn)) : 0;
      Effects.corpse(u.art, u.x, u.y + u.radius * 0.5, u.scale, u.face);
      Effects.death(u.x, u.y - 14, u.isHero ? '#f2c14e' : '#9aa3b2');
      AudioSys.play('death');
    },
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const u = this.list[i];
        if (u.temp) { u.life -= dt; if (u.state === 'dead' || u.life <= 0) { if (u.state !== 'dead') Effects.ring(u.x, u.y, 4, 26, 0.4, '#8ac8ff', 3); this.list.splice(i, 1); continue; } }
        u.update(dt);
      }
    }
  };
  window.Units = Units; window.Hero = Hero; window.Unit = Unit;
})();
