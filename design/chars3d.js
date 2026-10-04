/* =========================================================
 * chars3d.js – Dựng nhân vật CHIBI 3D cho Canh Cổng (Three.js r147, không cần build)
 * Phong cách Kingdom Rush: đầu to, thân ngắn, tô toon 3 tông, viền mực đen dày
 * (inverted hull – xuất ra .glb vẫn giữ viền ở mọi engine).
 * Mỗi nhân vật = cây khớp có tên (root › hips › torso › head, armR/armL › vũ khí, legR/legL …)
 * + các clip hoạt ảnh (idle, walk, attack, skill, die) nướng sẵn từ hàm tư thế.
 * Bảng màu & chi tiết lấy đúng theo js/chibi.js (bản 2D trong game).
 * API: Chars3D.list, Chars3D.build(id, tier) → { root, clips, rig }, Chars3D.toExportable(root)
 * ========================================================= */
(function () {
  'use strict';
  const T = THREE, TAU = Math.PI * 2, S = Math.sin, C = Math.cos;
  T.ColorManagement.legacyMode = false; // màu hex = sRGB, xuất glTF đúng màu

  const INK = '#1b0f16', GOLD = '#f5c542', SKIN = '#ffd9b8', OUT = 0.026;
  let INKK = 1; // hệ số độ dày viền (trong trận dùng dày hơn cho rõ ở cỡ nhỏ)

  /* ---------- vật liệu toon ---------- */
  const GRAD = (() => {
    const d = new Uint8Array([88, 88, 88, 255, 168, 168, 168, 255, 255, 255, 255, 255]);
    const t = new T.DataTexture(d, 3, 1, T.RGBAFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; return t;
  })();
  const mats = {};
  function mat(col, o) {
    o = o || {};
    const k = col + '|' + (o.glow || 0) + '|' + (o.metal ? 1 : 0) + '|' + (o.op || 1) + '|' + (o.ds ? 1 : 0);
    if (!mats[k]) {
      const m = new T.MeshToonMaterial({ color: col, gradientMap: GRAD });
      if (o.glow) { m.emissive = new T.Color(col); m.emissiveIntensity = o.glow; }
      if (o.op) { m.transparent = true; m.opacity = o.op; m.depthWrite = false; }
      if (o.ds) m.side = T.DoubleSide;
      m.userData.metal = !!o.metal; m.userData.glow = o.glow || 0;
      mats[k] = m;
    }
    return mats[k];
  }
  const inkMat = new T.MeshBasicMaterial({ color: INK });
  inkMat.userData.ink = true;

  /* ---------- viền mực: vỏ đẩy theo pháp tuyến (gộp theo vị trí) + đảo chiều tam giác ---------- */
  function hullGeo(geo, t) {
    const p = geo.attributes.position, n = geo.attributes.normal, N = p.count, acc = new Map(), keys = new Array(N);
    for (let i = 0; i < N; i++) {
      const k = keys[i] = Math.round(p.getX(i) * 400) + ',' + Math.round(p.getY(i) * 400) + ',' + Math.round(p.getZ(i) * 400);
      let a = acc.get(k); if (!a) acc.set(k, a = new T.Vector3());
      a.x += n.getX(i); a.y += n.getY(i); a.z += n.getZ(i);
    }
    acc.forEach(v => v.normalize());
    const out = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const v = acc.get(keys[i]); out[i * 3] = p.getX(i) + v.x * t; out[i * 3 + 1] = p.getY(i) + v.y * t; out[i * 3 + 2] = p.getZ(i) + v.z * t; }
    const src = geo.index ? geo.index.array : null, M = src ? src.length : N, idx = N > 65535 ? new Uint32Array(M) : new Uint16Array(M);
    for (let i = 0; i < M; i += 3) { idx[i] = src ? src[i] : i; idx[i + 1] = src ? src[i + 2] : i + 2; idx[i + 2] = src ? src[i + 1] : i + 1; } // đảo chiều tam giác
    const h = new T.BufferGeometry(); h.setAttribute('position', new T.BufferAttribute(out, 3)); h.setIndex(new T.BufferAttribute(idx, 1)); return h;
  }
  /** Một khối có màu + viền. o: { ink: độ dày | false, metal, glow, op, ds } */
  function part(geo, col, o) {
    o = o || {};
    const m = new T.Mesh(geo, mat(col, o));
    if (o.ink !== false && !o.op) { const h = new T.Mesh(hullGeo(geo, (o.ink || OUT) * INKK), inkMat); h.userData.hull = true; m.add(h); }
    return m;
  }
  function node(name, parent, x, y, z) { const g = new T.Group(); g.name = name; g.position.set(x || 0, y || 0, z || 0); if (parent) parent.add(g); return g; }
  function add(parent, obj, x, y, z, rx, ry, rz) { obj.position.set(x || 0, y || 0, z || 0); obj.rotation.set(rx || 0, ry || 0, rz || 0); parent.add(obj); return obj; }

  /* ---------- hình học (đã nướng tỉ lệ để viền dày đều) ---------- */
  const G = {
    ball: (r, sx, sy, sz, seg) => new T.SphereGeometry(r, seg || 18, Math.round((seg || 18) * 0.7)).scale(sx || 1, sy || 1, sz || 1),
    cap: (r, len, seg) => new T.CapsuleGeometry(r, Math.max(0.001, len), 5, seg || 12),
    cyl: (rt, rb, h, seg) => new T.CylinderGeometry(rt, rb, h, seg || 14),
    cone: (r, h, seg) => new T.ConeGeometry(r, h, seg || 12),
    torus: (R, r, arc) => new T.TorusGeometry(R, r, 8, 26, arc || TAU),
    oct: (r, sy) => new T.OctahedronGeometry(r, 0).scale(1, sy || 1, 1),
    /** khối hộp bo tròn (siêu elip) – giáp, giày, ngực */
    sbox(w, h, d, e) {
      e = e === undefined ? 0.35 : e;
      const g = new T.SphereGeometry(1, 20, 14), p = g.attributes.position;
      const f = v => Math.sign(v) * Math.pow(Math.abs(v), e);
      for (let i = 0; i < p.count; i++) p.setXYZ(i, f(p.getX(i)) * w / 2, f(p.getY(i)) * h / 2, f(p.getZ(i)) * d / 2);
      g.computeVertexNormals(); return g;
    },
    /** xoay biên dạng quanh trục Y; pts = [[bán kính, y], …] */
    lathe(pts, seg, sz) { const g = new T.LatheGeometry(pts.map(q => new T.Vector2(q[0], q[1])), seg || 22); if (sz) g.scale(1, 1, sz); return g; },
    /** đùn đa giác phẳng (mặt XY), dày theo Z, căn giữa */
    ext(pts, depth, bevel) {
      const s = pts instanceof T.Shape ? pts : (() => { const q = new T.Shape(); q.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) q.lineTo(pts[i], pts[i + 1]); return q; })();
      const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: !!bevel, bevelThickness: bevel || 0, bevelSize: bevel || 0, bevelSegments: 2, curveSegments: 10 });
      g.translate(0, 0, -depth / 2); return g;
    },
    tube(pts, r, seg) { return new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(q => new T.Vector3(q[0], q[1], q[2]))), seg || 20, r, 8, false); },
    /** áo choàng cong, xoè ra ở dưới (khối kín để viền đủ) */
    cape(w, L, flare) {
      const s = new T.Shape(), n = 10, th = 0.035, bulge = w * 0.24;
      for (let i = 0; i <= n; i++) { const u = i / n * 2 - 1; i ? s.lineTo(u * w / 2, -bulge * (1 - u * u)) : s.moveTo(u * w / 2, -bulge * (1 - u * u)); }
      for (let i = n; i >= 0; i--) { const u = i / n * 2 - 1; s.lineTo(u * w / 2 * 0.98, -bulge * (1 - u * u) + th); }
      const g = new T.ExtrudeGeometry(s, { depth: L, bevelEnabled: false, steps: 6 }), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = z / L; p.setXYZ(i, x * (1 + flare * k), -z, y * (1 + flare * 0.7 * k) - k * k * 0.06); }
      g.computeVertexNormals(); return g;
    },
    /** nón uốn cong ra sau (mũ phù thuỷ) */
    bentCone(r, h, bend) {
      const g = G.lathe([[0, 0], [r, 0], [r * 0.62, h * 0.35], [r * 0.3, h * 0.7], [0.012, h]], 18), p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const k = p.getY(i) / h; p.setZ(i, p.getZ(i) - bend * k * k * h); p.setY(i, p.getY(i) - bend * 0.35 * k * k * k * h); }
      g.computeVertexNormals(); return g;
    }
  };
  const flipY = g => g.rotateX(Math.PI); // đảo đầu nón

  /* ---------- quầng sáng (chỉ để xem, không xuất) ---------- */
  let glowTex = null;
  function glow(parent, x, y, z, size, col, op) {
    if (!glowTex) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64); glowTex = new T.CanvasTexture(c);
    }
    const sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: op || 0.8, blending: T.AdditiveBlending, depthWrite: false }));
    sp.scale.set(size, size, size); sp.position.set(x, y, z); sp.userData.noExport = true; parent.add(sp); return sp;
  }

  /* =================== MẶT =================== */
  /** gắn vật lên mặt cầu đầu: u = góc ngang (+ về bên trái nhân vật), v = góc dọc, k = hệ số bán kính */
  function onHead(head, R, obj, u, v, k, rz) {
    obj.position.set(S(u) * C(v) * R * k, S(v) * R * k, C(u) * C(v) * R * k);
    obj.rotation.set(-v, u, rz || 0, 'YXZ'); head.add(obj); return obj;
  }
  /** o: { iris, eye: 'cute'|'fierce'|'round'|'glow', brow, mouth: 'line'|'smile'|'grin'|'none', blush, eu, ev } */
  function face(head, R, o) {
    const eu = o.eu || 0.38, ev = o.ev === undefined ? -0.06 : o.ev, es = (o.es || 1) * 1.3;
    for (const s of [-1, 1]) {
      const u = s * eu;
      if (o.eye === 'glow') {
        onHead(head, R, new T.Mesh(G.ball(R * 0.1 * es, 1.2, 0.7, 0.4), mat(o.iris, { glow: 2.2 })), u, ev, 0.99);
        const gp = new T.Vector3(S(u) * C(ev) * R * 1.05, S(ev) * R * 1.05, C(u) * C(ev) * R * 1.05);
        glow(head, gp.x, gp.y, gp.z, R * 0.9, o.iris, 0.9);
        continue;
      }
      const fy = o.eye === 'fierce' ? 0.72 : o.eye === 'round' ? 1.08 : 1;
      onHead(head, R, part(G.ball(R * 0.16 * es, 0.86, 1.1 * fy, 0.36), '#ffffff', { ink: 0.012 }), u, ev, 0.95);
      onHead(head, R, new T.Mesh(G.ball(R * 0.115 * es, 0.86, 1.05 * fy, 0.36), mat(o.iris)), u - s * 0.025, ev - 0.02, 0.985);
      onHead(head, R, new T.Mesh(G.ball(R * 0.062 * es, 0.86, 1.05 * fy, 0.36), mat(INK)), u - s * 0.028, ev - 0.02, 1.01);
      onHead(head, R, new T.Mesh(G.ball(R * 0.036 * es), mat('#ffffff', { glow: 0.6 })), u - s * 0.06, ev + 0.05 * fy, 1.035);
      if (o.brow) onHead(head, R, part(G.sbox(R * 0.36, R * 0.075, R * 0.09, 0.5), o.brow, { ink: 0.01 }), u, ev + (o.eye === 'fierce' ? 0.2 : 0.27), 1.0, s * (o.eye === 'fierce' ? 0.38 : -0.12));
      if (o.blush) onHead(head, R, new T.Mesh(G.ball(R * 0.1, 1.4, 0.7, 0.3), mat('#ff9a9a', { op: 0.75 })), s * 0.6, -0.26, 0.97);
    }
    const m = o.mouth || 'line';
    if (m === 'line') onHead(head, R, new T.Mesh(G.cap(R * 0.022, R * 0.16).rotateZ(Math.PI / 2), mat(INK)), 0, -0.36, 1.0);
    else if (m === 'smile') onHead(head, R, new T.Mesh(G.torus(R * 0.1, R * 0.022, Math.PI).rotateZ(Math.PI), mat(INK)), 0, -0.3, 0.99);
    else if (m === 'grin') onHead(head, R, new T.Mesh(G.ball(R * 0.16, 1.2, 0.55, 0.3), mat('#3a1a1a')), 0, -0.38, 0.96);
  }

  /* =================== KHUNG NGƯỜI =================== */
  /** Thân chibi: hông › thân › đầu, 2 tay (vai, cầm), 2 chân + giày. Mặt hướng +Z, cao ~2 đơn vị. */
  function humanoid(o) {
    const root = node('root'), n = {};
    o.hipY = o.legL + o.bootH;
    n.hips = node('hips', root, 0, o.hipY, 0);
    n.torso = node('torso', n.hips, 0, 0, 0);
    if (o.hunch) n.torso.rotation.x = o.hunch;
    n.head = node('head', n.torso, 0, o.torsoH + o.R * (o.neck || 0.8), o.headZ || 0);
    if (o.hunch) n.head.rotation.x = -o.hunch * 0.8;
    add(n.head, part(G.ball(o.R, 1.04, 0.96, 1), o.skin), 0, 0, 0);
    const len = o.armL, sx = o.torsoW / 2 + o.armR * 0.5, sy = o.torsoH - o.armR * 1.15;
    for (const [s, k] of [[-1, 'R'], [1, 'L']]) {
      const arm = n['arm' + k] = node('arm' + k, n.torso, s * sx, sy, 0);
      arm.rotation.z = s * 0.14;
      add(arm, part(G.cap(o.armR, len - o.armR), o.sleeve), 0, -len / 2 + o.armR * 0.3, 0);
      add(arm, part(G.ball(o.armR * 1.28), o.glove || o.skin), 0, -len, 0);
      n['hand' + k] = node('hand' + k, arm, 0, -len, 0);
      const leg = n['leg' + k] = node('leg' + k, n.hips, s * o.torsoW * 0.22, 0.02, 0);
      add(leg, part(G.cap(o.legR, o.legL - o.legR), o.legs), 0, -o.legL / 2, 0);
      add(leg, part(G.sbox(o.legR * 2.3, o.bootH, o.legR * 3.3, 0.4), o.boots), 0, -o.legL - o.bootH / 2 + 0.01, o.legR * 0.55);
    }
    return { root, n, o };
  }
  /** lưu tư thế nghỉ để hoạt ảnh cộng dồn */
  function freeze(rig) {
    Object.values(rig.n).forEach(nd => { nd.userData.r0 = nd.rotation.clone(); nd.userData.p0 = nd.position.clone(); nd.userData.s0 = nd.scale.clone(); });
  }

  /* =================== VŨ KHÍ (gốc = tay cầm, lưỡi theo +Y) =================== */
  const WEAP = {
    sword(len, w, blade, guard, o) {
      o = o || {}; const g = node('weapon');
      add(g, part(G.cyl(0.03, 0.03, 0.17), o.grip || '#4a2a1a'), 0, -0.07, 0);
      add(g, part(G.ball(0.048), o.pommel || GOLD, { metal: 1 }), 0, -0.17, 0);
      add(g, part(G.sbox(0.08, 0.06, w * 2.5, 0.5), guard, { metal: 1 }), 0, 0.03, 0);
      if (o.spikes) for (const s of [-1, 1]) add(g, part(G.cone(0.03, 0.12), guard), 0, 0.08, s * w * 1.3, s * 0.6, 0, 0);
      add(g, part(G.ext([-w / 2, 0, w / 2, 0, w / 2, len * 0.84, 0, len, -w / 2, len * 0.84], 0.032, 0.008).rotateY(Math.PI / 2), blade, { metal: 1, glow: o.glow }), 0, 0.05, 0);
      if (o.core) for (const s of [-1, 1]) add(g, new T.Mesh(G.sbox(0.006, len * 0.72, w * 0.22, 0.6), mat(o.core, { glow: 1.6 })), s * 0.026, 0.05 + len * 0.42, 0);
      if (o.halo) glow(g, 0, len * 0.55, 0, len * 1.1, o.halo, 0.35);
      return g;
    },
    shield(col, t, rim) {
      const g = node('shield'), sh = new T.Shape();
      sh.moveTo(-0.2, 0.24); sh.lineTo(0.2, 0.24); sh.quadraticCurveTo(0.22, -0.06, 0, -0.27); sh.quadraticCurveTo(-0.22, -0.06, -0.2, 0.24);
      add(g, part(G.ext(sh, 0.05, 0.018), rim || '#d8dce6', { metal: 1 }), 0, 0, 0);
      add(g, new T.Mesh(G.ext(sh, 0.05, 0.004).scale(0.86, 0.86, 1), mat(col)), 0, 0.005, 0.018);
      if (t >= 2) { add(g, part(G.sbox(0.05, 0.4, 0.03, 0.5), GOLD, { metal: 1, ink: 0.012 }), 0, -0.01, 0.06); add(g, part(G.sbox(0.3, 0.05, 0.03, 0.5), GOLD, { metal: 1, ink: 0.012 }), 0, 0.07, 0.06); }
      else add(g, part(G.ball(0.04, 1, 1, 0.6), '#c8c8c8', { metal: 1 }), 0, 0, 0.05);
      return g;
    },
    axe(c, double) {
      const g = node('weapon');
      add(g, part(G.cyl(0.03, 0.034, 0.85), '#5a3a24'), 0, 0.22, 0);
      for (const y of [0.0, 0.1]) add(g, new T.Mesh(G.torus(0.035, 0.008), mat('#3a2416')), 0, y, 0, Math.PI / 2);
      const bit = s => G.ext([0.02, 0.52, 0.16, 0.66, 0.28, 0.64, 0.25, 0.48, 0.28, 0.32, 0.16, 0.34, 0.02, 0.42], 0.04, 0.01).rotateY(-s * Math.PI / 2);
      add(g, part(bit(1), c, { metal: 1 }), 0, 0, 0);
      if (double) add(g, part(bit(-1), c, { metal: 1 }), 0, 0, 0);
      add(g, part(G.cone(0.03, 0.1), '#9aa0ac', { metal: 1 }), 0, 0.68, 0);
      return g;
    },
    warhammer(c) {
      const g = node('weapon');
      add(g, part(G.cyl(0.032, 0.036, 0.8), '#6a4026'), 0, 0.2, 0);
      add(g, part(G.sbox(0.22, 0.2, 0.36, 0.3), c, { metal: 1 }), 0, 0.62, 0);
      for (const s of [-1, 1]) add(g, part(G.sbox(0.24, 0.07, 0.06, 0.4), GOLD, { metal: 1 }), 0, 0.62, s * 0.19);
      add(g, new T.Mesh(G.ball(0.035), mat('#ff7a2a', { glow: 1.5 })), 0.115, 0.62, 0);
      return g;
    },
    knife() {
      const g = node('weapon');
      add(g, part(G.cyl(0.022, 0.022, 0.09), '#4a2e1a'), 0, -0.02, 0);
      add(g, part(G.ext([-0.035, 0, 0.035, 0, 0.02, 0.16, -0.01, 0.24, -0.04, 0.12], 0.02, 0.004).rotateY(Math.PI / 2), '#c8ccd4', { metal: 1 }), 0, 0.03, 0);
      return g;
    },
    spear() {
      const g = node('weapon');
      add(g, part(G.cyl(0.024, 0.026, 1.35), '#6a4426'), 0, 0.3, 0);
      add(g, part(G.oct(0.07, 2.2).scale(1, 1, 0.4), '#c8ccd6', { metal: 1 }), 0, 1.1, 0);
      add(g, part(G.cone(0.05, 0.12), '#a8201a'), 0, 0.92, 0, Math.PI);
      return g;
    },
    staff(gem, t, n) {
      const g = node('staff');
      add(g, part(G.cyl(0.026, 0.032, 1.08), t >= 3 ? '#3a2a5a' : '#5a3a26'), 0, 0.17, 0);
      add(g, part(G.torus(0.045, 0.016), GOLD, { metal: 1 }), 0, 0.7, 0, Math.PI / 2);
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; add(g, part(G.cone(0.02, 0.12), GOLD, { metal: 1, ink: 0.012 }), S(a) * 0.04, 0.76, C(a) * 0.04, C(a) * 0.5, 0, -S(a) * 0.5); }
      n.gem = node('gem', g, 0, 0.88, 0);
      add(n.gem, part(G.oct(0.085 + t * 0.008, 1.45), gem, { glow: 1.1, ink: 0.014 }), 0, 0, 0);
      glow(n.gem, 0, 0, 0, 0.5 + t * 0.08, gem, 0.75);
      return g;
    },
    bow(t, n) {
      const g = node('bow'), wood = t >= 3 ? GOLD : '#c89a3a';
      add(g, part(G.tube([[0, 0.14, -0.46], [0, 0.03, -0.27], [0, -0.04, 0], [0, 0.03, 0.27], [0, 0.14, 0.46]], 0.022), wood, { metal: t >= 3 }), 0, 0, 0);
      if (t >= 2) for (const s of [-1, 1]) add(g, new T.Mesh(G.tube([[0.02, 0.0, s * 0.08], [0.022, 0.035, s * 0.3]], 0.008, 6), mat('#3fae5a')), 0, 0, 0);
      add(g, part(G.cyl(0.032, 0.032, 0.12).rotateX(Math.PI / 2), '#5a3420'), 0, -0.04, 0);
      for (const s of [-1, 1]) add(g, part(G.ball(0.03), t >= 4 ? '#c8ffb0' : GOLD, { glow: t >= 4 ? 1.2 : 0 }), 0, 0.14, s * 0.46);
      add(g, new T.Mesh(G.cyl(0.005, 0.005, 0.92).rotateX(Math.PI / 2), mat('#f4f0e0')), 0, 0.14, 0);
      n.arrow = node('arrow', g, 0, 0.14, 0);
      add(n.arrow, part(G.cyl(0.011, 0.011, 0.5), '#d8b880', { ink: 0.012 }), 0, -0.2, 0);
      add(n.arrow, part(flipY(G.cone(0.03, 0.08)), t >= 4 ? '#c8ffb0' : '#dfe6f0', { metal: 1, ink: 0.012, glow: t >= 4 ? 1 : 0 }), 0, -0.48, 0);
      for (const s of [-1, 1]) add(n.arrow, new T.Mesh(G.sbox(0.004, 0.08, 0.04), mat('#f4f0e0')), 0, 0.02, s * 0.018);
      if (t >= 4) glow(g, 0, 0, 0, 0.7, '#c8ffb0', 0.35);
      return g;
    }
  };

  /* =================== NHÂN VẬT =================== */
  /** Kiếm sĩ Con Người (trụ Người) / Aldric (anh hùng) */
  function SOLDIER(t, o) {
    o = o || {};
    const HC = o.hair || '#1e1a22', CAPE = o.cape || '#6a1218';
    const armor = o.armor || (t === 1 ? '#aab0ba' : t === 2 ? '#c2c8d2' : '#dde2ea');
    const rig = humanoid({ R: 0.46, torsoH: 0.5, torsoW: 0.5, torsoD: 0.36, legL: 0.3, legR: 0.095, bootH: 0.13, armL: 0.37, armR: 0.092,
      skin: SKIN, legs: '#5a5e6a', boots: t >= 3 ? '#8a94a6' : '#3a2a20', sleeve: armor, glove: '#6a6e78' });
    const { n } = rig, d = rig.o, R = d.R;
    add(n.torso, part(G.sbox(d.torsoW, d.torsoH, d.torsoD, 0.32), armor, { metal: 1 }), 0, d.torsoH / 2, 0);
    add(n.torso, part(G.sbox(d.torsoW * 1.04, 0.07, d.torsoD * 1.04, 0.4), '#3a2216'), 0, 0.05, 0);
    add(n.torso, part(G.ext([-0.13, 0, 0.13, 0, 0.1, -0.2, 0, -0.25, -0.1, -0.2], 0.04, 0.01), CAPE), 0, 0.04, d.torsoD / 2 - 0.02);
    if (t >= 3) {
      add(n.torso, part(G.sbox(d.torsoW * 0.9, 0.04, 0.03, 0.5), GOLD, { metal: 1, ink: 0.012 }), 0, d.torsoH * 0.78, d.torsoD / 2);
      add(n.torso, part(G.ball(0.04, 1, 1, 0.6), '#c8202a', { glow: 0.3 }), 0, d.torsoH * 0.55, d.torsoD / 2 + 0.005);
    }
    for (const k of ['R', 'L']) add(n['arm' + k], part(G.ball(0.15, 1.15, 0.85, 1.05), t >= 4 ? GOLD : armor, { metal: 1 }), 0, 0.02, 0);
    n.cape = node('cape', n.torso, 0, d.torsoH - 0.03, -d.torsoD / 2 + 0.02);
    add(n.cape, part(G.cape(d.torsoW * 0.9, 0.42 + t * 0.07, 0.5), CAPE, { ds: true }), 0, 0, 0);
    // đầu
    face(n.head, R, { iris: o.iris || '#3a2a22', eye: 'fierce', brow: HC === '#1e1a22' ? INK : '#8a8ea0', mouth: 'line' });
    add(n.head, part(G.ball(R * 1.07, 1.04, 0.9, 1.04), HC), 0, R * 0.22, -R * 0.13);
    for (const [x, z, rx, rz, h] of [[-0.55, -0.1, -0.2, 0.55, 0.42], [-0.05, 0.05, -0.35, 0.05, 0.46], [0.45, -0.05, -0.2, -0.5, 0.4], [0.05, -0.6, -0.9, 0.1, 0.42]])
      add(n.head, part(G.cone(R * 0.25, R * h), HC), R * x, R * 0.95, R * z, rx, 0, rz);
    for (const [x, rz] of [[-0.4, 0.35], [0.05, 0], [0.42, -0.3]]) onHead(n.head, R, part(flipY(G.cone(R * 0.19, R * 0.34)), HC), x * 0.9, 0.5, 0.97, rz);
    if (t >= 4 && !o.noCrown) {
      add(n.head, part(G.cyl(R * 0.5, R * 0.55, R * 0.16, 16), GOLD, { metal: 1 }), 0, R * 1.02, -R * 0.05);
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; add(n.head, part(G.cone(R * 0.09, R * 0.28), GOLD, { metal: 1, ink: 0.014 }), S(a) * R * 0.5, R * 1.22, C(a) * R * 0.5 - R * 0.05); }
    }
    // vũ khí
    let sw;
    if (o.weapon === 'greatsword') sw = WEAP.sword(0.78, 0.15, '#e8f4ff', GOLD, { core: o.wcol || '#9ae0ff', halo: o.wcol || '#9ae0ff', grip: '#3a2a4a' });
    else sw = WEAP.sword(0.7, 0.13, t >= 3 ? '#f0f4fa' : '#d4dae4', t >= 3 ? GOLD : '#8a8e98', { glow: t === 4 ? 0.25 : 0, halo: t === 4 ? '#ffe6a0' : null });
    add(n.handR, sw, 0, 0, 0, 1.15);
    if (o.shield !== false) { n.shield = WEAP.shield(o.shieldCol || '#8a1e24', t, t >= 3 ? GOLD : '#d8dce6'); add(n.handL, n.shield, 0.07, 0.14, 0.05, 0, 0.45, 0); }
    return { rig, anim: { kind: 'melee', shield: o.shield !== false, skill: o.shield !== false ? 'block' : 'holy' } };
  }

  /** Cung thủ Elf / Lyra */
  function ELF(t, o) {
    o = o || {};
    const tunic = o.tunic || (t >= 4 ? '#5ac078' : '#3fa05a'), hairC = o.hair || (t >= 3 ? '#fff6dc' : '#f5d878'), cape = o.cape || (t >= 2 ? '#2f7a40' : null);
    const rig = humanoid({ R: 0.46, torsoH: 0.46, torsoW: 0.38, torsoD: 0.28, legL: 0.33, legR: 0.078, bootH: 0.12, armL: 0.36, armR: 0.072,
      skin: SKIN, legs: '#2f6a3a', boots: '#6a4a26', sleeve: tunic });
    const { n } = rig, d = rig.o, R = d.R;
    add(n.torso, part(G.lathe([[0, 0.48], [0.17, 0.48], [0.2, 0.36], [0.19, 0.2], [0.23, 0.02], [0.27, -0.1], [0, -0.1]], 20, 0.78), tunic), 0, 0, 0);
    add(n.torso, part(G.torus(0.2, 0.025).rotateX(Math.PI / 2).scale(1, 1, 0.8), '#6a4a26'), 0, 0.12, 0);
    if (t >= 2) add(n.torso, part(G.sbox(0.025, 0.36, 0.02), GOLD, { metal: 1, ink: 0.01 }), 0, 0.26, 0.15);
    for (const s of [-1, 1]) add(n.torso, part(G.ball(0.11, 1.3, 0.55, 1), t >= 3 ? GOLD : '#7acc6a', { metal: t >= 3 }), s * 0.2, 0.46, 0, 0, 0, -s * 0.35);
    // ống tên sau lưng
    const q = node('quiver', n.torso, -0.08, 0.3, -0.17); q.rotation.set(0.15, 0, -0.45);
    add(q, part(G.cyl(0.06, 0.055, 0.34), '#7a4a26'), 0, 0, 0);
    for (const x of [-0.025, 0.0, 0.025]) add(q, part(G.cone(0.025, 0.1), t >= 4 ? '#9affc8' : '#f4f0e0', { ink: 0.01 }), x, 0.22, 0);
    if (cape) { n.cape = node('cape', n.torso, 0, d.torsoH - 0.04, -d.torsoD / 2 + 0.02); add(n.cape, part(G.cape(d.torsoW * 0.85, 0.34, 0.4), cape, { ds: true }), 0, 0, 0); }
    face(n.head, R, { iris: '#2aa86a', eye: 'cute', brow: '#c8a040', mouth: 'smile', blush: true });
    add(n.head, part(G.ball(R * 1.07, 1.03, 0.9, 1.04), hairC), 0, R * 0.21, -R * 0.13);
    add(n.head, part(G.ball(R * 0.75, 1.05, 1.55, 0.55), hairC), 0, -R * 0.6, -R * 0.6, 0.15);
    for (const [x, rz] of [[-0.5, 0.5], [-0.15, 0.25], [0.3, -0.35]]) onHead(n.head, R, part(flipY(G.cone(R * 0.22, R * 0.5)), hairC), x, 0.48, 0.96, rz);
    for (const s of [-1, 1]) add(n.head, part(G.cone(R * 0.15, R * 0.75).scale(1, 1, 0.5), SKIN), s * R * 1.08, R * 0.12, -R * 0.08, 0, 0, -s * (Math.PI / 2 - 0.45));
    if (t >= 3) {
      add(n.head, part(G.torus(R * 1.02, 0.018).rotateX(Math.PI / 2), GOLD, { metal: 1, ink: 0.012 }), 0, R * 0.42, 0, -0.12);
      onHead(n.head, R, part(G.oct(0.05, 1.3), '#7fffd0', { glow: 0.8, ink: 0.012 }), 0, 0.5, 1.03);
    }
    add(n.handL, WEAP.bow(t, n), 0, 0, 0.02);
    return { rig, anim: { kind: 'bow', skill: 'triple' } };
  }

  /** Phù thuỷ (trụ Phép) / Selene */
  function MAGE(t, o) {
    o = o || {};
    const robe = o.robe || '#4a3ec4', hairC = o.hair || '#d8d4f8', hatC = o.hat || '#3a2ea0', trimC = o.trim || '#7fd8ff', capeC = o.cape || '#2a2480';
    const rig = humanoid({ R: 0.46, torsoH: 0.44, torsoW: 0.36, torsoD: 0.3, legL: 0.2, legR: 0.07, bootH: 0.1, armL: 0.33, armR: 0.075,
      skin: SKIN, legs: '#2a2260', boots: '#22183a', sleeve: robe });
    const { n } = rig, d = rig.o, R = d.R;
    add(n.torso, part(G.lathe([[0, 0.46], [0.16, 0.46], [0.19, 0.3], [0.26, 0.05], [0.36, -0.2], [0.42, -0.28], [0, -0.28]], 22, 0.85), robe), 0, 0, 0);
    add(n.torso, part(G.torus(0.415, 0.022).rotateX(Math.PI / 2).scale(1, 1, 0.85), trimC, { ink: 0.012 }), 0, -0.27, 0);
    add(n.torso, part(G.torus(0.17, 0.045).rotateX(Math.PI / 2).scale(1, 1, 0.85), robe), 0, 0.45, 0);
    add(n.torso, part(G.sbox(0.03, 0.62, 0.02), trimC, { ink: 0.01 }), 0, 0.1, 0.2, -0.38);
    add(n.torso, part(G.torus(0.19, 0.022).rotateX(Math.PI / 2).scale(1, 1, 0.85), GOLD, { metal: 1, ink: 0.012 }), 0, 0.2, 0);
    if (t >= 3) add(n.torso, part(G.oct(0.05, 1.3).scale(1, 1, 0.5), trimC, { glow: 0.8, ink: 0.012 }), 0, 0.36, 0.15);
    for (const k of ['R', 'L']) add(n['arm' + k], part(G.cyl(0.07, 0.12, 0.16), robe), 0, -0.25, 0);
    n.cape = node('cape', n.torso, 0, d.torsoH - 0.04, -d.torsoD / 2 + 0.03);
    add(n.cape, part(G.cape(d.torsoW * 1.0, 0.62, 0.9), capeC, { ds: true }), 0, 0, 0);
    face(n.head, R, { iris: o.iris || '#7a5ae0', eye: 'cute', brow: '#9a90c8', mouth: 'smile', blush: true });
    add(n.head, part(G.ball(R * 1.07, 1.03, 0.92, 1.04), hairC), 0, R * 0.17, -R * 0.13);
    add(n.head, part(G.ball(R * 0.78, 1.15, 1.5, 0.55), hairC), 0, -R * 0.55, -R * 0.55, 0.12);
    for (const [x, rz] of [[-0.45, 0.4], [0.35, -0.4]]) onHead(n.head, R, part(flipY(G.cone(R * 0.24, R * 0.55)), hairC), x, 0.38, 0.95, rz);
    // mũ phù thuỷ
    const hat = node('hat', n.head, 0, R * 0.62, -R * 0.04); hat.rotation.set(-0.08, 0, 0.06);
    add(hat, part(G.cyl(R * 1.72, R * 1.72, R * 0.09, 28), hatC), 0, 0, 0);
    add(hat, part(G.bentCone(R * 0.92, R * 2.4, 0.42), hatC), 0, R * 0.03, 0);
    add(hat, part(G.cyl(R * 0.86, R * 0.92, R * 0.22, 22), GOLD, { metal: 1 }), 0, R * 0.14, 0);
    for (const [x, y, z, r] of [[-0.35, 0.95, 0.5, 0.07], [0.3, 1.25, 0.33, 0.05], [0.05, 1.7, 0.08, 0.045]]) add(hat, part(G.oct(R * r * 1.6, 1).scale(1, 1, 0.5), '#fff6a0', { glow: 0.7, ink: 0.01 }), R * x, R * y, R * z, 0, 0, 0.4);
    const staff = WEAP.staff(o.wcol || '#9ae6ff', t, n); n.staff = staff;
    add(n.handR, staff, 0, 0, 0.02, 0.12);
    return { rig, anim: { kind: 'staff', skill: 'meteor' } };
  }

  /** Chiến binh Lùn (trụ Lùn) / Borin */
  function DWARF(t, o) {
    o = o || {};
    const steel = t >= 4 ? '#d8b860' : '#9ea4b0', beard = o.beard || '#d4581e', armor = o.armor || (t >= 3 ? '#8a92a0' : '#7a6a5a');
    const rig = humanoid({ R: 0.5, torsoH: 0.44, torsoW: 0.7, torsoD: 0.54, legL: 0.13, legR: 0.12, bootH: 0.15, armL: 0.34, armR: 0.12,
      skin: '#f8c4a0', legs: '#4a3428', boots: '#2a1c14', sleeve: armor, glove: '#3a2a20', neck: 0.62 });
    const { n } = rig, d = rig.o, R = d.R;
    add(n.torso, part(G.ball(0.4, 0.95, 0.68, 0.72), armor, { metal: t >= 3 }), 0, 0.22, 0);
    for (const y of [0.32, 0.17]) add(n.torso, new T.Mesh(G.torus(0.37, 0.012).rotateX(Math.PI / 2).scale(1.03, 1, 0.78), mat('#3a3028')), 0, y, 0);
    add(n.torso, part(G.cyl(0.38, 0.38, 0.1, 22).scale(1, 1, 0.78), '#3a2416'), 0, 0.04, 0);
    add(n.torso, part(G.sbox(0.13, 0.11, 0.05, 0.4), GOLD, { metal: 1 }), 0, 0.04, 0.3);
    for (const k of ['R', 'L']) {
      add(n['arm' + k], part(G.ball(0.19, 1.1, 0.8, 1.05), steel, { metal: 1 }), 0, 0.02, 0);
      if (t >= 2) for (const z of [-0.07, 0.07]) add(n['arm' + k], new T.Mesh(G.ball(0.022), mat('#e8e8f0')), 0, 0.17, z);
    }
    face(n.head, R, { iris: '#3a5ab8', eye: 'cute', brow: null, mouth: 'none', ev: 0.0, es: 0.85 });
    for (const s of [-1, 1]) onHead(n.head, R, part(G.sbox(R * 0.42, R * 0.13, R * 0.14, 0.5), beard, { ink: 0.012 }), s * 0.38, 0.2, 1.08, s * 0.22);
    onHead(n.head, R, part(G.ball(R * 0.2), '#f0a080', { ink: 0.014 }), 0, -0.2, 1.0);
    // râu khổng lồ
    add(n.head, part(G.ball(R * 0.78, 1.1, 1.1, 0.62), beard), 0, -R * 0.95, R * 0.52);
    for (const s of [-1, 1]) {
      add(n.head, part(G.ball(R * 0.42, 0.8, 1.1, 0.8), beard), s * R * 0.7, -R * 0.5, R * 0.3);
      add(n.head, part(G.cap(R * 0.1, R * 0.4).rotateZ(Math.PI / 2 - s * 0.35), sh(beard, 0.15)), s * R * 0.25, -R * 0.4, R * 0.96);
    }
    if (t >= 3) for (const s of [-1, 1]) add(n.head, part(G.cyl(R * 0.1, R * 0.1, R * 0.14), GOLD, { metal: 1, ink: 0.012 }), s * R * 0.3, -R * 1.6, R * 0.62);
    // mũ sắt
    add(n.head, part(G.ball(R * 1.09, 1.03, 0.72, 1.04), steel, { metal: 1 }), 0, R * 0.45, -R * 0.04);
    add(n.head, part(G.torus(R * 1.0, R * 0.08).rotateX(Math.PI / 2), sh(steel, -0.15), { metal: 1 }), 0, R * 0.48, -R * 0.03, -0.06);
    onHead(n.head, R, part(G.sbox(R * 0.16, R * 0.5, R * 0.12, 0.5), sh(steel, -0.1), { metal: 1, ink: 0.014 }), 0, 0.36, 1.07);
    if (t >= 3) for (const s of [-1, 1]) add(n.head, part(G.tube([[s * R * 0.8, R * 0.62, 0], [s * R * 1.4, R * 0.9, 0], [s * R * 1.5, R * 1.45, -R * 0.1], [s * R * 1.3, R * 1.9, -R * 0.15]], R * 0.12, 16), '#f2ead6'), 0, 0, 0);
    let w;
    if (o.weapon === 'warhammer') w = WEAP.warhammer(t >= 3 ? '#c4c8d4' : '#a8adb8');
    else w = WEAP.axe(t >= 4 ? '#f2d070' : t >= 3 ? '#d8dce6' : '#aeb2bc', true);
    add(n.handR, w, 0, 0, 0, 1.1);
    return { rig, anim: { kind: 'two', skill: 'slam' } };
  }
  function sh(hex, k) { const c = new T.Color(hex); const hsl = {}; c.getHSL(hsl); return '#' + new T.Color().setHSL(hsl.h, hsl.s, Math.max(0, Math.min(1, hsl.l + k * 0.5))).getHexString(); }

  /** Goblin (quái nhỏ) / Bóng Tối */
  function GOBLIN(o) {
    o = o || {}; const skin = o.skin || '#7cc23e', cloth = o.cloth || '#7a5232', eye = o.eye || '#ffd23a';
    const rig = humanoid({ R: 0.42, torsoH: 0.3, torsoW: 0.3, torsoD: 0.25, legL: 0.18, legR: 0.062, bootH: 0.08, armL: 0.27, armR: 0.058, hunch: 0.32, neck: 0.75, headZ: 0.06,
      skin, legs: sh(skin, -0.25), boots: '#4a3020', sleeve: skin });
    const { n } = rig, d = rig.o, R = d.R;
    add(n.torso, part(G.lathe([[0, 0.31], [0.13, 0.31], [0.16, 0.18], [0.2, 0.0], [0.17, -0.06], [0, -0.06]], 9, 0.85), cloth), 0, 0, 0);
    add(n.torso, part(G.torus(0.15, 0.02).rotateX(Math.PI / 2).scale(1, 1, 0.85), '#3a2416', { ink: 0.01 }), 0, 0.08, 0);
    if (o.glow) {
      face(n.head, R, { iris: eye, eye: 'glow', es: 1.2 });
      glow(n.torso, 0, 0.2, 0, 1.6, '#7a3aff', 0.35);
    } else face(n.head, R, { iris: eye, eye: 'round', es: 1.15, brow: sh(skin, -0.4), mouth: 'grin', eu: 0.4 });
    if (!o.glow) onHead(n.head, R, new T.Mesh(flipY(G.cone(R * 0.06, R * 0.12)), mat('#fffbe8')), 0.08, -0.36, 1.0);
    onHead(n.head, R, part(G.cone(R * 0.11, R * 0.36).rotateX(Math.PI / 2), skin), 0, -0.12, 0.98);
    for (const s of [-1, 1]) add(n.head, part(G.cone(R * 0.22, R * 1.3).scale(1, 1, 0.42), skin), s * R * 1.35, R * 0.18, -R * 0.05, 0, 0, -s * (Math.PI / 2 - 0.28));
    if (!o.glow) {
      add(n.head, part(G.ball(R * 1.05, 1.02, 0.62, 1.04), '#c8302a'), 0, R * 0.42, -R * 0.08);
      for (const s of [-1, 1]) add(n.head, part(G.cone(R * 0.12, R * 0.4), '#c8302a'), s * R * 0.12, R * 0.2, -R * 1.05, -2.0, 0, s * 0.4);
    }
    add(n.handR, WEAP.knife(), 0, 0, 0, 1.2);
    return { rig, anim: { kind: 'stab', look: true, skill: null } };
  }

  /** Orc (quái) – biến thể 1..3 */
  function ORC(t) {
    const skin = '#7a9a62', leather = '#6a3e26', steel = t >= 3 ? '#c8ccd6' : '#8a8e98';
    const rig = humanoid({ R: 0.47, torsoH: 0.5, torsoW: 0.62, torsoD: 0.42, legL: 0.27, legR: 0.12, bootH: 0.12, armL: 0.4, armR: 0.12,
      skin, legs: '#4a2e20', boots: '#2a1a14', sleeve: skin, glove: '#4a2e20' });
    const { n } = rig, d = rig.o, R = d.R;
    add(n.torso, part(G.sbox(d.torsoW, d.torsoH, d.torsoD, 0.4), skin), 0, d.torsoH / 2, 0);
    add(n.torso, part(G.sbox(0.07, 0.72, 0.46, 0.5), '#3a2216', { ink: 0.014 }), 0, d.torsoH * 0.5, 0, 0, 0, 0.75);
    add(n.torso, part(G.sbox(d.torsoW * 1.06, 0.1, d.torsoD * 1.06, 0.4), leather), 0, 0.05, 0);
    add(n.torso, part(G.ext([-0.13, 0, 0.13, 0, 0.1, -0.22, -0.1, -0.22], 0.04, 0.01), '#b02a24'), 0, 0.02, d.torsoD / 2 - 0.02);
    add(n.armR, part(G.ball(0.19, 1.1, 0.8, 1.05), steel, { metal: 1 }), 0, 0.02, 0);
    if (t >= 2) add(n.armL, part(G.ball(0.17, 1.1, 0.8, 1.05), leather), 0, 0.02, 0);
    if (t >= 2) for (const z of [-0.08, 0.08]) add(n.armR, part(G.cone(0.04, 0.14), '#d8d8e0', { ink: 0.012 }), 0, 0.2, z);
    if (t >= 3) { // da sói trên vai
      add(n.torso, part(G.ball(0.36, 1.2, 0.4, 0.85), '#8a8a92'), 0, d.torsoH + 0.02, -0.02);
      for (const x of [-0.12, 0, 0.12]) add(n.torso, part(flipY(G.cone(0.03, 0.09)), '#f2f0e8', { ink: 0.01 }), x, d.torsoH - 0.06, 0.28);
    }
    face(n.head, R, { iris: '#ff5a2a', eye: 'fierce', brow: INK, mouth: 'grin' });
    for (const s of [-1, 1]) {
      onHead(n.head, R, part(G.cone(R * 0.075, R * 0.3), '#fff8e0', { ink: 0.012 }), s * 0.28, -0.4, 1.0);
      add(n.head, part(G.cone(R * 0.16, R * 0.5).scale(1, 1, 0.5), skin), s * R * 1.02, R * 0.08, -R * 0.05, 0, 0, -s * (Math.PI / 2 - 0.35));
    }
    if (t >= 3) {
      add(n.head, part(G.ball(R * 1.08, 1.03, 0.8, 1.04), steel, { metal: 1 }), 0, R * 0.28, -R * 0.04);
      add(n.head, part(G.torus(R * 1.05, R * 0.07).rotateX(Math.PI / 2), GOLD, { metal: 1 }), 0, R * 0.38, -R * 0.03, -0.05);
      for (const s of [-1, 1]) add(n.head, part(G.tube([[s * R * 0.8, R * 0.55, 0], [s * R * 1.5, R * 0.8, 0], [s * R * 1.5, R * 1.5, -R * 0.1]], R * 0.12, 14), '#f2ead6'), 0, 0, 0);
    } else {
      add(n.head, part(G.ball(R * 1.06, 1.02, 0.8, 1.02), '#2a1e22'), 0, R * 0.22, -R * 0.16);
      add(n.head, part(G.ball(R * 0.32), '#2a1e22'), 0, R * 1.05, -R * 0.25);
      add(n.head, part(G.torus(R * 1.03, R * 0.07).rotateX(Math.PI / 2), '#b02a24'), 0, R * 0.3, -R * 0.06, -0.12);
    }
    add(n.handR, WEAP.axe(t >= 3 ? '#d8dce6' : '#a8aab4', t >= 2), 0, 0, 0, 1.1);
    return { rig, anim: { kind: 'melee', skill: null } };
  }

  /** Kỵ Sĩ Hắc Ám (boss giữa màn) – p2: áo choàng bay lên, kiếm rực đỏ */
  function DARKKNIGHT(p2, lord, p3) {
    const armor = p3 ? '#4a1e22' : '#2c2a36', trim = p3 ? '#ff4a2a' : lord ? '#8a2a3a' : '#5a2a3a', light = '#4a4658';
    const rig = humanoid({ R: 0.42, torsoH: 0.62, torsoW: 0.62, torsoD: 0.42, legL: 0.38, legR: 0.12, bootH: 0.14, armL: 0.44, armR: 0.12,
      skin: armor, legs: '#22202a', boots: '#16141c', sleeve: armor, glove: '#1a1820', neck: 0.85 });
    const { n } = rig, d = rig.o, R = d.R, gl = p3 ? 0.35 : 0;
    add(n.torso, part(G.sbox(d.torsoW, d.torsoH, d.torsoD, 0.3), armor, { metal: 1, glow: gl }), 0, d.torsoH / 2, 0);
    add(n.torso, part(G.sbox(0.05, d.torsoH * 0.85, 0.04, 0.5), trim, { ink: 0.012, glow: p3 ? 1 : 0 }), 0, d.torsoH / 2, d.torsoD / 2);
    add(n.torso, part(G.sbox(d.torsoW * 1.05, 0.09, d.torsoD * 1.05, 0.4), '#16141c'), 0, 0.05, 0);
    if (lord) add(n.torso, part(G.ext([-0.12, 0, 0.12, 0, 0, -0.2], 0.03, 0.008), trim, { glow: p3 ? 1.2 : 0.3 }), 0, d.torsoH * 0.82, d.torsoD / 2 + 0.01);
    for (const k of ['R', 'L']) {
      add(n['arm' + k], part(G.ball(0.2, 1.15, 0.85, 1.05), armor, { metal: 1, glow: gl }), 0, 0.03, 0);
      add(n['arm' + k], part(G.cone(0.06, 0.24), light, { metal: 1 }), 0, 0.26, 0, 0, 0, k === 'R' ? 0.35 : -0.35);
    }
    n.cape = node('cape', n.torso, 0, d.torsoH - 0.03, -d.torsoD / 2 + 0.02);
    if (p2 && !lord) n.cape.rotation.x = 0.85;
    add(n.cape, part(G.cape(d.torsoW * 1.0, lord ? 1.15 : 0.95, lord ? 1.1 : 0.8), '#141018', { ds: true }), 0, 0, 0);
    // mũ trụ kín
    onHead(n.head, R, new T.Mesh(G.sbox(R * 1.15, R * 0.3, R * 0.3, 0.4), mat('#0a080e')), 0, 0.02, 0.92);
    face(n.head, R, { iris: p3 ? '#ffb04a' : '#ff2a1a', eye: 'glow', ev: 0.02, eu: 0.3 });
    for (let i = 0; i < 3; i++) onHead(n.head, R, new T.Mesh(G.sbox(R * 0.05, R * 0.3, R * 0.06), mat('#0a080e')), (i - 1) * 0.2, -0.45, 0.98);
    add(n.head, part(G.cone(R * 0.22, R * 0.75), light, { metal: 1 }), 0, R * 1.1, -R * 0.1, -0.2);
    for (const s of [-1, 1]) add(n.head, part(G.cone(R * 0.16, R * 0.75), light, { metal: 1 }), s * R * 1.0, R * 0.6, -R * 0.05, 0, 0, -s * 0.8);
    add(n.head, part(G.torus(R * 1.02, R * 0.05).rotateX(Math.PI / 2), trim, { glow: p3 ? 1 : 0 }), 0, R * 0.36, 0, -0.06);
    if (lord) { // vương miện đen
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; add(n.head, part(G.cone(R * 0.12, R * (i % 2 ? 0.45 : 0.7)), '#18141e', { metal: 1, ink: 0.016 }), S(a) * R * 0.8, R * 0.95, C(a) * R * 0.8, C(a) * 0.25, 0, -S(a) * 0.25); }
      for (const a of [-0.9, 0, 0.9]) add(n.head, new T.Mesh(G.ball(R * 0.08), mat(p3 ? '#ffd040' : '#c8202a', { glow: 1.4 })), S(a) * R * 0.88, R * 0.82, C(a) * R * 0.88);
    }
    const red = p2 || lord;
    const sw = WEAP.sword(lord ? 1.25 : 1.05, 0.21, '#26222e', '#2a2430', { spikes: true, grip: '#1a1418', pommel: '#5a1a22', core: red ? '#ff4a2a' : '#6a3a7a', halo: red ? '#ff2a1a' : null });
    add(n.handR, sw, 0, 0, 0, 1.15);
    if (lord) { // khói bóng tối sau lưng (chỉ để xem)
      const aura = node('aura', n.torso, 0, 0.3, -0.35); aura.userData.noExport = true; const puffs = [];
      for (let i = 0; i < 9; i++) { const m = new T.Mesh(G.ball(0.2, 1, 1, 1, 12), mat(p3 ? '#5a0e14' : '#1a1024', { op: 0.55 })); aura.add(m); puffs.push(m); }
      glow(aura, 0, 0.2, 0, 2.6, p3 ? '#ff2a1a' : '#6a1a8a', 0.4);
      aura.userData.tick = tt => puffs.forEach((m, i) => { const ph = (tt * 0.35 + i / puffs.length) % 1; m.position.set(S(i * 2.3 + tt) * 0.35 - ph * 0.1, ph * 1.4 - 0.2, -ph * 0.25); m.scale.setScalar(0.6 + ph * 1.2); m.material.opacity = (1 - ph) * 0.6; });
    }
    return { rig, anim: { kind: 'melee', still: !lord, heavy: true, skill: lord ? 'slam' : 'summon' } };
  }

  /** Orc cưỡi sói (quái) – khung riêng 4 chân */
  function WOLFRIDER() {
    const root = node('root'), n = {}, fur = '#7a7680', furD = '#4a4652', skin = '#7a9a62';
    n.wolf = node('wolf', root, 0, 0.72, 0);
    add(n.wolf, part(G.cap(0.3, 0.62).rotateX(Math.PI / 2), fur), 0, 0, 0);
    add(n.wolf, new T.Mesh(G.ball(0.24, 1, 0.6, 1.4), mat('#c8c0c8')), 0, -0.14, 0.05);
    for (let i = 0; i < 4; i++) add(n.wolf, part(G.cone(0.07, 0.2), furD, { ink: 0.014 }), 0, 0.3, 0.3 - i * 0.16, -0.5);
    for (const [k, x, z] of [['wFL', 0.17, 0.36], ['wFR', -0.17, 0.36], ['wBL', 0.17, -0.38], ['wBR', -0.17, -0.38]]) {
      const lg = n[k] = node(k, n.wolf, x, -0.1, z);
      add(lg, part(G.cap(0.085, 0.42), k[2] === 'R' ? furD : fur), 0, -0.28, 0);
      add(lg, part(G.ball(0.09, 1.1, 0.7, 1.4), '#2a2630'), 0, -0.55, 0.04);
    }
    n.tail = node('tail', n.wolf, 0, 0.12, -0.6);
    add(n.tail, part(G.tube([[0, 0, 0], [0, 0.12, -0.2], [0, 0.32, -0.32], [0, 0.48, -0.3]], 0.06, 12), fur), 0, 0, 0);
    n.wHead = node('wHead', n.wolf, 0, 0.2, 0.62);
    add(n.wHead, part(G.ball(0.25, 1, 0.92, 1.05), fur), 0, 0, 0);
    add(n.wHead, part(G.sbox(0.2, 0.15, 0.3, 0.45), fur), 0, -0.04, 0.27);
    add(n.wHead, part(G.ball(0.045), '#1a1418'), 0, 0.01, 0.43);
    for (const s of [-1, 1]) {
      add(n.wHead, part(G.cone(0.08, 0.22).scale(1, 1, 0.5), furD), s * 0.13, 0.25, -0.04, -0.2, 0, -s * 0.25);
      add(n.wHead, new T.Mesh(G.ball(0.035, 1.2, 0.8, 0.5), mat('#ffd23a', { glow: 1.6 })), s * 0.11, 0.07, 0.21, 0, s * 0.5, 0);
    }
    n.jaw = node('jaw', n.wHead, 0, -0.1, 0.1);
    add(n.jaw, part(G.sbox(0.17, 0.07, 0.3, 0.45), furD), 0, 0, 0.17);
    for (const s of [-1, 1]) add(n.jaw, new T.Mesh(G.cone(0.016, 0.06), mat('#ffffff')), s * 0.06, 0.05, 0.28);
    // orc trên lưng sói
    n.rider = node('rider', n.wolf, 0, 0.28, -0.08);
    for (const s of [-1, 1]) add(n.rider, part(G.cap(0.08, 0.26), '#4a2e20'), s * 0.26, -0.08, 0.04, 0.5, 0, s * 0.3);
    add(n.rider, part(G.sbox(0.4, 0.4, 0.3, 0.4), '#6a3e26'), 0, 0.2, 0);
    add(n.rider, part(G.sbox(0.06, 0.46, 0.34, 0.5), '#3a2216', { ink: 0.012 }), 0, 0.2, 0, 0, 0, 0.7);
    add(n.rider, part(G.ball(0.13, 1.1, 0.8, 1), '#8a8e98', { metal: 1 }), 0.22, 0.38, 0);
    n.rHead = node('rHead', n.rider, 0, 0.62, 0.02);
    const R = 0.3;
    add(n.rHead, part(G.ball(R, 1.04, 0.96, 1), skin), 0, 0, 0);
    face(n.rHead, R, { iris: '#ffcc22', eye: 'fierce', brow: INK, mouth: 'grin' });
    for (const s of [-1, 1]) {
      onHead(n.rHead, R, part(G.cone(R * 0.075, R * 0.3), '#fff8e0', { ink: 0.01 }), s * 0.28, -0.4, 1.0);
      add(n.rHead, part(G.cone(R * 0.16, R * 0.5).scale(1, 1, 0.5), skin), s * R * 1.02, R * 0.05, -R * 0.05, 0, 0, -s * (Math.PI / 2 - 0.35));
    }
    add(n.rHead, part(G.ball(R * 1.08, 1.03, 0.78, 1.04), '#8a8e98', { metal: 1 }), 0, R * 0.3, -R * 0.04);
    add(n.rHead, part(G.cone(R * 0.15, R * 0.55), '#c8302a'), 0, R * 1.05, -R * 0.1);
    n.rArm = node('rArm', n.rider, -0.26, 0.34, 0); n.rArm.rotation.set(-0.9, 0, -0.2);
    add(n.rArm, part(G.cap(0.08, 0.26), skin), 0, -0.15, 0); add(n.rArm, part(G.ball(0.1), skin), 0, -0.3, 0);
    add(n.rArm, WEAP.spear(), 0, -0.3, 0, 1.25);
    n.lArm = node('lArm', n.rider, 0.26, 0.34, 0); n.lArm.rotation.set(-1.2, 0, 0.25);
    add(n.lArm, part(G.cap(0.08, 0.22), skin), 0, -0.13, 0); add(n.lArm, part(G.ball(0.1), skin), 0, -0.27, 0);
    return { rig: { root, n, o: { hipY: 0.72 } }, anim: { kind: 'wolf', skill: 'charge' } };
  }

  /* =================== HOẠT ẢNH =================== */
  /** khoá hình mượt: pts = [[t, giá trị], …] */
  function kf(t, pts) {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; let k = (t - a[0]) / (b[0] - a[0] || 1); k = k * k * (3 - 2 * k); return a[1] + (b[1] - a[1]) * k; }
    return pts[pts.length - 1][1];
  }
  /** nướng hàm tư thế fn(t∈[0,1]) → { tênKhớp: { rx, ry, rz, x, y, z, s } } thành AnimationClip (cộng vào tư thế nghỉ) */
  function bake(rig, name, dur, fn, loop) {
    const N = Math.max(2, Math.round(dur * 30) + 1), frames = [], keys = new Set();
    for (let f = 0; f < N; f++) { const p = fn(f / (N - 1)); frames.push(p); Object.keys(p).forEach(k => keys.add(k)); }
    const times = frames.map((_, f) => f / (N - 1) * dur), tracks = [], e = new T.Euler(), q = new T.Quaternion();
    keys.forEach(k => {
      const nd = rig.n[k]; if (!nd) return;
      const r0 = nd.userData.r0, p0 = nd.userData.p0, s0 = nd.userData.s0, qa = [], pa = [], sa = [];
      let hasP = false, hasS = false;
      frames.forEach(fr => {
        const v = fr[k] || {};
        e.set(r0.x + (v.rx || 0), r0.y + (v.ry || 0), r0.z + (v.rz || 0), r0.order); q.setFromEuler(e); qa.push(q.x, q.y, q.z, q.w);
        if (v.x || v.y || v.z) hasP = true; pa.push(p0.x + (v.x || 0), p0.y + (v.y || 0), p0.z + (v.z || 0));
        const s = v.s === undefined ? 1 : v.s; if (s !== 1) hasS = true; sa.push(s0.x * s, s0.y * s, s0.z * s);
      });
      tracks.push(new T.QuaternionKeyframeTrack(nd.name + '.quaternion', times, qa));
      if (hasP) tracks.push(new T.VectorKeyframeTrack(nd.name + '.position', times, pa));
      if (hasS) tracks.push(new T.VectorKeyframeTrack(nd.name + '.scale', times, sa));
    });
    const c = new T.AnimationClip(name, dur, tracks); c.userData = { loop: loop !== false }; return c;
  }

  function humanClips(rig, A) {
    const out = [], two = A.kind === 'two', bow = A.kind === 'bow', staff = A.kind === 'staff', hasCape = !!rig.n.cape, gem = !!rig.n.gem;
    const capeUp = rig.n.cape && rig.n.cape.userData.r0.x > 0.3;
    const armsRest = (o, b) => {
      if (two) { o.armR = { rx: -0.75 + b, rz: 0.4 }; o.armL = { rx: -0.75 + b, rz: -0.4 }; }
      if (bow) o.armL = { rx: -0.85 + b, rz: -0.05 };
      if (staff) o.armR = { rx: -0.2 + b };
      if (A.shield) o.armL = { rx: -0.35 + b, rz: -0.1 };
      return o;
    };
    const capeFx = (o, base, amp, ph) => { if (hasCape) o.cape = { rx: (capeUp ? 0.15 : base) + S(ph) * (capeUp ? 0.12 : amp) }; return o; };
    const k = A.still ? 0.35 : 1;
    // ĐỨNG: thở, lắc đầu nhẹ (goblin nhìn trái phải)
    out.push(bake(rig, 'idle', 2.4, t => {
      const p = t * TAU, b = S(p);
      const o = { torso: { y: b * 0.012 * k, rx: b * 0.02 * k }, head: { rx: -b * 0.035 * k, rz: S(p + 1) * 0.035 * k, ry: A.look ? S(p) * 0.4 : 0 }, armR: { rx: b * 0.06 * k }, armL: { rx: -b * 0.06 * k } };
      armsRest(o, b * 0.04 * k); capeFx(o, 0.08, 0.035, p * 2);
      if (gem) o.gem = { y: S(p * 2) * 0.035, ry: t * TAU };
      return o;
    }));
    // ĐI: nhún nảy kiểu KR, vung tay ngược chân
    out.push(bake(rig, 'walk', A.heavy ? 1.0 : 0.7, t => {
      const p = t * TAU, s = S(p);
      const o = { hips: { y: Math.abs(s) * (A.heavy ? 0.04 : 0.07), ry: s * 0.08, rz: s * 0.03 }, torso: { rx: 0.1 }, head: { rx: -0.08 + Math.abs(C(p)) * 0.04 },
        legR: { rx: s * 0.75 }, legL: { rx: -s * 0.75 }, armR: { rx: -s * 0.6 }, armL: { rx: s * 0.6 } };
      armsRest(o, s * 0.12); if (!two && !bow && !A.shield && !staff) { o.armR = { rx: -s * 0.6 }; o.armL = { rx: s * 0.6 }; }
      if (staff) o.armR = { rx: -0.2 - s * 0.3 };
      capeFx(o, 0.4, 0.1, p * 2);
      if (gem) o.gem = { y: S(p * 2) * 0.03, ry: t * TAU };
      return o;
    }));
    // ĐÁNH
    if (A.kind === 'melee') out.push(bake(rig, 'attack', A.heavy ? 1.2 : 0.8, t => ({
      armR: { rx: kf(t, [[0, 0], [0.38, -2.6], [0.52, -0.45], [0.72, -0.55], [1, 0]]), rz: kf(t, [[0, 0], [0.38, -0.45], [0.52, 0.6], [0.72, 0.5], [1, 0]]) },
      armL: A.shield ? { rx: kf(t, [[0, -0.35], [0.38, -0.9], [0.52, -0.2], [1, -0.35]]), rz: -0.1 } : { rx: kf(t, [[0, 0], [0.38, 0.4], [0.52, -0.3], [1, 0]]) },
      torso: { ry: kf(t, [[0, 0], [0.38, -0.45], [0.52, 0.42], [1, 0]]), rx: kf(t, [[0, 0], [0.38, -0.1], [0.52, 0.18], [1, 0]]) },
      hips: { z: kf(t, [[0, 0], [0.38, -0.04], [0.52, 0.1], [1, 0]]), y: kf(t, [[0, 0], [0.38, 0.02], [0.55, -0.04], [1, 0]]) },
      legR: { rx: kf(t, [[0, 0], [0.52, -0.45], [1, 0]]) }, legL: { rx: kf(t, [[0, 0], [0.52, 0.3], [1, 0]]) },
      ...(hasCape ? { cape: { rx: kf(t, [[0, capeUp ? 0.1 : 0.08], [0.52, 0.5], [1, capeUp ? 0.1 : 0.08]]) } } : {})
    })));
    if (two) out.push(bake(rig, 'attack', 0.95, t => {
      const a = kf(t, [[0, -0.75], [0.42, -2.9], [0.56, -0.35], [0.75, -0.4], [1, -0.75]]);
      return { armR: { rx: a, rz: 0.4 }, armL: { rx: a, rz: -0.4 }, torso: { rx: kf(t, [[0, 0], [0.42, -0.22], [0.56, 0.35], [1, 0]]) },
        hips: { y: kf(t, [[0, 0], [0.42, 0.05], [0.56, -0.06], [1, 0]]) }, legR: { rx: kf(t, [[0, 0], [0.56, -0.3], [1, 0]]) }, legL: { rx: kf(t, [[0, 0], [0.56, 0.25], [1, 0]]) } };
    }));
    if (A.kind === 'stab') out.push(bake(rig, 'attack', 0.6, t => ({
      armR: { rx: kf(t, [[0, 0], [0.35, 0.7], [0.5, -1.7], [0.7, -1.6], [1, 0]]) }, armL: { rx: kf(t, [[0, 0], [0.35, -0.6], [0.5, 0.6], [1, 0]]) },
      hips: { z: kf(t, [[0, 0], [0.35, -0.06], [0.5, 0.18], [1, 0]]), y: kf(t, [[0, 0], [0.42, 0.06], [0.55, 0], [1, 0]]) },
      torso: { rx: kf(t, [[0, 0], [0.35, -0.15], [0.5, 0.25], [1, 0]]) }, legR: { rx: kf(t, [[0, 0], [0.5, -0.6], [1, 0]]) }, legL: { rx: kf(t, [[0, 0], [0.5, 0.5], [1, 0]]) }
    })));
    const shoot = (t, o) => {
      o.armL = { rx: kf(t, [[0, -0.85], [0.15, -1.55], [0.85, -1.55], [1, -0.85]]), rz: -0.05 };
      o.armR = { rx: kf(t, [[0, 0], [0.15, -1.45], [0.55, -1.15], [0.62, -0.7], [1, 0]]), rz: kf(t, [[0, 0], [0.15, 0.45], [0.55, 0.15], [1, 0]]) };
      o.torso = { ry: kf(t, [[0, 0], [0.15, -0.45], [0.85, -0.45], [1, 0]]) };
      o.arrow = { y: kf(t, [[0, 0], [0.55, 0.09], [0.6, 0.09], [0.61, 0], [1, 0]]), s: kf(t, [[0, 1], [0.6, 1], [0.61, 0.001], [0.9, 0.001], [1, 1]]) };
      return o;
    };
    if (bow) out.push(bake(rig, 'attack', 0.75, t => shoot(t, {})));
    if (staff) out.push(bake(rig, 'attack', 1.0, t => ({
      armR: { rx: kf(t, [[0, -0.2], [0.4, -2.65], [0.6, -2.45], [1, -0.2]]) }, staff: { rx: kf(t, [[0, 0], [0.4, 2.4], [0.6, 2.2], [1, 0]]) },
      armL: { rx: kf(t, [[0, 0], [0.5, -1.45], [0.72, -1.35], [1, 0]]) }, gem: { s: kf(t, [[0, 1], [0.45, 1.7], [0.6, 1], [1, 1]]), ry: t * TAU },
      torso: { rx: kf(t, [[0, 0], [0.4, -0.12], [0.6, 0.15], [1, 0]]) }, hips: { y: kf(t, [[0, 0], [0.4, 0.05], [0.6, 0], [1, 0]]) },
      ...(hasCape ? { cape: { rx: kf(t, [[0, 0.08], [0.6, 0.45], [1, 0.08]]) } } : {})
    })));
    // KỸ NĂNG
    if (A.skill === 'block') out.push(bake(rig, 'skill', 1.4, t => ({
      armL: { rx: kf(t, [[0, -0.35], [0.2, -1.35], [0.8, -1.35], [1, -0.35]]), rz: kf(t, [[0, -0.1], [0.2, 0.55], [0.8, 0.55], [1, -0.1]]) },
      shield: { rx: kf(t, [[0, 0], [0.2, 1.1], [0.8, 1.1], [1, 0]]), ry: kf(t, [[0, 0], [0.2, -0.45], [0.8, -0.45], [1, 0]]) },
      armR: { rx: kf(t, [[0, 0], [0.2, 0.35], [0.8, 0.35], [1, 0]]) }, hips: { y: kf(t, [[0, 0], [0.2, -0.06], [0.8, -0.06], [1, 0]]) },
      legR: { rx: kf(t, [[0, 0], [0.2, 0.3], [0.8, 0.3], [1, 0]]) }, legL: { rx: kf(t, [[0, 0], [0.2, -0.35], [0.8, -0.35], [1, 0]]) }, torso: { rx: kf(t, [[0, 0], [0.2, 0.12], [0.8, 0.12], [1, 0]]) }
    }), false));
    if (A.skill === 'holy' || A.skill === 'summon') out.push(bake(rig, 'skill', 1.5, t => ({
      armR: { rx: kf(t, [[0, 0], [0.3, -3.0], [0.75, -3.0], [1, 0]]), rz: kf(t, [[0, 0], [0.3, 0.15], [0.75, 0.15], [1, 0]]) },
      armL: { rx: kf(t, [[0, 0], [0.3, -1.3], [0.75, -1.3], [1, 0]]), rz: kf(t, [[0, 0], [0.3, 0.5], [0.75, 0.5], [1, 0]]) },
      torso: { rx: kf(t, [[0, 0], [0.3, -0.18], [0.75, -0.18], [1, 0]]) }, head: { rx: kf(t, [[0, 0], [0.3, -0.25], [0.75, -0.25], [1, 0]]) },
      hips: { y: kf(t, [[0, 0], [0.3, 0.05], [0.75, 0.05], [1, 0]]) }
    }), false));
    if (A.skill === 'triple') out.push(bake(rig, 'skill', 1.05, t => { const tt = (t * 3) % 1, o = shoot(tt, {}); o.armL = { rx: -1.55, rz: -0.05 }; o.torso = { ry: -0.45 }; return o; }));
    if (A.skill === 'meteor') out.push(bake(rig, 'skill', 1.6, t => ({
      armR: { rx: kf(t, [[0, -0.2], [0.3, -2.95], [0.8, -2.95], [1, -0.2]]) }, staff: { rx: kf(t, [[0, 0], [0.3, 2.85], [0.8, 2.85], [1, 0]]) },
      armL: { rx: kf(t, [[0, 0], [0.3, -2.9], [0.8, -2.9], [1, 0]]), rz: kf(t, [[0, 0], [0.3, -0.3], [0.8, -0.3], [1, 0]]) },
      gem: { s: kf(t, [[0, 1], [0.35, 1.5], [0.6, 2.1], [0.8, 1.4], [1, 1]]), ry: t * TAU * 2 },
      head: { rx: kf(t, [[0, 0], [0.3, -0.3], [0.8, -0.3], [1, 0]]) }, hips: { y: kf(t, [[0, 0], [0.3, 0.08], [0.8, 0.08], [1, 0]]) },
      ...(hasCape ? { cape: { rx: kf(t, [[0, 0.08], [0.4, 0.6], [0.8, 0.5], [1, 0.08]]) } } : {})
    }), false));
    if (A.skill === 'slam') out.push(bake(rig, 'skill', 1.2, t => {
      const a = kf(t, [[0, two ? -0.75 : 0], [0.35, -3.0], [0.55, -0.15], [0.8, -0.2], [1, two ? -0.75 : 0]]);
      const o = { armR: { rx: a, rz: two ? 0.4 : 0.1 }, torso: { rx: kf(t, [[0, 0], [0.35, -0.3], [0.55, 0.45], [0.8, 0.4], [1, 0]]) },
        hips: { y: kf(t, [[0, 0], [0.2, -0.06], [0.4, 0.3], [0.55, -0.08], [0.8, -0.06], [1, 0]]) },
        legR: { rx: kf(t, [[0, 0], [0.4, -0.4], [0.55, -0.5], [1, 0]]) }, legL: { rx: kf(t, [[0, 0], [0.4, 0.3], [0.55, 0.4], [1, 0]]) } };
      o.armL = two ? { rx: a, rz: -0.4 } : { rx: kf(t, [[0, 0], [0.35, -1.0], [0.55, 0.5], [1, 0]]) };
      return o;
    }, false));
    // NGÃ
    const fall = -(rig.o.hipY - (rig.o.torsoD || 0.3) * 0.5);
    out.push(bake(rig, 'die', 1.1, t => ({
      hips: { rx: kf(t, [[0, 0], [0.2, 0.2], [0.7, -1.5], [0.8, -1.38], [1, -1.45]]), y: kf(t, [[0, 0], [0.2, 0.05], [0.7, fall], [1, fall]]), z: kf(t, [[0, 0], [0.7, -0.15], [1, -0.15]]) },
      armR: { rx: kf(t, [[0, 0], [0.3, -2.0], [1, -1.7]]), rz: kf(t, [[0, 0], [1, -0.6]]) }, armL: { rx: kf(t, [[0, 0], [0.3, -1.8], [1, -1.5]]), rz: kf(t, [[0, 0], [1, 0.6]]) },
      legR: { rx: kf(t, [[0, 0], [0.6, 0.5], [1, 0.75]]) }, legL: { rx: kf(t, [[0, 0], [0.6, 0.2], [1, 0.55]]) }, head: { rx: kf(t, [[0, 0], [0.5, 0.35], [1, 0.2]]) }
    }), false));
    return out;
  }

  function wolfClips(rig) {
    const out = [];
    out.push(bake(rig, 'idle', 2.6, t => {
      const p = t * TAU, roar = kf(t, [[0, 0], [0.08, 0], [0.18, 1], [0.32, 1], [0.42, 0], [1, 0]]);
      return { wolf: { y: S(p) * 0.012, rx: -roar * 0.05 }, wHead: { rx: -roar * 0.4 + S(p) * 0.03 }, jaw: { rx: roar * 0.55 }, tail: { ry: S(p * 3) * 0.3, rx: S(p * 2) * 0.08 },
        rider: { y: S(p) * 0.01 }, rHead: { ry: S(p) * 0.15 }, rArm: { rx: S(p) * 0.04 } };
    }));
    const gallop = (name, dur, low) => bake(rig, name, dur, t => {
      const p = t * TAU, a = 0.85;
      return { wolf: { y: Math.abs(S(p)) * 0.09, rx: S(p) * 0.09 + (low ? 0.08 : 0) }, wFL: { rx: S(p) * a }, wFR: { rx: S(p + 0.5) * a }, wBL: { rx: S(p + Math.PI) * a }, wBR: { rx: S(p + Math.PI + 0.5) * a },
        wHead: { rx: -S(p) * 0.1 + (low ? 0.3 : 0) }, jaw: { rx: low ? 0.35 : 0.08 }, tail: { rx: 0.4 + S(p * 2) * 0.15 },
        rider: { y: S(p * 2) * 0.02, rx: -S(p) * 0.06 + (low ? 0.2 : 0) }, rArm: { rx: S(p) * 0.08 + (low ? -0.5 : 0) } };
    });
    out.push(gallop('walk', 0.55, false));
    out.push(bake(rig, 'attack', 0.85, t => ({
      wolf: { z: kf(t, [[0, 0], [0.3, -0.1], [0.5, 0.28], [1, 0]]), rx: kf(t, [[0, 0], [0.3, -0.12], [0.5, 0.12], [1, 0]]) },
      wHead: { rx: kf(t, [[0, 0], [0.3, -0.25], [0.5, 0.25], [1, 0]]) }, jaw: { rx: kf(t, [[0, 0], [0.4, 0.6], [0.55, 0.1], [1, 0]]) },
      wFL: { rx: kf(t, [[0, 0], [0.3, 0.5], [0.5, -0.8], [1, 0]]) }, wFR: { rx: kf(t, [[0, 0], [0.3, 0.4], [0.5, -0.7], [1, 0]]) },
      wBL: { rx: kf(t, [[0, 0], [0.3, -0.3], [0.5, 0.6], [1, 0]]) }, wBR: { rx: kf(t, [[0, 0], [0.3, -0.3], [0.5, 0.5], [1, 0]]) },
      rArm: { rx: kf(t, [[0, 0], [0.3, 0.5], [0.5, -0.7], [0.65, -0.6], [1, 0]]) }, rider: { rx: kf(t, [[0, 0], [0.3, -0.12], [0.5, 0.2], [1, 0]]) }
    })));
    out.push(gallop('skill', 0.4, true));
    out.push(bake(rig, 'die', 1.1, t => ({
      wolf: { rz: kf(t, [[0, 0], [0.2, -0.15], [0.7, 1.45], [1, 1.4]]), y: kf(t, [[0, 0], [0.2, 0.06], [0.7, -0.45], [1, -0.45]]) },
      wHead: { rx: kf(t, [[0, 0], [0.5, -0.3], [1, 0.2]]) }, jaw: { rx: kf(t, [[0, 0], [0.4, 0.5], [1, 0.3]]) },
      rider: { rz: kf(t, [[0, 0], [0.7, 0.4], [1, 0.5]]), x: kf(t, [[0, 0], [0.7, -0.2], [1, -0.25]]) },
      wFL: { rx: kf(t, [[0, 0], [1, -0.6]]) }, wBL: { rx: kf(t, [[0, 0], [1, 0.6]]) }
    }), false));
    return out;
  }

  /* =================== DANH SÁCH =================== */
  const pal = (...a) => a.map(([c, l]) => ({ c, l }));
  const LIST = [
    { id: 'soldier', name: 'Kiếm Sĩ Con Người', group: 'Trụ', role: 'Trụ Người · gọi 2 kiếm sĩ chặn đường', tiers: 4, tierName: 'Cấp trụ',
      desc: 'Tóc đen dựng gai, giáp bạc (cấp 3 viền vàng, cấp 4 vai vàng + vương miện), áo choàng đỏ sẫm, kiếm lớn + khiên đỏ thập tự vàng. Chém chéo vai; kỹ năng giơ khiên tạo lá chắn.',
      palette: pal(['#1e1a22', 'Tóc'], ['#dde2ea', 'Giáp bạc'], ['#6a1218', 'Áo choàng'], ['#8a1e24', 'Khiên'], [GOLD, 'Viền vàng']),
      make: t => SOLDIER(t) },
    { id: 'elf', name: 'Cung Thủ Elf', group: 'Trụ', role: 'Trụ Elf · bắn rất nhanh, chí mạng', tiers: 4, tierName: 'Cấp trụ',
      desc: 'Mảnh mai, tóc vàng dài (cấp 3 bạch kim + vòng vàng ngọc lục bảo), tai nhọn dài, áo xanh lá, ống tên sau lưng, cung vàng cong. Cấp 4 mũi tên phát sáng; kỹ năng bắn 3 mũi liên tiếp.',
      palette: pal(['#f5d878', 'Tóc'], ['#3fa05a', 'Áo'], ['#2f7a40', 'Áo choàng'], ['#c89a3a', 'Cung'], ['#2aa86a', 'Mắt']),
      make: t => ELF(t) },
    { id: 'mage', name: 'Phù Thủy', group: 'Trụ', role: 'Trụ Phép · cầu phép nổ lan', tiers: 4, tierName: 'Cấp trụ',
      desc: 'Dáng nhỏ trong áo choàng cực lớn, mũ nhọn uốn cong có sao vàng, tóc bạc-tím dài, gậy có viên pha lê bay lơ lửng và phát sáng. Kỹ năng giơ hai tay gọi mưa thiên thạch.',
      palette: pal(['#3a2ea0', 'Mũ'], ['#4a3ec4', 'Áo choàng'], ['#d8d4f8', 'Tóc'], ['#7fd8ff', 'Viền phép'], ['#9ae6ff', 'Pha lê']),
      make: t => MAGE(t) },
    { id: 'dwarf', name: 'Chiến Binh Lùn', group: 'Trụ', role: 'Trụ Lùn · rìu hai tay, đập đất gây choáng', tiers: 4, tierName: 'Cấp trụ',
      desc: 'Thấp, cực béo chắc, râu cam khổng lồ che miệng, mũ sắt có sống mũi (cấp 3 thêm sừng + khoen vàng ở râu), vai thép to, rìu hai lưỡi. Kỹ năng nhảy lên bổ rìu xuống đất.',
      palette: pal(['#d4581e', 'Râu'], ['#9ea4b0', 'Mũ & vai'], ['#7a6a5a', 'Giáp da'], ['#aeb2bc', 'Rìu'], [GOLD, 'Khoá vàng']),
      make: t => DWARF(t) },
    { id: 'aldric', name: 'Aldric', group: 'Anh hùng', role: 'Hiệp sĩ · Thánh Quang', tiers: 4, tierName: 'Bậc trang bị',
      desc: 'Hiệp sĩ tóc bạch kim, giáp xanh hoàng gia, áo choàng xanh đậm, đại kiếm thánh có lõi sáng xanh (bậc cao sáng vàng). Kỹ năng giơ kiếm gọi Thánh Quang.',
      palette: pal(['#eef2f8', 'Tóc'], ['#3a5ab8', 'Giáp'], ['#1e3488', 'Áo choàng'], ['#9ae0ff', 'Lõi kiếm'], [GOLD, 'Chuôi']),
      make: t => SOLDIER(t, { hair: '#eef2f8', armor: '#3a5ab8', cape: '#1e3488', weapon: 'greatsword', shield: false, iris: '#3a8ad8', noCrown: true, wcol: t >= 3 ? '#ffe680' : '#9ae0ff' }) },
    { id: 'lyra', name: 'Lyra', group: 'Anh hùng', role: 'Xạ thủ Elf · Mưa Tên', tiers: 4, tierName: 'Bậc trang bị',
      desc: 'Xạ thủ tóc xanh ngọc, áo xanh rêu, áo choàng xanh biển sâu. Bắn liên hoàn 3 mũi; kỹ năng Mưa Tên.',
      palette: pal(['#6ae0c8', 'Tóc'], ['#2f8a6a', 'Áo'], ['#1f6a5a', 'Áo choàng'], ['#c89a3a', 'Cung']),
      make: t => ELF(t, { hair: '#6ae0c8', tunic: '#2f8a6a', cape: '#1f6a5a' }) },
    { id: 'selene', name: 'Selene', group: 'Anh hùng', role: 'Đại pháp sư · Bão Băng', tiers: 4, tierName: 'Bậc trang bị',
      desc: 'Đại pháp sư tóc trắng, mũ và áo xanh lam, pha lê băng xanh nhạt. Kỹ năng Bão Băng làm chậm cả vùng.',
      palette: pal(['#f4f6ff', 'Tóc'], ['#2a3aa0', 'Mũ'], ['#3a5ac8', 'Áo choàng'], ['#8ad8ff', 'Pha lê băng']),
      make: t => MAGE(t, { hair: '#f4f6ff', hat: '#2a3aa0', robe: '#3a5ac8', cape: '#22307a', wcol: '#8ad8ff', iris: '#3a8ad8' }) },
    { id: 'borin', name: 'Borin', group: 'Anh hùng', role: 'Chiến thần Lùn · Địa Chấn', tiers: 4, tierName: 'Bậc trang bị',
      desc: 'Chiến thần Lùn râu đỏ lửa, giáp thép xám, búa chiến đầu khối có lõi lửa. Kỹ năng Địa Chấn: nhảy lên nện búa làm choáng.',
      palette: pal(['#c8401e', 'Râu'], ['#6a6e7a', 'Giáp'], ['#a8adb8', 'Búa'], ['#ff7a2a', 'Lõi lửa']),
      make: t => DWARF(t, { beard: '#c8401e', armor: '#6a6e7a', weapon: 'warhammer' }) },
    { id: 'goblin', name: 'Yêu Tinh Goblin', group: 'Quái', role: 'Quái nhỏ · đi thành bầy', tiers: 1,
      desc: 'Tí hon, khom người, tai dài chìa ngang, mắt tròn to vàng đảo trái phải, khăn đỏ, dao nhỏ. Đánh: lao tới đâm.',
      palette: pal(['#7cc23e', 'Da'], ['#7a5232', 'Áo vải'], ['#c8302a', 'Khăn'], ['#ffd23a', 'Mắt']),
      make: () => GOBLIN() },
    { id: 'shade', name: 'Bóng Tối', group: 'Quái', role: 'Do Kỵ Sĩ Hắc Ám triệu hồi', tiers: 1,
      desc: 'Goblin bóng ma màu tím đen, mắt tím phát sáng, quầng tối quanh người.',
      palette: pal(['#5a4a8a', 'Da'], ['#1a1024', 'Áo'], ['#d080ff', 'Mắt sáng']),
      make: () => GOBLIN({ skin: '#5a4a8a', cloth: '#1a1024', eye: '#d080ff', glow: true }) },
    { id: 'orc', name: 'Chiến Binh Orc', group: 'Quái', role: 'Quái giáp vừa · phép khắc chế', tiers: 3, tierName: 'Biến thể',
      desc: 'Da xanh xám, búi tóc đen, nanh trắng, băng đô đỏ, đai da chéo ngực, khố đỏ, vai thép. Biến thể 3: mũ sừng + da sói trên vai (Hắc Orc).',
      palette: pal(['#7a9a62', 'Da'], ['#6a3e26', 'Da thuộc'], ['#b02a24', 'Khố đỏ'], ['#ff5a2a', 'Mắt']),
      make: t => ORC(t) },
    { id: 'wolfRider', name: 'Orc Cưỡi Sói', group: 'Quái', role: 'Quái nhanh · sói húc lính', tiers: 1,
      desc: 'Orc đội mũ sắt chóp đỏ cưỡi sói xám lớn, cầm giáo. Đứng: sói gầm. Đánh: lao tới đâm giáo. Kỹ năng: sói cúi đầu tăng tốc húc.',
      palette: pal(['#7a7680', 'Lông sói'], ['#4a4652', 'Bờm'], ['#7a9a62', 'Da orc'], ['#ffd23a', 'Mắt sói']),
      make: () => WOLFRIDER() },
    { id: 'darkKnight', name: 'Kỵ Sĩ Hắc Ám', group: 'Boss', role: 'Boss giữa màn · 2 giai đoạn', tiers: 2, tierName: 'Giai đoạn', scale: 1.35,
      desc: 'Giáp đen kín người, không thấy mặt, mắt đỏ phát sáng sau khe mũ, áo choàng đen dài, kiếm đen khổng lồ có gai. Giai đoạn 2: áo choàng bay lên, kiếm rực đỏ. Kỹ năng: giơ kiếm triệu hồi bóng tối.',
      palette: pal(['#2c2a36', 'Giáp đen'], ['#5a2a3a', 'Viền'], ['#141018', 'Áo choàng'], ['#ff2a1a', 'Mắt / kiếm đỏ']),
      make: t => DARKKNIGHT(t >= 2) },
    { id: 'darkLord', name: 'Chúa Hắc Ám', group: 'Boss', role: 'Boss cuối · 3 giai đoạn', tiers: 3, tierName: 'Giai đoạn', scale: 1.8,
      desc: 'Khổng lồ, giáp đen, vương miện đen gắn ngọc đỏ, kiếm khổng lồ, khói bóng tối bốc sau lưng. Giai đoạn 3: toàn thân rực đỏ. Kỹ năng: cắm kiếm xuống đất.',
      palette: pal(['#26222e', 'Giáp'], ['#8a2a3a', 'Viền'], ['#4a1e22', 'Giáp G.Đ 3'], ['#ff4a2a', 'Rực đỏ'], ['#1a1024', 'Khói']),
      make: t => DARKKNIGHT(true, true, t >= 3) }
  ];

  const SKILL_NAME = { soldier: 'Giơ khiên', elf: '3 mũi tên', mage: 'Mưa thiên thạch', dwarf: 'Đập đất', aldric: 'Thánh Quang', lyra: 'Mưa Tên', selene: 'Bão Băng', borin: 'Địa Chấn', wolfRider: 'Sói húc', darkKnight: 'Triệu hồi bóng tối', darkLord: 'Cắm kiếm' };
  function build(id, tier) {
    const def = LIST.find(c => c.id === id) || LIST[0];
    const t = Math.max(1, Math.min(def.tiers, tier || def.tiers));
    const made = def.make(t), rig = made.rig;
    rig.root.name = 'root';
    if (def.scale) rig.root.scale.setScalar(def.scale);
    freeze(rig);
    const clips = made.anim.kind === 'wolf' ? wolfClips(rig) : humanClips(rig, made.anim);
    rig.root.userData.charId = def.id; rig.root.userData.tier = t;
    return { root: rig.root, clips, rig, def, tier: t, skill: made.anim.skill, skillName: SKILL_NAME[def.id] };
  }

  /** Bản sao sạch để xuất .glb: bỏ quầng sáng, đổi toon → PBR (emissive giữ nguyên) */
  function toExportable(root) {
    const c = root.clone(true), cache = new Map(), drop = [];
    c.traverse(o => {
      if (o.userData.noExport) { drop.push(o); return; }
      if (!o.isMesh) return;
      if (o.geometry.attributes.uv) o.geometry.deleteAttribute("uv"); // không dùng texture → bỏ UV cho nhẹ
      const m = o.material;
      if (m.userData.ink) return;
      if (!cache.has(m)) {
        const n = new T.MeshStandardMaterial({ color: m.color, roughness: m.userData.metal ? 0.42 : 0.85, metalness: m.userData.metal ? 0.55 : 0, transparent: m.transparent, opacity: m.opacity, side: m.side });
        if (m.userData.glow) { n.emissive = m.color.clone(); n.emissiveIntensity = Math.min(1, m.userData.glow); }
        n.name = '#' + m.color.getHexString();
        cache.set(m, n);
      }
      o.material = cache.get(m);
    });
    drop.forEach(o => o.parent && o.parent.remove(o));
    inkMat.name = 'ink_outline';
    return c;
  }

  window.Chars3D = { list: LIST, build, toExportable, INK, setInk: k => { INKK = k; } };
})();
