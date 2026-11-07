# Dark Poke · Thu mua V3

Trang thu mua mới gồm vật phẩm, liên hệ và kiểm tra trước khi gửi. Tình trạng dùng tiếng Việt, giữ các mã NM/LP/MP/HP/Seal/Grading của dữ liệu cũ. Chọn **Khác** sẽ mở mô tả bắt buộc, từ 5 đến 500 ký tự. Mỗi vật phẩm có ảnh riêng; giới hạn chung của một yêu cầu là **14 ảnh**, mỗi ảnh tối đa **2.097.152 byte (2 MB)**, định dạng JPG/PNG/WebP. Có xem lớn, xóa ảnh và chọn lại trước khi gửi.

## 1. Áp dụng code

Dừng server bằng `Ctrl+C`. Lưu script vào Downloads, chạy PowerShell trong VS Code:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Tradein-V3.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Tradein-V3.ps1"
```

Script kiểm tra tất cả file trước khi ghi, sao lưu vào `.patch-backup/Tradein-V3-...`, cập nhật dependency và chạy TypeScript. Không thay `.env.local`, không tự chạy SQL. `-Check` chỉ kiểm tra; `-Production` chạy build thay cho typecheck; `-SkipChecks`/`-SkipInstall` chỉ dùng khi chủ động bỏ bước tương ứng. Có thể truyền `-ProjectRoot` nếu chuyển thư mục dự án. Nguồn ngoài những phiên bản đã nhận diện sẽ dừng với `Source mismatch`, không ép ghi đè.

## 2. Bật lưu ảnh trên Supabase

Trong **Supabase Dashboard → SQL Editor**, mở và chạy **chỉ file migration mới**:

```text
supabase/migrations/20261105000100_tradein_photos.sql
```

Không chạy lại `all-in-one.sql`, `init` hoặc `seed` trên dữ liệu đang dùng. Migration mới bổ sung cột ảnh, phiên tải và bucket riêng tư; không xóa yêu cầu cũ. Các hàm ghi ảnh chỉ cấp quyền cho `service_role`; trình duyệt không được cấp khóa này hay quyền ghi Storage trực tiếp.

Kiểm tra `.env.local` đã có ba giá trị của đúng project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` là khóa phía server, không thêm tiền tố `NEXT_PUBLIC_`, không đưa vào Git. Đây là biến đã có trong `.env.example`, không phải khóa đưa vào component client. Cấu hình tương tự ở môi trường deploy nếu chạy trên Vercel.

```powershell
npm run dev
```

Mở `http://localhost:3000/thu-mua`. Chủ shop xem ảnh ở `/admin/thu-mua`, bấm **Xem ảnh khách gửi**. Ảnh chỉ tải khi mở, liên kết riêng tư có hiệu lực 10 phút; có nút làm mới và xem lớn. Khách không đăng nhập vẫn gửi được yêu cầu; người đã đăng nhập được gắn `user_id` từ phiên đã xác minh ở server.

Nếu chưa bật Supabase, trang chạy demo và không gửi/lưu ảnh thật. Nếu đã bật Supabase nhưng thiếu migration hoặc service role, hệ thống trả lỗi và giữ form để gửi lại, không báo thành công giả.

## 3. Kiểm tra chạy thật

Trên project Supabase của bạn, gửi một yêu cầu thử với tình trạng “Khác” và 2 ảnh, kiểm tra mô tả/ảnh trong admin. Thử thêm ảnh thứ 15 và ảnh trên 2 MB; giao diện phải từ chối. Thử mất mạng rồi gửi lại: phiên giữ nguyên nội dung sẽ tiếp tục những ảnh còn thiếu và trả lại mã đã tạo nếu mất phản hồi ở bước cuối.

Không sửa nội dung rồi gửi lại khi chưa kiểm tra mã yêu cầu vừa tạo: chỉnh nội dung sẽ bắt đầu phiên gửi mới. Tải lại trang sẽ làm mất lựa chọn File theo cơ chế của trình duyệt; ảnh chưa gửi không được lưu vào localStorage.

Cron có sẵn `/api/cron/cancel-expired` tiếp tục hủy đơn theo logic cũ và dọn tối đa 30 phiên tải bỏ dở mỗi lần chạy. Chỉ dọn phiên hết hạn thêm ít nhất một giờ; không xóa ảnh đã gắn vào yêu cầu hoàn tất. Phiên hoàn tất được bỏ dữ liệu tạm và dọn bản ghi sau một ngày. Đảm bảo `CRON_SECRET` và cron hiện có hoạt động. Với lượng phiên bỏ dở lớn hơn một batch/ngày, lên lịch cron thường xuyên hơn hoặc gọi endpoint được xác thực nhiều batch; không có vòng lặp dọn không giới hạn trong request của khách.

## 4. Cấu trúc đã tách

| Vị trí | Trách nhiệm |
| --- | --- |
| `src/app/(shop)/thu-mua/page.tsx` | Server Component, metadata, kiểm tra bật module và đọc cấu hình |
| `src/components/shop/tradein-form.tsx` | Điểm vào tương thích, không chứa nghiệp vụ |
| `src/features/tradein/domain.ts` | Schema Zod, nhãn tình trạng và giới hạn dùng chung |
| `components/` | Chỉ giao diện, field và gallery |
| `hooks/use-tradein-form.ts` | Form, validation, tiến trình và gửi lại |
| `hooks/use-tradein-photos.ts` | File và vòng đời Object URL cho ảnh xem trước |
| `client-upload.ts` | Tính hash và tải tối đa hai ảnh đồng thời |
| `animation/use-tradein-motion.ts` | Lifecycle React, nạp động animation |
| `animation/controller.ts` | GSAP ScrollTrigger và Lenis, không chứa form hay API |
| `server/` và `/api/tradein/photos` | Xác minh phiên, kiểm tra ảnh, lưu dữ liệu và dọn tệp bỏ dở |

GSAP 3.15.1 và Lenis 1.3.27 chỉ được nạp động ở trang thu mua. Animation gồm trình tự giới thiệu, xuất hiện từng phần và đường tiến trình theo cuộn; không pin/kéo form hoặc làm trễ nhập liệu. Lenis làm mượt con lăn trên thiết bị con trỏ chính xác; cảm ứng dùng cuộn native. Giảm chuyển động sẽ tắt cả animation và smooth scroll. Module tự hủy RAF, observer, instance và ScrollTrigger khi rời trang. Không gọi `killAll` hay thay cấu hình ticker toàn website.

## 5. Phạm vi kiểm thử

Đã kiểm tra TypeScript, Next.js production build, render 16 URL; kiểm tra schema, route tải ảnh với Storage giả lập và migration thực thi trong PostgreSQL WASM/PGlite. Các ca gồm 14/15 ảnh, đúng/vượt 2 MB, stream quá lớn, MIME/hash, token/phiên hết hạn, gửi lặp không tạo trùng, rate limit, RLS và dữ liệu cũ. Chưa chạy trên Supabase production của bạn.

Kiểm tra trình duyệt dùng HTML/JS production để xem responsive, chọn “Khác” và nhập mô tả. Hộp chọn file trong môi trường trình duyệt kiểm thử bị timeout; upload end-to-end bằng trình duyệt chưa được xác nhận. Kiểm thử route và SQL được thực hiện riêng. Cần hoàn thành bước kiểm tra chạy thật ở trên sau khi cấu hình.

Script dùng cú pháp Windows PowerShell 5.1 và UTF-8 BOM; kiểm tra parser và vòng đời bản vá bằng PowerShell 7, chưa chạy trên Windows 5.1 hoặc máy điện thoại thật.

## 6. Khôi phục code

Dùng đúng đường dẫn Backup script đã in, thay `THOI-DIEM`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Tradein-V3.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Tradein-V3-THOI-DIEM" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Tradein-V3.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Tradein-V3-THOI-DIEM"
```

Rollback bảo vệ các file đã sửa sau bản vá. Phần SQL bổ sung và ảnh thật được giữ nguyên khi khôi phục code để tránh mất dữ liệu khách.

Tham khảo triển khai: [GSAP matchMedia](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/), [Lenis](https://github.com/darkroomengineering/lenis), [Supabase Storage private buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals).
