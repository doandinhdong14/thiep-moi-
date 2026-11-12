# SHOP_INTEGRATION_NOTES — Cửa hàng quà (Quà tặng tận tay) × DingDongGift

Tài liệu phân tích tích hợp hệ thống trước khi triển khai phân hệ e-commerce **"Cửa hàng quà" / "Quà tặng tận tay"** trong repository `thiep-moi-` theo đặc tả `cua hang offline .md`.

---

## 1. Stack hiện hữu của repository

- **Framework**: Next.js `14.2.35` (App Router), React `18`, TypeScript.
- **Styling**: Tailwind CSS `3.4` (`src/app/globals.css`, `tailwind.config.ts`). Toàn bộ CSS của phân hệ shop phải scope trong `.ddg-shop` (`src/styles/shop.css`) để không ảnh hưởng landing `/`, `/products`, `/collections`, `/create`, `/editor/*`, `/i/[slug]`, `/templates/[slug]`.
- **Database & ORM**: Prisma `5.22` (`prisma/schema.prisma`) với `scripts/prisma-prepare.js` tự chuyển `provider` giữa `"sqlite"` (local dev `file:./dev.db`) và `"postgresql"` (production/Railway).
  - **Ràng buộc schema quan trọng**: Để tương thích đồng thời SQLite và PostgreSQL, schema không dùng `enum` block của Prisma, không dùng scalar list (`String[]`), không dùng `@db.*` native types; mọi status dùng `String` và cấu trúc phức tạp lưu JSON string.
- **Auth & RBAC**: Custom session cookie `dingdong_session` trong `src/lib/auth/session.ts` (`getCurrentUser()`, `requireAuth()`, `requireRole(allowedRoles)`). Roles qua bảng `RoleAssignment` (`ADMIN`, `SHOP_MANAGER` mới bổ sung cho shop).
- **Payment & QR hiện có**:
  - `src/lib/payments/payos.ts`: SDK `@payos/node` + `processPayOSWebhookPayload`.
  - `src/lib/payments/vietqr.ts`: `buildVietQrPayload`, `resolveVietQRBank`, `buildSafeVietQrDescription`.
  - `src/lib/qr/index.ts`: `generateQrDataUrl`, `generateQrPng`, `generateQrSvg` dùng package `qrcode`.
- **Upload & Storage**: `src/lib/storage/index.ts` (local + fallback `SystemSetting` `asset_blob:*` phục vụ qua rewrite `/uploads/:filename` -> `/api/v1/assets/file/:filename`).
- **Thư viện thiệp hiện có**:
  - `src/lib/templates/registry.ts` (`TEMPLATES_REGISTRY` gồm 18 template, 10 template hiển thị mặc định qua `getEffectiveVisibleTemplates()` trong `src/lib/templates/adminConfig.ts`, hỗ trợ `thiep-3`..`thiep-10`, `thiep-giang-sinh`, `thiep-xmas`...).
  - `src/lib/templates/hydrateInteractiveHtml.ts` & `src/components/template-renderer/TemplateRenderer.tsx` (render thiệp HTML tương tác qua `<iframe srcDoc>` hoặc React schema block).
- **Testing**: Vitest `2.1.4` (`vitest.config.ts`) + Playwright `1.48.2`.

---

## 2. Quy tắc bảo toàn tuyệt đối hệ thống cũ

1. **Không đụng tới các model & luồng đối tác hoa / thẻ QR sẵn có**:
   - Giữ nguyên `Shop`, `ShopMembership`, `ShopProduct`, `ShopRequest`, `GiftCardBatch`, `GiftCard`, `GiftCardBinding` (`/shops`, `/shops/[slug]`, `/shop/dashboard`, `/gift/[publicCode]`, `/admin/shops`, `/admin/gift-cards`) và test `tests/unit/m5-shop-giftcard.test.ts`.
   - Toàn bộ dữ liệu Cửa hàng quà mới dùng namespace riêng `Store*` (`StoreCategory`, `StoreProduct`, `StoreVariant`, `StoreInventory`, `StoreInventoryMovement`, `StoreCart`, `StoreCartItem`, `StoreGiftCustomization`, `StoreOrder`, `StoreOrderItem`, `StoreOrderGiftUnit`, `StorePayment`, `StorePaymentEvent`, `StoreStockReservation`, `StoreShipment`, `StoreGiftCardLink`, `StoreWishlistItem`, `StoreAuditLog`).
2. **Bảo vệ quy tắc Zero-Ad tuyệt đối trên `/i/[slug]`**:
   - `tests/unit/qr-and-personalization.test.ts` kiểm tra `/i/[slug]` và `hydrateInteractiveHtml` không chứa `"dingdong"`. Không thêm CTA/branding shop vào `/i/[slug]` hoặc `hydrateInteractiveHtml`.
   - Chỉ đặt nút dẫn nhẹ sang `/qua-tang` tại `/products`, `/collections`, `/templates/[slug]`, `/dashboard`, và Navbar.
3. **Tách route & API mới sạch sẽ**:
   - Storefront khách hàng: `/qua-tang`, `/qua-tang/tat-ca`, `/qua-tang/danh-muc/[slug]`, `/qua-tang/san-pham/[slug]`, `/qua-tang/gio-hang`, `/qua-tang/thanh-toan`, `/qua-tang/thanh-toan/[orderCode]`, `/qua-tang/dat-hang-thanh-cong/[orderCode]`, `/qua-tang/tra-cuu-don`, `/qua-tang/don-hang/[orderCode]`, `/tai-khoan/don-hang`.
   - Trang mở thiệp QR người nhận (zero-chrome, ẩn `Navbar`/`Footer` trong `SiteChrome.tsx`): `/mo-qua/[giftToken]`.
   - Admin Cửa hàng quà: `/admin/qua-tang`, `/admin/qua-tang/san-pham`, `/admin/qua-tang/kho`, `/admin/qua-tang/don-hang`, `/admin/qua-tang/don-hang/[id]`, `/admin/qua-tang/cau-hinh`.
   - API routes: `/api/shop/*`, `/api/gifts/*`, `/api/admin/shop/*`, `/api/payments/shop/*` (và bổ sung CSRF + rate limit trong `src/middleware.ts`).

---

## 3. Chiến lược tích hợp Payment, QR & Thiệp online

- **Thanh toán an toàn**:
  - `bank_transfer` (VietQR): Chỉ kích hoạt và render QR khi Admin cấu hình đầy đủ `bankCode`, `bankAccountNo`, `bankAccountName` trong `/admin/qua-tang/cau-hinh`. Tuyệt đối không đặt giá trị giả để thu tiền thật. Nút `"Tôi đã chuyển khoản"` chỉ chuyển trạng thái sang `PAYMENT_REVIEW_REQUESTED`, chờ Admin đối soát xác nhận.
  - `payos`: Tích hợp qua `getPayOSClient()` và xử lý webhook có xác thực chữ ký tại `/api/payments/shop/webhook` lẫn fallback trong `processPayOSWebhookPayload` (`src/lib/payments/payos.ts`).
  - `cod`: Chỉ bật khi Admin cho phép.
- **Reservation & Chống oversell**:
  - Checkout tính toàn bộ giá/ship/chiết khấu trên server (VND nguyên), trừ `available` (`reserved += qty` với điều kiện atomic `onHand - reserved >= qty`), tạo `StoreStockReservation` có TTL (mặc định 30 phút).
  - Nếu hết TTL mà sau đó tiền mới về, kiểm tra lại tồn kho khả dụng; nếu không đủ hàng, gắn cờ `STOCK_CONFLICT_REFUND_NEEDED` cho Admin xử lý thay vì cho tồn kho âm.
- **QR Opaque Token & Quy tắc kích hoạt lần mở đầu tiên**:
  - Mỗi hộp quà (`StoreOrderGiftUnit`, kể cả khi mua số lượng `> 1`) có một token ngẫu nhiên không đoán được, lưu hash SHA-256 kèm server pepper (`tokenHash`), kèm `code` in hỗ trợ đọc tay (`DDG-XXXX`).
  - `GET /api/gifts/[token]/landing` **KHÔNG** ghi nhận `firstOpenedAt`, không trả PII người gửi/người nhận.
  - Chỉ `POST /api/gifts/[token]/open` (khi người nhận bấm `"Mở thiệp ♡"`) mới thực hiện transaction atomic đặt `firstOpenedAt = now`, tính `expiresAt` nếu gói có `durationDays != null`, chuyển sang `ACTIVE` và trả nội dung thiệp đã hydrate từ `GiftCardService`.
  - Hỗ trợ chế độ kiểm tra nội bộ `?mode=preview` (chỉ Admin/`SHOP_MANAGER` đã đăng nhập) để quét thử lúc đóng gói mà không kích hoạt thời hạn thiệp.

---

## 4. Kế hoạch triển khai & Kiểm thử

- **Phase B**: Mở rộng `prisma/schema.prisma`, tạo `src/lib/shop/*` (`types`, `settings`, `auth`, `inventory`, `gift-card`, `shipping`, `payment`, `seed`), tạo đầy đủ API `/api/shop/*`, `/api/gifts/*`, `/api/admin/shop/*`, `/api/payments/shop/*`, cập nhật `src/middleware.ts`. Seed 4 danh mục chuẩn & 7 sản phẩm mẫu ở trạng thái `DRAFT` cùng SVG minh họa cục bộ.
- **Phase C**: CSS `.ddg-shop` với motion tokens & `prefers-reduced-motion`, cập nhật `Navbar`/`SiteChrome`/`AdminHeader`, xây toàn bộ trang khách hàng (`/qua-tang/*`), `/mo-qua/[giftToken]` và admin `/admin/qua-tang/*` (gồm trang in phiếu QR A6/A7/90x55mm).
- **Phase D**: Chạy `vitest run` (test cũ + test unit/integration shop mới cho HP01–HP05 & E01–E25), `tsc --noEmit`, `next lint`, `next build`, kiểm thử Playwright desktop & mobile (320px–1440px), tạo `SHOP_README.md` và báo cáo trung thực mọi kết quả thực tế.

