# Audit codebase cho thay đổi Thu mua V3

Audit dựa trên snapshot nguồn đã cung cấp cùng Admin V1, Client V2 và bản sửa key V2.1. Đây là rà soát theo luồng thu mua và những điểm tích hợp liên quan, không phải xác nhận bảo mật/hiệu năng của toàn bộ deployment hoặc database thật.

| Điểm trước đây | Thay đổi trong V3 |
| --- | --- |
| Một component đồng thời quản lý render, form và submit | Chia feature theo domain, hooks, transport, server, view và animation |
| Các trạng thái chỉ hiện viết tắt; condition tối đa 20 ký tự | Nhãn tiếng Việt, mã cũ giữ nguyên; “Khác” có `condition_note` riêng, dùng schema chung |
| Form dùng key chỉ số khi xóa dòng | FieldArray ID ổn định; ảnh gắn với `client_id` của vật phẩm |
| Chưa có ảnh trong yêu cầu | Mỗi món có ảnh, lưu metadata trong `tradein_requests.photos`, Storage riêng tư |
| Gửi nhiều ảnh qua Server Action dễ vượt giới hạn body | Action chỉ nhận metadata; route riêng mỗi request một ảnh, tối đa hai request song song |
| Chưa có giới hạn ảnh ở server/Storage | Giới hạn 14 ở schema, manifest và SQL; 2 MB ở file/body stream, manifest và bucket |
| Nguy cơ retry tạo yêu cầu trùng | Khóa hàng khi hoàn tất phiên, trả lại mã cũ khi gửi lại cùng phiên |
| File giả tên hoặc payload vượt body | Kiểm MIME, magic bytes, SHA-256 và đọc stream có giới hạn trước khi parse multipart |
| Ảnh của khách có thể thành URL public nếu tái dùng bucket sản phẩm | Bucket riêng, không có policy public ghi/xem; staff được cấp URL ký ngắn hạn |
| File bị bỏ dở gây rác lưu trữ | Phiên có hạn và batch cleanup trong cron đã có |
| Thêm animation có thể làm nặng mọi trang hoặc giữ RAF sau chuyển trang | Dynamic import trong feature, scope phần tử, cleanup đầy đủ, reduced motion và native touch |

Không thay cơ chế thanh toán, sản phẩm, POS hoặc phân quyền nghiệp vụ. Admin thu mua chỉ được thêm nhãn tình trạng, mô tả và xem ảnh; trạng thái/báo giá hiện tại giữ nguyên. Các client Supabase liên quan dùng kiểu schema nếu nguồn cũ chưa có, không dùng `any` cho model upload.

## Việc còn phụ thuộc môi trường thật

- Kiểm tra Supabase migration và Storage với tài khoản nhân viên/khách thật; PGlite dùng schema thay thế cho auth/storage để kiểm tra SQL/RLS, không thay thế dịch vụ Supabase.
- Đo bundle và Core Web Vitals trên deployment; đã tách tải animation theo route nhưng chưa có số đo LCP/CLS thực tế.
- Rate limit 15 phiên/giờ theo fingerprint mạng được lưu trong PostgreSQL. Header IP cần được reverse proxy/deployment thiết lập tin cậy; lớp này không thay thế chống bot/rate limit tại edge khi mở công khai.
- Server nhận JPG/PNG/WebP theo MIME, magic bytes và hash; không làm nhận diện nội dung vật phẩm hay xác thực ảnh do khách sở hữu. Không nhận SVG/HEIC/video. Người dùng cần xuất HEIC thành JPG hoặc giảm dung lượng trước khi chọn nếu ảnh lớn.
- Giới hạn toàn bộ yêu cầu là 14 ảnh, không phải 14 ảnh cho mỗi vật phẩm. Form tối đa 50 vật phẩm như luồng cũ.
- Phần kiểm tra Supabase, webhook và thao tác ngân hàng ngoài phạm vi thay đổi này không được coi là đã kiểm thử lại.
