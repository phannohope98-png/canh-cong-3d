/* =========================================================
 * map3d.js – Vật trang trí & công trình trên bản đồ vẽ từ mô hình 3D (design/props3d.js)
 * Mặt đất, đường, sông vẫn là tranh vẽ tay (mapart.js); cây, đá, nhà, lâu đài… là 3D
 * được chụp thành sprite 1 lần cho mỗi mẫu / vùng / độ phân giải rồi đặt theo chiều sâu.
 * ========================================================= */
(function () {
  if (!window.Art3D || !window.Props3D || !window.MapArt) return;
  const cache = new Map();
  window.Map3D = {
    draw(g, d, T, theme, res) {
      if (!Art3D.enabled || !Art3D.available()) return false;
      const prop = d.prop ? d : null;
      if (!Props3D.has(d.k, !!prop)) return false;
      const vi = Math.min(2, (d.v * 3) | 0);
      const ppu = Math.min(4, Math.ceil(res * (prop ? 1.1 : 1.9) * 4) / 4);
      const key = (prop ? [d.k, d.theme, d.snow ? 1 : 0, d.dark ? 1 : 0].join('|') : d.k + '|' + theme + '|' + vi) + '@' + ppu;
      let sp = cache.get(key);
      if (sp === undefined) {
        Chars3D.setInk(1.0);
        const root = Props3D.build(d.k, prop ? (d.theme || theme) : theme, (vi + 0.5) / 3, prop);
        sp = root ? Art3D.sprite(root, ppu) : null;
        cache.set(key, sp);
      }
      if (!sp) return false;
      g.save(); g.translate(d.x, d.y);
      if (!prop) g.scale(d.s * d.flip, d.s);
      if (d.k !== 'monument' && d.k !== 'flowerbed' && d.k !== 'rune') ArtKit.shadow(g, sp.fw * 0.1, 2, sp.fw * 0.5, sp.fw * 0.16, 0.38);
      g.drawImage(sp.c, -sp.ox, -sp.oy, sp.w, sp.h);
      g.restore();
      return true;
    },
    clear() { cache.clear(); }
  };
})();
