# Cổng thư viện thẻ · Home Library Portal V9

Thiết kế lại đúng khu vực giới thiệu thư viện thẻ trên trang chủ: chữ lớn lệch nhịp, nền đêm, nút xanh thương hiệu, điểm nhấn xanh chanh, khung ảnh cắt góc và nhãn đồ họa nghiêng. Dùng ảnh lễ hội Lugia/Gengar mới được cung cấp thay cho ảnh Gyarados. Nút chính mở thư viện; ba liên kết tra nhanh mở kết quả Pikachu, Charizard và Eevee theo API/route đang có.

## Áp dụng trên dự án hiện tại

Cần có Home Fullwidth V8. Lưu script vào Downloads, dừng server bằng Ctrl+C rồi chạy:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Library-Portal-V9.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Library-Portal-V9.ps1"
npm run dev
```

Mở `http://localhost:3000/`, cuộn tới khu vực thư viện thẻ. Script tự backup và chạy TypeScript. Có `-Check`, `-Production`, `-SkipInstall`, `-SkipChecks`, `-ProjectRoot`. DryRun/Check không tạo file hoặc cài dependency; dùng Production để chạy build thay cho riêng TypeScript.

Ảnh PNG mới trùng đúng ảnh lễ hội đã tối ưu ở V7. Bản vá dùng lại `public/home-v7/moon-festival.webp` (1600 × 900, 471.170 byte), không cần chép ảnh thủ công. Script kiểm tra hash source và ảnh trước khi ghi. Hai banner đầu trang Morpeko → Mewtwo của V8 giữ nguyên, ảnh lễ hội chỉ dùng cho cổng thư viện.

## Bố cục và thao tác

- Tiêu đề “Tìm thẻ. Chạm đam mê.” và phần mời khám phá nằm phía trên một khung ảnh rộng. Nút chính cao 58px; liên kết tra nhanh cao tối thiểu 44px và có focus bàn phím.
- Ảnh giữ sáng, không đặt đoạn nội dung chính đè lên ảnh. Cắt góc chỉ là mask CSS ở góc trên phải/dưới trái; vùng ghi tác giả ở dưới phải được giữ. Ảnh gốc không chỉnh sửa.
- Màn hình hẹp chuyển về một cột, nút chính chiếm chiều ngang. Dưới 360px, tra nhanh chia hai hàng để chữ đủ đọc và dễ bấm. Khung ảnh có tỷ lệ cố định để tránh nhảy bố cục.
- Trang chủ vẫn render phía server. Component cổng thư viện không có `use client`, không gọi TCGdex khi render trang chủ và không thêm package. Next Image tải ảnh này dạng lazy; ảnh đầu trang vẫn được ưu tiên.
- GSAP/ScrollTrigger đã có điều khiển góc nghiêng/scale của khung và nét SVG theo tiến trình cuộn trên desktop có con trỏ chính xác. Không ghim trang, không chặn thao tác cuộn hoặc tạo vòng animation lặp vô hạn.
- Trên thiết bị cảm ứng và khi bật giảm chuyển động, hình/nội dung ở trạng thái tĩnh. Lenis dùng ticker GSAP hiện có; không tạo Lenis hoặc ticker thứ hai. Khi resize qua breakpoint, GSAP matchMedia dọn và khởi tạo lại đúng phạm vi.
- Nội dung và link vẫn hiện nếu JavaScript hoặc animation module tải lỗi. Đây là lối vào thư viện tra cứu, không thêm chức năng quản lý bộ sưu tập hoặc giả số lượng thẻ/người dùng.

## Cấu trúc code

| File trong `src/features/home/` | Trách nhiệm |
| --- | --- |
| `components/library-portal.tsx` | Server render nội dung, Next Image và liên kết thật |
| `library-portal.css` | Token cục bộ, bố cục, cắt góc, hover, focus và responsive |
| `animation/library-portal.ts` | Animation GSAP, SVG, media query và cleanup riêng |
| `animation/controller.ts` | Nối module mới với vòng đời Lenis/GSAP hiện có |
| `components/storefront.tsx` | Thay đúng section thư viện bằng component mới |
| `home.css` | Bỏ các selector của section thư viện cũ đã không dùng |

Không thay package/lockfile, dữ liệu Supabase, SQL, API key, logic giỏ hàng, quản trị hoặc thư viện infinite scroll. Ảnh Gyarados cũ vẫn tồn tại để hoàn tác.

## Kiểm tra và giới hạn

Đã kiểm tra TypeScript và production build; production SSR xác nhận có section mới, link tra nhanh đúng query, ảnh lễ hội lazy và banner V8 vẫn bắt đầu bằng Morpeko. Đã kiểm tra asset và chuyển đổi AVIF bằng Next Image. Kiểm tra logic animation xác nhận phạm vi desktop/giảm chuyển động, cleanup khi đổi route, lỗi setup, và chỉ một ticker/Lenis.

Script được kiểm tra parser, DryRun/Check không ghi dữ liệu, áp dụng, chạy lặp, từ chối source/ảnh không khớp và rollback trên fixture LF cùng UTF-8 BOM/CRLF. Cú pháp hướng tới Windows PowerShell 5.1; runtime kiểm tra là PowerShell 7, chưa chạy trực tiếp trên Windows PowerShell 5.1.

Chưa xác nhận layout và thao tác đầu cuối bằng trình duyệt/điện thoại thật trong phiên này. Sau áp dụng, kiểm tra ở 320px, 390px, tablet và desktop; thử Tab, ba liên kết tra nhanh, cuộn qua section và bật giảm chuyển động. Chưa đo FPS hoặc Core Web Vitals trên deployment.

## Hoàn tác

Dùng đường dẫn backup được in khi chạy script:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Library-Portal-V9.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Library-Portal-V9-THOI-DIEM" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Library-Portal-V9.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Library-Portal-V9-THOI-DIEM"
```

Rollback khôi phục đúng byte các file cũ và xóa file V9 vừa tạo. Nếu đã sửa tiếp file trong bản vá, script dừng để tránh mất thay đổi. Muốn hoàn tác V8 sau khi đã áp dụng V9, hoàn tác V9 trước.
