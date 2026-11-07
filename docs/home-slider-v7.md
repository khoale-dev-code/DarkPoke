# Banner tự chuyển · Home Slider V7

Bản cập nhật thay banner đầu trang chủ V6 bằng bốn ảnh mới theo thứ tự: lễ hội dưới trăng, lễ hội Pokémon hệ ma, Hidden Fates Mewtwo và Morpeko 11.11. Ảnh chụp màn hình cuối cùng chỉ dùng xác định vị trí sửa, không đưa vào slideshow.

## Áp dụng

Dừng server bằng Ctrl+C, lưu script vào Downloads rồi chạy:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-Slider-V7.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-Slider-V7.ps1"
npm run dev
```

Mở `http://localhost:3000/`. Cần có bản Home World V6 trước khi áp dụng. Bốn ảnh đã nhúng trong script; không cần chép ảnh thủ công hoặc giải nén ZIP. Không có dependency, SQL, API key hoặc thay đổi cấu hình mới. Script chỉ cài lại dependency hiện có khi chúng bị thiếu.

Có `-Check`, `-Production`, `-SkipInstall`, `-SkipChecks` và `-ProjectRoot`. Mặc định có backup và TypeScript; `-Production` chạy build. DryRun/Check không thay đổi source hoặc cài gói. Package JSON giữ nguyên.

## Hành vi

- Tự chuyển sau 6 giây, fade 650 ms và lặp từ ảnh 4 về ảnh 1. Timer chờ ảnh hiện tại cùng ảnh tiếp theo sẵn sàng, tránh chuyển sang ảnh đang tải.
- Có nút trước/sau, chọn từng ảnh và tạm dừng/bật tự chuyển. Chọn ảnh bằng nút, phím mũi tên hoặc vuốt sẽ dừng tự chuyển cho tới khi bấm bật lại.
- Tạm dừng khi chuột ở trong banner, khi banner ngoài viewport hoặc tab bị ẩn. Đưa chuột ra ngoài sẽ tiếp tục nếu chưa chủ động dừng.
- Khi focus bàn phím vào khu vực banner, tự chuyển dừng và chỉ bật lại khi người dùng yêu cầu. Nút điều khiển tự chuyển đứng đầu thứ tự Tab.
- Khi hệ điều hành bật giảm chuyển động, tự chuyển và fade tắt; nút chọn ảnh thủ công vẫn hoạt động. Khi tab ẩn hoặc component unmount, timer/listener được dọn.
- Ảnh dùng object-fit contain để giữ toàn bộ chữ và bố cục. Tiêu đề/CTA cũ chuyển vào dải thông tin dưới ảnh; không đặt chữ đè lên banner quảng cáo. Có thể có khoảng nền hai bên trên màn hình rất rộng.
- Mobile có vùng bấm tối thiểu 44px, vuốt ngang đổi ảnh; cuộn dọc và pinch zoom vẫn dùng cơ chế trình duyệt. Chỉ một ảnh được ưu tiên lúc SSR, ảnh kế tiếp tải dần. Các ảnh đã tải được giữ để vòng lặp không nháy trắng.
- Ảnh lỗi không làm mất ảnh đang xem; có thể bấm chọn lại để thử tải. Nếu ảnh đầu lỗi, thử chuyển sang ảnh khác tải thành công.
- Nhấn banner Mewtwo/Morpeko mở tìm sản phẩm liên quan; hai banner minh họa mở danh mục. Không tự tạo SKU, khuyến mãi, giá hoặc tồn kho. Nội dung chương trình 11.11 là phần có sẵn trong ảnh được cung cấp.

## Code

| File | Trách nhiệm |
| --- | --- |
| `carousel/slides.ts` | Danh sách ảnh, alt, link và HERO_INTERVAL = 6000 |
| `carousel/model.ts` | Trạng thái ảnh, yêu cầu mới nhất, lỗi/thử lại, ảnh đã tải và hướng vuốt |
| `carousel/use-hero-carousel.ts` | Timer, hover/focus, reduced motion, visibility và IntersectionObserver |
| `components/hero-carousel.tsx` | Render Next Image, controls, link và phần giới thiệu |
| `hero-carousel.css` | Khung chứa ảnh, fade, mobile và focus states |
| `components/storefront.tsx` | Thay đúng vùng hero bằng carousel; các nhóm sản phẩm phía dưới giữ nguyên |

Các file trên nằm trong `src/features/home/`. Ảnh mới nằm tại `public/home-v7/`. Lenis/GSAP V6 vẫn được dùng ở các phần hiện có; carousel không thêm animation library hoặc một vòng requestAnimationFrame riêng.

## Ảnh WebP

Tổng bốn ảnh tối ưu: 1,359,114 byte. Ảnh đầu preload bằng next/image; sau khi tải xong mới chuẩn bị ảnh kế. Ảnh được giữ nguyên nội dung, chỉ giảm kích thước/đổi định dạng. File PNG gốc không bị sửa.

| File | Kích thước | Dung lượng |
| --- | --- | --- |
| `moon-festival.webp` | 1600 × 900 | 471,170 byte |
| `ghost-festival.webp` | 1600 × 900 | 303,342 byte |
| `hidden-fates.webp` | 1600 × 900 | 269,578 byte |
| `morpeko-festival.webp` | 1600 × 900 | 315,024 byte |

## Kiểm tra và giới hạn

Đã kiểm tra TypeScript/build production, SSR chỉ preload một ảnh, bốn asset WebP và tối ưu AVIF. Kiểm tra tự động bằng đồng hồ mô phỏng: mốc 6000ms, vòng 4→1, pause/resume, focus dừng cho tới khi bật lại, tab ẩn, banner ngoài viewport, reduced motion, yêu cầu bấm nhanh/ảnh tải chậm, lỗi/thử lại, hướng vuốt và cleanup timer/listener. Script được kiểm tra DryRun, áp dụng, chạy lại, source mismatch và rollback trên source LF và BOM/CRLF.

Browser preview ở phiên trước bị URL policy chặn khi reload, nên bản V7 chưa được xác nhận thao tác giao diện đầu cuối trong trình duyệt đó. Cần kiểm tra trên máy Windows/điện thoại thật sau khi áp dụng; chưa đo Core Web Vitals hoặc FPS trên deployment. Không coi kiểm tra logic mô phỏng là kiểm thử thiết bị thật.

Script có UTF-8 BOM và CRLF, dùng cú pháp PowerShell 5.1. Parser và vòng đời được thử bằng PowerShell 7, chưa chạy trực tiếp trên Windows PowerShell 5.1.

## Hoàn tác

Dùng đúng đường dẫn backup đã in:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-Slider-V7.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Home-Slider-V7-THOI-DIEM" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-Slider-V7.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Home-Slider-V7-THOI-DIEM"
```

Rollback dừng nếu source hoặc ảnh đã sửa sau cập nhật. Ảnh dùng SHA-256 byte, source text cho phép BOM/CRLF nhưng backup khôi phục đúng byte ban đầu. Các ảnh V6 giữ nguyên để các phần còn lại và khả năng hoàn tác tiếp tục hoạt động.

Tham khảo: [WAI-ARIA carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/), [Next Image](https://nextjs.org/docs/app/api-reference/components/image).
