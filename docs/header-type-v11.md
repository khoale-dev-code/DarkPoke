# Header mới và khoảng dòng tiếng Việt · V11

Bản vá dùng sau Preorder Scroll V10. Sửa tiêu đề pre-order bị chạm dấu và thiết kế lại header trên toàn bộ route khách hàng.

## Chạy bản vá

Dừng server bằng Ctrl+C, lưu script vào Downloads rồi chạy:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Header-Type-V11.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Header-Type-V11.ps1"
npm run dev
```

Script kiểm tra source trước khi ghi, tự backup và chạy TypeScript. Có `-Check`, `-Production`, `-SkipInstall`, `-SkipChecks`, `-ProjectRoot`. DryRun/Check không ghi source hoặc cài package; Production chạy build. Không có dependency mới hoặc thay đổi Supabase/SQL.

## Chữ không còn chạm dấu

Tiêu đề “Hẹn một / lần mở pack.” trước đây dùng line-height 1.12 và br nối với một span inline-block. Với glyph Bricolage Grotesque weight 800 đang dùng, dấu nặng ở dòng trên và dấu cao ở dòng dưới cần khoảng baseline khoảng 1.358em. Vì vậy 1.12em có thể làm phần dấu chạm nhau.

V11 chuyển sang hai span block trong một cột flex, line-height 1.35, gap 0.12em và padding dọc từng dòng 0.04em. Khoảng baseline giữa hai dòng riêng đạt tối thiểu 1.55em, để khoảng thở cho dấu. Cỡ tối đa tăng lên 96px; mobile 36–58px. Không đặt chiều cao cố định hoặc giấu phần chữ vượt khung. Dòng thứ hai tự xuống hàng khi không đủ chiều ngang. Khoảng lùi được bỏ trên mobile.

Kiểm tra hình học glyph dùng chính hai file font Latin/Vietnamese và weight đang cài. Đây là kiểm tra outline font, không phải ảnh chụp layout trong trình duyệt.

## Header

- Dải thông tin nền mực; logo hiện có, menu lớn, tìm kiếm, tài khoản và giỏ hàng có nhóm rõ ràng.
- Tìm kiếm vẫn là Next Form GET tới `/san-pham` với tham số `q`, có label thật. Input 16px trên mobile; nút tìm cao tối thiểu 48px.
- Các link danh mục lớn 15–16px, cao 48px, nằm trong dải nền mực. Tab hiện tại có điểm nhấn xanh chanh; thư viện thẻ có nút riêng.
- Tab hiện tại xác định theo pathname và tham số type, không tô cố định “Tất cả sản phẩm” khi đang xem Sealed. Nav có Suspense fallback để giữ server render/SSG của trang chủ.
- Desktop có menu chữ “Danh mục”. Tablet dùng nút icon và dải link cuộn ngang khi cần. Mobile có một hàng tìm kiếm riêng, nút menu/tài khoản/giỏ hàng 44–48px; tất cả liên kết vẫn có trong menu.
- Menu dùng dialog hiện có, thêm trạng thái aria-expanded/aria-haspopup. Link tài khoản, đếm giỏ, danh mục gốc đang hiện, module pre-order/thu mua giữ đúng dữ liệu và quyền bật/tắt hiện có.
- Style mới scope vào store-header; không thay CSS admin/POS hoặc logo/footer. Giữ class shop-header để runtime Lenis vẫn đo được chiều cao header.

## Cấu trúc

| File | Trách nhiệm |
| --- | --- |
| components/shop/header.tsx | Server render header và form tìm kiếm |
| components/shop/header.css | Header responsive, chữ, vùng bấm, focus và dải danh mục |
| components/shop/header-nav.tsx | Nav có trạng thái route, cùng fallback tĩnh |
| components/shop/header-navigation.ts | Logic khớp pathname/type, tách khỏi render |
| components/shop/menu.tsx | Nút menu có label và trạng thái mở |
| features/home/components/preorder-drop.tsx | Hai dòng tiêu đề tách rõ |
| features/home/preorder-drop.css | Khoảng dòng, dấu tiếng Việt và focus |

Tất cả file code ở trên nằm trong src/. Ảnh, giỏ hàng, dialog, auth, query dữ liệu, API, carousel V8, thư viện V9 và Lenis V10 không bị viết lại.

## Kiểm tra và giới hạn

Đã kiểm tra TypeScript/build production, SSR trang chủ và route sản phẩm. Test render xác nhận form/label, tài khoản/giỏ/menu, danh mục ẩn/con, module bật/tắt, điều hướng theo type và hai dòng tiêu đề. Test outline font xác nhận khoảng 1.55em lớn hơn khoảng cần thiết 1.358em của hai dòng đã cung cấp.

Script được kiểm tra parser, DryRun/Check không ghi dữ liệu, apply, chạy lặp, source mismatch và rollback đúng byte trên source LF cùng BOM/CRLF. Script dùng UTF-8 BOM/CRLF, cú pháp hướng tới PowerShell 5.1; runtime kiểm tra là PowerShell 7, chưa chạy trực tiếp trên Windows PowerShell 5.1.

Chưa xác nhận giao diện và thao tác đầu cuối trong trình duyệt/điện thoại thật ở phiên này. Sau áp dụng, kiểm tra ở 320px, 390px, tablet và desktop; thử zoom 125%/200%, nhập tìm kiếm, mở/đóng menu, tài khoản và giỏ hàng. Chưa đo Core Web Vitals hoặc FPS trên deployment.

## Hoàn tác

Dùng đúng backup in ra khi chạy script:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Header-Type-V11.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Header-Type-V11-THOI-DIEM" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Header-Type-V11.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Header-Type-V11-THOI-DIEM"
```

Rollback phục hồi source V10 và xóa file V11 tạo mới. Script dừng nếu một file đã sửa tiếp sau cập nhật để không ghi đè thay đổi mới.
