# Dark Poke · giao diện khách V2

Bản cập nhật thiết kế lại trang chủ, danh mục, tìm kiếm/bộ lọc, chi tiết sản phẩm, giỏ hàng, đặt hàng, thanh toán VietQR, tài khoản, đăng nhập Google, pre-order và thu mua. Màu chủ đạo `#1b4fe0`, nền trắng, chữ rõ và ảnh sản phẩm có khung cố định. Bố cục thích ứng từ 320px, tablet đến desktop.

Thiết kế tham khảo phương pháp trong [baoyu-design](https://github.com/JimLiu/baoyu-design): xác lập thứ bậc nội dung, hệ thống màu/khoảng cách thống nhất, kiểm tra trạng thái và sử dụng trên màn hình nhỏ. Giao diện được triển khai bằng component Next.js và CSS/Tailwind hiện có.

## Chạy bản cập nhật

Lưu `Dark-Poke-Client-UIUX-V2.ps1` vào `C:\Users\Bin77\Downloads`. Trong VS Code, dừng server đang chạy bằng `Ctrl+C`, rồi mở PowerShell:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Client-UIUX-V2.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Client-UIUX-V2.ps1"
npm run dev
```

Mở `http://localhost:3000`. Nếu trình duyệt vẫn giữ giao diện cũ, tải lại bằng `Ctrl+F5`.

`-DryRun` kiểm tra nguồn và liệt kê file sẽ đổi, không ghi file/cài gói. `-Check` kiểm tra thêm Node/npm và tình trạng thư mục dependencies, vẫn không ghi dữ liệu. Lần áp dụng tạo sao lưu trong `.patch-backup/Client-UIUX-V2-...`, cập nhật file rồi chạy TypeScript. Chỉ cài dependencies khi thiếu Next.js trong `node_modules`; không thêm thư viện mới. Chạy lại khi đã áp dụng sẽ không ghi lại hoặc tạo thêm sao lưu.

Muốn kiểm tra bản production:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Client-UIUX-V2.ps1" -Production
npm run start
```

Với thư mục khác, truyền `-ProjectRoot "D:\duong-dan\dark-poke"`. `-SkipInstall` và `-SkipChecks` chỉ dùng khi chủ động bỏ qua bước tương ứng; không coi bản cập nhật đã kiểm thử khi bỏ qua kiểm tra.

## Sao lưu và khôi phục

Script kiểm tra tất cả file đích trước khi ghi. Nếu báo `Source mismatch`, mã nguồn hiện tại đã khác snapshot đã cung cấp: giữ nguyên file và gửi nguồn mới của các file được liệt kê để tạo bản vá tương thích. Không có chế độ ghi đè ép buộc.

Dùng chính xác đường dẫn `Backup` script đã in, thay phần `THOI-DIEM` trong ví dụ:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Client-UIUX-V2.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Client-UIUX-V2-THOI-DIEM" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Client-UIUX-V2.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Client-UIUX-V2-THOI-DIEM"
```

Khôi phục dừng trước khi ghi nếu file đã được sửa sau bản vá. Các dependency đã cài vẫn được giữ trong `node_modules`.

## Hành vi và hiệu năng

- Giữ nguyên Server Actions, đăng nhập, cách tính tiền/tồn kho phía server, quyền truy cập đơn bằng token, Supabase và RLS. Không có migration SQL; không cần chạy lại init/seed. Bản này không sửa admin/POS và không yêu cầu đã cài Admin V1.
- Trang chủ vẫn là Server Component/ISR, chỉ đọc các nhóm sản phẩm có giới hạn. Danh mục giữ TanStack Query, cursor từng trang, IntersectionObserver, skeleton và nút tải thêm dự phòng. Không tải toàn bộ danh sách lên trình duyệt.
- Ảnh giữ helper `ProductImage`/`next/image` đã có, khung vuông và `sizes`; ưu tiên ảnh đầu trang. Logo dùng file hiện tại nếu tồn tại, có chữ dự phòng. Ảnh ngoài vẫn tuân theo cấu hình domain hiện có.
- CSS chỉ trong route khách; chuyển động dùng opacity/transform và tôn trọng giảm chuyển động. Không thêm thư viện animation hoặc UI.
- Mobile có menu, tìm kiếm và thanh điều hướng dưới; trang sản phẩm có thanh mua riêng. Modal hỗ trợ Escape, focus và chặn cuộn nền. Cỡ chữ nhập liệu trên mobile giúp tránh tự phóng to khi nhập trên iOS.
- Khi thêm hàng có sẵn vào giỏ pre-order hoặc ngược lại, giao diện hỏi trước khi thay giỏ theo quy tắc hiện có. Cọc được server tính theo từng sản phẩm; hiển thị chính xác cùng QR sau khi tạo đơn.
- Khi lỗi mạng ở bước tạo đơn, giỏ được giữ. Kiểm tra đơn đã tạo trước khi thử lại, vì server có thể đã xử lý yêu cầu.

## Phạm vi kiểm tra

Đã chạy TypeScript, Next.js production build và render phía server cho 16 URL gồm các trang khách, tìm kiếm/lọc, đơn hàng demo, admin/POS. Đã kiểm tra trực quan bằng trình duyệt trên HTML production ở các chiều rộng 320/390/768/1280px; kiểm tra menu/bộ lọc, Escape, thêm giỏ, số lượng và lỗi nhập liệu.

Kiểm tra trình duyệt dùng dữ liệu demo và bản render tĩnh: không thực hiện giao dịch, webhook, gửi yêu cầu thu mua hoặc đăng nhập Google thật. Cần kiểm tra các luồng này với Supabase/nhà cung cấp đã cấu hình tại máy bạn. Không khẳng định chỉ số Core Web Vitals thực tế khi chưa đo trên deployment.

Script dùng cú pháp tương thích Windows PowerShell 5.1, UTF-8 BOM. Kiểm tra parser và vòng đời DryRun/áp dụng/lặp lại/khôi phục được chạy bằng PowerShell 7 trong môi trường kiểm thử; chưa chạy trực tiếp trên Windows PowerShell 5.1 hoặc thiết bị iOS/Android thật.
