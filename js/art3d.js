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
  const IDLE = 2.618;                                    // chu kỳ idle của Painter (giây)

  let renderer = null, scene = null, cam = null, failed = false;
  function gl() {
    if (renderer || failed) return renderer;
    try {
      renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'low-power' });
      renderer.outputEncoding = T.sRGBEncoding; renderer.setPixelRatio(1); renderer.setClearColor(0x000000, 0);
      scene = new T.Scene();
      scene.add(new T.HemisphereLight(0xfff4e8, 0x5a4a6a, 0.85));
      const key = new T.DirectionalLight(0xffffff, 1.0); key.position.set(-1.5, 5, 4); scene.add(key);
      const rim = new T.DirectionalLight(0xa8c4ff, 0.4); rim.position.set(3, 2.5, -4); scene.add(rim);
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
    const c = g.canvas, m = g.getTransform(), W = c.width, H = c.height;
    const sz = r.getSize(new T.Vector2()); if (sz.x !== W || sz.y !== H) r.setSize(W, H, false);
    const s = 1 / (m.a * I.k); // mét / điểm ảnh
    cam.left = -m.e * s; cam.right = (W - m.e) * s; cam.top = m.f * s; cam.bottom = -(H - m.f) * s; cam.updateProjectionMatrix();
    scene.add(I.root); r.render(scene, cam); scene.remove(I.root);
    K.shadow(g, 0, 0.6, spec.shadow, spec.shadow * 0.24, 0.42);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(r.domElement, 0, 0); g.restore();
    Art3D.stats.frames++; Art3D.stats.ms += performance.now() - t0;
  }

  /* ---------- thay hình 2D bằng 3D (giữ hình 2D để quay về khi tắt) ---------- */
  const Art3D = { enabled: true, keys: [], stats: { frames: 0, ms: 0 } };
  function wrap(key, cid, tier, view, baseKey) {
    const base = reg[baseKey || key]; if (!base || (reg[key] && reg[key].__3d)) return;
    const orig = (reg[key] || base).draw;
    const spec = { cid, tier, view, orig, tall: base.tall || 30, shadow: Math.min(26, (base.wide || 26) * (cid === 'wolfRider' ? 0.5 : 0.48)) };
    reg[key] = Object.assign({}, base, reg[key] || {}, { chibi: true, __3d: true, draw: (g, P) => (Art3D.enabled && !failed ? draw3d(spec, g, P) : orig(g, P)) });
    Art3D.keys.push(key);
  }
  function wrapAll(key, cid, tier) { wrap(key, cid, tier, 'side'); wrap(key + '_b', cid, tier, 'back', key); wrap(key + '_f', cid, tier, 'front', key); }

  for (let t = 1; t <= 4; t++) { wrapAll('soldier' + t, 'soldier', t); wrapAll('elf' + t, 'elf', t); wrapAll('mage' + t, 'mage', t); wrapAll('dwarf' + t, 'dwarf', t); }
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
  const towers = new Map();
  function towerRoot(type, tier) {
    const key = type + tier; let root = towers.get(key); if (root) return root;
    Chars3D.setInk(1.0);
    root = Towers3D.build(type, tier); optimize(root, { n: {} }); root.updateMatrixWorld(true);
    towers.set(key, root); return root;
  }
  function drawTower(type, tier, g) {
    drawStatic(towerRoot(type, tier), g);
  }
  function drawStatic(root, g) {
    const r = gl(), c = g.canvas, m = g.getTransform(), W = c.width, H = c.height;
    const sz = r.getSize(new T.Vector2()); if (sz.x !== W || sz.y !== H) r.setSize(W, H, false);
    const s = 1 / (m.a * 40);
    cam.left = -m.e * s; cam.right = (W - m.e) * s; cam.top = m.f * s; cam.bottom = -(H - m.f) * s; cam.updateProjectionMatrix();
    scene.add(root); r.render(scene, cam); scene.remove(root);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(r.domElement, 0, 0); g.restore();
  }
  if (window.ArtTowers && window.Towers3D) ['archer', 'mage', 'barracks', 'artillery'].forEach(type => {
    const d = ArtTowers[type]; if (!d) return;
    const orig = d.static;
    d.static = (g, tier) => (Art3D.enabled && !failed && gl() ? drawTower(type, tier, g) : orig(g, tier));
  });

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

  Art3D.setEnabled = function (on) {
    Art3D.enabled = !!on; plotCache.clear();
    if (window.Painter) Painter.clear();
  };
  Art3D.available = () => !!gl();
  window.Art3D = Art3D;
})();
