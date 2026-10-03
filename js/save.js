/* =========================================================
 * save.js – Tiến trình người chơi (localStorage)
 * Sao → nâng cấp trụ. Xu → mở khoá anh hùng & mua trang bị.
 * ========================================================= */
(function () {
  const KEY = 'canhcong_v4';
  const SLOTS = ['weapon', 'gloves', 'armor', 'boots'];
  function defaults() {
    const upgrades = {}; Object.keys(CONFIG.upgrades).forEach(k => { upgrades[k] = 0; });
    const heroXp = {}, equip = {}; Object.keys(CONFIG.heroes).forEach(k => { heroXp[k] = 0; equip[k] = { weapon: 0, gloves: 0, armor: 0, boots: 0 }; });
    return { stars: {}, unlocked: 1, upgrades, heroXp, seen: {}, settings: { music: true, sound: true, shake: true },
      coins: CONFIG.startCoins, heroes: { aldric: true }, hero: 'aldric', gear: { weapon: 0, gloves: 0, armor: 0, boots: 0 }, equip };
  }
  const Save = {
    data: null,
    load() {
      let p = null; try { p = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
      const d = defaults();
      if (p && typeof p === 'object') {
        Object.assign(d.stars, p.stars || {}); Object.assign(d.upgrades, p.upgrades || {}); Object.assign(d.seen, p.seen || {}); Object.assign(d.settings, p.settings || {});
        Object.assign(d.heroXp, p.heroXp || {}); Object.assign(d.heroes, p.heroes || {}); Object.assign(d.gear, p.gear || {});
        for (const h in (p.equip || {})) if (d.equip[h]) Object.assign(d.equip[h], p.equip[h]);
        d.unlocked = p.unlocked || 1; d.coins = typeof p.coins === 'number' ? p.coins : d.coins;
        d.hero = d.heroes[p.hero] ? p.hero : 'aldric';
      }
      this.data = d; return d;
    },
    save() { try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {} },
    reset() { try { localStorage.removeItem(KEY); } catch (e) {} this.data = defaults(); this.save(); }
  };

  /** Tiện ích tiến trình */
  const Progress = {
    SLOTS,
    totalStars() { return Object.values(Save.data.stars).reduce((a, b) => a + b, 0); },
    spentStars() { let n = 0; for (const k in Save.data.upgrades) { const c = CONFIG.upgrades[k] && CONFIG.upgrades[k].cost; if (!c) continue; for (let i = 0; i < Save.data.upgrades[k]; i++) n += c[i]; } return n; },
    freeStars() { return this.totalStars() - this.spentStars(); },
    upLevel(type) { return Save.data.upgrades[type] || 0; },
    bonus(type, stat) { const u = CONFIG.upgrades[type]; return u && u.perLevel[stat] ? u.perLevel[stat] * this.upLevel(type) : 0; },
    buyUpgrade(type) {
      const u = CONFIG.upgrades[type], lv = this.upLevel(type);
      if (lv >= u.cost.length || this.freeStars() < u.cost[lv]) return false;
      Save.data.upgrades[type] = lv + 1; Save.save(); return true;
    },

    /* ---- Anh hùng ---- */
    selectedHero() { return Save.data.hero; },
    heroLevel(id) { id = id || Save.data.hero; const t = CONFIG.heroLevelXp, xp = Save.data.heroXp[id] || 0; let lv = 1; while (lv < t.length && xp >= t[lv]) lv++; return lv; },
    heroXpProgress(id) { id = id || Save.data.hero; const t = CONFIG.heroLevelXp, lv = this.heroLevel(id); if (lv >= t.length) return 1; return ((Save.data.heroXp[id] || 0) - t[lv - 1]) / (t[lv] - t[lv - 1]); },
    addHeroXp(id, n) { Save.data.heroXp[id] = (Save.data.heroXp[id] || 0) + n; },
    unlockHero(id) {
      const H = CONFIG.heroes[id]; if (Save.data.heroes[id] || Save.data.coins < H.unlock) return false;
      Save.data.coins -= H.unlock; Save.data.heroes[id] = true; Save.save(); return true;
    },
    selectHero(id) { if (Save.data.heroes[id]) { Save.data.hero = id; Save.save(); return true; } return false; },
    /** Trang bị đang mặc của 1 anh hùng: { weapon: item|null, ... } */
    worn(id) { const e = Save.data.equip[id] || {}, out = {}; SLOTS.forEach(s => { const t = e[s] || 0; out[s] = t > 0 ? CONFIG.equipment[s].items[t - 1] : null; }); return out; },
    wornTiers(id) { const e = Save.data.equip[id] || {}; return SLOTS.map(s => e[s] || 0); },
    /** Hệ số cộng thêm từ trang bị */
    gearMods(id) {
      const w = this.worn(id), m = { dmg: 0, rate: 0, hp: 0, arm: 0, spd: 0 };
      SLOTS.forEach(s => { const it = w[s]; if (!it) return; m.dmg += it.dmg || 0; m.rate += it.rate || 0; m.hp += it.hp || 0; m.arm += it.arm || 0; m.spd += it.spd || 0; });
      return m;
    },
    buyGear(slot) {
      const n = Save.data.gear[slot], items = CONFIG.equipment[slot].items;
      if (n >= items.length || Save.data.coins < items[n].cost) return false;
      Save.data.coins -= items[n].cost; Save.data.gear[slot] = n + 1;
      Save.data.equip[Save.data.hero][slot] = n + 1; Save.save(); return true;
    },
    setGear(id, slot, tier) { if (tier <= Save.data.gear[slot]) { Save.data.equip[id][slot] = tier; Save.save(); return true; } return false; },
    addCoins(n) { Save.data.coins += Math.max(0, Math.floor(n)); Save.save(); },

    recordWin(i, stars) {
      const s = Save.data, old = s.stars[i] || 0;
      if (stars > old) s.stars[i] = stars;
      s.unlocked = Math.max(s.unlocked, Math.min(CONFIG.levels.length, i + 2));
      Save.save(); return Math.max(0, stars - old);
    }
  };
  window.Save = Save; window.Progress = Progress;
})();
