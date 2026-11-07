# Thư viện thẻ Pokémon · TCGdex V4

Trang `/thu-vien-the` hiển thị dữ liệu Pokémon TCG từ TCGdex, có tìm theo tên hoặc mã đầy đủ, lọc bộ thẻ, chọn ngôn ngữ, sắp xếp và phân trang 24 thẻ. Chi tiết có ảnh lớn, bộ thẻ, HP, độ hiếm, họa sĩ, khả năng và chiêu thức khi nguồn có dữ liệu. Điều hướng có liên kết ở header, menu điện thoại và footer.

Đây là dữ liệu tra cứu từ TCGdex. Hàng bán tại shop, giá bán và tồn kho vẫn nằm trong danh mục sản phẩm hiện có. Nút tìm sản phẩm cùng tên chỉ mở tìm kiếm của shop, không tự tạo sản phẩm hoặc khẳng định còn hàng.

## Chạy bản cập nhật

Dừng server bằng `Ctrl+C`. Lưu script vào Downloads, chạy trong PowerShell:

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-TCGdex-V4.ps1" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-TCGdex-V4.ps1"
npm run dev
```

Mở `http://localhost:3000/thu-vien-the`. Ví dụ tìm Furret bằng mã `swsh3-136`, ngôn ngữ Tiếng Anh.

Script thêm dependency `@tcgdex/sdk` bản **2.9.0**, giữ các dependency khác của dự án. Không cần API key, SQL hoặc thay cấu hình Supabase cho tính năng này. Server cần truy cập API TCGdex, trình duyệt cần truy cập CDN ảnh của họ. Ảnh WebP đã có hai kích thước từ TCGdex nên dùng `next/image unoptimized` để tải trực tiếp từ CDN, giữ khung cố định/lazy load và tránh xử lý ảnh thêm một lần ở server. Không cần sửa next.config cho ảnh thư viện.

Nguồn giao diện khách cần có Client V2; bản sửa key V2.1 và Thu mua V3 không phải điều kiện bắt buộc. Script giữ nguyên cấu hình Next.js đang có. Package JSON được cập nhật riêng dependency SDK để giữ các gói bạn đã thêm. Nếu file header/footer nằm ngoài phiên bản giao diện nhận diện, script dừng trước khi ghi và liệt kê file khác nguồn.

`-DryRun` không ghi file/cài gói; `-Check` kiểm tra thêm Node/npm và dependency. Áp dụng mặc định có backup, npm install khi cần và TypeScript. `-Production` chạy build. `-SkipInstall`/`-SkipChecks` chỉ dùng khi chủ động bỏ bước đó. Có thể dùng `-ProjectRoot` nếu chuyển thư mục.

## Tổ chức và hiệu năng

| Thành phần | Trách nhiệm |
| --- | --- |
| `src/features/card-library/domain.ts` | Kiểu dữ liệu, chuẩn hóa query, ngôn ngữ và đường dẫn an toàn; không nạp SDK vào client |
| `server/sdk.ts` | SDK TCGdex chạy phía server, giới hạn thời gian HTTP 8 giây/lần gọi |
| `server/schema.ts` | Zod kiểm tra dữ liệu bên ngoài, chỉ ở server |
| `server/data.ts` | Truy vấn SDK, cache và chuyển model thành object thuần |
| `components/` | Bộ lọc, danh sách, ảnh, chi tiết và trạng thái lỗi |
| `src/app/(shop)/thu-vien-the` | Routes App Router, metadata, loading và trang không tìm thấy |

- Dùng `TCGdex.card.list(Query)` có phân trang, `TCGdex.set.list(Query)` và `TCGdex.card.get(id)`, không gọi tải toàn bộ card.
- Mỗi trang truy vấn tối đa 24 bản ghi và 1 bản ghi nhìn trước để biết chính xác có trang sau; bản ghi nhìn trước không bị bỏ qua khi chuyển trang.
- Cache danh sách 10 phút, chi tiết 1 giờ, bộ thẻ 1 ngày. Mỗi ngôn ngữ/bộ lọc/trang có khóa riêng. Lỗi HTTP 429/5xx được giữ là lỗi thay vì báo “không có thẻ”.
- Dropdown lấy tối đa 500 bộ thẻ theo ngày phát hành. Đã quan sát 220 bộ trong lần kiểm tra tiếng Anh; đây không phải số lượng cam kết cố định của API. Các ngôn ngữ có thể khác nhau về độ đầy đủ dữ liệu.
- Model SDK có liên kết nội bộ được chuyển thành object thuần trước khi cache/render, tránh tham chiếu vòng hoặc gửi class sang React Client Component.
- Grid dùng WebP `low` 245×337, chi tiết dùng `high` 600×825 qua `next/image unoptimized`, kích thước cố định. Thiếu ảnh hoặc lỗi ảnh có placeholder. Link thẻ không tự prefetch toàn bộ chi tiết, tránh tạo hàng chục request API khi chỉ xem grid.
- Giao diện tiếng Việt; tên thẻ và mô tả theo ngôn ngữ nguồn. Đổi ngôn ngữ bỏ bộ thẻ đã chọn vì mã bộ có thể khác nhau. Quay lại từ chi tiết giữ query ban đầu.
- Không thêm bộ animation/SDK vào JavaScript ban đầu của các trang khách khác. Hiệu ứng CSS tôn trọng giảm chuyển động; form điện thoại dùng chữ nhập 16px và nút tối thiểu 44px.
- Trang tra cứu được đặt `noindex` để hạn chế công cụ tìm kiếm quét hàng nghìn tổ hợp truy vấn dữ liệu bên ngoài.

## Nguồn và tình huống dữ liệu thiếu

SDK và dữ liệu: [tcgdex/javascript-sdk](https://github.com/tcgdex/javascript-sdk), [TypeScript SDK](https://tcgdex.dev/sdks/typescript), [filter/sort/pagination](https://tcgdex.dev/rest/filtering-sorting-pagination), [TCGdex](https://www.tcgdex.net).

API có thể trả thẻ trong danh sách nhưng chưa có ảnh hoặc chi tiết ở một ngôn ngữ. Trang hiển thị trạng thái tương ứng, không thay bằng dữ liệu sản phẩm demo hay đoán thông tin. Không tự dịch nội dung thẻ, nhập kho hoặc lưu hàng chục nghìn thẻ vào Supabase.

## Kiểm tra và giới hạn

Đã gọi SDK/API thật cho danh sách, bộ thẻ, tìm Pikachu và chi tiết Furret; kiểm tra build production, TypeScript, query/URL, phân trang, model/DTO, HTTP 429/503 và không tìm thấy. Đã kiểm tra render server của các URL mới. API JSON trả dữ liệu thật nhưng CDN `assets.tcgdex.net` bị lỗi DNS/timeout từ môi trường kiểm thử, nên chưa xác nhận tải ảnh thực tế tại đây. Mã dùng đúng URL WebP theo tài liệu TCGdex, có placeholder khi ảnh lỗi. Chưa xác nhận thao tác trình duyệt đầu cuối trên mọi thiết bị; cần mở route trên máy bạn để kiểm tra thực tế. Chưa đo Core Web Vitals trên deployment.

Script dùng cú pháp Windows PowerShell 5.1, UTF-8 BOM. Parser và vòng đời backup/DryRun/áp dụng/chạy lại/rollback được kiểm tra bằng PowerShell 7 trong môi trường thử, chưa chạy trực tiếp trên Windows 5.1.

## Khôi phục

Dùng đúng BackupPath script đã in:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-TCGdex-V4.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\TCGdex-V4-THOI-DIEM" -DryRun
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-TCGdex-V4.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\TCGdex-V4-THOI-DIEM"
```

Rollback dừng nếu file đã được sửa sau bản vá. Các gói đã cài trong node_modules có thể vẫn còn; package JSON và lock được khôi phục từ bản sao lưu. Không có thao tác database trong bản cập nhật này.
