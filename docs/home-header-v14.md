# Dark Poke — Header, Trang chủ, Footer, Tìm kiếm & Thư viện thẻ V14.33

Bản vá thay header và trang chủ. Thanh tiện ích trên cùng ("HUNT · TRADE · COLLECT / Giao hàng toàn quốc…") được bỏ hẳn. Header mới gọn một hàng, trong suốt khi nằm trên ảnh hero của trang chủ và chuyển sang nền kính mờ khi cuộn. Hai banner mới (30th Celebration ETB, Perfect Order ETB) đã được tối ưu thành WebP và đóng gói ngay trong file PowerShell.

## Chạy trên Windows PowerShell

Tải `Dark-Poke-Header-Home-V14-33.ps1` vào `C:\Users\Bin77\Downloads`. Dừng server bằng Ctrl+C trước khi áp dụng.

```powershell
cd "D:\freetime\dark-poke"
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Header-Home-V14-33.ps1" -DryRun
if ($LASTEXITCODE -ne 0) { throw "DryRun chua dat; dung tai day." }
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Header-Home-V14-33.ps1"
if ($LASTEXITCODE -ne 0) { throw "Ban va chua thanh cong; xem loi phia tren." }
npm run dev
```

- `-DryRun`: liệt kê file sẽ sửa/tạo, không ghi gì.
- `-Check`: kiểm tra Node.js, npm, `node_modules`, package cần dùng và trạng thái source, không ghi gì.
- `-Production`: sau khi vá chạy thêm `npm run build`.
- `-SkipChecks`: bỏ qua `npm run typecheck` sau khi vá.
- `-SkipInstall`: không tự chạy `npm install` khi thiếu `node_modules`.
- `-ProjectRoot`: chỉ định thư mục dự án nếu không chạy từ `D:\freetime\dark-poke`.

Bản vá không thêm package, không đổi `.env.local`, không thao tác Supabase hay SQL. Chạy lại lần hai sẽ báo "da ap dung" và không ghi gì.

## V14.33: màu chữ "Pokémon"

- Chữ "Pokémon" trong tiêu đề Thư viện thẻ đổi sang vàng, viền xanh lá bài, bóng xanh đậm (chỉ đổi màu, giữ font của shop).

## V14.32: đầu trang Thư viện thẻ theo mặt sau lá bài Pokémon

- Ba lá bài xòe bên phải là ảnh mặt sau lá bài Pokémon (`public/library/card-back.webp`, 460 × 630), viền trắng như thẻ thật.
- Chữ "Pokémon" trong tiêu đề màu đỏ Poké Ball, viền vàng, bóng xanh đậm.
- Bảng màu lấy từ mặt sau lá bài trên nền sáng: xanh đậm của viền thẻ cho nút Tra cứu và các biểu tượng, quầng xanh nhạt, vàng nhạt và đỏ nhạt phía sau, vòng xoáy mờ sau xấp bài; chấm ở nhãn đầu trang thành Poké Ball nhỏ.

## V14.31: trang tài khoản (`/tai-khoan`)

- Hồ sơ là một "thẻ Trainer" nền sáng, viền holo pastel: ảnh Google (hoặc chữ viết tắt), tên, email, mã thành viên rút từ id tài khoản, và số đơn hàng, số yêu cầu thu mua, tổng đã mua (các đơn đã thanh toán trở đi).
- Lời chào theo tên Google; nếu có đơn chờ thanh toán thì nhắc ngay số đơn. Bốn lối tắt: Mua sắm, Pre-order, Thu mua thẻ, Thư viện thẻ.
- Mỗi đơn có thanh tiến trình Đặt hàng → Đã thanh toán → Đóng gói → Đang giao/Chờ nhận → Hoàn tất; đơn chờ thanh toán có nền vàng nhạt và nút "Thanh toán …₫".
- Khi chưa có đơn hoặc yêu cầu thu mua, hiện minh họa và nút hành động thay cho một dòng chữ.
- Chỉ dùng gradient tĩnh, không blur, để cuộn mượt trên điện thoại. Không đổi database.

## V14.30: webhook SePay tự xác nhận đơn đã chuyển khoản

- `/api/webhooks/bank` trả `{"success": true}` cho mọi lần nhận thành công. SePay chỉ coi webhook thành công khi nhận đúng body này; trước đó SePay báo lỗi và gửi lại tối đa 7 lần.
- Nhận cả hai cách xác thực của SePay, cùng dùng `BANK_WEBHOOK_SECRET`: **API Key** (`Authorization: Apikey …`) và **HMAC-SHA256** (`X-SePay-Signature`, `X-SePay-Timestamp`, lệch giờ tối đa 5 phút).
- Mã đơn lấy từ trường `code` của SePay nếu có, nếu không thì tìm `DP` + số trong nội dung chuyển khoản (chấp nhận "DP 100123", "DP-100123").
- Cấu hình trong SePay → Webhooks: URL `https://<tên-miền>/api/webhooks/bank`, Loại giao dịch "Tiền vào", Định dạng JSON, bật "Tự động gửi lại"; tab Bảo mật chọn API Key hoặc HMAC-SHA256 và dán cùng giá trị `BANK_WEBHOOK_SECRET`. Nên khai báo tiền tố mã thanh toán `DP` trong Công ty → Cấu hình chung → Cấu trúc mã thanh toán.
- Webhook chỉ chạy trên bản đã deploy có Supabase và `SUPABASE_SERVICE_ROLE_KEY`; ở chế độ demo hoặc localhost trả 503.

## V14.29: trang giỏ hàng (`/gio-hang`)

- Cùng phong cách với trang đặt hàng: danh sách sản phẩm trong một khung, ảnh lớn, tên, phiên bản, nhãn Đặt trước, đơn giá và thành tiền từng dòng.
- Nút tăng/giảm số lượng 44 × 44 px dễ bấm trên điện thoại; khi chạm giới hạn tồn kho hiện "Tối đa N sản phẩm".
- Xóa sản phẩm hiện thanh "Đã xóa … Hoàn tác" để lấy lại ngay nếu bấm nhầm.
- Khung tóm tắt có phí vận chuyển tham khảo (nội thành TP.HCM, tỉnh khác, nhận tại cửa hàng) lấy từ cài đặt cửa hàng, và thanh tiến độ miễn phí giao hàng nếu cửa hàng bật mức miễn phí.

## V14.28: trang đặt hàng (`/thanh-toan`)

- Địa chỉ giao hàng chia ba bước: **Tỉnh, thành phố** (34 đơn vị) → **Phường, xã** (ô tìm kiếm, gõ có dấu hay không dấu đều được, ví dụ "ben thanh") → **Số nhà, tên đường**. Đổi tỉnh thì phường, xã chọn lại. Bên dưới hiện dòng "Giao đến …" để khách kiểm tra.
- Danh sách 3.321 phường, xã, đặc khu theo Nghị quyết 202/2025/QH15 (687 phường, 2.621 xã, 13 đặc khu) nằm ở `src/lib/vn-address/wards.ts`, chỉ tải khi khách chọn giao tận nơi (~16 KB). Nếu tải lỗi, form quay về một ô địa chỉ như cũ.
- Đơn lưu như trước: `province` là tỉnh, `address` là "số nhà, tên đường, phường/xã". Không đổi database.
- Chọn cách nhận hàng bằng hai ô lớn có biểu tượng và phí ngay trên ô.
- Khung "Đơn hàng của bạn" rộng hơn (440 px): ảnh sản phẩm lớn, tên đủ 3 dòng, phiên bản, nhãn Đặt trước, đơn giá × số lượng, thành tiền từng dòng, nơi giao, phí vận chuyển kèm lý do, gợi ý mua thêm để được miễn phí (nếu cửa hàng bật), tổng tiền lớn và nút "Xác nhận đặt hàng · tổng tiền". Có nút "Sửa giỏ hàng".

## V14.27: khu danh mục và dịch vụ dưới banner

- Lối tắt chia hai nhóm có nhãn: **Danh mục** (Sealed, Thẻ lẻ, Thẻ grading, Phụ kiện, có ảnh minh họa và một dòng mô tả) và **Dịch vụ** (Pre-order, Thu mua thẻ, Thư viện thẻ, có biểu tượng, lời hứa ngắn và mũi tên). Thời gian báo giá thu mua lấy từ cài đặt cửa hàng.
- Các ô trong một hàng rộng bằng nhau nên không còn cảnh 4 ô trên, 3 ô dưới lệch phải.
- Màn hình rộng: tiêu đề bên trái, đoạn giới thiệu bên phải, hai nhóm trải hết chiều ngang bên dưới. Điện thoại: danh mục 2 × 2, dịch vụ là ba ô nhỏ trên một hàng; không còn thanh cuộn ngang.
- Thêm một câu giới thiệu dưới tiêu đề để khách biết cửa hàng bán gì và làm được gì.

## V14.26: thêm banner One Piece vào trang chủ

- Trình chiếu đầu trang chủ có 4 ảnh: 30th Celebration, Perfect Order, One Piece OP-18 The Dominance of God (mở trang Pre-order) và One Piece Store Treasure Cup tháng 12/2026 (mở danh sách sản phẩm One Piece).
- Mỗi banner mới có bản ngang 1920 × 784 cho máy tính và bản dọc 1024 × 1536 cho điện thoại: phần chữ đặt trên, nhân vật bên dưới, chữ chừa lề hai bên để không bị cắt trên màn hình hẹp.
- Ảnh nằm trong `public/home-v14/` (`op18-dominance-of-god*.webp`, `treasure-cup-2026*.webp`); danh sách banner ở `src/features/home/carousel/slides.ts`.

## V14.25: cuộn mượt bằng chuột và vuốt trên điện thoại

- Điện thoại và máy tính bảng dùng cuộn gốc của trình duyệt. Lenis chỉ chạy khi thiết bị có chuột/touchpad (`(hover: hover) and (pointer: fine)`). Lenis gắn listener `touchstart`/`touchmove` không passive, nên trước đây mỗi lần vuốt trình duyệt phải chờ luồng chính trả lời rồi mới cuộn; lúc trang đang tải thẻ hay ảnh, ngón tay đi trước nội dung và cú vuốt nhanh mất quán tính.
- Trang Thu mua không còn tạo Lenis thứ hai. Trên máy tính, hai bộ cuộn mượt cùng kéo một thanh cuộn gây rung.
- Bỏ `filter: blur` trên lớp glow động ở đầu Thư viện thẻ và trên bầu trời trang chủ (dùng gradient mềm thay thế), bỏ blur nền của ba lá bài ở đầu Thư viện thẻ. Hiệu ứng nền trông như cũ nhưng không phải làm mờ lại mỗi khung hình.
- Trên thiết bị cảm ứng, header, thanh tìm kiếm/thanh công cụ của Thư viện thẻ, thanh mục lục trang sản phẩm và khung chữ ở Khám phá dùng nền đặc thay cho kính mờ (`backdrop-filter`).
- Bản đồ Google ở footer chỉ tải khi người xem cuộn gần tới (trước đó hiện dòng "Đang tải bản đồ…"), nên trang không phải nạp cả ứng dụng bản đồ ngay từ đầu.
- Thư viện thẻ: thẻ đã hiện không vẽ lại khi tải thêm (`memo`); lô thẻ mới được vẽ ở mức ưu tiên thấp (`useDeferredValue`) để không chặn cuộn; khung xương giữ chỗ tới khi lô mới hiện xong nên lưới không co lại làm trang giật.
- Đo trên Chromium giả lập (máy chậm 4–6 lần): khi vuốt, cuộn chạy trên luồng compositor thay vì luồng chính ở trang Sản phẩm, Chi tiết, Thư viện thẻ và Thu mua; Thư viện thẻ cuộn chuột có p95 khung hình 66,7 ms → 50 ms, khung hình trên 34 ms 21% → 12%; trang chủ cuộn chuột 2,7% → 0,4%.
- Độ mượt nên thử bằng `npm run build` rồi `npm run start`. `npm run dev` dùng React bản phát triển và biên dịch theo yêu cầu nên luôn chậm hơn nhiều.
- Lỗi `npm run dev` "Committing semi space failed" hay "memory allocation of 16777216 bytes failed" nghĩa là Windows hết bộ nhớ cam kết (RAM + pagefile), không phải lỗi mã. Chạy `Dark-Poke-Dev-Doctor.ps1` để xem và dọn: dừng tiến trình node còn chạy của dự án, xóa cache `.next`; đặt pagefile về "System managed size".

## V14.23: giá mong muốn có dấu chấm và chữ, thẻ chọn căn giữa

- Ô "Giá mong muốn" tự thêm dấu chấm khi gõ (1000000 → 1.000.000), con trỏ giữ đúng vị trí; chỉ nhận số, tối đa 12 chữ số. Dữ liệu gửi đi vẫn là số trơn như trước.
- Dưới ô hiện số tiền bằng chữ, ví dụ "Một triệu đồng" (hàm trong `src/features/tradein/money.ts`).
- Nút chọn và biểu tượng trong các thẻ chọn (tình trạng, cách gửi, cách nhận giá trị) căn giữa theo chiều dọc.
- File: `src/features/tradein/components/item-card.tsx`, `src/features/tradein/money.ts` (mới), `src/features/tradein/tradein.css`.

## V14.22: trang Thu mua & trao đổi

- Theo hệ thống thiết kế Dark Poke: nền trắng, chữ đen, nhấn xanh; chữ nội dung 15–18px, nhãn 14px (trước 10–12px khó đọc).
- Đầu trang gọn: breadcrumb, tiêu đề, một câu mô tả, 3 bước có số tròn nối bằng đường mảnh (điện thoại xếp dọc).
- Bố cục 2 cột: form bên trái, khung "Yêu cầu của bạn" dính bên phải (số vật phẩm, tổng số lượng, số ảnh, cách gửi, cách nhận giá trị, nút gửi, ghi chú bảo mật). Tablet/điện thoại: khung này nằm cuối form.
- Mỗi vật phẩm: tiêu đề hiện tên đang nhập, tình trạng thành các thẻ chọn bấm được (thay ô chọn thả xuống), số lượng có nút − / +, giá mong muốn có ₫, ảnh thực tế với ô kéo thả và ô "Thêm ảnh" ngay trong lưới ảnh.
- Cách gửi vật phẩm và cách nhận giá trị thành 2 thẻ chọn có biểu tượng.
- Màn hình gửi thành công gọn, mã yêu cầu viết bằng font mono.
- Logic form, kiểm tra dữ liệu, tải ảnh, gửi yêu cầu giữ nguyên; trang quản trị không đổi.
- File: `src/features/tradein/components/tradein-screen.tsx`, `item-card.tsx`, `photo-picker.tsx`, `contact-fields.tsx`, `tradein-summary.tsx` (mới), `src/features/tradein/tradein.css`.

## V14.21: trang danh sách sản phẩm gọn (phương án A)

- Áp dụng cho "Tất cả sản phẩm", trang danh mục (`/danh-muc/...`) và Pre-order vì cùng dùng `CatalogView`. Theo hệ thống thiết kế Dark Poke: nền sáng, chữ đen, một màu nhấn xanh.
- Breadcrumb, tiêu đề 40px (Bricolage Grotesque), mô tả và số sản phẩm cùng một hàng.
- Một thanh công cụ nền xám nhạt: ô tìm kiếm, nút "Bộ lọc" có huy hiệu số bộ lọc đang bật, "Sắp xếp: Mới nhất".
- Loại sản phẩm thành tab gạch chân (vuốt ngang trên điện thoại), có lối vào "Pre-order · Mới" khi bật module Pre-order (ẩn ở chính trang Pre-order).
- Dòng "Đang lọc:" với các nhãn có nút bỏ và "Xóa tất cả".
- Điện thoại: ẩn mô tả, ô tìm kiếm một hàng, "Bộ lọc" và "Sắp xếp" chia đôi hàng dưới.
- Logic tìm kiếm, bộ lọc, ngăn kéo bộ lọc, sắp xếp, tải thêm giữ nguyên.
- File: `src/components/shop/catalog-view.tsx`, `src/components/shop/filters.tsx`, `src/components/shop/catalog-v14.css` (mới).

## V14.20: logo footer lớn hơn

- Logo ở footer cao 66px trên máy tính (trước 42px), 54px trên điện thoại (trước 38px).
- File: `src/components/shop/footer-v14.css`.

## V14.19: tiêu đề "Khám phá" một màu

- Tiêu đề "Mọi thứ cho hành trình sưu tầm" toàn bộ màu trắng, bỏ phần chữ chuyển màu.
- Nhãn "Khám phá · 06 lối vào" bỏ biểu tượng lấp lánh.
- File: `src/features/home/components/storefront.tsx`, `src/features/home/home-v14.css`.

## V14.18: footer gọn hơn

- Bỏ dòng "Hunt · Trade · Collect" và tagline ở dòng bản quyền (chỉ còn "© năm Dark Poke").
- 4 cam kết thành một hàng ngang, chia bằng đường mảnh, không còn khung hộp; điện thoại: lưới 2×2 chỉ giữ tiêu đề.
- Họa tiết kim cương mờ hơn ở cả hai nền, bong bóng giảm còn 8.
- Khung "Ghé cửa hàng" chỉ còn tiêu đề, nút "Chỉ đường" và bản đồ (16:9); bỏ khối "Có thẻ muốn bán hoặc đổi?" vì đã có link "Thu mua & trao đổi" ở cột Dịch vụ.
- File: `src/components/shop/footer.tsx`, `src/components/shop/footer-v14.css`.

## V14.17: ảnh mới cho 3 lá bài "Khám phá"

- Thẻ grading: `public/home-v14/explore-grading.webp` (ba lá bài với vòng sáng xanh), 1000×800.
- Thu mua & trao đổi: `public/home-v14/explore-tradein.webp` (các lá Pikachu 30th Celebration), 825×660.
- Sealed: `public/home-v14/explore-sealed.webp` (logo 30th Celebration "Available now!"), 1000×800; đã bỏ nút "Watch the trailer" trong ảnh gốc vì ở đây không bấm được, nền vàng được nới thêm để logo có khoảng thở.
- Ô ảnh lá bài theo tỉ lệ 5:4; muốn thay ảnh khác thì giữ tỉ lệ này, rộng tối thiểu 800px.
- Ảnh cũ (`home-v6/collector-display.webp`, `home-v6/johto-world.webp`, `home-v13/tcg-news.webp`) vẫn giữ trong thư mục, chỉ không còn dùng ở khối này.

## V14.16: "Khám phá" dạng sân khấu và bộ bài

- Lấy cảm hứng từ trang gallery Pokémon TCG (Phantasmal Flames): phần trên là sân khấu tím đêm, ánh lửa ma xanh tím trôi chậm, nền sao mờ.
- Câu chuyện đầu tiên (Thư viện thẻ) thành ảnh nền chính bên phải, mờ dần sang trái để chữ dễ đọc; khung kính "01 · Thư viện thẻ" có nút "Mở thư viện".
- Mép dưới sân khấu cong như đường chân trời, viền sáng tím.
- Các lối vào còn lại thành lá bài dọc (khung ngà, ô ảnh, số thứ tự 02/06…), xếp vắt ngang đường cong: nửa trên nằm trên nền tối, nửa dưới trên nền trắng ngà. Hai đầu hàng nhô cao theo đường cong.
- Rê chuột: lá bài nhấc lên, thẳng lại và lóe ánh holo. Máy bật giảm chuyển động thì tắt hiệu ứng.
- Tablet và điện thoại: các lá bài thành hàng vuốt ngang, không xoay.
- Thay cho lưới bento của V14.8–V14.10. File: `src/features/home/components/storefront.tsx`, `src/features/home/home-v14.css`.

## V14.15: bản đồ cửa hàng và khối cam kết rõ hơn

- Khung liên hệ đổi thành "Ghé cửa hàng": bản đồ Google Maps của DARK POKE - Pokemon Trading Card Store (tải lười khi cuộn tới) và nút "Chỉ đường" mở Google Maps.
- Hotline, Zalo, email, địa chỉ vẫn hiện dưới bản đồ khi đã nhập trong cài đặt; dòng "đang được cập nhật" đã bỏ.
- Bản đồ và link nằm ở `MAP_EMBED` / `MAP_LINK` đầu file `src/components/shop/footer.tsx`; muốn đổi địa điểm thì thay 2 hằng số này.
- 4 cam kết gom vào một khối có đường chia mảnh, nền đặc không bị họa tiết làm chìm, biểu tượng trong ô cyan sáng, chữ sáng hơn.
- Điện thoại dưới 480px: 4 cam kết thành lưới 2×2 gọn, chỉ giữ tiêu đề.
- File: `src/components/shop/footer.tsx`, `src/components/shop/footer-v14.css`.

## V14.14: footer phong cách Chaos Rising

- Dải trên màu xanh mòng két đậm có họa tiết kim cương lồng nhau: logo, câu giới thiệu, 4 cam kết.
- Đường phân cách dạng sóng nước có bong bóng (lớp sóng trước và lớp sóng mờ phía sau); bong bóng nổi nhẹ, tắt khi máy bật giảm chuyển động.
- Phần dưới màu xanh cyan có họa tiết kim cương mờ: 3 cột liên kết chữ tối, khung liên hệ màu tối nổi trên nền cyan.
- Dải pháp lý màu tối nhất, liên kết màu cyan.
- Sóng giữ tỉ lệ trên điện thoại (không bị nén thành gai), không gây cuộn ngang.
- File: `src/components/shop/footer.tsx`, `src/components/shop/footer-v14.css`.

## V14.13: trang chi tiết sản phẩm

- Bố cục mới: breadcrumb, khối ảnh lớn bên trái (dính khi cuộn trên desktop), thông tin và hộp mua bên phải.
- Gallery: ảnh nhỏ dọc bên trái (ngang trên mobile), nút trước/sau, bộ đếm `1 / n`, phím mũi tên, vuốt trên điện thoại, bấm để phóng to.
- Phần thông tin: nhãn loại hàng / danh mục / ngày phát hành / ưu đãi, tiêu đề lớn, SKU và thương hiệu, 4 ô thông số nổi bật.
- Hộp mua: nhãn "Giá bán" hoặc "Giá đặt trước", giá lớn hơn, chip "-x% · Tiết kiệm ..." khi có giá gốc, nút cao 52px.
- 4 thẻ dịch vụ lấy từ cài đặt shop: chính hãng, phí giao hàng, nhận tại cửa hàng (số ngày giữ hàng), chuyển khoản VietQR (giờ tự hủy).
- Thanh điều hướng nhanh: Mô tả · Thông số · Mua hàng & giao nhận.
- Thẻ mô tả tách đoạn và tag tìm kiếm; bảng thông số đầy đủ (SKU, nhóm hàng, thương hiệu, mọi thuộc tính, khối lượng, ngày phát hành, hạn đặt trước, giới hạn mỗi đơn), tự bỏ dòng trùng giá trị.
- 3 bước mua hàng, rồi lưới sản phẩm cùng danh mục.
- File: `src/app/(shop)/san-pham/[slug]/page.tsx`, `src/components/shop/gallery.tsx`, `src/components/shop/add-to-cart.tsx`, `src/components/shop/product-detail-v14.css` (mới).

## V14.12: hàng sản phẩm tràn chiều ngang, kéo bằng chuột

- Các hàng "Bán chạy", "Đặt trước bộ thẻ mới", "Vừa có mặt" trải hết chiều ngang màn hình với lề hai bên `clamp(16px, 3,2vw, 56px)`; tiêu đề thẳng hàng với thẻ đầu tiên. Màn hình rộng không còn khoảng trống lớn bên trái.
- Số thẻ mỗi hàng theo bề rộng (phần lẻ là thẻ lộ một phần để báo còn nữa): dưới 640 px 1,55; 640 px 2,3; 900 px 3,3; 1100 px 4,3; 1440 px 4,8; 1800 px 5,8. Thẻ luôn khoảng 225–335 px. Hàng Pre-order: 1,2 / 2,3 / 3,3 / 4,3.
- Giữ chuột trái và kéo để lướt hàng sản phẩm (con trỏ hình bàn tay). Thả ra thì hàng trượt tiếp theo đà rồi dừng đúng mép thẻ. Kéo không mở sản phẩm; bấm bình thường vẫn mở. Cảm ứng và touchpad vẫn cuộn như cũ.

## V14.11: thẻ sản phẩm to và dễ đọc hơn

- Thẻ sản phẩm (`product-card.tsx`, CSS riêng `product-card-v14.css`) dùng chung cho các hàng ở trang chủ, trang `/san-pham` và sản phẩm liên quan.
- Ảnh lớn hơn, nền sáng dịu; nhãn "Đặt trước / Hết hàng / Ưu đãi" bo tròn, chữ 11,5 px.
- Tên 15,5 px (điện thoại 14 px), tối đa 2 dòng; giá 19 px (điện thoại 16,5 px); có giá gốc gạch ngang và nhãn giảm "-7%" khi có ưu đãi.
- Dòng trạng thái thay cho "Khám phá chi tiết": Còn hàng (xanh), Chỉ còn N (cam, khi còn 3 trở xuống), Hết hàng (xám, ảnh mờ), N lựa chọn, Dự kiến dd/mm/yyyy (pre-order).
- Rê chuột: thẻ nhấc nhẹ, ảnh phóng nhẹ, nút mũi tên chuyển xanh.
- Hàng "Bán chạy" và "Vừa có mặt" ở trang chủ: 4 thẻ mỗi hàng trên máy tính (khoảng 267 px, trước đây khoảng 180 px), 3 trên tablet, khoảng 1,5 thẻ trên điện thoại (khoảng 200 px).

## V14.10: "Khám phá" gọn hơn, nền trắng ngà; thẻ Pre-order lớn hơn

- Khối Khám phá thấp hơn khoảng 30% (hàng cao bằng 0,72 bề rộng cột), tiêu đề, chữ trong ô và nút mũi tên nhỏ lại.
- Nền trắng ngà `#faf7f0` có hai vệt sáng màu kem và lưới chấm mờ, viền trên/dưới màu be nhạt; nhãn "Khám phá" màu vàng đồng.
- Hàng "Đặt trước bộ thẻ mới" dùng thẻ lớn: 3 thẻ mỗi hàng trên máy tính (khoảng 360 px thay vì 185 px), 2,3 thẻ trên tablet, 1,2 thẻ trên điện thoại; tên, giá và ảnh sản phẩm to hơn.

### Kích thước ảnh từng ô Khám phá (khi có đủ 6 ô)

Tỉ lệ giống nhau trên mọi màn hình (máy tính, tablet, điện thoại).

| Ô | File đang dùng | Tỉ lệ | Hiển thị lớn nhất | Nên xuất (2× cho màn Retina) |
|---|---|---|---|---|
| 01 Thư viện thẻ (lớn) | `public/home-v7/moon-festival.webp` | ≈ 1,38:1 | 585 × 425 px | 1200 × 872 px |
| 02 Pre-order (ngang) | `public/home-v6/sky-world.webp` | ≈ 2,86:1 | 585 × 206 px | 1240 × 434 px |
| 03 Thẻ grading (nhỏ) | `public/home-v6/collector-display.webp` | ≈ 1,39:1 | 286 × 206 px | 600 × 432 px |
| 04 Phụ kiện (nhỏ) | `public/home-v13/collection.webp` | ≈ 1,39:1 | 286 × 206 px | 600 × 432 px |
| 05 Thu mua (ngang) | `public/home-v13/tcg-news.webp` | ≈ 2,86:1 | 585 × 206 px | 1240 × 434 px |
| 06 Sealed (ngang) | `public/home-v6/johto-world.webp` | ≈ 2,86:1 | 585 × 206 px | 1240 × 434 px |

Đã đo: 1440 px rộng: 585×425, 585×206, 286×206; điện thoại 390 px: 354×258, 354×124, 172×124.

- Ảnh dùng `object-fit: cover`, ảnh khác tỉ lệ vẫn lấp đầy ô nhưng bị cắt cạnh. Xuất đúng tỉ lệ trên thì không mất gì.
- Vùng an toàn: góc trên bên trái có nhãn số thứ tự; khoảng 40% phía dưới có lớp tối chứa tiêu đề và nút. Đặt chủ thể ở giữa hoặc nửa trên.
- WebP chất lượng 80–85, mỗi ảnh nên dưới 250 KB. Thay ảnh bằng cách ghi đè file cùng tên.
- Tắt Pre-order hoặc Thu mua thì bố cục đổi: 5 ô thì ô cuối trải hết hàng; 4 ô gồm lớn, ngang, nhỏ, nhỏ.

## V14.9: nền tối cho "Khám phá", tỉ lệ ảnh cố định, khôi phục cuộn mượt

- (Nền tối và tỉ lệ 1:1 của bản này đã được thay ở V14.10.)
- Cuộn mượt Lenis bật lại trên mọi máy. Ở V14.8 Lenis tắt khi hệ điều hành báo "giảm chuyển động"; Windows hay bật sẵn cài đặt này (Settings → Accessibility → Visual effects → Animation effects), nên cuộn mượt bị mất. Giờ giữ như trước V14.8; phần tắt hiệu ứng rê chuột khi cuộn vẫn giữ.

## V14.8: khối "Khám phá" dạng bento và cuộn trang

### Khám phá
- Lưới bento 4 cột (máy tính), 2 cột (tablet/điện thoại): ô đầu lớn 2×2, các ô ngang 2×1 và ô vuông 1×1; bố cục tự đổi theo số ô đang bật (3–6 ô, tùy module Pre-order/Thu mua).
- Mỗi ô: số thứ tự và nhãn dạng kính mờ ở góc trên, tiêu đề và mô tả ở dưới, nút tròn mũi tên; ô lớn có thêm nút chữ. Rê chuột: ảnh phóng nhẹ, mũi tên xoay, ô ngang hiện nút chữ.
- Điện thoại không còn cuộn ngang: các ô xếp lưới 2 cột, ô vuông chỉ giữ số thứ tự để chữ không chật.

### Cuộn trang
- Trong lúc trang đang cuộn, hiệu ứng rê chuột tạm tắt (thuộc tính `data-scrolling` trên `html`, bật lại sau 140 ms dừng cuộn). Trước đây ảnh lớn phóng to và thẻ sản phẩm nhấc lên ngay dưới con trỏ khi trang trượt qua, gây vẽ lại ảnh lớn, nên thỉnh thoảng bị khựng.
- Header trong suốt ở trang chủ không còn tính hiệu ứng làm mờ nền khi đang ẩn.
- Cuộn mượt giữ nguyên cảm giác cũ (Lenis, 1,1 giây, ease-out). Đã đo so sánh với nhiều cấu hình khác, không cấu hình nào đều hơn.
- Lưu ý: `npm run dev` luôn chậm và hay khựng hơn bản thật. Muốn đánh giá độ mượt, chạy `npm run build` rồi `npm start`.

## V14.7: đầu trang thư viện thẻ phong cách iOS

- Nền sáng màu ngọc trai với ba vệt màu pastel (tím lavender, cam đào, xanh trời) trôi rất chậm; tắt chuyển động khi bật "giảm chuyển động".
- Kính mờ (frosted glass) cho nhãn, ô tìm kiếm, gợi ý nhanh và thanh lọc; chữ dùng font hệ thống của Apple (SF Pro) trên iPhone/Mac, máy khác dùng Inter.
- Chữ "Pokémon" trong tiêu đề có dải màu holo; ba thẻ kính xếp quạt có ánh holo và vệt sáng lướt qua (chỉ là hình trang trí).
- Chọn "Theo tên / Theo mã thẻ" là segmented control kiểu iOS có nút trượt; nút "Tra cứu" xanh iOS; nút xóa từ khóa tròn xám như iOS.
- Thanh lọc: các ô chọn dạng nền xám nhạt của iOS, "Xóa bộ lọc" màu đỏ iOS, "Mua thẻ tại shop" nền đen.

## V14.6: giao diện đầu trang thư viện thẻ

- Khối hero tối cùng tông trang chủ/footer, bo góc, nền chấm mờ và ba hình thẻ xếp quạt (chỉ là hình khối trang trí, không dùng ảnh thẻ có bản quyền).
- Ô tìm kiếm lớn dạng viên thuốc ngay trong hero, chuyển "Theo tên / Theo mã thẻ", nút xóa nhanh từ khóa, nút "Tra cứu".
- Hàng "Phổ biến" (Pikachu, Charizard, Eevee, Mewtwo, Umbreon, Gengar) chuyển từ đầu danh sách lên hero; trên điện thoại cuộn ngang.
- Thanh lọc gọn dưới hero: Ngôn ngữ, Bộ thẻ, Sắp xếp dạng ô có icon; "Xóa bộ lọc" khi đang lọc; nút "Mua thẻ tại shop". Điện thoại: nút "Bộ lọc" (kèm số bộ lọc đang bật) mở/đóng các ô.
- Logic tìm kiếm, lọc và tải thêm thẻ giữ nguyên.

## V14.5: chuyển giá sang VND và ảnh thẻ dự phòng

### Giá VND
- Nút **USD/EUR ↔ VND** ở khung "Giá thị trường" và ở phần Scrydex. Chọn VND thì mọi giá trên trang (khung giá, ô so sánh nguồn, bảng tình trạng/grading, biểu đồ, bảng số liệu) đổi sang đồng, làm tròn tới 1.000 ₫; dòng phụ vẫn hiện giá gốc (= $66.12). Lựa chọn được nhớ trên trình duyệt.
- Tỷ giá tự lấy từ ExchangeRate-API (gói miễn phí, không cần khóa, cập nhật mỗi ngày, cache 12 giờ) và ghi nguồn "Rates By Exchange Rate API" như điều khoản yêu cầu. Muốn dùng tỷ giá của cửa hàng thì đặt `CARD_PRICE_USD_VND`, `CARD_PRICE_EUR_VND`, `CARD_PRICE_JPY_VND` trong `.env.local`; khi đó trang ghi "tỷ giá do cửa hàng cài đặt".
- Không lấy được tỷ giá nào thì nút VND tự ẩn, giá gốc vẫn hiện bình thường.

### Ảnh thẻ
- Mỗi lá bài thử lần lượt: ảnh TCGdex theo ngôn ngữ đã chọn → ảnh bản tiếng Anh trên TCGdex (cho Pháp, Đức, Tây Ban Nha, Ý, Bồ Đào Nha, vì cùng số thẻ) → ảnh từ Pokémon TCG API (images.pokemontcg.io). Ảnh dự phòng có nhãn nhỏ "Ảnh bản tiếng Anh" hoặc "Ảnh tham khảo · Pokémon TCG API".
- Không nguồn nào có ảnh thì hiện mặt thẻ thiết kế sẵn (tên, bộ thẻ, số thẻ, "Chưa có ảnh") thay cho ô trống.
- Thẻ tiếng Nhật, Hàn, Trung, Thái, Indonesia chỉ dùng ảnh TCGdex vì mã bộ thẻ khác hệ tiếng Anh.

## V14.4: một khung giá ở đầu trang chi tiết thẻ

- Khung "Giá thị trường" ngay dưới tên thẻ gộp cả TCGplayer và Cardmarket. Có cả hai nguồn thì hiện hai ô chọn nguồn kèm giá đầu của mỗi nguồn; bên trong chọn bản in (Thường/Holo/Reverse…).
- TCGplayer không có giá (thẻ promo, bản phát hành riêng…) thì khung tự mở giá Cardmarket kèm ghi chú, không còn báo "chưa có giá" trong khi phía dưới lại có giá.
- Không nguồn nào có giá thì hiện liên kết tìm tin đăng trên TCGplayer và Cardmarket.
- Khung Cardmarket riêng ở cột phải được bỏ để không lặp; cột phải chỉ còn thông tin lá bài.
- Script V14.33 chạy được từ source gốc hoặc từ bản V14 đến V14.32.

## V14.3: tìm kiếm dạng bảng lệnh và thư viện thẻ có giá TCGplayer

### Tìm kiếm
- Nút kính lúp, phím `Ctrl/⌘ + K` hoặc phím `/` (khi không gõ trong ô nhập) mở hộp tìm kiếm ở giữa màn hình, nền trang mờ phía sau.
- Chưa gõ: mục **Điều hướng** (Sản phẩm, Sealed, Thẻ lẻ, Grading, Phụ kiện, Pre-order, Thu mua, Thư viện thẻ, Giỏ hàng, Tài khoản) và **Tìm nhanh**.
- Gõ từ 2 ký tự: gợi ý **Sản phẩm** trực tiếp (ảnh, tên, giá) từ `/api/products`, kèm "Tìm … trong tất cả sản phẩm" và "Tra cứu … trong thư viện thẻ".
- Gõ `/` ở đầu: chỉ tìm trang. `↑ ↓` di chuyển, `Enter` mở, `Ctrl/⌘ + Enter` mở tab mới, `Esc` đóng và trả focus về nút tìm kiếm.
- Code hộp tìm kiếm tách chunk riêng, chỉ tải khi rê chuột/focus vào nút hoặc khi mở.

### Thư viện thẻ
- Trang chi tiết thẻ bố cục kiểu trang sản phẩm TCGplayer: ảnh thẻ cố định bên trái; bên phải là **Giá thị trường TCGplayer** (USD) theo từng bản in (Thường/Holo/Reverse Holo…): market, thấp nhất, trung bình, cao nhất, direct thấp nhất, ngày cập nhật, liên kết tìm trên TCGplayer.
- **Giá Cardmarket** (EUR): xu hướng, trung bình, thấp nhất, trung bình 1/7/30 ngày cho bản thường và holo.
- Giá TCGplayer và Cardmarket lấy từ trường `pricing` của TCGdex (miễn phí, không cần khóa). TCGdex không có mã sản phẩm TCGplayer, nên nút chỉ mở trang tìm kiếm TCGplayer, không đoán link sản phẩm.
- Thông tin thẻ đầy đủ hơn: chiêu thức có biểu tượng năng lượng, điểm yếu/kháng/rút lui, thể thức hợp lệ, số Pokédex, phiên bản in, hậu tố, loại Trainer/năng lượng.
- Tùy chọn **Scrydex** (cần khóa, xem bên dưới): giá raw theo tình trạng NM/LP/MP/HP/DM, giá grading PSA/CGC/BGS/TAG theo điểm (thấp/trung vị/cao/market), biến động 1–90 ngày, biểu đồ lịch sử 90 ngày (kèm bảng số liệu), pop report. Phần này tải sau (Suspense), không làm chậm phần thông tin chính.
- Tùy chọn hiện "≈ … ₫" cạnh giá nếu đặt tỷ giá tham khảo trong `.env.local`.
- Mọi giá đều ghi rõ là tham khảo thị trường quốc tế, không phải giá bán của shop.

### Bật Scrydex (không bắt buộc)
1. Đăng ký tại https://scrydex.com, tạo team (lấy **Team ID**), đăng ký gói và tạo **API key**.
2. Thêm vào `.env.local` (script không sửa file này):
   ```
   SCRYDEX_API_KEY=...
   SCRYDEX_TEAM_ID=...
   SCRYDEX_WEBHOOK_SECRET=whsec_...
   CARD_PRICE_USD_VND=26300
   CARD_PRICE_EUR_VND=30500
   ```
   Trên Vercel thêm các biến này ở Project Settings → Environment Variables rồi deploy lại.
3. Trong Scrydex, đăng ký webhook `https://<tên-miền>/api/webhooks/scrydex` cho các sự kiện `pokemon.expansions.prices.raw_updated`, `pokemon.expansions.prices.graded_updated`, `pokemon.expansions.pop_reports.updated`, rồi chép secret vào `SCRYDEX_WEBHOOK_SECRET`.
4. Webhook kiểm tra chữ ký `X-Scrydex-Signature` (HMAC-SHA256 của `t.<body gốc>`, lệch tối đa 5 phút, so sánh an toàn thời gian). Hợp lệ thì chỉ làm hết hạn cache của đúng các bộ thẻ trong `expansion_ids`; không ghi cơ sở dữ liệu, gửi trùng cũng vô hại.

Chi phí API: lần đầu xem một lá bài tốn khoảng 1 credit để khớp thẻ, 1 credit lấy giá, 3 credit lịch sử giá. Sau đó dùng cache (khớp thẻ 7 ngày, giá 12 giờ hoặc tới khi webhook báo giá mới). Scrydex hiện chỉ dùng cho bản tiếng Anh; ngôn ngữ khác vẫn có giá TCGdex nếu nguồn có.

## V14.2: footer mới

- `footer.tsx` viết lại, CSS riêng `footer-v14.css` (không còn phụ thuộc quy tắc footer trong `anime-client-v13.css`).
- Nền xanh đậm cùng tông với hero. Trên cùng: logo, câu giới thiệu, "Hunt · Trade · Collect" và 4 cam kết (chính hãng, giao toàn quốc, đóng gói, VietQR).
- Ba cột liên kết: Mua sắm (tất cả sản phẩm, tối đa 5 danh mục gốc đang hiện, hàng mới về, pre-order nếu bật), Dịch vụ (thư viện thẻ, thu mua nếu bật, thẻ grading, phụ kiện), Tài khoản.
- Khung "Liên hệ cửa hàng" lấy hotline, Zalo, email, địa chỉ từ cài đặt cửa hàng: hotline mở cuộc gọi, Zalo mở `zalo.me/<số>`, địa chỉ mở Google Maps. Thông tin còn để trống dạng `[...]` sẽ không hiện; nếu trống hết thì hiện "Thông tin liên hệ đang được cập nhật."
- Thẻ nổi bật: "Có thẻ muốn bán hoặc đổi?" dẫn tới `/thu-mua` (khi bật module thu mua), nếu không thì dẫn tới thư viện thẻ.
- Dải cuối: bản quyền, ghi chú thương hiệu (Pokémon, One Piece Card Game thuộc chủ sở hữu tương ứng; cửa hàng độc lập).
- Trang chủ bỏ dải cam kết riêng để không lặp với footer.
- Điện thoại: cam kết 2 cột, liên kết 2 cột, vùng bấm 44 px.

## V14.1 so với V14

- Thay ảnh cắt giữa trên điện thoại bằng hai banner dọc mới: `public/home-v14/celebration-30th-portrait.webp`, `public/home-v14/perfect-order-portrait.webp`.
- Xóa hai ảnh cũ `celebration-30th-mobile.webp`, `perfect-order-mobile.webp` (có sao lưu).
- Script V14.33 chạy được từ source gốc hoặc từ bản đã áp dụng V14 đến V14.32.

## Header

- `header.tsx` (Server Component) giữ nguyên props `categories`, `modules`; dựng danh sách link rồi chuyển cho `header-bar.tsx` (Client Component).
- Cao 64 px trên desktop, 56 px trên điện thoại. Biến `--dph-h` dùng chung cho hero và các khối sticky (gallery, tóm tắt đơn hàng…).
- Chỉ trang chủ `/` có chế độ trong suốt; trang khác luôn là nền kính mờ. Hiệu ứng kính nằm trên `::before` để không phá `position: fixed` của lớp phủ.
- Menu đầy đủ hiển thị từ 1180 px; màn nhỏ hơn dùng drawer `ShopMenu` sẵn có, logo căn giữa.
- Tìm kiếm: hộp tìm kiếm dạng bảng lệnh ở giữa màn hình (xem phần V14.3).
- Link đang xem có `aria-current="page"`; vùng bấm 40–44 px; tôn trọng giảm chuyển động, forced-colors, in ấn.

## Trang chủ

- Hero tràn màn hình nằm dưới header trong suốt. Ảnh rộng 1920×784 cho máy tính/tablet (từ 768 px); dưới 768 px dùng banner dọc thiết kế riêng cho điện thoại (30th Celebration 1103×1426, Perfect Order 1024×1536) qua `getImageProps` + `<picture>`. Mỗi ảnh có nền mờ nhỏ (base64) riêng cho từng cỡ màn hình.
- Trên điện thoại khung ảnh theo tỉ lệ 2:3, không cao quá phần màn hình còn lại phía trên thanh tab dưới cùng; ảnh hiển thị trọn vẹn (`object-fit: contain`), phần dư hai bên hoặc trên dưới được lấp bằng nền mờ của chính ảnh đó.
- Thanh tiến trình mảnh dưới banner (tự chuyển 6 giây, tạm dừng/tiếp tục, vuốt trên cảm ứng, phím mũi tên). Banner dẫn tới trang tìm kiếm sản phẩm tương ứng.
- Phần giới thiệu ngắn + lối tắt danh mục; các hàng sản phẩm cuộn ngang ("Bán chạy", "Đặt trước", "Vừa có mặt") có nút trái/phải trên desktop; ô biên tập lớn có tiêu đề + nút (lấy ý tưởng TCGplayer); "Bạn đã xem gần đây" lưu trên thiết bị (localStorage, tối đa 10 sản phẩm); dải cam kết cuối trang.
- Trang chủ vẫn tĩnh với ISR 300 giây. Trang chi tiết sản phẩm chỉ thêm `RememberProduct` (không render gì).
- Ô biên tập dùng lại ảnh có sẵn trong `public/home-v6`, `public/home-v7`, `public/home-v13`. Script cảnh báo nếu thiếu ảnh nào.

## File

Sửa: `.env.example` (thêm biến Scrydex, tỷ giá), `src/components/shop/header.tsx`, `src/components/shop/footer.tsx`, `src/features/card-library/{domain.ts, server/schema.ts, server/data.ts, components/card-detail.tsx, components/library-list.tsx}`, `src/app/(shop)/thu-vien-the/[id]/page.tsx`, `src/features/home/carousel/slides.ts`, `src/features/home/components/hero-carousel.tsx`, `src/features/home/hero-carousel.css`, `src/features/home/components/storefront.tsx`, `src/features/home/server/data.ts`, `src/app/(shop)/san-pham/[slug]/page.tsx`.

Tạo: `header-bar.tsx`, `header-links.tsx`, `header-v14.css`, `footer-v14.css`, `search-palette.tsx`, `search-palette.css` (trong `src/components/shop`); `src/features/card-library/{pricing.ts, library-v14.css, server/tcgdex-pricing.ts, server/scrydex.ts, server/scrydex-signature.ts, server/rates.ts, components/price-panel.tsx, components/price-chart.tsx, components/scrydex-section.tsx}`; `src/app/api/webhooks/scrydex/route.ts`, `product-rail.tsx`, `rail-controls.tsx`, `recently-viewed.tsx` (trong `src/features/home/components`), `src/features/home/recently-viewed.ts`, `src/features/home/home-v14.css`, 4 ảnh WebP trong `public/home-v14` (2 ảnh ngang, 2 ảnh dọc), tài liệu này.

Các component trang chủ cũ (library-portal, preorder-drop, collector-studio…) vẫn giữ nguyên, chỉ không còn được dùng ở trang chủ.

## Đã kiểm tra

Trên bản sao source từ Repomix ở chế độ demo (không có biến môi trường): `tsc --noEmit`, ESLint cho các file mới, `next build` (trang `/` vẫn Static). Playwright/Chrome ở 1440×900, 768×1024, 390×844 và 375×667: header trong suốt → kính mờ khi cuộn, mở/đóng tìm kiếm bằng Esc, focus và khóa cuộn được trả lại, "Đã xem gần đây" xuất hiện sau khi mở sản phẩm, banner tự chuyển sang ảnh 2. Script được chạy thử bằng PowerShell 7 trên Linux: DryRun/Check không ghi, áp dụng, chạy lại không đổi gì, phát hiện source lệch, rollback trả đúng từng byte.

V14.3 kiểm tra thêm bằng dữ liệu mẫu (TCGdex/Scrydex giả lập vì môi trường thử không gọi được API thật): hộp tìm kiếm (mở bằng nút, Ctrl+K, `/`; mũi tên, Enter, chế độ `/`, Tab, Esc, bấm nền), gợi ý sản phẩm, trang chi tiết thẻ với giá TCGplayer/Cardmarket, bảng Scrydex, biểu đồ, pop report, khi Scrydex tắt hoặc lỗi; webhook: thiếu chữ ký, sai secret, quá 5 phút, body bị sửa đều trả 401, hợp lệ trả 200 và chỉ tải lại đúng bộ thẻ.

Chưa kiểm tra: Windows PowerShell 5.1 thật, Safari/iOS thật, dữ liệu Supabase thật, logo thật trên nền hero (logo được giữ nguyên, thêm bóng đổ nhẹ khi header trong suốt). Chưa gọi API TCGdex/Scrydex thật từ môi trường thử: tên trường `pricing` của TCGdex và dữ liệu Scrydex được đọc theo tài liệu, bỏ qua trường lạ; khi bật thật nên mở thử vài lá bài.

## Khôi phục

Script in đường dẫn `.patch-backup\Header-Home-V14-33-...` và lệnh rollback đầy đủ. Nếu typecheck/build sau khi vá thất bại, script tự khôi phục. Nếu file đã bị chỉnh tiếp sau khi vá, rollback dừng để không mất thay đổi đó.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\Bin77\Downloads\Dark-Poke-Header-Home-V14-33.ps1" -Rollback -BackupPath "D:\freetime\dark-poke\.patch-backup\Header-Home-V14-33-THOI-GIAN"
```

Nếu báo `Source mismatch`, không ghi đè cưỡng bức. Cần đối chiếu các file được liệt kê với source thực tế.
