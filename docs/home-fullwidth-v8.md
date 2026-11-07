# Banner tràn khung · Home Fullwidth V8

Bản vá dùng cho Dark Poke đã cài Home Slider V7. Banner chỉ còn hai ảnh theo đúng thứ tự: **Morpeko 11.11 → Hidden Fates Mewtwo → Morpeko**, tự chuyển mỗi 6 giây sau khi ảnh sẵn sàng.

## Cách chạy

Lưu file PS1 vào `C:\Users\Bin77\Downloads`. Dừng server đang chạy bằng Ctrl+C rồi thực hiện:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-Fullwidth-V8.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-Fullwidth-V8.ps1"
npm run dev
```

Mở `http://localhost:3000/`. Không cần tải hoặc chép lại ảnh: hai ảnh WebP đã có trong V7, tổng 584.602 byte. Script kiểm tra đúng ảnh và source trước khi ghi; tạo backup tự động và chạy TypeScript. Không thay đổi package, SQL hoặc Supabase. Nếu dependency hiện có bị thiếu, script có thể cài lại; dùng `-SkipInstall` để chỉ dùng dependency đã cài.

Các tùy chọn khác: `-Check` kiểm tra môi trường và source, `-Production` chạy production build, `-ProjectRoot` chỉ định thư mục. `-DryRun` và `-Check` không ghi source, tạo backup hoặc cài gói.

## Thay đổi giao diện và chuyển ảnh

- Bỏ toàn bộ thanh điều khiển dưới ảnh: nút trước/sau, chấm chọn, bộ đếm và dòng “Tự chuyển đã tắt”.
- Banner rộng 100% khung trang chủ, không giới hạn 1672px, không giới hạn theo chiều cao viewport. Khung giữ tỷ lệ 16:9; ảnh dùng `object-fit: cover` và `sizes="100vw"`. Hai ảnh tối ưu sẵn có cùng tỷ lệ nên phủ khung mà không có dải nền hai bên.
- Morpeko là ảnh đầu được ưu tiên tải. Mewtwo chỉ bắt đầu chuẩn bị khi ảnh đầu sẵn sàng. Ảnh đã tải được giữ lại để vòng lặp không nháy trắng.
- Tự chuyển mặc định, kể cả khi chuột nằm trên ảnh. Vuốt ngang trên điện thoại hoặc dùng phím mũi tên vẫn đổi ảnh; tự chuyển tiếp tục sau 6 giây. Cuộn dọc và pinch zoom vẫn do trình duyệt xử lý.
- Khi hệ điều hành bật giảm chuyển động, ảnh vẫn đổi theo yêu cầu nhưng tắt fade. Lenis/GSAP của các phần khác giữ nguyên hành vi hiện có.
- Tạm ngưng timer khi tab ẩn hoặc banner nằm ngoài màn hình; bắt đầu lại một chu kỳ khi quay về. Nếu ảnh kế chưa sẵn sàng, giữ ảnh hiện tại; không chuyển sang khung đang tải.
- Focus bàn phím vào carousel sẽ tạm dừng để có thời gian đọc. Một nút tạm dừng/bật chỉ hiện khi người dùng Tab tới nó, nằm đè trên ảnh và không tạo thanh điều khiển hoặc khoảng trống. Bấm/tap thông thường không kích hoạt việc dừng do focus bàn phím.
- Banner mở tìm sản phẩm Morpeko/Mewtwo đang có trong shop. Nội dung khuyến mãi là chữ sẵn trong ảnh; bản vá không tự tạo chương trình giảm giá.

## Cấu trúc code

| File trong `src/features/home/` | Trách nhiệm |
| --- | --- |
| `carousel/slides.ts` | Hai ảnh theo thứ tự và khoảng chuyển 6000ms |
| `carousel/use-hero-carousel.ts` | Timer, pause/resume, visibility, IntersectionObserver và cleanup |
| `components/hero-carousel.tsx` | Render Next Image, link, thao tác vuốt/phím và nội dung giới thiệu |
| `hero-carousel.css` | Khung tràn chiều ngang, fade và focus |

Model ảnh, phần giới thiệu và các nhóm sản phẩm phía dưới được giữ nguyên. Không thêm thư viện hoặc vòng `requestAnimationFrame`. Hai ảnh lễ hội V7 cũ vẫn nằm trong public để bảo toàn khả năng hoàn tác, nhưng không còn trong danh sách render/tải của carousel.

## Kiểm tra

Đã kiểm tra TypeScript, production build, SSR chỉ render một banner Morpeko ưu tiên tải, hai asset WebP và tối ưu AVIF. Kiểm tra đồng hồ mô phỏng xác nhận chu kỳ 6000ms, vòng 1→2→1, vuốt không tắt autoplay, focus/pause/resume, tab ẩn, ngoài viewport, ảnh chưa sẵn sàng/lỗi và cleanup. Cấu hình giảm chuyển động không khóa autoplay; CSS tắt transition trong chế độ này.

Script được kiểm tra parser, DryRun/Check không ghi dữ liệu, áp dụng, chạy lặp, từ chối source/ảnh không khớp và rollback đúng byte trên hai fixture LF và BOM/CRLF. File dùng UTF-8 BOM, CRLF và cú pháp tương thích PowerShell 5.1; runtime kiểm tra là PowerShell 7, chưa chạy trên Windows PowerShell 5.1 thực tế.

Chưa xác nhận thao tác đầu cuối bằng trình duyệt hoặc thiết bị thật trong phiên này, và chưa đo Core Web Vitals trên deployment. Sau khi áp dụng, mở trang chủ, đợi ảnh tải rồi kiểm tra Morpeko → Mewtwo → Morpeko; thử trên điện thoại và màn hình rộng.

## Hoàn tác

Dùng chính đường dẫn backup in ra khi áp dụng:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-Fullwidth-V8.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Home-Fullwidth-V8-THOI-DIEM" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Home-Fullwidth-V8.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Home-Fullwidth-V8-THOI-DIEM"
```

Rollback phục hồi source V7 và xóa tài liệu V8 đã tạo. Nếu file trong bản vá được chỉnh tiếp sau cập nhật, rollback dừng để không ghi đè thay đổi mới. Ảnh V7 được dùng lại, không ghi đè hoặc xóa ảnh.
