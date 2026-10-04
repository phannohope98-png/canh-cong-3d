# Canh Cổng – Bảo Vệ Thế Giới

Game thủ thành **xoay ngang** cho điện thoại, viết bằng HTML5 Canvas + JavaScript thuần (không cần thư viện, chơi offline như app).

## Chơi ngay
Bật GitHub Pages (Settings → Pages → Deploy from a branch → `main` / `(root)`), mở
`https://TÊN-TÀI-KHOẢN.github.io/TÊN-REPO/` trên điện thoại, **xoay ngang** → "Thêm vào màn hình chính".
Mỗi lần sửa code: đổi `CACHE_NAME` trong `service-worker.js` để máy tải bản mới.

## 4 trụ (4 cấp mỗi trụ, đổi hình khi nâng cấp)
| Trụ | Vai trò |
|---|---|
| Người | Gọi 2 kiếm sĩ (tóc đen, giáp bạc, áo choàng đỏ sẫm, kiếm lớn + khiên). Chém ngang; cấp 4 giơ khiên tạo lá chắn |
| Elf | Bắn rất nhanh, sát thương cao, tầm trung; 15% mũi tên phát sáng chí mạng; cấp 4 bắn 3 mũi liên tiếp |
| Phù Thủy | Tầm xa nhất, quả cầu phép nổ vòng phép sát thương lan; cấp 4 gọi mưa thiên thạch |
| Người Lùn | Gọi 1 chiến binh Lùn béo chắc, rìu hai tay; cứ 4 nhát đập đất gây choáng |

Orc giờ là quái: Orc, Orc Cưỡi Sói (sói tăng tốc húc lính). Goblin tí hon đi thành bầy. Boss: Kỵ Sĩ Hắc Ám (giữa màn, triệu hồi bóng tối, giai đoạn 2 kiếm rực đỏ), Chúa Hắc Ám (boss cuối, 3 giai đoạn: đánh mạnh → triệu hồi Orc + Goblin → rực đỏ, tăng tốc).

Bách khoa → "5 Nhân vật trụ" hiển thị bảng thiết kế từng nhân vật (4 cấp, biểu cảm, trụ, trang bị, bảng màu).

## 6 vùng đất – dùng ẢNH MAP THẬT làm chiến trường
Rừng Xanh · Thành Cổ · Sa Mạc · Băng Giá · Núi Lửa · Cổng Hỗn Mang (boss cuối). Nền trận là chính ảnh map (`assets/art/battle_N.jpg`, cắt từ `assets/art/src/maps.png` bằng `test/mkbattle.ps1`). Đường quái đi được dò theo con đường vẽ trong ảnh (`js/maps-img.js`, toạ độ theo ảnh gốc). Ô xây tự đặt dọc đường, tránh nước / dung nham / vực bằng cách đọc màu ảnh.

## Anh hùng & trang bị
4 anh hùng: **Aldric** (hiệp sĩ – Thánh Quang), **Lyra** (xạ thủ Elf – Mưa Tên), **Selene** (đại pháp sư – Bão Băng làm chậm), **Borin** (chiến thần Người Lùn – Địa Chấn làm choáng).
Mỗi anh hùng mang 4 ô trang bị: **vũ khí, găng tay, giáp, giày** (3 bậc), mua bằng **Xu** kiếm sau mỗi trận; trang bị đổi hình dạng nhân vật.

## Phép toàn bản đồ (như Kingdom Rush)
- **Viện Binh** (hồi 20s): chạm lên đường, gọi 2 lính tạm thời ra chặn quái trong 20 giây.
- **Mưa Thiên Thạch** (hồi 45s): chạm lên bản đồ, 5 thiên thạch rơi gây sát thương diện rộng.

## Hoạt ảnh
Nhân vật ảnh art có nhún bước, lấy đà – lao chém – vệt chém, tụ lực khi bắn; trúng đòn nháy trắng; chết thì ngã xuống rồi mờ dần; nổ để lại vết cháy xém; trụ mọc lên từ mặt đất khi xây.

## Cách chơi
- Chạm ô đất có cọc gỗ → menu vòng tròn 5 nhân vật → chọn trụ. Chạm trụ để nâng cấp / bán / dời cờ (Con người).
- Chạm anh hùng (hoặc ảnh góc trái) rồi chạm bản đồ để di chuyển; nút bên cạnh là kỹ năng.
- Bấm đầu lâu đỏ ở cửa vào để gọi đợt quái (gọi sớm được thưởng vàng).
- Kéo để di chuyển bản đồ, chụm 2 ngón (hoặc lăn chuột) để phóng to.
- Sao (1–3 mỗi màn) dùng nâng cấp trụ vĩnh viễn.

## Chỉnh game
Mọi thông số nằm trong `js/config.js`: `towers`, `heroes`, `equipment`, `enemies`, `upgrades`, `levels` (đường đi là điểm điều khiển, đợt quái dạng `"orc:6,goblin:10"`, `spots` = số ô xây), `themes`.

## Cấu trúc
- `art-kit.js` bộ vẽ hoạt hình · `art-chars.js` nhân vật/quái/anh hùng · `art-towers.js` trụ · `art.js` bộ đệm khung hình
- `level.js` đường đi, ô xây, nền 6 vùng · `camera.js` kéo/phóng to
- `enemies.js`, `units.js` (lính + anh hùng + kỹ năng), `towers.js`, `combat.js`, `waves.js`, `game.js`, `ui.js`, `save.js`

## Xưởng nhân vật 3D (`design/nhan-vat-3d.html`)
Mở từ Bách khoa → **Mô hình 3D**, hoặc trực tiếp `design/nhan-vat-3d.html?c=soldier&t=4`.
34 nhân vật + 4 trụ dựng lại bằng 3D theo đúng thiết kế chibi trong game (đầu to, tô toon 3 tông, viền mực dày kiểu Kingdom Rush):
4 trụ (Kiếm Sĩ, Elf, Phù Thủy, Lùn – mỗi trụ 4 cấp), 4 anh hùng, Goblin, Bóng Tối, Orc (3 biến thể), Orc Cưỡi Sói, Kỵ Sĩ Hắc Ám (2 giai đoạn), Chúa Hắc Ám (3 giai đoạn).
- Xoay/phóng to, đổi cấp, xem hoạt ảnh: Đứng · Đi · Đánh · Kỹ năng · Ngã; bảng màu, bảng quay 4 góc, tên khớp xương.
- **Tải .GLB**: mô hình có khung khớp + mọi clip hoạt ảnh + viền mực, mở bằng Blender / Unity / Godot / three.js. Bản dựng sẵn (cấp cao nhất) nằm ở `assets/models/*.glb`.
- **Sprite sheet 8 hướng**: 8 hàng hướng × 8 khung, nền trong suốt, góc nhìn chéo kiểu KR – dùng làm sprite 2D cho game.
- Mã: `design/chars3d.js` (dựng hình + hoạt ảnh), `design/viewer3d.js` (giao diện), Three.js r147 để offline trong `design/vendor/`.

### Chiến trường 3D
Trận đánh vẽ trực tiếp từ mô hình 3D (`js/art3d.js` + `design/chars3d.js` + `design/towers3d.js`): mỗi khung đi / đánh / đứng / ngã và các hướng nhìn được chụp từ mô hình bằng WebGL rồi lưu đệm như sprite, nên vẫn mượt trên điện thoại.
- **Nhân vật**: 4 loại lính trụ (mọi cấp), 4 anh hùng (theo trang bị), toàn bộ 26 loại quái, kể cả 4 boss (Kỵ Sĩ Hắc Ám, Chúa Hắc Ám, Vua Troll Đá, Chúa Tể Hỗn Mang). Quái chết dùng hoạt ảnh ngã 3D.
- **Công trình**: 4 trụ × 4 cấp và ô xây trống. Cờ, lửa, khói, cửa mở vẫn là lớp hiệu ứng động vẽ chồng lên.
- **Bản đồ**: mặt đất, đường, sông vẽ tay; toàn bộ cây, đá, xương rồng, pha lê, đèn, nhà, lều, lâu đài cổng, pháo đài, tượng đài, cổng hư vô là mô hình 3D (`design/props3d.js`, `js/map3d.js`). Bản đồ chiến dịch cũng dựng lại bằng vật 3D theo 6 vùng.
- **Hiệu ứng**: mũi tên, tinh thể phép, bom, thiên thạch và cờ vải bay là 3D (`js/fx3d.js`); vệt sáng, lửa, khói giữ dạng hiệu ứng.
- **Ánh sáng theo vùng**: núi lửa ánh cam, băng giá ánh lạnh, hỗn mang ánh tím…; Núi Lửa và Hỗn Mang có lớp tối + nguồn sáng thật (đèn, đuốc, pha lê, dòng dung nham, chớp nổ, phép, thiên thạch – `js/lights.js`).
- **Mặt đất 3D** (`js/terrain3d.js`): lòng sông / hồ / dung nham khoét sâu có bờ dốc, đường trũng, cầu gỗ / đá 3D; **nước động** (`js/water.js`).
- **8 hướng nhìn**: lính trụ quay về phía quái, lính và quái đi chéo quay đúng hướng.
- **Biểu tượng 3D** cho xu, sao, tim, vương miện, rương, vũ khí… (`js/icons3d.js`).
- **Âm thanh theo vùng**: nhạc trận riêng và tiếng môi trường (chim, chuông, gió cát, gió tuyết, dung nham, hư không).
- **Tối ưu**: dùng chung bộ đệm WebGL, giảm đa giác trong trận, dựng sẵn khung hình lúc rảnh, tự hạ độ phân giải khi máy chậm (nhớ cho lần sau).
- Cài đặt → **Nhân vật 3D** để tắt (quay về hình 2D) nếu máy yếu; máy không có WebGL tự dùng 2D.

### Nâng cấp đồ hoạ (chất liệu, bóng đổ, giao diện)
- **Chất liệu sinh trong shader** (`design/chars3d.js`, tham số `tex` của `part()`): gạch, đá hộc, đá lát, ván gỗ, ngói, rơm, tán lá, đá tảng, vỏ cây, vữa, xương rồng, vải, tóc (sợi + vòng bóng), râu. Không dùng ảnh hay UV; vân bám theo toạ độ riêng của khối nên vẫn đúng sau khi gộp lưới. Mọi vật 3D còn có viền sáng theo màu đèn vùng, vệt bóng trên kim loại và chân tối dần.
- **Bóng đổ thật**: cây, đá, nhà, lâu đài… được dựng chung cảnh với mặt đất và đổ bóng bằng shadow map theo một hướng nắng (sau-trái → trước-phải). Trụ đổ bóng chiếu theo cùng hướng (`js/art3d.js`).
- **Chi tiết mặt đất 3D**: bụi cỏ, hoa, sỏi, đá viền đường, phiến đá lát (vẽ theo lô), gò đất thoai thoải có sáng tối mềm; nền trận dựng nét hơn khi phóng to.
- **Giao diện**: thanh thông số bằng gỗ viền vàng, nút phép vành kim loại, biểu tượng 3D cho kỹ năng và trang bị (màu theo bậc), màn Nâng Cấp Trụ có trụ 3D lớn.
