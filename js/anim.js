/* =========================================================
 * anim.js – Lớp chuyển động phụ cho nhân vật / quái (vẽ trên các khung 3D đã chụp sẵn)
 * Khung hình 3D chỉ có 12–24 tư thế mỗi vòng; lớp này bù thêm những thứ làm hoạt hình "sống":
 *  - đòn đánh có lấy đà → lao tới → thu về (không đứng yên chém như tượng)
 *  - bị đánh thì giật lùi, bẹp nhẹ rồi nảy lại
 *  - đang giao chiến mà chưa tới lượt đánh thì nhún nhảy qua lại (không đứng đơ)
 *  - đi thì hơi chúi người theo hướng đi; vừa xuất hiện thì phồng lên (easeOutBack)
 *  - quay hướng 8 góc có độ trễ (hysteresis) để không giật qua lại khi đường cong
 * ========================================================= */
(function () {
  const TAU = Math.PI * 2;
  const ease = t => t * t * (3 - 2 * t), out = t => 1 - (1 - t) * (1 - t);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const P = { dx: 0, dy: 0, sx: 1, sy: 1, rot: 0 }; // dùng lại 1 đối tượng, không tạo rác mỗi khung

  const Anim = {
    /** Tính phép biến đổi cho thực thể e (Unit hoặc Enemy).
     *  mode: 'walk' | 'atk' | 'idle'; ph: pha của mode (atk: 0..1) ; dir: hướng ngang -1/1 (hướng đòn đánh / đi); t: giờ */
    pose(e, mode, ph, dir, t) {
      let dx = 0, dy = 0, sx = 1, sy = 1, rot = 0;
      const ranged = !!(e.range || (e.def && e.def.ranged)), big = e.radius > 20 ? 1.4 : 1;
      if (mode === 'atk') {
        const A = ranged ? 0.3 : 1;
        if (ph < 0.38) { const k = ease(ph / 0.38); dx = -dir * 3 * k * A * big; sy = 1 + 0.035 * k; sx = 1 - 0.025 * k; rot = -dir * 0.05 * k * A; }                                 // lấy đà: ngả người ra sau
        else if (ph < 0.58) { const k = out((ph - 0.38) / 0.2); dx = dir * (-3 + 11 * k) * A * big; sy = 1.035 - 0.085 * k; sx = 0.975 + 0.1 * k; rot = dir * (-0.05 + 0.16 * k) * A; dy = -1.2 * Math.sin(k * Math.PI) * A; } // lao tới + bẹp theo hướng đánh
        else { const k = ease((ph - 0.58) / 0.42); dx = dir * 8 * (1 - k) * A * big; sy = 0.95 + 0.05 * k; sx = 1.05 - 0.05 * k; rot = dir * 0.11 * (1 - k) * A; }                          // thu về
      } else if (mode === 'walk') {
        rot = dir * 0.035;                                                                                                                                                       // hơi chúi người theo hướng đi
        const s = Math.sin(ph * TAU * 2); sy = 1 + s * 0.012; sx = 1 - s * 0.01;                                                                                                  // nhún theo mỗi bước chân
      } else if (e.state === 'fight' || e.target) {
        const w = Math.sin(t * 5.2 + (e.uid || 0) * 1.7);
        dx = w * 1.4; rot = w * 0.022; sy = 1 + Math.sin(t * 10.4 + (e.uid || 0)) * 0.012; // giao chiến: nhún nhảy qua lại
      }
      if (e.hitT > 0) { const k = Math.sin(clamp(e.hitT / 0.2, 0, 1) * Math.PI); dx -= dir * 3.2 * k; sy *= 1 - 0.07 * k; sx *= 1 + 0.06 * k; rot -= dir * 0.07 * k; }       // trúng đòn
      if (e.popT > 0) { const u = 1 - e.popT / 0.4, c1 = 1.9, k = 1 + (c1 + 1) * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); sx *= 0.55 + 0.45 * k; sy *= 0.4 + 0.6 * k; }       // mới xuất hiện: nảy lên
      P.dx = dx; P.dy = dy; P.sx = sx; P.sy = sy; P.rot = rot; return P;
    },
    /** áp phép biến đổi quanh chân (x, y); nhớ ctx.restore() sau khi vẽ */
    begin(ctx, x, y, p) {
      ctx.save(); ctx.translate(x + p.dx, y + p.dy); if (p.rot) ctx.rotate(p.rot); if (p.sx !== 1 || p.sy !== 1) ctx.scale(p.sx, p.sy); ctx.translate(-x, -y);
    },
    /** chọn 1 trong 8 hướng nhìn có trễ: chỉ đổi hướng khi góc thật lệch quá ~0,62 ô so với hướng đang giữ */
    dirKey(art, aim, holder) {
      const A3 = window.Art3D; if (!A3 || !A3.dirIndex) return null;
      const raw = A3.dirIndex(aim); if (raw === null) return null;
      let cur = holder._dk;
      if (cur === undefined) cur = Math.round(raw); else { const d = (((raw - cur + 4) % 8) + 8) % 8 - 4; if (Math.abs(d) > 0.62) cur = Math.round(raw); }
      holder._dk = cur; const k = ((Math.round(cur) % 8) + 8) % 8, key = art + '_a' + k;
      return window.ArtChars && ArtChars[key] ? key : null;
    }
  };
  window.Anim = Anim;
})();
