# Phân hệ Cửa hàng Quà Tặng Tận Tay (`Cửa hàng quà`) — DingDongGift

Tài liệu hướng dẫn kiến trúc, vận hành Admin, tạo đơn thử nghiệm, in mã QR cho từng hộp quà và danh sách các cấu hình cần bổ sung trước khi bán chính thức cho phân hệ thương mại điện tử **Quà tặng tận tay** trong `DingDongGift`.

---

## 1. Tổng quan & Bảo toàn hệ thống cũ

Phân hệ **Cửa hàng quà** cho phép khách đặt mua quà vật lý (`Khăn quàng cổ`, `Găng tay giữ ấm`, `Móc khóa kỷ niệm`, `Hộp quà đôi / Combo`), trong đó **mỗi hộp quà vật lý (`StoreOrderGiftUnit`)** được gắn **1 mẫu thiệp online thật** từ thư viện thiệp hiện có của DingDongGift và sở hữu **1 mã QR ngẫu nhiên độc lập** để người nhận quét và tự nhấn **"Mở thiệp"**.

- **Không ảnh hưởng hệ thống cũ**: Toàn bộ route, CSS và dữ liệu hiện hữu (`/`, `/products`, `/collections`, `/templates/*`, `/i/[slug]`, `/create`, `/editor/*`, `/checkout/*`, `/admin/*`, luồng `Shop` / `GiftCard` cũ) được giữ nguyên, cô lập CSS dưới lớp `.ddg-shop`.
- **Không tự động mở bán hàng mẫu**: Dữ liệu seed mặc định trong `src/lib/shop/seed.ts` khởi tạo 4 danh mục và các sản phẩm mẫu ở trạng thái **`DRAFT`** với tồn kho **`onHand = 0`** và dùng ảnh SVG minh họa trong `public/assets/shop/*.svg`. Khách sẽ chưa thấy các sản phẩm nháp cho tới khi Admin nhập ảnh thật/giá thật/tồn kho hoặc chủ động bật chế độ thử nghiệm QA trong `/admin/qua-tang/cau-hinh`.

---

## 2. Bản đồ Route & API

### 2.1. Trang khách hàng (Storefront & Order Tracking)
| Route | Chức năng |
|---|---|
| `/qua-tang` | Landing Page Cửa hàng quà (Hero, danh mục, nổi bật, combo, gallery, quy trình 3 bước, gợi ý theo dịp, tra cứu nhanh) |
| `/qua-tang/tat-ca` | Danh mục đầy đủ hỗ trợ tìm kiếm không dấu, lọc theo danh mục, tầm giá, dịp tặng, còn hàng, sắp xếp |
| `/qua-tang/danh-muc/[slug]` | Danh mục theo nhóm (`khan-quang`, `gang-tay`, `moc-khoa`, `hop-qua`) |
| `/qua-tang/san-pham/[slug]` | Chi tiết sản phẩm, chọn biến thể màu/size, tồn kho khả dụng, chọn số lượng, mở Wizard cá nhân hóa thiệp 4 bước |
| `/qua-tang/gio-hang` | Giỏ quà chi tiết: cấu hình riêng **từng hộp** (`Hộp #1`, `Hộp #2`, ...) khi mua nhiều hộp |
| `/qua-tang/thanh-toan` | Checkout: địa chỉ người nhận, tự tính phí ship theo vùng/tỉnh thành từ server, mã ưu đãi, chọn phương thức thanh toán |
| `/qua-tang/thanh-toan/[orderCode]` | Hướng dẫn thanh toán VietQR động (nội dung CK `DDG <orderCode>`) & nút `"Tôi đã chuyển khoản"` gửi đối soát thủ công |
| `/qua-tang/dat-hang-thanh-cong/[orderCode]` | Trang xác nhận sau tạo đơn / COD / thanh toán thành công |
| `/qua-tang/tra-cuu-don` | Tra cứu đơn ẩn danh an toàn bằng `Mã đơn + SĐT/Email đặt hàng` |
| `/qua-tang/don-hang/[orderCode]` | Chi tiết đơn, tiến độ 5 chặng, vận đơn, chỉnh sửa nội dung thiệp trước khi `PACKING` (yêu cầu xác thực chủ đơn hoặc cookie tra cứu) |
| `/tai-khoan/don-hang` | Lịch sử đơn hàng quà tặng của tài khoản đã đăng nhập |

### 2.2. Trang người nhận QR (Zero-Chrome)
| Route / API | Chức năng |
|---|---|
| `/mo-qua/[giftToken]` | Trang nhận thiệp toàn màn hình không navbar shop; hỗ trợ `?mode=preview` cho Admin kiểm tra nội bộ |
| `GET /api/gifts/[token]/landing` | Trả trạng thái thiệp & thông tin an toàn để hiển thị màn chờ (tuyệt đối **không kích hoạt** `firstOpenedAt` / `expiresAt`) |
| `POST /api/gifts/[token]/open` | Kích hoạt mở thiệp lần đầu (`READY_UNOPENED` -> `ACTIVE`, gán `firstOpenedAt` & `expiresAt`) và nạp HTML mẫu thiệp online thật |

### 2.3. Cổng vận hành Admin (`/admin/qua-tang`)
| Route | Chức năng |
|---|---|
| `/admin/qua-tang` | Dashboard KPI đơn hàng, doanh thu, cảnh báo tồn kho thấp, cảnh báo đơn chờ đối soát chuyển khoản |
| `/admin/qua-tang/san-pham` | CRUD danh mục, sản phẩm, biến thể màu/size/SKU, upload ảnh sản phẩm, cấu hình mẫu thiệp áp dụng, trạng thái `DRAFT / ACTIVE / ARCHIVED` |
| `/admin/qua-tang/kho` | Sổ kho (`StoreInventory`), điều chỉnh nhập/xuất/kiểm kê (`IMPORT / ADJUSTMENT`), theo dõi số đang giữ chỗ (`reserved`) và lịch sử biến động |
| `/admin/qua-tang/don-hang` | Danh sách đơn hàng, lọc theo trạng thái / phương thức thanh toán / tìm kiếm, xuất CSV an toàn chống formula injection |
| `/admin/qua-tang/don-hang/[id]` | Chi tiết đơn: **đối soát chuyển khoản (`CONFIRM_PAID` / `REJECT_REVIEW`)**, chuyển trạng thái đóng gói (`PACKING` tự khóa sửa thiệp), gắn mã vận đơn HTTPS allowlisted, **tải PNG/SVG & in phiếu QR từng hộp (`A6`, `A7`, `90×55mm`)**, cấp lại QR (`REISSUE_QR`), hủy / hoàn tiền |
| `/admin/qua-tang/cau-hinh` | Cấu hình bật/tắt cửa hàng, tài khoản ngân hàng nhận VietQR thật, PayOS/COD limits, phí ship theo vùng, mã ưu đãi, gói thiệp, hộp quà, và nút bật/tắt hàng mẫu QA |

### 2.4. API Chính (`src/app/api/`)
- **Khách hàng (`/api/shop/*`)**: `products`, `products/[slug]`, `categories`, `templates`, `templates/preview`, `customizations`, `customizations/[id]`, `cart`, `cart/items`, `cart/items/[id]`, `cart/merge`, `shipping/quote`, `checkout`, `settings`, `wishlist`, `uploads`, `orders/my`, `orders/lookup`, `orders/[code]/access`, `orders/[code]/payment-status`, `orders/[code]/payment-review`, `orders/[code]/units/[unitId]/card`.
- **Admin (`/api/admin/shop/*`)**: `dashboard`, `categories`, `categories/[id]`, `products`, `products/[id]`, `inventory`, `inventory/adjust`, `orders`, `orders/[id]`, `orders/[id]/verify-payment`, `orders/[id]/refund`, `qr/[unitId]` (`GET` JSON/PNG/SVG, `POST` `MARK_PRINTED | VERIFY_SCAN | REISSUE_QR`), `settings`, `qa-demo`.

---

## 3. Cơ chế Bảo mật & Toàn vẹn Dữ liệu

1. **Không giả thanh toán & không hardcode STK demo**: Khi chưa cấu hình ngân hàng thật và chưa bật PayOS, hệ thống chặn/ẩn phương thức chưa sẵn sàng thay vì sinh QR giả. Chuyển khoản VietQR luôn chờ Admin kiểm tra sao kê và bấm xác nhận (`CONFIRM_PAID`).
2. **Chống oversell & Idempotency Checkout**: `POST /api/shop/checkout` kiểm tra idempotency key, giữ chỗ kho (`StoreStockReservation` với `reserved += qty` và tự nhả sau `reservationTtlMinutes` khi hết hạn) và chỉ trừ `onHand` thực tế khi đơn chuyển `PAID`.
3. **Giá & phí tính hoàn toàn ở Server**: Client không gửi giá sản phẩm, phí ship, hay giảm giá; server tính lại toàn bộ từ `StoreVariant`, `ShopSettings.shipping.zones`, `promoCodes`, `cardPlans`, `giftWrapOptions`.
4. **Quyền riêng tư đơn hàng (Order Privacy)**: Đường dẫn `/qua-tang/don-hang/[orderCode]` yêu cầu đúng phiên chủ đơn, signed guest token/cookie, hoặc xác thực qua `/qua-tang/tra-cuu-don`. Khách lạ truy cập trực tiếp sẽ bị ẩn SĐT, email, địa chỉ chi tiết và nội dung thiệp.
5. **QR Token duy nhất cho TỪNG HỘP**: Mỗi `StoreOrderGiftUnit` tạo token ngẫu nhiên riêng (`giftTokenHash` để tra cứu không lộ raw token + `giftTokenEncrypted` AES để Admin in lại đúng QR khi đóng gói). Quét hoặc GET trang `/mo-qua/[giftToken]` **không bao giờ** bắt đầu đếm ngày hết hạn; chỉ `POST /api/gifts/[token]/open` khi người nhận bấm nút **"Mở thiệp"** mới ghi `firstOpenedAt` và `expiresAt`.
6. **Phân quyền Server-side & Upload an toàn**: Trang & API `/admin/qua-tang` kiểm tra quyền trên server (`ADMIN` / `SHOP_MANAGER` cho vận hành đơn, kho, sản phẩm, QR; cấu hình tài chính/cài đặt shop & toggle QA giới hạn chặt cho `ADMIN` hoặc theo cờ `allowShopManagerPaymentReview`).

---

## 4. Hướng dẫn vận hành Admin

### 4.1. Cấu hình ban đầu (Thanh toán, Vận chuyển, Chính sách)
1. Đăng nhập tài khoản quyền `ADMIN` tại `/login` rồi vào **`/admin/qua-tang/cau-hinh`**.
2. Trong mục **Chuyển khoản ngân hàng (VietQR)**:
   - Bật `Chuyển khoản ngân hàng / VietQR`.
   - Chọn đúng ngân hàng (`bankCode`), nhập **Số tài khoản thật**, **Tên chủ tài khoản không dấu**, chi nhánh và hướng dẫn thanh toán.
3. Trong mục **Vận chuyển**:
   - Kiểm tra bảng cước 3 vùng (`INNER_CITY` 22.000đ, `REGIONAL` 32.000đ, `REMOTE` 45.000đ), ngưỡng miễn phí vận chuyển (mặc định đang cấu hình hoặc chỉnh tùy chiến dịch) và bật **Đã cấu hình cước vận chuyển (`configured = true`)**.
4. Nhấn **Lưu cấu hình**.

### 4.2. Nhập sản phẩm thật, giá, ảnh và tồn kho
1. Vào **`/admin/qua-tang/san-pham`**:
   - Chọn tạo sản phẩm mới hoặc mở sửa sản phẩm nháp (`DRAFT`).
   - Tải ảnh sản phẩm thật (PNG/JPG/WEBP) thay thế ảnh SVG minh họa, hoặc chỉnh mô tả, hướng dẫn bảo quản, mẫu thiệp mặc định và danh sách biến thể (`SKU`, màu sắc, kích thước, `priceVnd`, `compareAtVnd`).
   - Đổi trạng thái từ `DRAFT` sang **`ACTIVE`** và lưu.
2. Vào **`/admin/qua-tang/kho`**:
   - Tìm đến từng biến thể vừa tạo, chọn thao tác **`IMPORT` (Nhập kho)**, nhập số lượng thực tế trong kho (ví dụ `+20`) và ghi rõ lý do phiếu nhập. Hệ thống tự ghi nhận sổ cái `StoreInventoryMovement`.
3. *(Tùy chọn chỉ dùng khi test nội bộ QA)*: Trong **`/admin/qua-tang/cau-hinh`** có nút công cụ QA cho phép gọi `PUBLISH_SAMPLE_CATALOG` (chuyển các sản phẩm `DRAFT` thành `ACTIVE`, bơm 20 tồn kho thử nghiệm cho biến thể đang = 0 và bật `shipping.configured = true`) và `REVERT_SAMPLE_TO_DRAFT` để đưa về `DRAFT` khi kết thúc QA.

### 4.3. Tạo đơn test & đối soát chuyển khoản
1. Mở `/qua-tang` -> chọn một sản phẩm `ACTIVE` còn tồn kho -> nhấn **Chọn mẫu & Viết thiệp ngay** để đi qua Wizard 4 bước (chọn mẫu thiệp thật, nhập lời chúc/ảnh/nhạc nền, xem preview thật, chọn gói thời hạn/gói hộp quà).
2. Đặt số lượng `2` -> **Thêm vào giỏ quà** -> vào `/qua-tang/gio-hang` để thấy rõ 2 hộp cấu hình độc lập (`Hộp #1`, `Hộp #2`).
3. Vào `/qua-tang/thanh-toan` -> điền địa chỉ -> kiểm tra server tự tính phí ship -> chọn **Chuyển khoản VietQR** -> tạo đơn.
4. Trên trang `/qua-tang/thanh-toan/[orderCode]`, nhập mã giao dịch thử nghiệm rồi bấm **Tôi đã chuyển khoản** -> trạng thái đơn thành **`PAYMENT_REVIEW_REQUESTED`** (`Chờ đối soát chuyển khoản`, tuyệt đối chưa `PAID`).
5. Quay lại **`/admin/qua-tang/don-hang`**, mở đơn vừa tạo -> nhập mã FT tham chiếu sao kê và bấm **Xác nhận ĐÃ NHẬN TIỀN** -> hệ thống chốt trừ kho thực (`onHand -= qty`, giải phóng `reserved`) và chuyển trạng thái thiệp sang `READY_UNOPENED`.

### 4.4. Đóng gói & In phiếu QR cho từng hộp
1. Tại **`/admin/qua-tang/don-hang/[id]`**, bấm chuyển trạng thái đơn sang **`PACKING` (`Đang gói quà & gắn QR`)**. Bước này tự động khóa (`isCardLocked = true`) để khách không thể sửa nội dung thiệp sau khi đã in.
2. Nhấn **Tải QR tất cả hộp** để hiển thị đủ QR riêng cho từng hộp (`Box #1`, `Box #2`, ...).
3. Chọn khổ giấy in mong muốn (**Khổ A6 `105×148mm`**, **Khổ A7 `74×105mm`**, hoặc **Card `90×55mm`**), sau đó bấm **In phiếu QR** hoặc tải từng file `Tải PNG` / `Tải SVG` riêng cho mỗi hộp.
4. Nếu cần kiểm tra hiển thị trước khi dán hộp, dùng link **Mở kiểm tra nội bộ** (`/mo-qua/[giftToken]?mode=preview`) hoặc nút **Xác minh quét QR** — các thao tác này không làm mất lượt mở đầu của người nhận.
5. Gửi link `/mo-qua/[giftToken]` (hoặc quét QR in trên thiệp) ở trình duyệt ẩn danh để kiểm tra luồng người nhận nhấn **"Mở thiệp"** và kích hoạt đếm thời hạn độc lập cho từng hộp.

---

## 5. Những điểm cần cấu hình thêm trước khi bán thật (Production Checklist)

- [ ] **Ảnh sản phẩm thật & Nội dung hàng thật**: Thay thế toàn bộ ảnh SVG mẫu trong `public/assets/shop/` bằng ảnh chụp sản phẩm thật của cửa hàng; điền giá bán thật, tồn kho thật và chỉ để `ACTIVE` các sản phẩm kinh doanh thực tế.
- [ ] **Tài khoản ngân hàng & Cổng thanh toán PayOS**:
  - Cập nhật số tài khoản ngân hàng nhận tiền thật tại `/admin/qua-tang/cau-hinh`.
  - Nếu dùng thanh toán tự động PayOS, cấu hình đầy đủ biến môi trường `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`, `PAYOS_WEBHOOK_URL` (HTTPS công khai trỏ về webhook của hệ thống) và bật PayOS trong `/admin/qua-tang/cau-hinh`.
- [ ] **Nhà vận chuyển & Tự động hóa vận đơn**: Hiện tại Admin nhập tên đơn vị vận chuyển, mã vận đơn và link tracking HTTPS thuộc danh sách tin cậy (`ghtk.vn`, `ghn.vn`, `viettelpost.com.vn`, `jtexpress.vn`, `ninjavan.co`, `vnpost.vn`, `spx.vn`, `lalamove.com`, `ahamove.com`) thủ công trên `/admin/qua-tang/don-hang/[id]`. Nếu muốn đẩy đơn và tự động đồng bộ trạng thái từ GHN/GHTK/Viettel Post, cần tích hợp thêm API credentials và webhook của đơn vị vận chuyển tương ứng.
- [ ] **Biến môi trường bảo mật & Cơ sở dữ liệu Production**:
  - Đặt secret riêng đủ mạnh cho `SESSION_SECRET`, `GIFT_CARD_ACTIVATION_PEPPER`, `PAYMENT_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` trên môi trường thật.
  - Đổi cấu hình upload ảnh từ local `./public/uploads` sang object storage (S3/R2) qua `STORAGE_PROVIDER`, `S3_*` nếu deploy đa instance/serverless để tránh mất file upload khi redeploy.
  - Chuyển database từ SQLite (`file:./dev.db`) sang PostgreSQL bằng `npm run db:postgres` khi lên production.
- [ ] **Email / Thông báo giao dịch**: Cấu hình `EMAIL_PROVIDER` / `RESEND_API_KEY` nếu muốn gửi email xác nhận đơn tự động cho khách.

---

## 6. Lệnh kiểm tra kỹ thuật

```bash
# Kiểm tra kiểu TypeScript
npm run typecheck

# Chạy toàn bộ unit & integration test (bao gồm tests/unit/shop-core.test.ts và các suite cũ)
npm test

# Build production
npm run build

# Chạy E2E Playwright (responsive 320-1440px, reduced motion, full luồng mua-duyệt-QR-mở thiệp, regression cũ)
npx playwright test --config=playwright.shop.config.ts
```

