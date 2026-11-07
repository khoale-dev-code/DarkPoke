# Dark Poke · Home World V6

Trang chủ được thiết kế lại quanh các banner khách hàng cung cấp: cảnh mở đầu màu nước, danh mục, sản phẩm nổi bật, ảnh trưng bày, pre-order, sản phẩm mới, thư viện thẻ và thu mua. Tham khảo nhịp hình ảnh/câu chuyện của Bombon, xây dựng bố cục riêng theo thương hiệu Dark Poke: xanh #1b4fe0, trắng, xanh navy và font đã có.

## Áp dụng

Dừng server bằng Ctrl+C. Lưu file trong Downloads và chạy:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-World-V6.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-World-V6.ps1"
npm run dev
```

Mở `http://localhost:3000/`. `-Check` kiểm tra môi trường, `-Production` chạy build thay cho TypeScript. Có thể dùng `-ProjectRoot` khi chuyển thư mục. Script dành cho giao diện Client V2 đã có mục thư viện TCGdex V4/V5. Không yêu cầu cài lại V5 nếu đã có thư viện V4; bản này không sửa mã thư viện.

Script giữ các dependency khác, chỉ bổ sung/pin `gsap` 3.15.1 và `lenis` 1.3.27 nếu khác bản đã kiểm tra. Trên source hiện tại hai gói đã có, package và lock được giữ nguyên khi không cần install. `-SkipInstall` và `-SkipChecks` là lựa chọn chủ động; mặc định có kiểm tra TypeScript và npm install khi cần. Không có SQL migration, API key hoặc cập nhật cấu hình Supabase cho giao diện này.

## Cấu trúc

| File | Trách nhiệm |
| --- | --- |
| `src/app/(shop)/page.tsx` | Entry App Router, ISR 300 giây |
| `src/features/home/server/data.ts` | Đọc catalog/settings qua cache hiện có; giới hạn dữ liệu và gộp ID duy nhất |
| `components/storefront.tsx` | Render Server Component, banner và link nghiệp vụ |
| `components/motion-shell.tsx` | Ranh giới client nhỏ, theo dõi reduced motion và nạp animation sau render |
| `animation/lifecycle.ts` | Chống khởi tạo sau unmount/import chậm, quản lý cleanup |
| `animation/controller.ts` | Lenis, ScrollTrigger, DrawSVG và MotionPath; dọn ticker, listener và hiệu ứng theo scope |
| `home.css` | Styles chỉ dành cho trang chủ, responsive và accessibility |
| `public/home-v6/` | Năm banner WebP đã tối ưu |

## Chuyển động và hiệu năng

- Banner chính dùng next/image, priority, kích thước bố cục cố định; các ảnh phía dưới lazy-load. Nguồn mobile của hero chọn độ phân giải đủ lớn khi ảnh ngang bị cắt dọc, tránh lấy ảnh 360px rồi phóng to toàn chiều cao.
- Lenis smooth wheel qua một ticker GSAP, giữ native touch với syncTouch=false, hỗ trợ anchor và vùng cuộn bên trong dialog/form. Không thay đổi global lagSmoothing và không reset vị trí cuộn khi mount.
- ScrollTrigger điều khiển parallax vừa phải trên desktop; DrawSVG vẽ đường SVG, MotionPath đưa điểm đánh dấu theo đường. Không pin màn hình, không carousel tự chạy và không chặn cuộn để chờ tải ảnh.
- Nội dung đầu trang hiển thị ngay từ SSR, không bị giấu để chờ reveal. Các nhóm phía dưới được reveal khi đi vào vùng nhìn; hover không dùng filter/blur nặng.
- Reduced motion được theo dõi trực tiếp. Khi bật, không khởi tạo animation; nếu đang chạy sẽ destroy/revert và trở về native scrolling. Nếu chunk animation lỗi, trang vẫn có đủ nội dung và link.
- Khi đổi route, hủy ticker, callback scroll Lenis và GSAP context của trang chủ. Không killAll các hiệu ứng khác. Import hoàn tất sau unmount không được tạo thêm instance.
- Dữ liệu sản phẩm vẫn đọc phía server từ catalog/Supabase hiện tại: tối đa 8 nổi bật + 8 gần đây để chọn các sản phẩm mới khác + 4 pre-order. Module pre-order tắt thì không truy vấn nhóm này. Không tải toàn bộ tồn kho; không bịa giá hoặc số lượng khách hàng.
- Các công tắc pre-order/thu mua trong cài đặt được giữ. Giá, tồn kho và link chi tiết dùng ProductCard hiện có. Ảnh banner là hình ảnh cảm hứng, không dùng để thay thumbnail sản phẩm thực tế.
- Header, footer, logo, checkout, thu mua, thư viện thẻ và admin được dùng lại. Các asset logo trong dự án Windows cần được giữ; snapshot source dạng văn bản của môi trường thử không có ảnh logo gốc nên logo không hiện ở preview đó.

## Banner

Các ảnh được chuyển định dạng/giảm kích thước để tải web; giữ nguyên nội dung và dấu tác giả trong file nguồn. Tỷ lệ hiển thị khác nhau theo vùng chứa. Tổng năm WebP: **1,218,586 byte**, so với 14,851,639 byte PNG đầu vào. Chỉ banner đầu được ưu tiên; các banner còn lại tải khi cần.

| File | Kích thước | Dung lượng |
| --- | --- | --- |
| `johto-world.webp` | 1774 × 887 | 419,408 byte |
| `collector-display.webp` | 1920 × 814 | 173,108 byte |
| `ocean-world.webp` | 1199 × 671 | 252,742 byte |
| `sky-world.webp` | 1000 × 1105 | 250,844 byte |
| `collector-adventure.webp` | 573 × 828 | 122,484 byte |

## Kiểm tra và phạm vi xác nhận

Đã kiểm tra TypeScript, build production, render server, dữ liệu catalog có/không có module và ảnh qua endpoint next/image. Kiểm tra tự động cho import chậm/unmount, bật/tắt animation, native touch, ticker duy nhất, cleanup khi SVG setup lỗi và callback font hoàn tất sau unmount. Script có kiểm tra read-only/DryRun, source khác phiên bản, backup, chạy lại và rollback, gồm hash byte cho ảnh.

Đã xem banner và bố cục desktop cùng các khung viewport 320/390px trong trình duyệt thử. Các tương tác client trong preview không phản hồi ổn định, kể cả menu có sẵn; lần reload production bị chặn bởi URL policy của browser. Vì vậy chưa xác nhận Lenis/GSAP đầu cuối trong trình duyệt này và chưa thử trên điện thoại thật. Cần mở trên máy Windows và thử cuộn, menu, link sản phẩm và bật giảm chuyển động. Chưa đo Core Web Vitals trên deployment; không cam kết một số FPS/LCP cụ thể.

Script dùng UTF-8 BOM, CRLF và cú pháp Windows PowerShell 5.1. Parser và vòng đời cập nhật được kiểm tra bằng PowerShell 7; chưa chạy trực tiếp trên Windows 5.1.

## Hoàn tác

Dùng đúng đường dẫn backup đã in khi áp dụng:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-World-V6.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Home-World-V6-THOI-DIEM" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-World-V6.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Home-World-V6-THOI-DIEM"
```

Rollback dừng nếu file đã sửa sau bản vá. File ảnh được kiểm tra SHA-256 trên byte; source text cho phép BOM/CRLF khác nhau nhưng backup khôi phục đúng byte ban đầu. Lock được sao lưu khi npm install; node_modules đã cài có thể vẫn còn sau rollback.

Nguồn tham khảo: [Bombon](https://bombon.rs/), [Lenis README](https://github.com/darkroomengineering/lenis/blob/main/README.md), [GSAP SVG](https://gsap.com/svg/), [DrawSVG](https://gsap.com/docs/v3/Plugins/DrawSVGPlugin/), [MotionPath](https://gsap.com/docs/v3/Plugins/MotionPathPlugin/).
