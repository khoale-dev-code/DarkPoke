# Thư viện thẻ · Tự tải khi cuộn V5

Bản V5 cập nhật trên TCGdex V4 đã cài. Trang `/thu-vien-the` không còn nút Trang trước/Trang sau hoặc số trang. 24 thẻ đầu được render ở server; khi cuộn gần cuối, các thẻ tiếp theo tự nối vào danh sách. Header gọn hơn, card dễ đọc và bộ lọc có thể mở/thu trên điện thoại.

## Áp dụng trên Windows

Dừng server bằng `Ctrl+C`, lưu script vào Downloads và chạy:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-TCGdex-Infinite-V5.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-TCGdex-Infinite-V5.ps1"
npm run dev
```

Mở `http://localhost:3000/thu-vien-the`. Có thể dùng `-Check` để kiểm tra môi trường hoặc `-Production` để chạy build thay cho TypeScript. Script giữ nguyên package JSON và các dependency, không thêm thư viện mới. Chỉ chạy npm install nếu dependency hiện có bị thiếu. Không cần SQL hoặc API key.

## Sử dụng

- Cuộn gần cuối để tự tải thêm từng nhóm 24 thẻ. Thẻ cũ được giữ nguyên, không chuyển trang hoặc đưa về đầu trang.
- Tìm theo tên/mã, ngôn ngữ, bộ thẻ và thứ tự sắp xếp. Đổi bộ lọc bắt đầu một danh sách riêng, tránh ghép thẻ từ các kết quả khác nhau.
- Số thẻ đã hiển thị cập nhật khi có thêm dữ liệu; đây không phải tổng số thẻ của API.
- Có skeleton trong khi tải; lỗi phần tiếp theo vẫn giữ danh sách cũ và hiện nút Thử tải lại. Khi trình duyệt báo offline, yêu cầu đang chờ có thể tiếp tục sau khi kết nối lại.
- Tạm dừng tải thêm để xem chân trang; bấm Tiếp tục khám phá khi muốn cuộn tiếp. Chế độ tự tải được bật mặc định.
- Trình duyệt không có IntersectionObserver có nút tải thêm dự phòng, không có nút chuyển trang.
- Các URL V4 có `page=2` trở lên chuyển về cùng thư viện liên tục, giữ từ khóa và bộ lọc. Không bắt đầu giữa danh sách rồi bỏ mất các thẻ trước đó.

## Cấu trúc và giới hạn tải

| File | Trách nhiệm |
| --- | --- |
| `components/library-list.tsx` | Server Component lấy nhóm đầu và danh sách bộ thẻ |
| `components/card-grid.tsx` | Hiển thị danh sách, skeleton, thông báo và nút hỗ trợ |
| `hooks/use-infinite-library.ts` | TanStack Query, IntersectionObserver và trạng thái tự tải |
| `infinite.ts` | Gọi API cùng origin, kiểm tra nhóm dữ liệu, xác định nhóm kế và gộp ID duy nhất |
| `src/app/api/card-library/route.ts` | Endpoint GET công khai, đọc dữ liệu qua SDK/cache phía server |

Không tải toàn bộ kho thẻ về máy. Query server vẫn giới hạn 24 thẻ + một bản ghi nhìn trước theo V4. Cache server giữ nguyên; API thành công có cache chia sẻ 10 phút, API lỗi trả 503 và no-store. SDK/kiểm tra schema của nguồn vẫn chỉ chạy ở server.

TanStack Query dùng dữ liệu render sẵn để không gọi lại nhóm đầu khi hydrate. Cache client tách theo từ khóa, cách tìm, ngôn ngữ, bộ thẻ và sắp xếp; dữ liệu được giữ 15 phút kể từ khi không còn sử dụng. Quay lại thư viện trong cùng phiên có thể dùng lại các nhóm đã tải. Không lưu danh sách vào localStorage/Supabase. Tải lại toàn bộ trình duyệt bắt đầu lại từ nhóm đầu.

IntersectionObserver nhìn trước 600px, không đăng ký listener cuộn chạy liên tục. Yêu cầu đang tải dùng `cancelRefetch: false` để tránh gọi trùng khi cuộn nhanh. Ngừng tự gọi khi lỗi, offline, hết dữ liệu hoặc tạm dừng. Mỗi ID chỉ có một card trong danh sách. AbortSignal đi theo request để hủy yêu cầu khi truy vấn không còn được dùng. Ảnh WebP giữ nguyên cách tải trực tiếp từ TCGdex của V4, có lazy load, tỷ lệ cố định và placeholder khi lỗi.

Giao diện grid 2 cột trên điện thoại, 3–4 trên tablet/laptop và 5 trên desktop rộng. Input điện thoại 16px; điều khiển có vùng bấm tối thiểu 44px, trạng thái tải đọc được bằng trình đọc màn hình, hỗ trợ giảm chuyển động. Dữ liệu nguồn là dữ liệu bên ngoài; ảnh hoặc thông tin có thể thiếu.

## Kiểm tra

Đã kiểm tra TypeScript, build production, API JSON thật theo các nhóm 24 thẻ, lọc và render server. Kiểm tra tự động bằng QueryClient/InfiniteQueryObserver thực và mô phỏng viewport: 24 → 48 → 50 thẻ, không trùng/không bỏ sót, cuộn nhanh không tạo request trùng, lỗi giữ thẻ cũ, tải lại, offline/online, hủy bằng signal, tạm dừng/hết dữ liệu và trình duyệt không hỗ trợ observer.

Preview của môi trường thử truyền cờ Vite vào lệnh Next dev nên không khởi động được; thao tác cuộn và kích thước thực trong trình duyệt chưa được xác nhận ở đây. API và SSR được thử độc lập. Không thay cấu hình dự án để xử lý hạn chế preview này. Cần kiểm tra thực tế trên điện thoại và desktop sau khi áp dụng. Chưa đo Core Web Vitals trên deployment.

Script có UTF-8 BOM/CRLF và dùng cú pháp Windows PowerShell 5.1. Parser, DryRun, kiểm tra source, áp dụng, chạy lại và rollback được thử bằng PowerShell 7; chưa chạy trực tiếp trên Windows 5.1.

## Backup và hoàn tác

Script kiểm tra toàn bộ file cần sửa trước khi ghi. Các module SDK/domain phụ thuộc cũng được kiểm tra để không ghép với source chưa biết. Source khác V4 sẽ dừng và in tên file; không có chế độ ghi đè cưỡng bức. Backup nằm trong `.patch-backup/TCGdex-Infinite-V5-...`.

Dùng đúng đường dẫn Backup script in ra:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-TCGdex-Infinite-V5.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\TCGdex-Infinite-V5-THOI-DIEM" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-TCGdex-Infinite-V5.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\TCGdex-Infinite-V5-THOI-DIEM"
```

Rollback dừng nếu file đã được sửa sau khi cập nhật. Các chức năng sản phẩm, thu mua, tài khoản và admin không bị thay đổi bởi bản vá này.
