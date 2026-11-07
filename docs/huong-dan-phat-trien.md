# Dark Poke · Website bán thẻ bài TCG

HUNT - TRADE - COLLECT. Website gồm trang khách, trang quản trị (desktop và điện thoại) và bán tại quầy (POS). Code dựng theo bản thiết kế Dark Poke trên Claude Design.

**Công nghệ:** Next.js 16 (App Router, React 19), Tailwind CSS v4, Supabase (Postgres, Auth, Storage). Dự án deploy được lên Vercel.

Chưa cấu hình Supabase thì web vẫn chạy được ở **chế độ demo** với dữ liệu mẫu. Ở chế độ này bạn xem được toàn bộ giao diện, nhưng không lưu được đơn hàng.

---

## 1. Chạy nhanh trên Windows (PowerShell)

Yêu cầu: **Node.js 20.9 trở lên**, khuyên dùng bản LTS 22.x tải ở https://nodejs.org.

```powershell
# Giải nén file ZIP vừa tải về vào D:\freetime
Expand-Archive -Path "C:\Users\Bin77\Downloads\dark-poke.zip" -DestinationPath "D:\freetime" -Force

# Mở VS Code tại thư mục đã giải nén
cd "D:\freetime\dark-poke"
code .

# Kiểm tra trước, không thay đổi dữ liệu
powershell -NoProfile -ExecutionPolicy Bypass -File ".\setup.ps1" -DryRun

# Kiểm tra môi trường
powershell -NoProfile -ExecutionPolicy Bypass -File ".\setup.ps1" -Check

# Khởi tạo và chạy dự án (mở http://localhost:3000)
powershell -NoProfile -ExecutionPolicy Bypass -File ".\setup.ps1"

# Kiểm tra bản production khi đã cấu hình xong
powershell -NoProfile -ExecutionPolicy Bypass -File ".\setup.ps1" -Production
```

Tham số thêm: `-Port 3001` (đổi cổng), `-SkipInstall` (bỏ qua cài thư viện), `-NoBrowser` (không tự mở trình duyệt). Nhật ký chạy được ghi vào `setup.log`.

| Đường dẫn | Trang |
| --- | --- |
| `/` | Trang chủ |
| `/san-pham`, `/danh-muc/the-bai` | Danh sách, tự tải thêm khi cuộn |
| `/san-pham/<slug>` | Chi tiết sản phẩm |
| `/gio-hang` → `/thanh-toan` → `/don-hang/<mã>` | Giỏ hàng, đặt hàng, chờ thanh toán VietQR |
| `/pre-order`, `/thu-mua` | Pre-order có cọc, gửi yêu cầu thu mua |
| `/dang-nhap`, `/tai-khoan` | Đăng nhập Google, đơn hàng của tôi |
| `/admin` | Quản trị (có thanh tab dưới cho điện thoại) |
| `/pos` | Bán tại quầy |

---

## 2. Kết nối Supabase (bán hàng thật)

1. Tạo project ở https://supabase.com (chọn region Singapore cho gần Việt Nam).
2. Vào **SQL Editor > New query**, dán toàn bộ file `supabase/all-in-one.sql`, rồi bấm **Run**. File này gồm:
   - bảng, index, phân quyền RLS và hàm nghiệp vụ;
   - kho ảnh (storage);
   - dữ liệu mẫu (24 sản phẩm).

   Nếu dùng Supabase CLI thì chạy lần lượt `supabase/migrations/*.sql`, sau đó `supabase/seed.sql`.
3. Vào **Project Settings > API** và copy giá trị vào `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...      # chỉ để ở server, không đưa lên client
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```
4. **Bật đăng nhập Google:**
   - Vào **Authentication > Providers > Google**, nhập Client ID và Secret lấy từ Google Cloud Console (OAuth client loại Web). Redirect URI trên Google điền `https://xxxx.supabase.co/auth/v1/callback`.
   - Vào **Authentication > URL Configuration**:
     - Site URL: `http://localhost:3000`, khi deploy thì đổi thành domain thật;
     - Redirect URLs: thêm `http://localhost:3000/auth/callback` và `https://<domain>/auth/callback`.
5. **Tạo tài khoản chủ shop:**
   - Vào **Authentication > Users > Add user**, tạo email và mật khẩu.
   - Chạy SQL sau, thay bằng email vừa tạo:
     ```sql
     insert into public.staff (email, full_name, role) values ('email-cua-ban@gmail.com', 'Chủ shop', 'owner');
     ```
   - Đăng nhập ở `/admin/dang-nhap`, dùng email + mật khẩu hoặc Google với đúng email đó.

   Từ đây chủ shop mời thêm nhân viên ở mục **Nhân viên**.
6. Vào **Cài đặt > Thanh toán chuyển khoản**, nhập mã BIN ngân hàng, số tài khoản và chủ tài khoản. Trang chờ thanh toán sẽ hiện mã VietQR đúng số tiền và nội dung chuyển khoản của từng đơn.

### Tự xác nhận chuyển khoản (không bắt buộc)

- Đăng ký dịch vụ đối soát ngân hàng (SePay, Casso hoặc tương tự), trỏ webhook về `https://<domain>/api/webhooks/bank`.
- Header gửi kèm: `Authorization: Apikey <BANK_WEBHOOK_SECRET>`.
- Khi nội dung chuyển khoản có mã đơn (dạng `DP100123`) và đủ số tiền, đơn tự chuyển sang **Đã thanh toán**. Hệ thống chống ghi trùng theo mã giao dịch.

### Tự hủy đơn quá hạn chuyển khoản

Chọn một trong hai cách:

- **pg_cron (khuyên dùng):** bật extension pg_cron, rồi chạy `supabase/optional/cron.sql`. Đơn quá hạn sẽ được hủy mỗi 15 phút.
- **Vercel Cron:** `vercel.json` gọi `/api/cron/cancel-expired` mỗi ngày. Bạn cần đặt `CRON_SECRET` trên Vercel.

Khi hủy đơn, hệ thống hoàn lại tồn kho và suất pre-order.

---

## 3. Deploy lên Vercel

1. Đưa code lên GitHub, rồi vào Vercel chọn **Add New > Project > Import** repo.
2. Nhập Environment Variables giống `.env.local`, với `NEXT_PUBLIC_SITE_URL` là domain thật. Nếu dùng webhook và cron thì thêm `BANK_WEBHOOK_SECRET` và `CRON_SECRET`.
3. Deploy. Sau đó cập nhật Site URL và Redirect URLs trong Supabase Auth theo domain mới.

---

## 4. Cấu trúc thư mục

```
src/
  app/
    (shop)/            Trang khách: chủ, danh mục, sản phẩm, giỏ, thanh toán, chờ thanh toán, tài khoản, thu mua
    admin/(panel)/     Quản trị: tổng quan, đơn, sản phẩm, loại sản phẩm, danh mục, pre-order, thu mua, khách, nhân viên, cài đặt
    admin/dang-nhap/   Đăng nhập quản trị (email + mật khẩu hoặc Google, chỉ email được mời)
    pos/               Bán tại quầy
    api/               products (cuộn vô hạn), webhooks/bank, cron/cancel-expired
    auth/              callback Google, đăng xuất
  components/          shop/ (giao diện khách), admin/ (quản trị, POS)
  lib/
    catalog.ts         Đọc danh mục và sản phẩm (cache, phân trang theo con trỏ)
    admin-data.ts      Đọc dữ liệu cho quản trị
    actions/           Server Actions: đặt hàng, quản trị, thu mua, đăng nhập
    supabase/          Client Supabase cho server, trình duyệt, proxy
    demo/              Dữ liệu mẫu cho chế độ demo (giống supabase/seed.sql)
  proxy.ts             Làm mới phiên đăng nhập, chặn sớm /admin và /pos (Next.js 16 đổi middleware thành proxy)
supabase/
  migrations/          Schema, RLS, hàm nghiệp vụ, storage
  seed.sql             Dữ liệu mẫu
  all-in-one.sql       Gộp tất cả để dán 1 lần
  optional/cron.sql    Lịch tự hủy đơn bằng pg_cron
public/art/            Ảnh mẫu SVG (thay bằng ảnh thật khi có)
setup.ps1              Script cài đặt và chạy trên Windows
```

---

## 5. Nghiệp vụ đã có trong code

- **Sản phẩm tái sử dụng cho mọi ngành hàng:**
  - Mỗi **loại sản phẩm** tự khai báo thuộc tính (văn bản, số, danh sách chọn, có hoặc không, ngày) và cách bán: theo dõi tồn, món duy nhất, có biến thể, cho pre-order, cho thu mua.
  - Form sản phẩm tự hiện đúng các trường theo loại.
  - Thuộc tính đánh dấu "Lọc ở cửa hàng" tự thành bộ lọc trên trang danh sách.
  - Muốn chuyển sang ngành hàng khác, bạn chỉ cần tạo loại mới (có sẵn mẫu Thời trang, Mô hình).
- **Biến thể:** tối đa 3 tùy chọn (màu, kích cỡ…). Mỗi biến thể có SKU, giá và tồn kho riêng. Mọi sản phẩm luôn có ít nhất 1 biến thể, nên giỏ hàng, đơn và POS dùng chung một cách tính.
- **Đặt hàng an toàn:** giá, tồn kho và phí ship được tính lại trong database (hàm `place_order`). Dòng biến thể bị khóa khi trừ kho nên không bán vượt tồn. Hàng pre-order đặt riêng, chỉ thu tiền cọc.
- **Thanh toán:**
  - Chỉ chuyển khoản, không có COD.
  - Trang **Chờ thanh toán** có VietQR, nút sao chép, đếm ngược giữ đơn và nút "Tôi đã chuyển khoản".
  - Khách tải được ảnh chuyển khoản.
  - Khách xem đơn bằng mã + token bí mật, không cần đăng nhập.
- **Quản trị:**
  - Menu ngang trên máy tính, tab dưới trên điện thoại, bố cục một cột.
  - Đủ thao tác thêm, sửa, xóa. Thao tác xóa và hủy đều có hộp xác nhận.
  - Phân quyền theo 4 vai trò: chủ shop, quản lý, thu ngân, nhân viên kho.
- **POS:**
  - Quét mã vạch (máy quét dạng bàn phím) hoặc tìm theo tên.
  - Thu tiền mặt có tính tiền thối, hoặc chuyển khoản qua VietQR, hoặc thẻ.
  - Thu ngân giảm vượt hạn mức sẽ bị chặn.
  - In được hóa đơn.

## 6. Tối ưu đã áp dụng

- **Database:**
  - Index cho trang danh sách theo kiểu phân trang con trỏ (keyset): không dùng OFFSET, nên cuộn sâu vẫn nhanh.
  - Index GIN `pg_trgm` cho tìm kiếm tiếng Việt không dấu.
  - Index GIN `jsonb_path_ops` cho lọc theo thuộc tính.
  - Cột tổng hợp (tồn, giá thấp nhất) do trigger cập nhật, nên trang danh sách không cần join.
  - RLS dùng `(select auth.uid())` để Postgres chỉ tính một lần mỗi truy vấn.
- **Tốc độ tải trang:**
  - Trang chủ và trang sản phẩm render sẵn (ISR), cache dữ liệu danh mục và sản phẩm.
  - Khi admin sửa dữ liệu, cache được xóa ngay theo tag.
  - API danh sách có cache CDN `s-maxage`.
  - Font tự host (fontsource, có tiếng Việt).
  - Ảnh thật qua `next/image` (AVIF/WebP); ảnh sản phẩm có tỷ lệ cố định nên không nhảy bố cục.
- **Độ mượt:**
  - Cuộn vô hạn bằng TanStack Query + IntersectionObserver, có khung xương khi tải.
  - Hiệu ứng chỉ dùng `transform` và `opacity`, tôn trọng `prefers-reduced-motion`.
  - Vùng chạm tối thiểu 44px.

## 7. Cần làm tiếp và cần chủ shop chốt

- Các số mặc định (cọc 30%, tự hủy 24 giờ, giữ món 15 phút, báo giá thu mua 48 giờ, hạn mức 5.000.000₫, thu ngân giảm tối đa 5%) đều sửa được ở **Cài đặt**.
- **Chưa làm:**
  - giữ món duy nhất trong giỏ 15 phút (mới có công tắc trong Cài đặt);
  - mở và chốt ca POS;
  - nhập, xuất Excel;
  - quản lý banner và trang chính sách;
  - giao diện tối.
- **Kiểu TypeScript cho database:** chạy `npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts` để có kiểu chính xác theo schema.
- **Thêm component giao diện:** dùng `npx shadcn@latest add <tên>`. File `components.json` đã cấu hình sẵn.
