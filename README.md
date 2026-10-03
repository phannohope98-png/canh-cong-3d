# Canh Cổng – Bảo Vệ Thế Giới

Game thủ thành **xoay ngang** cho điện thoại, viết bằng HTML5 Canvas + JavaScript thuần (không cần thư viện, chơi offline như app).

## Chơi ngay
Bật GitHub Pages (Settings → Pages → Deploy from a branch → `main` / `(root)`), mở
`https://TÊN-TÀI-KHOẢN.github.io/TÊN-REPO/` trên điện thoại, **xoay ngang** → "Thêm vào màn hình chính".
Mỗi lần sửa code: đổi `CACHE_NAME` trong `service-worker.js` để máy tải bản mới.

## 5 nhân vật = 5 trụ (4 cấp mỗi trụ, đổi hình khi nâng cấp)
| Nhân vật | Trụ | Vai trò |
|---|---|---|
| Con Người | Trụ Thành | Triệu hồi 3 lính kiếm chặn đường |
| Elf | Trụ Cung | Bắn tên nhanh, trúng cả quân bay |
| Người Lùn | Trụ Pháo | Đạn nổ diện rộng (không bắn quân bay) |
| Phù Thủy | Trụ Pháp | Phép xuyên giáp, cấp 4 nảy tia |
| Orc | Hang Chiến Binh | Gọi 3 lính Orc ra chặn đường, cấp 4 cứ 3 nhát làm choáng |

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
