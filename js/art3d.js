/* =========================================================
 * art3d.js – Nhân vật trên chiến trường vẽ từ MÔ HÌNH 3D (design/chars3d.js)
 * Mỗi khung hình (đi / đánh / đứng × hướng nhìn) được chụp từ mô hình 3D bằng
 * WebGL ẩn rồi đưa vào bộ đệm của Painter → chạy nhanh như sprite 2D.
 * Tắt được trong Cài đặt ("Nhân vật 3D"); không có WebGL thì tự quay về hình 2D.
 * ========================================================= */
(function () {
  const reg = window.ArtChars;
  if (!reg || !window.THREE || !window.Chars3D) return;
  const T = THREE, K = ArtKit;
  const EL = 0.34;                                       // góc máy nhìn xuống (rad)
  const YAW = { side: 0.78, back: Math.PI - 0.6, front: 0.4 }; // gốc: nhìn sang PHẢI
  for (let k = 0; k < 8; k++) YAW['a' + k] = (k <= 4 ? k : k - 8) * Math.PI / 4 * 0.85; // 8 hướng (a0 = quay mặt, a2 = phải, a4 = quay lưng)
  const IDLE = 2.618;                                    // chu kỳ idle của Painter (giây)

  let renderer = null, scene = null, cam = null, failed = false, theme = 'forest';
  const L3 = {};
  /** ánh sáng theo vùng: [trời, đất, độ sáng trời, màu chính, độ sáng chính, màu viền, độ sáng viền] */
  const LIGHT = {
    forest: [0xfff4e8, 0x5a4a6a, 0.85, 0xffffff, 1.0, 0xa8c4ff, 0.4], castle: [0xfff4e8, 0x5a4a6a, 0.85, 0xffffff, 1.0, 0xa8c4ff, 0.4],
    desert: [0xfff0d8, 0x8a6a4a, 0.85, 0xfff2d8, 1.05, 0xffd8a0, 0.35], ice: [0xeaf4ff, 0x6a7a9a, 0.9, 0xeef6ff, 0.95, 0x9ad8ff, 0.5],
    lava: [0xffe0c8, 0x5a2a2a, 0.75, 0xffd0a8, 0.95, 0xff6a2a, 0.75], chaos: [0xf0e4ff, 0x4a2a6a, 0.8, 0xf2e8ff, 0.95, 0xc070ff, 0.75]
  };
  function applyTheme() { const p = LIGHT[theme] || LIGHT.forest; if (!L3.hemi) return; L3.hemi.color.setHex(p[0]); L3.hemi.groundColor.setHex(p[1]); L3.hemi.intensity = p[2]; L3.key.color.setHex(p[3]); L3.key.intensity = p[4]; L3.rim.color.setHex(p[5]); L3.rim.intensity = p[6]; if (Chars3D.fx) { Chars3D.fx.uRim.value.setHex(p[5]); Chars3D.fx.uRimK.value = 0.35 + p[6] * 0.4; } }
  function gl() {
    if (renderer || failed) return renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
      renderer.outputEncoding = T.sRGBEncoding; renderer.setPixelRatio(1); renderer.setClearColor(0x000000, 0);
      scene = new T.Scene();
      scene.add(L3.hemi = new T.HemisphereLight(0xfff4e8, 0x5a4a6a, 0.85));
      const key = L3.key = new T.DirectionalLight(0xffffff, 1.0); key.position.set(-1.5, 5, 4); scene.add(key);
      const rim = L3.rim = new T.DirectionalLight(0xa8c4ff, 0.4); rim.position.set(3, 2.5, -4); scene.add(rim);
      applyTheme();
      cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
      cam.position.set(0, Math.sin(EL) * 60, Math.cos(EL) * 60); cam.lookAt(0, 0, 0);
    } catch (e) { failed = true; renderer = null; console.warn('Art3D: không có WebGL, dùng hình 2D'); }
    return renderer;
  }

  /* ---------- gộp khối theo khớp + vật liệu: ~180 → ~50 lệnh vẽ ---------- */
  function optimize(root, rig) {
    const owners = new Set(Object.values(rig.n)); owners.add(root);
    const drop = []; root.traverse(o => { if (o.userData.noExport && o.userData.tick) drop.push(o); });
    drop.forEach(o => o.parent.remove(o)); // khói động (aura) chỉ dùng trong xưởng
    root.updateMatrixWorld(true);
    const buckets = new Map(), meshes = [], inv = new Map(), m4 = new T.Matrix4();
    root.traverse(o => {
      if (!o.isMesh) return;
      meshes.push(o);
      let ow = o.parent; while (!owners.has(ow)) ow = ow.parent;
      if (!inv.has(ow)) inv.set(ow, ow.matrixWorld.clone().invert());
      const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(m4.copy(inv.get(ow)).multiply(o.matrixWorld));
      if (g.attributes.uv) g.deleteAttribute('uv');
      if (o.material.userData.tex) { if (!g.attributes.tpos) Chars3D.kit.texCoords(g); } else if (g.attributes.tpos) { g.deleteAttribute('tpos'); g.deleteAttribute('tnrm'); }
      const k = ow.uuid + '|' + o.material.uuid;
      if (!buckets.has(k)) buckets.set(k, { ow, mat: o.material, geos: [], order: o.material.transparent ? 1 : 0 });
      buckets.get(k).geos.push(g);
    });
    meshes.forEach(o => { if (o.parent) o.parent.remove(o); });
    buckets.forEach(b => {
      const merged = T.BufferGeometryUtils.mergeBufferGeometries(b.geos, false);
      b.geos.forEach(g => g.dispose());
      if (!merged) return;
      const mesh = new T.Mesh(merged, b.mat); mesh.renderOrder = b.order; mesh.frustumCulled = false; b.ow.add(mesh);
    });
  }

  /* ---------- bản dựng 3D theo (nhân vật, cấp) ---------- */
  const insts = new Map();
  function inst(cid, tier, tall) {
    const key = cid + tier;
    let I = insts.get(key); if (I) return I;
    Chars3D.setInk(1.8);
    const b = Chars3D.build(cid, tier);
    optimize(b.root, b.rig);
    b.root.updateMatrixWorld(true);
    // tỉ lệ: chiều cao thân (tới đỉnh đầu, bỏ mũ/sừng) khớp với chiều cao hình 2D cũ
    let H;
    if (b.rig.o.bodyH) H = b.rig.o.bodyH * b.root.scale.y;
    else if (b.rig.o.R) { const p = new T.Vector3(); b.rig.n.head.getWorldPosition(p); H = p.y + (b.rig.o.R * 0.95 - (b.rig.o.float || 0)) * b.root.scale.y; }
    else H = new T.Box3().setFromObject(b.root).max.y * 0.7;
    const mixer = new T.AnimationMixer(b.root), actions = {};
    b.clips.forEach(c => { const a = mixer.clipAction(c); if (!c.userData.loop) { a.setLoop(T.LoopOnce, 1); a.clampWhenFinished = true; } actions[c.name] = a; });
    I = { root: b.root, mixer, actions, clips: b.clips, k: tall * 1.15 / (H * Math.cos(EL)), cur: null };
    insts.set(key, I); return I;
  }
  function pose(I, P) {
    let name, f;
    if (P.d >= 0) { name = 'die'; f = P.d; } else if (P.w >= 0) { name = 'walk'; f = P.w; } else if (P.a >= 0) { name = 'attack'; f = P.a; } else { name = 'idle'; f = (((P.t || 0) / IDLE) % 1 + 1) % 1; }
    const a = I.actions[name] || I.actions.idle;
    if (I.cur !== a) { I.mixer.stopAllAction(); a.reset().play(); I.cur = a; }
    I.mixer.setTime(a.getClip().duration * Math.min(0.999, f));
  }

  /** vẽ 1 khung: g đã được Painter dời gốc tới chân nhân vật & nhân tỉ lệ ppu */
  function draw3d(spec, g, P) {
    const r = gl(); if (!r) return spec.orig(g, P);
    const t0 = performance.now();
    const I = inst(spec.cid, spec.tier, spec.tall);
    pose(I, P);
    I.root.rotation.y = YAW[spec.view];
    K.shadow(g, 0, 0.6, spec.shadow, spec.shadow * 0.24, 0.42);
    renderInto(I.root, g, I.k);
    Art3D.stats.frames++; Art3D.stats.ms += performance.now() - t0;
  }
  /** dựng 1 mô hình vào vùng góc dưới-trái của bộ đệm WebGL (không cấp phát lại khi đổi cỡ) rồi chép sang g */
  const _sz = new T.Vector2();
  function renderInto(root, g, k) {
    const r = gl(), c = g.canvas, m = g.getTransform(), W = c.width, H = c.height;
    r.getSize(_sz);
    if (_sz.x < W || _sz.y < H) { r.setSize(Math.max(_sz.x, Math.ceil(W / 128) * 128), Math.max(_sz.y, Math.ceil(H / 128) * 128), false); r.getSize(_sz); }
    r.setViewport(0, 0, W, H); r.setScissor(0, 0, W, H); r.setScissorTest(true);
    const s = 1 / (m.a * k); // mét / điểm ảnh
    cam.left = -m.e * s; cam.right = (W - m.e) * s; cam.top = m.f * s; cam.bottom = -(H - m.f) * s; cam.updateProjectionMatrix();
    scene.add(root); r.render(scene, cam); scene.remove(root);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(r.domElement, 0, _sz.y - H, W, H, 0, 0, W, H); g.restore();
  }

  /** Đo khung chữ nhật thật chứa mô hình qua mọi tư thế (đứng, đi, đánh, ngã) ở hướng nhìn của spec → khung tranh KHÔNG bao giờ cắt cụt boss / anh hùng */
  const boxCache = new Map(), _vv = new T.Vector3();
  function measureBox(spec, base) {
    const ck = spec.cid + spec.tier + '|' + spec.view; let b = boxCache.get(ck); if (b) return b;
    const I = inst(spec.cid, spec.tier, spec.tall), cE = Math.cos(EL), sE = Math.sin(EL), k = I.k;
    let x0 = -spec.shadow, x1 = spec.shadow, y0 = -spec.shadow * 0.3, y1 = spec.shadow * 0.3 + 1;
    const plan = [['idle', [0, 0.25, 0.5, 0.75]], ['walk', [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875]], ['attack', [0.15, 0.3, 0.4, 0.5, 0.6, 0.75, 0.9]], ['die', [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.999]], ['skill', [0.3, 0.6, 0.9]]];
    I.root.rotation.y = YAW[spec.view]; const meshes = [];
    for (const [name, ts] of plan) {
      const a = I.actions[name]; if (!a) continue;
      for (const f of ts) {
        if (I.cur !== a) { I.mixer.stopAllAction(); a.reset().play(); I.cur = a; }
        I.mixer.setTime(a.getClip().duration * f); I.root.updateMatrixWorld(true); meshes.length = 0; I.root.traverse(o => { if (o.isMesh && o.geometry.attributes.position) meshes.push(o); });
        for (const o of meshes) {
          const p = o.geometry.attributes.position, mw = o.matrixWorld;
          for (let i = 0; i < p.count; i += 2) { _vv.fromBufferAttribute(p, i).applyMatrix4(mw); const sx = _vv.x * k, sy = -(_vv.y * cE - _vv.z * sE) * k; if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy; }
        }
      }
    }
    const pad = 6, ob = base.box, ox = Math.max(ob[2], -x0 + pad), oy = Math.max(ob[3], -y0 + pad), w = Math.max(ob[0], ox + x1 + pad), h = Math.max(ob[1], oy + y1 + pad);
    b = [Math.ceil(w), Math.ceil(h), Math.ceil(ox), Math.ceil(oy)]; boxCache.set(ck, b); return b;
  }

  /* ---------- thay hình 2D bằng 3D (giữ hình 2D để quay về khi tắt) ---------- */
  const Art3D = { enabled: true, keys: [], stats: { frames: 0, ms: 0 } };
  Chars3D.setDetail(0.62); // trong trận: ít đa giác hơn (nhân vật chỉ cao vài chục điểm ảnh)
  function wrap(key, cid, tier, view, baseKey) {
    const base = reg[baseKey || key]; if (!base || (reg[key] && reg[key].__3d)) return;
    const orig = (reg[key] || base).draw;
    const spec = { cid, tier, view, orig, tall: base.tall || 30, shadow: Math.min(26, (base.wide || 26) * (cid === 'wolfRider' ? 0.5 : 0.48)) };
    reg[key] = Object.assign({}, base, reg[key] || {}, { chibi: true, __3d: true, draw: (g, P) => (Art3D.enabled && !failed ? draw3d(spec, g, P) : orig(g, P)) });
    let mb = null; // khung tranh: đo thật từ mô hình 3D (lười, 1 lần)
    Object.defineProperty(reg[key], 'box', { configurable: true, enumerable: true, get() { if (!Art3D.enabled || failed || !gl()) return base.box; if (!mb) { try { mb = measureBox(spec, base); } catch (e) { mb = base.box; } } return mb; } });
    Art3D.keys.push(key);
  }
  function wrapAll(key, cid, tier) { wrap(key, cid, tier, 'side'); wrap(key + '_b', cid, tier, 'back', key); wrap(key + '_f', cid, tier, 'front', key); for (let k = 0; k < 8; k++) wrap(key + '_a' + k, cid, tier, 'a' + k, key); }

  for (let t = 1; t <= 4; t++) { wrapAll('soldier' + t, 'soldier', t); wrapAll('elf' + t, 'elf', t); wrapAll('mage' + t, 'mage', t); wrapAll('dwarf' + t, 'dwarf', t); }
  // boss mới: mô hình riêng, hình 2D dự phòng = quái gốc
  [['pharaoh', 'mummy'], ['treantKing', 'treant'], ['magmaLord', 'magmaGolem']].forEach(([k, b]) => { wrap(k, k, 1, 'side', b); wrap(k + '_b', k, 1, 'back', b); wrap(k + '_f', k, 1, 'front', b); for (let i = 0; i < 8; i++) wrap(k + '_a' + i, k, 1, 'a' + i, b); });
  // lính cầm khiên (vật phẩm Khiên của trụ Người): khoá soldier{cấp}s{bậc}, hình 2D dự phòng = lính thường
  for (let t = 1; t <= 4; t++) for (let r = 0; r < 5; r++) { const k = 'soldier' + t + 's' + r, b = 'soldier' + t; wrap(k, 'soldierS' + r, t, 'side', b); wrap(k + '_b', 'soldierS' + r, t, 'back', b); wrap(k + '_f', 'soldierS' + r, t, 'front', b); for (let i = 0; i < 8; i++) wrap(k + '_a' + i, 'soldierS' + r, t, 'a' + i, b); }
  wrapAll('goblin', 'goblin', 1); wrapAll('shade', 'shade', 1); wrapAll('orc', 'orc', 2); wrapAll('wolfRider', 'wolfRider', 1);
  ['orcArcher', 'warg', 'treant', 'skeleton', 'wraith', 'deathKnight', 'bandit', 'mummy', 'scorpion', 'frostWolf', 'iceGolem', 'imp', 'drake', 'magmaGolem', 'voidling', 'voidWalker', 'blackOrc', 'troll', 'trollKing', 'voidLord'].forEach(k => wrapAll(k, k, 1));
  wrapAll('darkKnight', 'darkKnight', 1); wrapAll('darkKnight2', 'darkKnight', 2); wrapAll('darkLord', 'darkLord', 1); wrapAll('darkLord3', 'darkLord', 3);
  // anh hùng: khoá tạo dần theo trang bị
  if (reg.heroKey) {
    const baseHeroKey = reg.heroKey;
    reg.heroKey = function (id, tiers) {
      const key = baseHeroKey.call(reg, id, tiers);
      if (key.indexOf('c_') === 0 && reg[key] && !reg[key].__3d) {
        const sum = (tiers || [0, 0, 0, 0]).reduce((a, b) => a + b, 0);
        wrapAll(key, id, Math.min(4, 2 + Math.floor(sum / 4)));
      }
      return key;
    };
  }

  /* ---------- trụ công trình 3D (phần tĩnh; cờ, lửa, nhân vật vẫn do fx vẽ) ---------- */
  const towers = new Map(), fronts = new Map();
  /** mô hình trụ; nhóm 'front' (lan can trước) tách riêng để vẽ ĐÈ lên chân lính đứng trên trụ */
  function towerRoot(type, tier) {
    const key = type + tier; let root = towers.get(key); if (root) return root;
    Chars3D.setInk(1.0);
    root = Towers3D.build(type, tier);
    const fr = root.getObjectByName('front');
    if (fr) { root.remove(fr); const fRoot = new T.Group(); fRoot.add(fr); optimize(fRoot, { n: {} }); fRoot.updateMatrixWorld(true); fronts.set(key, fRoot); }
    optimize(root, { n: {} }); root.updateMatrixWorld(true);
    towers.set(key, root); return root;
  }
  function drawTower(type, tier, g) {
    drawStatic(towerRoot(type, tier), g);
  }
  function drawStatic(root, g) {
    renderInto(root, g, 40);
  }
  const frontCache = new Map();
  function drawFront(type, tier, g) {
    towerRoot(type, tier); const fr = fronts.get(type + tier); if (!fr) return;
    const m = g.getTransform(), ppu = Math.max(0.5, Math.min(4, Math.ceil(Math.hypot(m.a, m.b) * 2) / 2)), k = type + tier + '|' + ppu, [w, h, ox, oy] = ArtTowers[type].box;
    let c = frontCache.get(k);
    if (!c) { c = document.createElement('canvas'); c.width = Math.ceil(w * ppu); c.height = Math.ceil(h * ppu); const cg = c.getContext('2d'); cg.setTransform(ppu, 0, 0, ppu, ox * ppu, oy * ppu); renderInto(fr, cg, 40); frontCache.set(k, c); }
    g.drawImage(c, -ox, -oy, w, h);
  }
  /* độ cao sàn trên đỉnh trụ 3D → các hàm hiệu ứng / nòng súng dùng chung */
  if (window.ArtTowers && window.Towers3D && Towers3D.TOPS) {
    const TP = Towers3D.TOPS, A = ArtTowers;
    for (let i = 1; i <= 4; i++) { A.ARCH_TOP[i] = -TP.archer[i]; A.MAGE_TOP[i] = -TP.mage[i]; A.ART_Y[i] = -TP.artillery[i]; }
    A.barracks.box = [150, 215, 75, 190]; A.artillery.box = [140, 180, 70, 150]; A.archer.box = [140, 240, 70, 212]; A.mage.box = [140, 250, 70, 222];
  }
  /* hiệu ứng động khớp mô hình 3D (2D cũ vẽ cửa, lan can, cờ ở chỗ khác) */
  /* súng cối của trụ Người Lùn: dựng riêng, xoay 16 hướng, vẽ cùng nhân vật (chính xác vị trí đầu nòng để bắn đúng chỗ) */
  const MORT_N = 16, mortCache = new Map(), PI2 = Math.PI * 2;
  const mortAim = (st, f) => (st.aim !== undefined ? st.aim : f > 0 ? 0.05 : Math.PI - 0.05);
  /** hướng bắn trên màn hình (rad) → góc xoay quanh trục đứng của mô hình 3D */
  const mortYaw = aim => Math.atan2(-Math.sin(aim) / Math.sin(EL), Math.cos(aim));
  function mortarSprite(t, k, ppu) {
    const key = t + '|' + k + '|' + ppu; let sp = mortCache.get(key);
    if (sp === undefined) { Chars3D.setInk(1.0); sp = Art3D.sprite(Towers3D.mortar(t, k / MORT_N * PI2), ppu); mortCache.set(key, sp); }
    return sp;
  }
  /** đầu nòng (px, gốc = chân giá súng, y âm = lên cao) khi súng quay về hướng aim */
  function mortarTip(t, aim, f) {
    const yaw = Math.round(mortYaw(aim) / PI2 * MORT_N) / MORT_N * PI2, L = 0.3 + t * 0.03 + 0.03, bx = 0.682 * L, by = 0.15 + 0.7317 * L;
    return { x: f * 7 + bx * Math.cos(yaw) * 40, y: -(by * Math.cos(EL) - (-bx * Math.sin(yaw)) * Math.sin(EL)) * 40 };
  }
  if (window.ArtTowers) ArtTowers.mortarTip = (t, aim, f) => (Art3D.enabled && !failed && window.Towers3D && Towers3D.mortar ? mortarTip(t, aim, f) : null);
  const K2 = window.ArtKit, FX3 = {
    archer(g, t, time, st, env) {
      const top = ArtTowers.ARCH_TOP[t], f = st.face || 1, a = st.a === undefined ? -1 : st.a, k = st.k || 0;
      if (t === 4) K2.glow(g, 0, top - 56, 16, '#9affc8', 0.45 + Math.sin(time * 3) * 0.15);
      env.char('elf' + t, -10, top + 2, f, k % 2 ? -1 : a, time + 0.7);
      env.char('elf' + t, 10, top + 4, f, k % 2 ? a : -1, time);
    },
    barracks(g, t, time, st) { if ((st.door || 0) > 0) K2.glow(g, 0, -12, 16, '#ffd080', 0.55); },
    artillery(g, t, time, st, env) {
      const top = ArtTowers.ART_Y[t], f = st.face || 1, a = st.a === undefined ? -1 : st.a, aim = mortAim(st, f);
      const fire = a >= 0.48 && a < 0.85 ? 1 - (a - 0.48) / 0.37 : 0, rec = a >= 0.48 && a < 0.8 ? Math.sin((a - 0.48) / 0.32 * Math.PI) : 0;
      if (t >= 3) for (let i = 0; i < 3; i++) { const p = (time * 0.4 + i / 3) % 1; K2.glow(g, -22 + Math.sin(p * 5 + i) * 3, top - 22 - p * 34, 4 + p * 7, '#b8b2b8', (1 - p) * 0.45); }
      // súng cối xoay thật theo hướng quái (16 hướng), giật lùi khi bắn; người lùn đứng phía sau súng
      const tip = mortarTip(t, aim, f), toward = Math.sin(aim) > 0.3, sx = f * 7;
      const dwarf = () => env.char('dwarf' + t, -f * 13, top + 2, f, a, time);
      if (toward) dwarf();
      const res = (window.Painter && Painter.res) || 1, ppu = Math.min(4, Math.max(0.5, Math.ceil(res * 1.1 * 2) / 2)), k = ((Math.round(mortYaw(aim) / (Math.PI * 2) * MORT_N) % MORT_N) + MORT_N) % MORT_N, sp = mortarSprite(t, k, ppu);
      if (sp) { const dx = tip.x - sx, dy = tip.y - 0, l = Math.hypot(dx, dy) || 1; g.drawImage(sp.c, sx - rec * 5 * dx / l - sp.ox, top - rec * 5 * dy / l - sp.oy, sp.w, sp.h); }
      if (!toward) dwarf();
      if (fire > 0) { K2.glow(g, tip.x, top + tip.y, 12 + fire * 14, '#ffd060', fire); K2.glow(g, tip.x + 2 * f, top + tip.y - 6, 8 + (1 - fire) * 16, '#e8e0d8', fire * 0.7); }
    }
  };
  if (window.ArtTowers && window.Towers3D) ['archer', 'mage', 'barracks', 'artillery'].forEach(type => {
    const d = ArtTowers[type]; if (!d) return;
    const orig = d.static, origFx = d.fx;
    d.static = (g, tier) => (Art3D.enabled && !failed && gl() ? drawTower(type, tier, g) : orig(g, tier));
    d.fx = (g, tier, time, st, env) => {
      if (!(Art3D.enabled && !failed && gl())) return origFx(g, tier, time, st, env);
      (FX3[type] || origFx)(g, tier, time, st, env);
      drawFront(type, tier, g);
    };
  });

  /** đỉnh cao nhất của trụ gần trục giữa (px, âm = lên) → chỗ cắm cột cờ / ngọc đỉnh tháp */
  const apexCache = new Map();
  if (window.ArtTowers) ArtTowers.apex = (type, tier) => {
    if (!Art3D.enabled || failed || !gl() || !window.Towers3D) return null;
    const k = type + tier; if (apexCache.has(k)) return apexCache.get(k);
    const root = towerRoot(type, tier); root.updateMatrixWorld(true); let best = 0, tmp = new T.Vector3(); const cE2 = Math.cos(EL), sE2 = Math.sin(EL);
    root.traverse(o => { if (!o.isMesh || !o.geometry.attributes.position) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 2) { tmp.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); const sx = tmp.x * 40, sy = -(tmp.y * cE2 - tmp.z * sE2) * 40; if (Math.abs(sx) < 8 && sy < best) best = sy; } });
    apexCache.set(k, best); return best;
  };

  /* bóng đổ của trụ: chiếu mô hình xuống mặt đất theo cùng hướng nắng với cây cối (terrain3d SDIR) */
  const SDIR = new T.Vector3(-2.4, 3.2, -1.1).normalize(), shMat = new T.MeshBasicMaterial({ color: 0x000000 });
  const shM = new T.Matrix4().set(1, -SDIR.x / SDIR.y, 0, 0, 0, 0.001, 0, 0, 0, -SDIR.z / SDIR.y, 1, 0, 0, 0, 0, 1);
  const shadowCache = new Map(), SH_PAD = [100, 30];
  function towerShadow(type, tier, ppu) {
    const k = type + tier + '|' + ppu; let c = shadowCache.get(k); if (c) return c;
    const [w, h, ox, oy] = ArtTowers[type].box;
    c = document.createElement('canvas'); c.width = Math.ceil((w + SH_PAD[0]) * ppu); c.height = Math.ceil((h + SH_PAD[1]) * ppu);
    const g = c.getContext('2d'); g.setTransform(ppu, 0, 0, ppu, ox * ppu, oy * ppu); g.filter = 'blur(' + (ppu * 0.8).toFixed(1) + 'px)';
    const root = towerRoot(type, tier), grp = new T.Group(), hid = [];
    grp.matrixAutoUpdate = false; grp.matrix.copy(shM); grp.add(root);
    root.traverse(o => { if (o.isSprite && o.visible) { o.visible = false; hid.push(o); } });
    scene.overrideMaterial = shMat; renderInto(grp, g, 40); scene.overrideMaterial = null;
    hid.forEach(o => { o.visible = true; }); grp.remove(root);
    shadowCache.set(k, c); return c;
  }
  if (window.Painter && window.ArtTowers && window.Towers3D) {
    const origTower = Painter.tower.bind(Painter);
    Painter.tower = function (ctx, type, tier, x, y, scale, t, st) {
      if (Art3D.enabled && !failed && !(st && st.portrait) && Towers3D.build && ArtTowers[type] && type !== 'orc' && gl()) {
        const ppu = Math.max(0.5, Math.min(4, Math.round(scale * this.res * 2) / 2)), [w, h, ox, oy] = ArtTowers[type].box;
        ctx.save(); ctx.globalAlpha = 0.3; ctx.drawImage(towerShadow(type, tier, ppu), x - ox * scale, y - oy * scale, (w + SH_PAD[0]) * scale, (h + SH_PAD[1]) * scale); ctx.restore();
      }
      return origTower(ctx, type, tier, x, y, scale, t, st);
    };
  }

  // ô xây trống 3D
  const plotCache = new Map(); let plotRoot = null;
  if (window.Painter && window.Towers3D && Towers3D.plot) {
    const origPlot = Painter.plot.bind(Painter);
    Painter.plot = function (ctx, x, y, hi, t) {
      if (!(Art3D.enabled && !failed && gl())) return origPlot(ctx, x, y, hi, t);
      const ppu = Math.max(0.5, Math.min(4, Math.round(this.res * 4) / 4));
      let c = plotCache.get(ppu);
      if (!c) {
        if (!plotRoot) { Chars3D.setInk(1.0); plotRoot = Towers3D.plot(); optimize(plotRoot, { n: {} }); plotRoot.updateMatrixWorld(true); }
        c = document.createElement('canvas'); c.width = Math.ceil(100 * ppu); c.height = Math.ceil(70 * ppu);
        const g = c.getContext('2d'); g.setTransform(ppu, 0, 0, ppu, 50 * ppu, 41 * ppu);
        drawStatic(plotRoot, g); plotCache.set(ppu, c);
      }
      ctx.drawImage(c, x - 50, y - 41, 100, 70);
      if (hi) { const p = 0.6 + Math.sin(t * 6) * 0.3; ctx.save(); ctx.globalAlpha = p; ctx.strokeStyle = '#ffe58a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y, 44, 17, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    };
  }

  /** Chụp 1 mô hình tĩnh thành sprite (1 m = 40 đv): → { c: canvas, ox, oy, w, h, fw } theo đv game */
  const _box = new T.Box3(), _v = new T.Vector3(), cE = Math.cos(EL), sE = Math.sin(EL);
  Art3D.sprite = function (root, ppu) {
    if (!gl()) return null;
    optimize(root, { n: {} }); root.updateMatrixWorld(true); _box.setFromObject(root);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (let i = 0; i < 8; i++) {
      _v.set(i & 1 ? _box.max.x : _box.min.x, i & 2 ? _box.max.y : _box.min.y, i & 4 ? _box.max.z : _box.min.z);
      const sx = _v.x * 40, sy = -(_v.y * cE - _v.z * sE) * 40;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    const pad = 3, ox = -x0 + pad, oy = -y0 + pad, w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2;
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w * ppu)); c.height = Math.max(1, Math.ceil(h * ppu));
    const g = c.getContext('2d'); g.setTransform(ppu, 0, 0, ppu, ox * ppu, oy * ppu);
    drawStatic(root, g);
    root.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    return { c, ox, oy, w, h, fw: (_box.max.x - _box.min.x) * 40 };
  };

  /* ---------- dựng sẵn khung hình lúc rảnh (≤ 6 ms mỗi khung màn hình) để khỏi khựng khi quái mới xuất hiện ---------- */
  const warmQ = []; let warmRaf = 0, scratch = null;
  const MODES = [['walk', Painter.N.walk], ['atk', Painter.N.atk], ['idle', Painter.N.idle], ['die', Painter.N.die]];
  Art3D.warm = function (list) {
    if (!Art3D.enabled || failed) return;
    for (const it of list) {
      if (!reg[it.key] || !reg[it.key].__3d) continue;
      for (const [mode, n] of (it.modes ? MODES.filter(m => it.modes.includes(m[0])) : MODES))
        for (let i = 0; i < n; i++) warmQ.push({ key: it.key, scale: it.scale, mode, ph: mode === 'idle' ? (i + 0.5) / n * IDLE : (i + 0.5) / n });
      if (it.dirs) for (let k = 0; k < 8; k++) { const dk = it.key + '_a' + k; if (!reg[dk]) continue; for (let i = 0; i < Painter.N.walk; i++) warmQ.push({ key: dk, scale: it.scale, mode: 'walk', ph: (i + 0.5) / Painter.N.walk }); if (k === 2 || k === 6) for (let i = 0; i < Painter.N.atk; i++) warmQ.push({ key: dk, scale: it.scale, mode: 'atk', ph: (i + 0.5) / Painter.N.atk }); }
    }
    if (!warmRaf && warmQ.length) warmRaf = requestAnimationFrame(pump);
  };
  function pump() {
    warmRaf = 0; if (!scratch) scratch = document.createElement('canvas').getContext('2d');
    const t0 = performance.now();
    while (warmQ.length && performance.now() - t0 < 6) { const j = warmQ.shift(); try { Painter.char(scratch, j.key, 0, 0, j.scale, 1, j.mode, j.ph); } catch (e) { } }
    if (warmQ.length) warmRaf = requestAnimationFrame(pump);
  }
  Art3D.warmClear = () => { warmQ.length = 0; };

  Art3D.setEnabled = function (on) {
    Art3D.enabled = !!on; plotCache.clear(); frontCache.clear(); shadowCache.clear();
    if (window.Painter) Painter.clear();
  };
  Art3D.available = () => !!gl();
  Art3D.optimize = root => { optimize(root, { n: {} }); root.updateMatrixWorld(true); return root; };
  Art3D.lightTheme = () => theme;
  Art3D.lights = () => LIGHT[theme] || LIGHT.forest;
  Art3D.renderer = () => gl();
  /** khoá hình theo hướng màn hình aim (rad, 0 = sang phải, π/2 = xuống) → 'key_aK' hoặc null */
  /** chỉ số hướng liên tục 0..8 (để chọn hướng có độ trễ) */
  Art3D.dirIndex = function (aim) {
    if (!Art3D.enabled || failed || aim === undefined || aim === null) return null;
    return ((Math.atan2(Math.cos(aim), Math.sin(aim) / Math.sin(EL)) / (Math.PI / 4)) % 8 + 8) % 8;
  };
  Art3D.dirKey = function (type, aim) {
    if (!Art3D.enabled || failed || aim === undefined || aim === null) return null;
    let k = Math.round(Math.atan2(Math.cos(aim), Math.sin(aim) / Math.sin(EL)) / (Math.PI / 4)); k = ((k % 8) + 8) % 8;
    const key = type + '_a' + k; return reg[key] ? key : null;
  };
  /** đổi ánh sáng theo vùng của màn chơi (xoá đệm khung hình để vẽ lại) */
  Art3D.setTheme = function (name) {
    if (!LIGHT[name] || name === theme) return; theme = name; applyTheme(); plotCache.clear(); frontCache.clear(); shadowCache.clear();
    if (window.Painter) Painter.clear(); if (window.Fx3D) Fx3D.clear();
  };
  window.Art3D = Art3D;
})();
