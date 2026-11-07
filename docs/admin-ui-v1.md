# Dark Poke · Cập nhật quản trị V1

Bản cập nhật dành cho dự án đang có tại `D:\freetime\dark-poke`. Không khởi tạo lại dự án.

## Áp dụng từ file tải về

Dừng `npm run dev` bằng Ctrl+C, sau đó chạy:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Admin-UIUX-V1.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Admin-UIUX-V1.ps1"
```

Script tự sao lưu các file được thay đổi, cập nhật thư viện và kiểm tra TypeScript. `-DryRun` và `-Check` chỉ đọc, không tạo file, không cài thư viện và không gọi Supabase. Script không sửa `.env.local`, không xóa dữ liệu và không chạy SQL tự động.

## Supabase hiện có: chạy một file bổ sung

Mở Supabase → SQL Editor và chạy **chỉ** file:

`supabase/migrations/20261104000300_admin_experience.sql`

Không chạy lại `all-in-one.sql`, migration khởi tạo hoặc seed trên database đã có dữ liệu. Migration mới thêm index, tìm kiếm bỏ dấu, tổng hợp số lượng ở Postgres, view tồn kho theo ngưỡng của từng sản phẩm và publication Realtime. Các view/hàm mới dùng `security_invoker`, kiểm tra nhân viên và giữ các RLS sẵn có. Script PowerShell không kết nối hay thay đổi database.

Sau đó:

```powershell
npm run dev
```

Mở `http://localhost:3000/admin` và `http://localhost:3000/pos`.

## Kiểm tra và khôi phục

```powershell
# Kiểm tra bản vá đã được áp dụng hay chưa, không ghi file
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Admin-UIUX-V1.ps1" -Check

# Áp dụng và kiểm tra thêm bản production (không tự chạy server)
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Admin-UIUX-V1.ps1" -Production

# Dùng đúng thư mục backup mà script in ra
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Admin-UIUX-V1.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Admin-UIUX-V1-THOI-GIAN"
```

Rollback phục hồi file code và package lock cũ, rồi cập nhật thư viện tương ứng. Nếu bạn đã sửa tiếp một file sau bản vá, rollback sẽ dừng trước khi ghi để tránh mất phần sửa mới. SQL bổ sung không bị rollback tự động. Các index/view/hàm bổ sung có thể giữ lại khi quay về UI cũ.

Nếu source khác bản Repomix đã gửi, script liệt kê đúng file không khớp và dừng trước khi ghi. Không có tham số ép ghi đè. CRLF/LF, UTF-8 BOM và số dòng trống cuối file không gây báo sai.

## Những thay đổi chính

- Admin có một cột nội dung chính; sidebar desktop, drawer tablet và thanh điều hướng điện thoại, hỗ trợ safe-area và chiều rộng từ 320px.
- Thống nhất token xanh `#1b4fe0`, bảng, form, trạng thái, nút và khoảng cách. Trang khách giữ bố cục/nghiệp vụ cũ.
- Sản phẩm dùng TanStack Table v8, lọc/sắp xếp/phân trang ở server, tối đa 20 dòng. Chọn nhiều dòng áp dụng cho trang hiện tại. Đổi trạng thái có phản hồi optimistic, tự trở lại khi server từ chối; xuất CSV chỉ cho các dòng đã chọn.
- Đơn hàng giữ bộ lọc tìm kiếm/kênh/trạng thái; đếm các tab bằng một RPC tổng hợp. Danh sách không đưa token truy cập đơn hàng sang client.
- Pre-order lọc tại database trước khi phân trang; có phân trang riêng cho sản phẩm và đơn. Thu mua và khách hàng được phân trang.
- Form sản phẩm và cài đặt dùng React Hook Form + Zod. Schema được dùng lại trên server. Form động vẫn theo định nghĩa thuộc tính, SKU, biến thể và kho hiện có.
- Cài đặt theo từng nhóm; thanh lưu form sản phẩm/loại ở vùng dễ chạm và tránh thanh tab điện thoại.
- Hộp thoại/menu dùng Radix theo cách tổ chức component cục bộ của shadcn/ui, hỗ trợ focus, Escape và bàn phím.
- Dashboard có biểu đồ doanh thu một thang đo, tooltip bằng chuột/bàn phím và bảng số liệu. Doanh thu giữ định nghĩa cũ: tổng giá trị đơn đã thanh toán theo ngày tạo đơn, không phải sổ thu tiền theo ngày ngân hàng nhận tiền.
- Realtime chỉ được đăng ký trong admin/POS. Admin thông báo có thay đổi để người dùng tự cập nhật, tránh làm mất dữ liệu form. POS theo dõi thay đổi tồn biến thể; máy chủ vẫn kiểm tra tồn trước khi chốt đơn.
- Camera được tải khi mở, dùng BarcodeDetector khi trình duyệt hỗ trợ; có thông báo chuyển sang nhập SKU/máy quét nếu không hỗ trợ hoặc từ chối quyền.
- Font tự host qua next/font/local, giữ cả Latin và tiếng Việt. Không cần gọi Google Fonts khi build. Ảnh AVIF/WebP và cơ chế tải danh mục cuộn vô hạn sẵn có được giữ.

## PWA và mạng yếu

Manifest dùng icon hiện có. Service worker chỉ đăng ký ở bản production, cache một trang hướng dẫn khi mất mạng, không cache HTML admin, API, token, đơn hàng hoặc dữ liệu thanh toán. Khi kết nối đứt, giữ tab đang mở để giữ form/giỏ trong bộ nhớ và kết nối lại để lưu. Không tạo hàng đợi thanh toán offline; reload/đóng tab có thể mất nội dung chưa lưu.

HTTPS hoặc localhost là điều kiện để dùng service worker/camera. BarcodeDetector tùy trình duyệt; nhập SKU và máy quét dạng bàn phím luôn là phương án dự phòng. Chưa kiểm thử camera vật lý/iPhone/Android trong môi trường này.

## Kiểu dữ liệu và hiệu năng

`src/lib/database.types.ts` được sinh từ các migration đã cung cấp, chưa lấy từ database production của bạn. Các Supabase client đã gắn generic Database. Sau khi thay đổi schema trên Supabase, dùng `scripts/update-db-types.ps1 -ProjectId ...` để tạo lại bằng CLI chính thức và chạy TypeScript.

Đo bundle:

```powershell
$env:ANALYZE = "true"
npm run build -- --webpack
Remove-Item Env:ANALYZE
```

Vercel Analytics và Speed Insights chỉ hoạt động khi đặt `NEXT_PUBLIC_ENABLE_ANALYTICS=true` trong môi trường rồi build lại. Mặc định không gửi telemetry ứng dụng. LCP <2,5 giây và CLS gần 0 là mục tiêu cần đo trên hosting thật, không phải kết quả đã được xác nhận bằng database/thiết bị của bạn.

## Tham chiếu thiết kế

Đã đọc repository https://github.com/JimLiu/baoyu-design và các hướng dẫn liên quan về phân cấp thông tin, nhịp khoảng cách, biểu đồ, tương tác và accessibility. Áp dụng vào component Next.js thực tế; không cài thêm editor canvas hoặc thay stack của dự án.

Các logo PNG không có trong Repomix nhưng đã có ở dự án gốc được giữ nguyên. Nếu không tải được logo ở admin, giao diện dùng tên chữ Dark Poke để vẫn vận hành được.

## Phạm vi kiểm chứng

- TypeScript và build production Next.js đã chạy thành công; chế độ phân tích Webpack cũng tạo báo cáo thành công.
- Đã render phía server 22 URL quản trị/POS ở chế độ demo, gồm danh sách, chi tiết, tạo mới và các nhóm cài đặt/danh mục. Đây là kiểm tra render, không thay thế kiểm thử tương tác trên trình duyệt.
- Đã kiểm tra phân trang, giới hạn dữ liệu, tìm kiếm mã đơn, không đưa access token vào dòng danh sách, lọc pre-order trước phân trang và bảo vệ công thức khi xuất CSV.
- SQL mới đã được phân tích cú pháp PostgreSQL và PL/pgSQL; chưa thực thi trên Supabase thật của bạn.
- File cập nhật được kiểm tra cú pháp và chạy vòng đời thực bằng PowerShell 7.6.9 trên Linux, với npm install và TypeScript thật: DryRun/Check không ghi file, áp dụng, chạy lại không trùng, dừng khi source khác và rollback có bảo vệ phần sửa mới. Script dùng cú pháp tương thích Windows PowerShell 5.1, nhưng chưa chạy trực tiếp trên Windows 5.1.
- Môi trường preview truyền tham số không tương thích Next.js, nên chưa kiểm thử giao diện tương tác bằng trình duyệt hoặc thiết bị thật; chưa đo Core Web Vitals trên hosting thật.
