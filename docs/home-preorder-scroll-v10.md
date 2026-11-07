# Pre-order Drop & kiểm tra cuộn · V10

Bản vá cho dự án đã áp dụng Library Portal V9. Khu vực pre-order chuyển sang nền xanh thương hiệu, tiêu đề lớn, tranh Charizard nghiêng và thẻ sản phẩm nền đêm. Sản phẩm đầu được ưu tiên; danh sách dùng hết cột khi chỉ có một món, không chừa ô sản phẩm thứ hai.

## Chạy bản vá

Dừng server bằng Ctrl+C, lưu file vào Downloads rồi chạy:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Preorder-Scroll-V10.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Preorder-Scroll-V10.ps1"
npm run dev
```

Script kiểm tra source trước khi ghi, backup tự động và chạy TypeScript. `-Check` chỉ kiểm tra; `-Production` chạy build. Có `-SkipInstall`, `-SkipChecks`, `-ProjectRoot` và rollback. Không cần chép ảnh hoặc cài package mới. Dependency đang dùng chỉ được cài lại nếu thiếu và không có SkipInstall.

## Thiết kế pre-order

- Dùng tên, giá và ngày dự kiến thật từ dữ liệu hiện có; không giả số lượng giữ chỗ, đồng hồ đếm ngược hoặc mức đặt cọc. Nhãn giá là giá sản phẩm, không phải số tiền cọc.
- Giữ giới hạn tối đa bốn sản phẩm từ server. Module tắt hoặc không có sản phẩm thì không render section.
- Tranh Charizard hiện có là hình cảm hứng, không dùng thay cho ảnh hàng hóa. Ảnh sản phẩm và link chi tiết vẫn theo từng món. Không sửa ảnh gốc hoặc SQL.
- Mobile chuyển về một cột; màn hình dưới 400px cho ảnh và thông tin sản phẩm đầu xếp dọc để tên/giá dễ đọc. Link chi tiết và mục xem tất cả có vùng bấm lớn.
- Animation nghiêng tranh/đưa thẻ lên theo cuộn nằm trong module riêng, chỉ bật ở desktop có con trỏ chính xác và không yêu cầu giảm chuyển động. Nội dung không phụ thuộc animation để hiện ra.

## Vì sao trước đây có thể thấy cuộn không khác biệt

Đây là các điều kiện xác định được từ source, chưa phải chẩn đoán thiết bị Windows của bạn:

1. Lenis chỉ gắn với trang chủ; các route shop khác chưa có Lenis.
2. HomeMotionShell bỏ qua toàn bộ motion khi `prefers-reduced-motion: reduce` bật. V8 chỉ điều chỉnh carousel; không thay điều kiện này của smooth scroll.
3. Lenis nằm chung vòng đời với GSAP/SVG. Khi setup một hiệu ứng lỗi, cleanup cũng hủy Lenis; lỗi chỉ cảnh báo trong development.
4. `syncTouch: false` giữ thao tác vuốt ngón tay và quán tính gốc của trình duyệt, vì vậy cảm giác trên điện thoại không phải phép thử Lenis bằng wheel.

V10 tách vòng đời cuộn và hiệu ứng thành hai nhánh lazy độc lập. Lenis khởi tạo ngay sau khi client mount, không chờ timer 120ms hoặc setup SVG. Dùng `lerp: 0`, duration 1,1 giây và easing cubic để nội suy wheel có độ trễ dễ so sánh hơn; không tăng quãng đường wheel và không sửa global lag-smoothing của GSAP. Vẫn chỉ có một Lenis và một ticker cấp frame cho Lenis.

Đồng bộ với ScrollTrigger đi qua subscriber riêng. Khi animation lỗi, cuộn vẫn chạy. Khi component unmount hoặc đổi chế độ, listener/ticker/observer được dọn. Hộp thoại khóa overflow sẽ tạm dừng Lenis và tiếp tục khi mở khóa. Input, textarea, select, dialog, vùng data-lenis-prevent, Ctrl+wheel và Shift+wheel giữ cơ chế phù hợp của trình duyệt.

## So sánh Mượt / Gốc

Khi chạy **npm run dev**, trang chủ có bảng nhỏ ở góc phải:

- **Theo máy:** mặc định; tôn trọng giảm chuyển động của hệ điều hành.
- **Mượt:** thử Lenis bằng chuột/touchpad. Đây là lựa chọn chủ động trong development; có thể thử dù máy đang bật giảm chuyển động. Hiệu ứng GSAP vẫn tôn trọng cài đặt giảm chuyển động.
- **Gốc:** hủy Lenis để so sánh cùng quãng cuộn. Hiệu ứng GSAP hiện có vẫn độc lập.

Cuộn wheel một nấc rồi thả, đổi giữa hai chế độ để so sánh. Bảng hiển thị Lenis đang chạy, cuộn gốc hoặc lý do đang dùng fallback. Bảng không render trong production. Lựa chọn chỉ tồn tại trong phiên trang hiện tại, không lưu cookie/localStorage. Trên điện thoại, thao tác vuốt vẫn dùng cuộn gốc trong cả ba chế độ; dùng chuột/touchpad để kiểm tra khác biệt.

Có thể kiểm tra bằng Console:

```javascript
document.querySelector('.dp-home')?.dataset.homeScroll
document.querySelector('.dp-home')?.dataset.homeMotion
document.documentElement.classList.contains('lenis')
window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

Ở chế độ cuộn mượt, homeScroll là ready và thẻ html có class lenis. Class lenis-smooth chỉ xuất hiện trong khi Lenis đang nội suy cuộn, không phải tín hiệu engine luôn bật. V10 vẫn chỉ cấp Lenis cho trang chủ; không thêm engine vào admin, POS hoặc các route khác.

## Cấu trúc

| File trong src/features/home | Trách nhiệm |
| --- | --- |
| components/preorder-drop.tsx + preorder-drop.css | Server render và responsive pre-order |
| animation/preorder-drop.ts | Hiệu ứng pre-order riêng |
| animation/smooth-scroll.ts | Lenis, ticker, khóa dialog và cleanup |
| animation/scroll-events.ts | Kênh đồng bộ cuộn với effect |
| animation/controller.ts | GSAP/ScrollTrigger; không tạo/hủy Lenis |
| components/motion-shell.tsx + animation/lifecycle.ts | Hai vòng đời độc lập, hủy import muộn và báo lỗi |
| components/scroll-debug.tsx | Bảng thử chỉ ở development |

Carousel V8 và thư viện V9 giữ nguyên. Source cũ của section pre-order được bỏ khỏi home.css. Package/lockfile, query dữ liệu, API, SQL và nghiệp vụ đặt cọc giữ nguyên.

## Kiểm tra và giới hạn

Đã kiểm tra TypeScript/build production, SSR và ảnh qua Next Image. Test render 0–4 sản phẩm xác nhận giá, ngày và link đúng; section rỗng không render. Test dùng **Lenis 1.3.27 thực tế trong DOM mô phỏng**: wheel 120px nội suy đến 105px ở 550ms và hoàn tất ở 1100ms; kiểm tra touch/Ctrl/Shift, khóa dialog, override có chủ động, một ticker, lỗi SVG không hủy Lenis, lỗi setup được dọn và import sau unmount không được mount.

Script được kiểm tra parser, DryRun/Check, apply, chạy lặp, từ chối source/ảnh không khớp và rollback đúng byte trên fixture LF và BOM/CRLF. Runtime PowerShell dùng kiểm tra là 7; script dùng cú pháp tương thích 5.1, chưa chạy trực tiếp trên Windows PowerShell 5.1.

Chưa xác nhận layout hoặc cảm giác cuộn bằng trình duyệt/thiết bị thật trong phiên này; test DOM mô phỏng không thay thế kiểm thử wheel thực tế. Chưa đo FPS/Core Web Vitals. Sau áp dụng, kiểm tra ở 320px/390px/tablet/desktop và so sánh Mượt/Gốc bằng chuột. Bản vá không cam kết FPS trên thiết bị chưa đo.

## Hoàn tác

Dùng đúng backup in ra khi áp dụng:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Preorder-Scroll-V10.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Preorder-Scroll-V10-THOI-DIEM" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Preorder-Scroll-V10.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Preorder-Scroll-V10-THOI-DIEM"
```

Rollback phục hồi source V9, xóa file V10 tạo mới và dừng nếu file đã sửa tiếp để tránh mất thay đổi. Ảnh được dùng lại, không bị ghi đè.

Tham khảo triển khai: [Lenis README](https://github.com/darkroomengineering/lenis/blob/main/README.md).
