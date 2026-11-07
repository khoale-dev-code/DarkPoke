# Dark Poke — Anime V13.1

Bản này thay thế lần chạy V13 bị dừng vì thiếu ảnh. Hai ảnh người dùng cung cấp đã được tối ưu thành WebP và đóng gói ngay trong file PowerShell. Không cần lưu hoặc đổi tên ảnh trong Downloads, không cần bản V13 cũ.

## Chạy trên Windows PowerShell

Tải `Dark-Poke-Anime-V13-1.ps1` vào `C:\Users\Bin77\Downloads`. Dừng server bằng Ctrl+C trước khi áp dụng.

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Anime-V13-1.ps1" -DryRun
if ($LASTEXITCODE -ne 0) { throw "DryRun chua dat; dung tai day." }
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Anime-V13-1.ps1"
if ($LASTEXITCODE -ne 0) { throw "Ban va chua thanh cong; xem loi phia tren." }
npm run dev
```

`-Check` kiểm tra source, Node.js, npm và các package hiện có. `-DryRun` không ghi file. `-Production` chạy production build. Bản vá không tự cài package, không đổi khóa cấu hình, không thao tác Supabase hay SQL.

## Giao diện và cấu trúc

- Header và footer dùng màu sáng, nét thẳng và vùng bấm lớn; footer có chữ liên kết 17 px và tiêu đề 21 px.
- `collector-studio.tsx` là Server Component chứa hai khối trưng bày và thu mua; giờ báo giá và đường dẫn phụ kiện lấy từ dữ liệu cửa hàng.
- `anime-client-shell.tsx` khởi tạo một Lenis cho layout trang khách và dọn dẹp khi unmount. Không còn bảng chọn chế độ cuộn. Cử chỉ chạm giữ cuộn tự nhiên; hiệu ứng GSAP vẫn quan sát thiết lập giảm chuyển động.
- CSS nằm trong `anime-client-v13.css`, giới hạn bởi `.shop-ui.shop-v13`. Hai ảnh WebP nằm trong `public/home-v13`.
- Hai banner tự chuyển, thư viện thẻ, danh sách sản phẩm, tìm kiếm, giỏ hàng và các cờ bật/tắt module tiếp tục sử dụng logic hiện có.
- Poster là ảnh cảm hứng, không phải dữ liệu tồn kho hay một chương trình khuyến mại đang được xác nhận.

## Khôi phục

Script in đường dẫn `.patch-backup/Anime-V13-1-...` và lệnh rollback đầy đủ. Khi kiểm tra sau sửa thất bại, script thử khôi phục các file của bản vá. Nếu file đã được chỉnh sửa tiếp, rollback dừng để bảo toàn thay đổi đó.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Anime-V13-1.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Anime-V13-1-THOI-GIAN"
```

Nếu báo `Source mismatch`, không dùng ghi đè cưỡng bức. Cần đối chiếu những file được liệt kê với source thực tế.
