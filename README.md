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
| Orc | Trụ Thủ | Chém cận chiến lan nhóm, cấp 4 làm choáng |

Bách khoa → "5 Nhân vật trụ" hiển thị bảng thiết kế từng nhân vật (4 cấp, biểu cảm, trụ, trang bị, bảng màu).

## 6 vùng đất (đường đi, hình dạng, ô xây thiết kế riêng)
Rừng Xanh · Thành Cổ · Sa Mạc · Băng Giá · Núi Lửa · Cổng Hỗn Mang (boss cuối). Quái vào từ **trái**, cổng thành bên **phải**. Mỗi vùng có quái riêng (yêu tinh, cây ma, hiệp sĩ xương, xác ướp, bọ cạp, người băng, quỷ lửa, rồng lửa, quái magma, hư vô…).

## Anh hùng & trang bị
4 anh hùng: **Aldric** (hiệp sĩ – Thánh Quang), **Lyra** (xạ thủ Elf – Mưa Tên), **Selene** (đại pháp sư – Bão Băng làm chậm), **Borin** (chiến thần Người Lùn – Địa Chấn làm choáng).
Mỗi anh hùng mang 4 ô trang bị: **vũ khí, găng tay, giáp, giày** (3 bậc), mua bằng **Xu** kiếm sau mỗi trận; trang bị đổi hình dạng nhân vật.

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
