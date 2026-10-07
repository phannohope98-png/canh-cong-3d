/* =========================================================
 * campaign.js – Chiến dịch 6 vùng × 6 map (map 6 = BOSS của vùng)
 * Rừng Xanh 1→6 → Sa Mạc... phải thắng map trước mới mở map sau; thắng map 6 mới sang vùng mới.
 * Bố cục đường đi lấy từ js/maps-img.js (12 bản vẽ tay + bản lật dọc) + 12 bố cục mới bên dưới.
 * Địa hình (sông, hồ, nhà, lâu đài) của bố cục mới tự sinh theo vùng, tránh đường đi.
 * ========================================================= */
(function () {
  const MP = window.MAPS, OLD = CONFIG.levels.slice(), B2 = MP.B2;
  const THEMES = ['forest', 'castle', 'desert', 'ice', 'lava', 'chaos'];
  const REGIONS = [
    { name: 'Rừng Xanh', subs: ['Bìa Rừng', 'Suối Hoa', 'Thung Lũng Sương Mù', 'Ngã Ba Cổ Thụ', 'Rừng Thẳm', 'Hang Vua Cây Ma'], boss: 'treantKing' },
    { name: 'Thành Cổ', subs: ['Cổng Thành', 'Phố Chợ Cũ', 'Cầu Đá Hoàng Gia', 'Tường Thành Đổ', 'Nghĩa Trang Hiệp Sĩ', 'Điện Hắc Ám'], boss: 'darkLord' },
    { name: 'Sa Mạc', subs: ['Cồn Cát', 'Làng Lều', 'Ốc Đảo Bão Cát', 'Hẻm Bọ Cạp', 'Lăng Mộ Cổ', 'Kim Tự Tháp Pharaoh'], boss: 'pharaoh' },
    { name: 'Băng Giá', subs: ['Đèo Tuyết', 'Hồ Đóng Băng', 'Đỉnh Tuyết Vĩnh Cửu', 'Làng Băng', 'Sông Băng', 'Ngai Vua Troll'], boss: 'trollKing' },
    { name: 'Núi Lửa', subs: ['Sườn Núi Cháy', 'Lò Than', 'Lò Rèn Địa Ngục', 'Cầu Dung Nham', 'Miệng Núi Lửa', 'Lõi Magma'], boss: 'magmaLord' },
    { name: 'Cổng Hỗn Mang', subs: ['Rìa Thế Giới', 'Đảo Trôi', 'Vực Thẳm Hư Không', 'Cầu Hư Vô', 'Cổng Xoáy', 'Ngai Chúa Tể Hỗn Mang'], boss: 'voidLord' }
  ];

  /* ---------- 3 boss mới (dùng lại mô hình quái, phóng to) ---------- */
  Object.assign(CONFIG.enemies, {
    treantKing: { name: 'Vua Cây Ma', art: 'treant', hp: 5200, speed: 20, armor: 0.3, mres: 0.1, damage: [60, 90], rate: 2.2, reward: 520, lives: 20, radius: 34, boss: true, regen: 10,
      slam: { every: 9, radius: 115, damage: 55 }, summon: { every: 12, type: 'goblin', n: 5 }, desc: 'Boss Rừng Xanh: cây cổ thụ nghìn năm hoá quỷ. Rễ cây đập đất làm choáng lính, gọi bầy Yêu Tinh, tự hồi máu.' },
    pharaoh: { name: 'Pharaoh Xác Ướp', art: 'mummy', hp: 6200, speed: 22, armor: 0.3, mres: 0.25, damage: [70, 100], rate: 2.0, reward: 600, lives: 20, radius: 32, boss: true, regen: 16,
      summon: { every: 11, type: 'scorpion', n: 3 }, desc: 'Boss Sa Mạc: vị vua ngàn năm thức giấc trong kim tự tháp. Liên tục gọi Bọ Cạp Cát, hồi máu rất nhanh.' },
    magmaLord: { name: 'Chúa Tể Dung Nham', art: 'magmaGolem', hp: 8200, speed: 18, armor: 0.45, mres: 0.35, damage: [90, 130], rate: 2.3, reward: 760, lives: 20, radius: 36, boss: true, regen: 12,
      slam: { every: 7, radius: 125, damage: 75 }, summon: { every: 13, type: 'imp', n: 4 }, desc: 'Boss Núi Lửa: khối dung nham khổng lồ. Đập đất thiêu cả đội hình, gọi bầy Quỷ Lửa bay qua đầu lính.' }
  });
  Object.assign(CONFIG.spawnInterval, { treantKing: 1, pharaoh: 1, magmaLord: 1 });
  CONFIG.enemies.darkLord.desc = 'Boss Thành Cổ: giáp đen, vương miện đen, kiếm khổng lồ, khói bóng tối sau lưng. Giai đoạn 2: triệu hồi Orc và Goblin. Giai đoạn 3: toàn thân rực đỏ, tốc độ tăng mạnh.';
  CONFIG.enemies.trollKing.desc = 'Boss Băng Giá: chúa tể vùng núi tuyết. Đập đất làm choáng và gây sát thương cả nhóm lính.';
  CONFIG.enemies.voidLord.desc = 'Boss cuối – Cổng Hỗn Mang: xé toạc không gian, choáng cả đội hình.';

  /* ---------- 12 bố cục mới (khung 480 × 200, quái vào từ trái / trên / dưới, thành ở phải) ---------- */
  const NEW = [
    [[[-6, 40], [60, 40], [110, 60], [120, 110], [100, 150], [140, 175], [200, 170], [230, 130], [220, 80], [250, 45], [310, 40], [350, 70], [350, 120], [380, 150], [430, 140], [455, 100], [460, 70]]],
    [[[-6, 50], [60, 55], [120, 80], [170, 100], [220, 100], [260, 70], [300, 50], [350, 60], [380, 95], [400, 135], [440, 140], [462, 110]],
     [[-6, 160], [60, 150], [120, 125], [170, 100], [220, 100], [260, 70], [300, 50], [350, 60], [380, 95], [400, 135], [440, 140], [462, 110]]],
    [[[150, -6], [150, 30], [120, 60], [80, 80], [70, 115], [100, 145], [160, 155], [220, 140], [260, 110], [300, 95], [340, 110], [360, 150], [400, 165], [440, 150], [458, 120]]],
    [[[-6, 170], [50, 170], [90, 150], [100, 110], [80, 70], [100, 35], [150, 30], [180, 60], [185, 110], [200, 150], [250, 165], [290, 140], [300, 95], [320, 55], [370, 45], [410, 70], [430, 110], [455, 120]]],
    [[[-6, 100], [50, 100], [100, 88], [150, 58], [205, 48], [255, 62], [295, 92], [335, 100], [375, 92], [415, 72], [456, 66]],
     [[-6, 100], [50, 100], [100, 112], [150, 142], [205, 152], [255, 140], [295, 108], [335, 100], [375, 92], [415, 72], [456, 66]]],
    [[[60, 206], [60, 170], [90, 140], [140, 130], [170, 100], [160, 60], [200, 35], [260, 40], [290, 75], [280, 120], [310, 160], [370, 170], [420, 150], [440, 110], [445, 70]]],
    [[[-6, 30], [60, 40], [110, 70], [150, 100], [200, 105], [240, 130], [290, 140], [330, 115], [350, 80], [390, 55], [440, 60], [462, 85]],
     [[-6, 100], [70, 100], [150, 100], [200, 105], [240, 130], [290, 140], [330, 115], [350, 80], [390, 55], [440, 60], [462, 85]],
     [[-6, 175], [60, 165], [110, 130], [150, 100], [200, 105], [240, 130], [290, 140], [330, 115], [350, 80], [390, 55], [440, 60], [462, 85]]],
    [[[-6, 45], [90, 45], [160, 55], [200, 85], [200, 130], [230, 165], [290, 170], [330, 140], [330, 95], [350, 55], [400, 40], [440, 60], [455, 95]]],
    [[[-6, 120], [50, 125], [100, 140], [150, 160], [200, 160], [230, 130], [210, 95], [170, 80], [160, 45], [200, 25], [260, 30], [300, 60], [310, 105], [340, 140], [390, 150], [430, 125], [450, 90]]],
    [[[-6, 45], [80, 50], [150, 40], [220, 55], [280, 75], [320, 100], [370, 100], [410, 85], [455, 70]],
     [[-6, 165], [80, 160], [150, 170], [220, 150], [280, 125], [320, 100], [370, 100], [410, 85], [455, 70]]],
    [[[-6, 140], [60, 140], [120, 120], [170, 90], [160, 130], [190, 165], [250, 170], [290, 140], [300, 100], [330, 65], [380, 55], [420, 80], [440, 120], [462, 130]],
     [[200, -6], [200, 30], [185, 60], [170, 90], [160, 130], [190, 165], [250, 170], [290, 140], [300, 100], [330, 65], [380, 55], [420, 80], [440, 120], [462, 130]]],
    [[[-6, 180], [60, 175], [120, 180], [170, 160], [160, 125], [110, 110], [90, 80], [120, 50], [180, 40], [240, 55], [260, 95], [250, 140], [290, 170], [350, 165], [380, 130], [370, 90], [400, 55], [445, 45], [462, 60]]]
  ];

  /* ---------- tiện ích hình học (toạ độ khung map gốc) ---------- */
  const segD = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1; let t = ((x - a[0]) * dx + (y - a[1]) * dy) / l; t = Math.max(0, Math.min(1, t)); return Math.hypot(x - a[0] - dx * t, y - a[1] - dy * t); };
  const polyD = (pts, x, y) => { let m = Infinity; for (let i = 0; i < pts.length - 1; i++) m = Math.min(m, segD(x, y, pts[i], pts[i + 1])); return m; };
  const pathD = (ip, x, y) => { let m = Infinity; for (const p of ip) m = Math.min(m, polyD(p, x, y)); return m; };
  const rng = seed => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  /** lật dọc bố cục (đường + địa hình) trong khung của nó */
  function mirror(m, feat) {
    const B = m.bg, fy = y => B.y0 + B.y1 - y, P = p => [p[0], fy(p[1])];
    const f = feat ? { void: feat.void, rivers: (feat.rivers || []).map(r => Object.assign({}, r, { pts: r.pts.map(P) })), lakes: (feat.lakes || []).map(l => Object.assign({}, l, { y: fy(l.y) })), props: (feat.props || []).map(p => Object.assign({}, p, { y: fy(p.y) })) } : null;
    return { bg: B, ipaths: m.ipaths.map(path => path.map(P)), feat: f };
  }
  /** địa hình tự sinh: lâu đài ở cổng thành, 1 dòng sông cắt ngang đường (có cầu), hồ & nhà cửa ở chỗ trống */
  function autoFeat(m, theme, seed) {
    const B = m.bg, ip = m.ipaths, r = rng(seed * 7919 + 13), W = B.x1 - B.x0, H = B.y1 - B.y0;
    const end = ip[0][ip[0].length - 1], props = [], rivers = [], lakes = [];
    const gate = { forest: { k: 'castle' }, castle: { k: 'castle' }, desert: { k: 'fort' }, ice: { k: 'castle', snow: true }, lava: { k: 'fort', dark: true }, chaos: { k: 'portal' } }[theme];
    props.push(Object.assign({ x: Math.min(B.x1 - 14, end[0]), y: Math.max(B.y0 + 22, Math.min(B.y1 - 20, end[1])) }, gate));
    if (theme === 'chaos') return { void: true, props };
    const kind = theme === 'ice' ? 'ice' : theme === 'lava' ? 'lava' : 'water';
    // sông: thử nhiều vị trí, chọn dòng cắt ngang đường gọn nhất (không chạy dọc theo đường)
    if (theme !== 'desert') {
      let best = null;
      for (let k = 0; k < 14; k++) {
        const x0 = B.x0 + W * (0.22 + r() * 0.5), amp = 8 + r() * 16, ph = r() * 6, w = theme === 'lava' ? 13 + r() * 4 : 11 + r() * 5;
        const pts = []; for (let i = 0; i <= 6; i++) { const y = B.y0 - 8 + (H + 16) * i / 6; pts.push([Math.round(x0 + Math.sin(ph + i * 1.1) * amp + (i - 3) * (r() - 0.5) * 6), Math.round(y)]); }
        let near = 0, run = 0, maxRun = 0, bad = false;
        for (let i = 0; i < pts.length - 1; i++) for (let s = 0; s <= 1; s += 0.1) {
          const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * s, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * s, d = pathD(ip, x, y);
          if (d < 16) { near++; run++; maxRun = Math.max(maxRun, run); } else run = 0;
          if (Math.hypot(x - props[0].x, y - props[0].y) < 46) bad = true;
          for (const p of ip) if (Math.hypot(x - p[0][0], y - p[0][1]) < 30) bad = true;
        }
        if (bad || !near || maxRun > 16) continue;
        const sc = near + Math.abs(x0 - (B.x0 + W * 0.5)) * 0.02;
        if (!best || sc < best.sc) best = { sc, pts, w };
      }
      if (best) rivers.push({ pts: best.pts, w: Math.round(best.w), kind: kind === 'water' ? undefined : kind });
    }
    const freeAt = (x, y, m2) => {
      if (pathD(ip, x, y) < m2) return false;
      for (const p of props) if (Math.hypot(x - p.x, (y - p.y) * 1.3) < 40) return false;
      for (const rv of rivers) if (polyD(rv.pts, x, y) < rv.w / 2 + 14) return false;
      for (const l of lakes) if (Math.hypot(x - l.x, y - l.y) < l.rx + 26) return false;
      return x > B.x0 + 16 && x < B.x1 - 20 && y > B.y0 + 14 && y < B.y1 - 12;
    };
    // hồ (sa mạc: ốc đảo)
    const nl = theme === 'desert' ? 2 : 1 + (r() < 0.5 ? 1 : 0);
    for (let k = 0; k < nl; k++) {
      let best = null;
      for (let t = 0; t < 60; t++) { const x = B.x0 + 20 + r() * (W - 60), y = B.y0 + 20 + r() * (H - 40), d = pathD(ip, x, y); if (d < 34 || !freeAt(x, y, 34)) continue; if (!best || d > best.d) best = { x, y, d }; }
      if (best) { const rx = Math.round(Math.min(34, 16 + best.d * 0.25)); lakes.push({ x: Math.round(best.x), y: Math.round(best.y), rx, ry: Math.round(rx * 0.4), kind: kind === 'water' ? undefined : kind }); }
    }
    // nhà cửa / lều / phế tích
    const kinds = { forest: ['cabin', 'house', 'well', 'cabin'], castle: ['house', 'house', 'ruin', 'well', 'house'], desert: ['tent', 'tent', 'mesa', 'ruin', 'mesa'], ice: ['house', 'ruin', 'house'], lava: ['tent', 'ruin', 'tent'] }[theme];
    for (const k of kinds) for (let t = 0; t < 50; t++) {
      const x = B.x0 + 16 + r() * (W - 40), y = B.y0 + 16 + r() * (H - 30); if (!freeAt(x, y, 30)) continue;
      const p = { k, x: Math.round(x), y: Math.round(y) }; if (theme === 'ice' && k === 'house') p.snow = true; if (theme === 'lava' && k === 'tent') p.dark = true;
      props.push(p); break;
    }
    return { rivers, lakes, props };
  }

  /* ---------- đợt quái tự sinh theo vùng ---------- */
  const POOL = {
    forest: { light: ['goblin', 'warg'], mid: ['orc', 'wolfRider', 'orcArcher'], heavy: ['treant', 'troll'] },
    castle: { light: ['skeleton', 'goblin'], mid: ['wraith', 'orcArcher', 'warg'], heavy: ['deathKnight'] },
    desert: { light: ['bandit'], mid: ['scorpion', 'mummy'], heavy: ['blackOrc', 'troll'] },
    ice: { light: ['frostWolf'], mid: ['orc', 'wraith'], heavy: ['iceGolem', 'blackOrc', 'troll'] },
    lava: { light: ['imp'], mid: ['blackOrc', 'drake'], heavy: ['magmaGolem', 'troll'] },
    chaos: { light: ['voidling'], mid: ['voidWalker', 'wraith', 'drake'], heavy: ['deathKnight', 'magmaGolem', 'iceGolem'] }
  };
  function genWaves(ri, m, seed) {
    const P = POOL[THEMES[ri]], r = rng(seed * 104729 + 7), n = 7 + (m >= 3 ? 1 : 0) + (m >= 4 ? 1 : 0), out = [];
    const pick = a => a[(r() * a.length) | 0], hp = k => CONFIG.enemies[k].hp;
    for (let i = 0; i < n; i++) {
      const budget = (520 + 110 * ri) * (1 + 0.62 * i) * (1 + 0.06 * m), parts = [];
      const L = pick(P.light); parts.push([L, Math.max(4, Math.round(budget * (i >= 4 ? 0.4 : i >= 2 ? 0.55 : 1) / hp(L)))]);
      if (i >= 2) { const M = pick(P.mid); parts.push([M, Math.max(2, Math.round(budget * (i >= 4 ? 0.32 : 0.45) / hp(M)))]); }
      if (i >= 4) { const Hh = pick(P.heavy); parts.push([Hh, Math.max(1, Math.round(budget * 0.28 / hp(Hh)))]); }
      out.push(parts.map(([k, c]) => k + ':' + Math.min(c, 22)).join(','));
    }
    return out;
  }
  /** bỏ boss ra khỏi map thường (boss chỉ xuất hiện ở map 6) */
  const NOBOSS = { darkKnight: 'deathKnight:1', trollKing: 'troll:2', darkLord: 'voidWalker:3', voidLord: 'magmaGolem:2' };
  const deBoss = waves => waves.map(w => w.split(',').map(p => { const [k] = p.trim().split(':'); return NOBOSS[k] || p.trim(); }).join(','));
  const ESCORT = { treantKing: 'goblin:12,orc:4', darkLord: 'skeleton:10,wraith:6', pharaoh: 'mummy:4,bandit:12', trollKing: 'iceGolem:2,frostWolf:12', magmaLord: 'imp:10,blackOrc:4', voidLord: 'voidWalker:8,voidling:14,drake:4' };

  /* ---------- ghép 36 màn ---------- */
  const STORY = [
    s => 'Bầy yêu tinh và thú hoang kéo qua ' + s + '. Giữ con đường về thành!',
    s => 'Quân xương khô lẩn khuất ở ' + s + '. Đừng để chúng phá cổng thành!',
    s => 'Bão cát nổi lên ở ' + s + ', cướp và xác ướp ập tới.',
    s => 'Gió tuyết gào thét trên ' + s + '. Sói tuyết và người băng đang xuống núi!',
    s => 'Dung nham sôi sục ở ' + s + '. Quỷ lửa bay rợp trời!',
    s => 'Không gian rạn nứt ở ' + s + '. Quái hư vô tràn ra từ mọi phía!'
  ];
  const BOSS_STORY = [
    'Vua Cây Ma thức giấc sâu trong hang rừng. Hạ nó để mở đường sang Thành Cổ!',
    'Chúa Hắc Ám ngự trong điện tối của thành cổ. Đánh bại hắn để vượt sang Sa Mạc!',
    'Pharaoh Xác Ướp bước ra khỏi kim tự tháp cùng đạo quân bọ cạp. Hạ hắn để tiến lên Băng Giá!',
    'Vua Troll Đá rời ngai băng xuống núi. Thắng trận này để tới Núi Lửa!',
    'Chúa Tể Dung Nham trồi lên từ lõi magma. Diệt hắn để mở Cổng Hỗn Mang!',
    'Chúa Tể Hỗn Mang tự mình bước ra khỏi cổng xoáy. Trận chiến cuối cùng của thế giới!'
  ];
  const DIFF = ['Dễ', 'Dễ - Trung bình', 'Trung bình', 'Trung bình - Khó', 'Khó', 'Rất khó', 'Cực khó'];
  const levels = [];
  REGIONS.forEach((R, ri) => {
    const th = THEMES[ri], c1 = MP.M[ri], c2 = MP.M[6 + ri], o1 = OLD[ri], o2 = OLD[6 + ri];
    const base = 0.8 + 0.18 * ri, F = [1, 1.08, 1.15, 1.22, 1.3, 1.3]; // vùng sau quái trâu hơn hẳn (người chơi đã có sao, cấp anh hùng, đồ trụ)
    const lay = [
      { bg: c1.bg, ipaths: c1.ipaths, feat: MP.FEAT[ri] },
      Object.assign({ bg: B2, ipaths: NEW[ri * 2] }, {}),
      { bg: c2.bg, ipaths: c2.ipaths, feat: MP.FEAT[6 + ri] },
      mirror(MP.M[(ri + 1) % 6]),
      { bg: B2, ipaths: NEW[ri * 2 + 1] },
      mirror(c2, MP.FEAT[6 + ri])
    ];
    lay.forEach((L, m) => {
      const gi = ri * 6 + m, boss = m === 5;
      const feat = L.feat || autoFeat(L, th, gi + 1);
      let waves;
      if (m === 0) waves = deBoss(o1.waves);
      else if (m === 2) waves = deBoss(o2.waves).slice(0, 9);
      else if (boss) { const w = deBoss(o2.waves).slice(0, 8); w.push(R.boss + ':1,' + ESCORT[R.boss]); waves = w; }
      else waves = genWaves(ri, m, gi + 3);
      const gold = m === 0 ? o1.gold : Math.round(380 + 55 * ri + 35 * m + (boss ? 120 : 0));
      levels.push({
        name: R.name + ' ' + (m + 1), sub: R.subs[m], region: ri, map: m, boss, theme: th,
        diff: boss ? 'BOSS · ' + CONFIG.enemies[R.boss].name : DIFF[Math.min(6, Math.floor(ri * 0.9 + m * 0.45))],
        gold, spots: Math.min(18, 13 + Math.floor(m / 2) + (ri >= 3 ? 1 : 0) + (boss ? 1 : 0)),
        hpMul: +(base * F[m]).toFixed(3),
        story: boss ? BOSS_STORY[ri] : m === 0 ? o1.story : m === 2 ? o2.story : STORY[ri](R.subs[m]),
        bg: L.bg, ipaths: L.ipaths, feat, waves
      });
    });
  });
  CONFIG.levels = levels; CONFIG.regions = REGIONS.map((R, i) => ({ name: R.name, theme: THEMES[i], boss: R.boss }));
  CONFIG.mapsPerRegion = 6;
})();
