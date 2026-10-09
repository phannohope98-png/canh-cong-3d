/* =========================================================
 * gear2d.js – Vật phẩm gắn trụ vẽ thành BỘ PHẬN THẬT của trụ (không còn huy hiệu tròn)
 *  - Mỗi trụ có 6 điểm gắn cố định (đỉnh · tầng trên · mặt trước · cánh trái · cánh phải · nền móng).
 *  - Ô chưa có vật phẩm → chỉ thấy móc/cột/bệ trống (VD: cột treo cờ trống). Có vật phẩm → bộ phận hiện đúng chỗ đó:
 *    Cờ Chiến = lá cờ bay trên cột, Khiên = tấm khiên treo tường, Cung Thần = cây cung lớn, Thùng Thuốc Súng = thùng thuốc…
 *  - Màu viền / ngọc / lá cờ theo bậc đồ (Tệ → Huyền thoại); bậc Cao cấp trở lên có ánh sáng toả.
 *  - Toạ độ vẽ: gốc = điểm gắn, y âm = hướng lên.
 * ========================================================= */
(function () {
  const K = window.ArtKit, TAU = Math.PI * 2, S = Math.sin, C = Math.cos, sh = (c, k) => K.shade(c, k);
  const GOLD = '#f2c14e', STEEL = '#c8ccd6', DSTEEL = '#7a808e', WOOD = '#8a5a32', DWOOD = '#5a3a22', LW = 1.5;
  const O = (o) => Object.assign({ lw: LW, s: 1, h: 0.6 }, o);

  /* ---------- móc / cột / bệ trống (hiện khi chưa gắn đồ) ---------- */
  const STUB = [
    g => { K.line(g, 0, 0, 0, -13, DWOOD, 3); K.line(g, 0, 0, 0, -13, WOOD, 1.7); K.dot(g, 0, -14, 2, GOLD); },                                                  // 0 cột cờ trống
    g => { K.line(g, 0, 0, 0, -5, DSTEEL, 2.2); K.line(g, 0, -5, 4, -8, DSTEEL, 2.2); },                                                                           // 1 móc treo
    g => { K.rr(g, -5, -4, 10, 6, 1.5, '#6a5a50', O({ s: 0.6 })); K.dot(g, -3, -1, 0.9, '#2a2018'); K.dot(g, 3, -1, 0.9, '#2a2018'); },                           // 2 tấm đỡ
    g => { K.line(g, 0, 0, 0, -4, DSTEEL, 2.2); K.line(g, -4, -4, 4, -4, DSTEEL, 2.2); },                                                                           // 3 móc trái
    g => { K.line(g, 0, 0, 0, -4, DSTEEL, 2.2); K.line(g, -4, -4, 4, -4, DSTEEL, 2.2); },                                                                           // 4 móc phải
    g => { K.ell(g, 0, 0, 9, 3.4, '#7a7480', O({ s: 0.8 })); }                                                                                                       // 5 bệ đá trống
  ];
  const glowAt = (g, x, y, r, col, rar, t) => { if (rar >= 3) { g.save(); g.globalCompositeOperation = 'lighter'; K.glow(g, x, y, r * (1 + 0.1 * S(t * 4)), col, rar >= 4 ? 0.7 : 0.45); g.restore(); } };

  const GEAR = {
    /* =============== TRẠI NGƯỜI =============== */
    barracks: [
      // 0 Cờ Chiến: cột + lá cờ bay, huy hiệu thập tự
      (g, c, r, t) => {
        K.line(g, 0, 2, 0, -30, DWOOD, 3.4); K.line(g, 0, 2, 0, -30, WOOD, 2); K.dot(g, 0, -31, 2.6, GOLD);
        const w = 17, h = 12, pts = [0, -29];
        for (let i = 1; i <= 6; i++) { const f = i / 6; pts.push(f * w, -29 + S(t * 5 + f * 3) * 2.4 * f + f * 1.2); }
        for (let i = 6; i >= 0; i--) { const f = i / 6; pts.push(f * (w - 3), -29 + h + S(t * 5 + f * 3 + 0.5) * 2.4 * f - f * 1.2); }
        K.poly(g, pts, c, O({ s: 1.6, h: 0.9, lw: 1.7 }));
        K.line(g, 6, -26, 6, -20, '#fff4c8', 1.6); K.line(g, 3, -23, 9, -23, '#fff4c8', 1.6);
      },
      // 1 Khiên: tấm khiên treo tường
      (g, c, r) => {
        K.poly(g, [-8, -16, 8, -16, 8, -6, 0, 2, -8, -6], STEEL, O({ s: 1.4, lw: 1.8 }));
        K.poly(g, [-6, -14, 6, -14, 6, -7, 0, -0.5, -6, -7], c, O({ s: 1.2, lw: 1 }));
        K.line(g, 0, -13, 0, -2, '#fff4c8', 1.8); K.line(g, -4, -9, 4, -9, '#fff4c8', 1.8);
      },
      // 2 Kiếm: kiếm dựng thẳng trên tấm đỡ
      (g, c, r) => {
        K.poly(g, [-2.2, -26, 2.2, -26, 2.8, -6, -2.8, -6], '#e4e8f0', O({ s: 0.8, lw: 1.5 }));
        K.line(g, 0, -25, 0, -8, '#ffffff', 0.9);
        K.rr(g, -7, -8, 14, 3.4, 1.4, GOLD, O({ s: 0.6 })); K.rr(g, -1.6, -5, 3.2, 8, 1, DWOOD, O({ s: 0.4 })); K.circ(g, 0, 4.4, 2.6, c, O({ s: 0.8 }));
      },
      // 3 Mũ Giáp: mũ sắt có lông
      (g, c, r) => {
        K.poly(g, [-8, 0, -8, -7, -5, -12, 0, -14, 5, -12, 8, -7, 8, 0], STEEL, O({ s: 1.4, lw: 1.7 }));
        K.rr(g, -5.5, -7, 11, 3, 1, '#2a1e2a', O({ s: 0, lw: 0.8 })); K.line(g, 0, -14, 0, -7, DSTEEL, 1.2);
        K.poly(g, [0, -14, 3, -20, 8, -18, 5, -13], c, O({ s: 0.8, lw: 1.2 }));
      },
      // 4 Giáp Ngực
      (g, c, r) => {
        K.poly(g, [-9, -14, -4, -16, 0, -14, 4, -16, 9, -14, 8, -3, 3, 1, -3, 1, -8, -3], STEEL, O({ s: 1.5, lw: 1.7 }));
        K.line(g, 0, -13, 0, 0, DSTEEL, 1.2); K.poly(g, [-3, -9, 3, -9, 3, -5, 0, -2.5, -3, -5], c, O({ s: 0.6, lw: 1 }));
      },
      // 5 Trống Trận
      (g, c, r) => {
        K.rr(g, -9, -10, 18, 12, 2, WOOD, O({ s: 1.4 })); K.ell(g, 0, -10, 9, 3.4, '#e8d8b0', O({ s: 0.7 }));
        for (let i = 0; i < 4; i++) { const x = -7 + i * 4.6; K.line(g, x, -9, x + 2.3, 1, c, 1.5); K.line(g, x + 2.3, 1, x + 4.6, -9, c, 1.5); }
        K.line(g, -4, -16, 0, -11, '#d8c8a0', 1.8); K.line(g, 4, -16, 0, -11, '#d8c8a0', 1.8);
      }
    ],
    /* =============== ELF =============== */
    archer: [
      // 0 Ngọc Gió: ngọc xanh lơ lửng trên cột
      (g, c, r, t) => {
        K.line(g, 0, 1, 0, -12, DWOOD, 3); K.line(g, 0, 1, 0, -12, WOOD, 1.6);
        const y = -21 + S(t * 2.4) * 1.6; glowAt(g, 0, y, 16, '#9affc8', Math.max(r, 2), t);
        K.poly(g, [0, y - 9, 6, y, 0, y + 9, -6, y], c, O({ s: 1.6, h: 1, lw: 1.6 })); K.line(g, -2, y - 4, 0, y - 1, '#ffffff', 1.1);
        g.save(); g.strokeStyle = 'rgba(200,255,225,.8)'; g.lineWidth = 1.2; for (let i = 0; i < 2; i++) { const a = t * 3 + i * 3.1; g.beginPath(); g.arc(0, y, 11 + i * 2, a, a + 1.7); g.stroke(); } g.restore();
      },
      // 1 Cung Thần: cây cung lớn
      (g, c, r) => {
        g.save(); g.lineCap = 'round';
        g.strokeStyle = K.INK; g.lineWidth = 5; g.beginPath(); g.moveTo(-3, -22); g.quadraticCurveTo(-13, -10, -3, 2); g.stroke();
        g.strokeStyle = '#a8703a'; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-3, -22); g.quadraticCurveTo(-13, -10, -3, 2); g.stroke();
        g.strokeStyle = c; g.lineWidth = 3.2; g.beginPath(); g.moveTo(-8.6, -13); g.quadraticCurveTo(-10.4, -10, -8.6, -7); g.stroke();
        g.strokeStyle = '#f4ecd8'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(-3, -22); g.lineTo(-3, 2); g.stroke();
        g.restore(); K.circ(g, -3, -22, 1.5, GOLD, O({ s: 0 })); K.circ(g, -3, 2, 1.5, GOLD, O({ s: 0 }));
      },
      // 2 Ống Tên
      (g, c, r) => {
        for (let i = -1; i <= 1; i++) { K.line(g, i * 2.6, -9, i * 3.4, -17, '#e8d8a8', 1.3); K.poly(g, [i * 3.4, -17, i * 3.4 - 2, -20, i * 3.4 + 2, -20], c, O({ s: 0.3, lw: 0.9 })); }
        K.poly(g, [-5, -10, 5, -10, 4.2, 2, -4.2, 2], '#8a5a32', O({ s: 1.2, lw: 1.6 })); K.rr(g, -5.4, -7, 10.8, 2.6, 1, c, O({ s: 0.4, lw: 1 })); K.rr(g, -4.6, -1.5, 9.2, 1.8, 1, GOLD, O({ s: 0.3, lw: 0.8 }));
      },
      // 3 Lông Ưng
      (g, c, r) => {
        K.line(g, 0, 1, 0, -4, DWOOD, 2);
        for (let i = -1; i <= 1; i++) {
          const a = i * 0.42; g.save(); g.translate(0, -3); g.rotate(a);
          K.poly(g, [0, 0, 3.4, -9, 2.6, -17, 0, -21, -2.6, -17, -3.4, -9], i === 0 ? '#f4efe4' : '#d8cdb8', O({ s: 0.8, lw: 1.3 }));
          K.line(g, 0, 0, 0, -19, '#9a8a6a', 0.9); K.poly(g, [0, -21, 2.2, -16, 0, -13, -2.2, -16], c, O({ s: 0.2, lw: 0.8 })); g.restore();
        }
      },
      // 4 Lọ Độc
      (g, c, r, t) => {
        K.rr(g, -2.6, -17, 5.2, 5, 1, '#8a6a3a', O({ s: 0.4, lw: 1.2 }));
        K.poly(g, [-3, -12, 3, -12, 8, -3, 8, 1, -8, 1, -8, -3], 'rgba(200,255,200,.55)', O({ s: 0, h: 0.5, lw: 1.6, flat: true }));
        K.poly(g, [-7.3, -3, 7.3, -3, 7.3, 0.4, -7.3, 0.4], '#6ae04a', O({ s: 0.6, lw: 0, flat: true }));
        K.ell(g, 0, -3, 7.3, 2, '#9aff7a', O({ s: 0, lw: 0, flat: true })); K.dot(g, -2.4 + S(t * 3) * 0.5, -4.5, 1.1, '#e8ffd8'); K.dot(g, 2.4, -6.5 + S(t * 3 + 1) * 0.6, 0.9, '#e8ffd8');
        K.rr(g, -5, -6.8, 10, 2.6, 1, c, O({ s: 0.3, lw: 0.9 })); glowAt(g, 0, -4, 14, '#7aff4a', Math.max(r, 2), t);
      },
      // 5 Rễ Cổ Thụ: rễ quấn quanh chân trụ
      (g, c, r, t) => {
        g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
        for (const [x0, x1, y1] of [[-16, -6, -12], [-3, 4, -16], [10, 16, -11]]) {
          for (const [col, w] of [[K.INK, 5.6], ['#6a4426', 3.8], ['#8a6236', 1.6]]) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, 3); g.quadraticCurveTo(x0 + (x1 - x0) * 0.2, y1 * 0.7, x1, y1); g.stroke(); }
          K.poly(g, [x1, y1, x1 + 5, y1 - 3, x1 + 2, y1 + 2], c, O({ s: 0.2, lw: 0.9 }));
        }
        g.restore(); glowAt(g, 0, -6, 20, '#8aff6a', Math.max(r, 2), t);
      }
    ],
    /* =============== PHÙ THỦY =============== */
    mage: [
      // 0 Pha Lê: pha lê lơ lửng
      (g, c, r, t) => {
        const y = -17 + S(t * 2.2) * 2; glowAt(g, 0, y, 18, c, Math.max(r, 2), t);
        K.poly(g, [0, y - 13, 7, y - 3, 4, y + 9, -4, y + 9, -7, y - 3], c, O({ s: 2, h: 1.2, lw: 1.7, light: '#ffffff' })); K.line(g, -2.5, y - 8, -3.6, y - 1, '#ffffff', 1.4); K.line(g, 0, y - 13, 0, y + 9, 'rgba(255,255,255,.35)', 0.8);
        K.ell(g, 0, 3, 7, 2.2, 'rgba(60,40,110,.5)', O({ s: 0, lw: 0, flat: true }));
      },
      // 1 Sách Phép: sách mở trên giá
      (g, c, r, t) => {
        K.line(g, 0, 2, 0, -5, DWOOD, 3.4);
        K.poly(g, [-11, -7, 0, -5, 0, -15, -11, -17], '#f4ead0', O({ s: 0.8, lw: 1.5 })); K.poly(g, [11, -7, 0, -5, 0, -15, 11, -17], '#ece0c0', O({ s: 0.8, lw: 1.5 }));
        K.line(g, -9, -13, -2, -12, '#a8884a', 0.9); K.line(g, -9, -10, -2, -9, '#a8884a', 0.9); K.line(g, 2, -12, 9, -13, '#a8884a', 0.9);
        K.line(g, -11, -6.4, 0, -4.4, c, 2.4); K.line(g, 11, -6.4, 0, -4.4, c, 2.4); glowAt(g, 0, -12, 14, c, Math.max(r, 2), t);
        K.dot(g, 6, -15 + S(t * 3) * 1.5, 1.2, '#ffffff');
      },
      // 2 Gậy Phép: gậy tựa tường + quả cầu
      (g, c, r, t) => {
        K.limb(g, -4, 3, 3, -20, 3, '#6a4426'); K.limb(g, 3, -20, 5, -23, 2.4, GOLD);
        glowAt(g, 6, -26, 14, c, Math.max(r, 2), t); K.circ(g, 6, -26, 5, c, O({ s: 1, h: 0.8, lw: 1.5, light: '#ffffff' })); K.dot(g, 4.6, -27.6, 1.4, '#ffffff');
        K.line(g, 1, -17, 6, -17.5, GOLD, 1.8);
      },
      // 3 Bùa Băng: bùa băng treo dây
      (g, c, r, t) => {
        K.line(g, 0, -17, 0, -9, '#8a6a3a', 1.2); const y = -4 + S(t * 2) * 1;
        K.poly(g, [0, y - 9, 8, y - 4.5, 8, y + 4.5, 0, y + 9, -8, y + 4.5, -8, y - 4.5], c, O({ s: 1.4, h: 1, lw: 1.6, light: '#ffffff' }));
        g.save(); g.strokeStyle = '#ffffff'; g.lineWidth = 1.3; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(C(a) * 6, y + S(a) * 6); g.lineTo(-C(a) * 6, y - S(a) * 6); g.stroke(); } g.restore();
        glowAt(g, 0, y, 13, '#bfeaff', Math.max(r, 2), t);
      },
      // 4 Nhẫn Hư Không: nhẫn vàng lơ lửng xoay
      (g, c, r, t) => {
        const y = -10 + S(t * 2.4) * 1.6; glowAt(g, 0, y, 16, '#b070ff', Math.max(r, 2), t);
        g.save(); g.translate(0, y); g.scale(1, 0.82); g.lineWidth = 6; g.strokeStyle = K.INK; g.beginPath(); g.arc(0, 0, 7, 0, TAU); g.stroke(); g.lineWidth = 3.6; g.strokeStyle = GOLD; g.stroke(); g.restore();
        K.poly(g, [0, y - 14, 4.6, y - 9, 0, y - 4, -4.6, y - 9], c, O({ s: 1, h: 0.7, lw: 1.4, light: '#ffffff' }));
        g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.1; K.dot(g, C(a) * 10, y + S(a) * 6, 1.2, '#d8b0ff'); } g.restore();
      },
      // 5 Vòng Rune: vòng chữ phép phát sáng dưới chân
      (g, c, r, t) => {
        g.save(); g.scale(1, 0.42); g.globalCompositeOperation = 'lighter'; g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 22, 0, TAU); g.stroke(); g.lineWidth = 1.6; g.strokeStyle = '#e0d0ff'; g.beginPath(); g.arc(0, 0, 17, 0, TAU); g.stroke();
        for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.7; g.fillStyle = '#e8dcff'; g.fillRect(C(a) * 19.5 - 1.6, S(a) * 19.5 - 2.4, 3.2, 4.8); }
        g.beginPath(); for (let i = 0; i <= 5; i++) { const a = i / 5 * TAU * 2 - Math.PI / 2 + t * 0.7; g.lineTo(C(a) * 15, S(a) * 15); } g.stroke(); g.restore();
      }
    ],
    /* =============== NGƯỜI LÙN =============== */
    artillery: [
      // 0 Ống Ngắm: ống nhòm đồng trên giá
      (g, c, r, t) => {
        K.line(g, -4, 3, 0, -8, DWOOD, 2.2); K.line(g, 4, 3, 0, -8, DWOOD, 2.2);
        g.save(); g.translate(0, -9); g.rotate(-0.55);
        K.rr(g, -12, -3.6, 18, 7.2, 2.4, '#b8843a', O({ s: 1.2, lw: 1.7 })); K.rr(g, 5, -4.6, 8, 9.2, 2, '#8a5a24', O({ s: 0.8, lw: 1.5 })); K.rr(g, -4, -4, 2.4, 8, 1, c, O({ s: 0.3, lw: 0.8 }));
        K.ell(g, 13, 0, 2, 4.2, '#bfeaff', O({ s: 0, lw: 1.1 })); g.restore(); glowAt(g, 11, -17, 11, c, Math.max(r, 2), t);
      },
      // 1 Nòng Pháo: nòng dự phòng vắt trên bệ
      (g, c, r, t) => {
        g.save(); g.rotate(-0.45);
        K.rr(g, -13, -4.6, 24, 9.2, 3.4, '#4a4a56', O({ s: 1.4, lw: 1.8 })); K.rr(g, 8, -6, 6, 12, 2, '#5a5a66', O({ s: 0.8, lw: 1.6 })); K.ell(g, 14, 0, 2, 4, '#15101a', O({ s: 0, lw: 1 }));
        for (const x of [-8, -1]) K.rr(g, x, -5.2, 3, 10.4, 1, c, O({ s: 0.3, lw: 0.9 })); g.restore(); glowAt(g, 0, -6, 15, c, Math.max(r, 2), t);
        K.circ(g, -9, 3.4, 3.2, '#3a3a44', O({ s: 0.8, lw: 1.3 })); K.circ(g, 4, 4.4, 3.2, '#3a3a44', O({ s: 0.8, lw: 1.3 }));
      },
      // 2 Thùng Thuốc Súng
      (g, c, r, t) => {
        K.poly(g, [-7, -15, 7, -15, 9, -7, 7, 1, -7, 1, -9, -7], '#8a5a32', O({ s: 1.6, lw: 1.7 }));
        for (const y of [-12, -3]) K.line(g, -8.2, y, 8.2, y, '#3a3a44', 1.8);
        K.circ(g, 0, -7, 3, '#efe6d0', O({ s: 0.5, lw: 1 })); K.dot(g, -1.1, -7.6, 0.7, '#2a1a14'); K.dot(g, 1.1, -7.6, 0.7, '#2a1a14'); K.line(g, -1.4, -4.4, 1.4, -4.4, '#2a1a14', 0.9);
        K.line(g, 0, -15, 3, -20, '#c8a060', 1.2); glowAt(g, 3, -20, 7, '#ffb030', Math.max(r, 3), t); K.dot(g, 3, -20.4, 1.7, S(t * 25) > 0 ? '#ffd040' : '#ff7020');
        K.rr(g, -7, -11.4, 14, 2.4, 1, c, O({ s: 0.2, lw: 0.8 }));
      },
      // 3 Bánh Răng: bánh răng sắt xoay
      (g, c, r, t) => {
        g.save(); g.translate(0, -9); g.rotate(t * 0.9);
        const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = (i % 2 ? 7.6 : 10) ; pts.push(C(a) * rr, S(a) * rr); }
        K.poly(g, pts, '#9aa0ae', O({ s: 1.4, lw: 1.7 })); K.circ(g, 0, 0, 5, '#6a7080', O({ s: 0.8, lw: 1.3 })); K.circ(g, 0, 0, 2.6, c, O({ s: 0.3, lw: 1 })); g.restore(); glowAt(g, 0, -9, 13, c, Math.max(r, 2), t);
      },
      // 4 Đạn Lửa: đống đạn nung đỏ + lửa
      (g, c, r, t) => {
        for (const [x, y] of [[-5, 0], [5, 0], [0, -7]]) { K.circ(g, x, y, 5, '#3a3a44', O({ s: 1.2, lw: 1.5 })); K.ell(g, x, y + 1, 3.2, 2.2, '#e8501a', O({ s: 0, lw: 0, flat: true })); }
        g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const f = ((t * 1.6 + i / 3) % 1); K.glow(g, -2 + i * 2.6 + S(t * 6 + i) * 1.4, -12 - f * 11, 6 - f * 3.5, i === 1 ? '#ffd860' : '#ff7a2a', 1 - f); } g.restore();
        K.ell(g, 0, 4, 11, 2.6, c, O({ s: 0, lw: 0, flat: true })); glowAt(g, 0, -6, 17, '#ff7a2a', Math.max(r, 2), t);
      },
      // 5 Bệ Thép: đe sắt
      (g, c, r, t) => {
        K.poly(g, [-9, -9, 11, -9, 14, -6, 8, -4, 5, -1, 6, 3, -6, 3, -5, -1, -7, -4, -13, -6], '#8a909e', O({ s: 1.6, lw: 1.8 }));
        K.rr(g, -9, -10.4, 20, 2.6, 1, '#b8bec8', O({ s: 0.4, lw: 1.2 })); K.line(g, -7, -4.4, 5, -4.4, c, 1.8); glowAt(g, 0, -6, 14, c, Math.max(r, 2), t);
      }
    ]
  };

  /** điểm gắn (px, gốc = chân trụ giữa ô; y âm = lên). top = chiều cao sàn, R = bán kính thân, apex = đỉnh mái (nếu đo được) */
  const RW = { archer: [0, 31, 31, 29, 29], mage: [0, 22, 23, 24, 25], barracks: [0, 22, 24, 24, 26], artillery: [0, 34, 35, 35, 36] };
  function mount(type, level, slot, topPx, apex) {
    const R = (RW[type] || RW.archer)[level] || 28, top = -topPx;
    switch (slot) {
      case 0: return [0, apex !== null && apex !== undefined ? apex + 1 : top - 4];
      case 1: return [R * 0.5, top + 3];
      case 2: return [0, top * 0.55];
      case 3: return [-R * 0.96, top * 0.42];
      case 4: return [R * 0.96, top * 0.42];
      default: return [R * 0.18, 5];
    }
  }

  const Gear = {
    GEAR, STUB, mount,
    /** vẽ cả 6 điểm gắn của 1 trụ: ô trống = móc/cột trống; ô có đồ = bộ phận thật */
    drawAll(ctx, type, level, x, y, scale, topPx, apex, list, t, rarCol) {
      const order = [5, 3, 4, 2, 1, 0]; // nền → cánh → mặt trước → tầng trên → đỉnh (xa → gần/cao)
      for (const s of order) {
        const m = mount(type, level, s, topPx, s === 0 ? apex : null), it = list ? list[s] : null;
        ctx.save(); ctx.translate(x + m[0] * scale, y + m[1] * scale); ctx.scale(scale, scale); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
        if (it) { const c = rarCol(it), r = it.r; GEAR[type][s](ctx, c, r, t); } else STUB[s](ctx);
        ctx.restore();
      }
    }
  };
  window.Gear = Gear;
})();
