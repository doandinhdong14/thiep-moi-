# 🚀 Hướng Dẫn Triển Khai Ding Dong Gift Lên Railway Với PostgreSQL

Tài liệu này hướng dẫn chi tiết cách deploy toàn bộ hệ thống Ding Dong Gift (MomentLink) lên nền tảng **Railway** kết hợp cơ sở dữ liệu **PostgreSQL** chuẩn production.

---

## 1. Chuẩn Bị Trước Khi Deploy

1. Tài khoản [Railway.app](https://railway.app)
2. Mã nguồn được đẩy lên GitHub (ví dụ: `https://github.com/doandinhdong14/thiep-moi-.git`)
3. Tài khoản [PayOS](https://payos.vn) (nếu dùng cổng thanh toán tự động)

---

## 2. Các Bước Triển Khai Trên Railway

### Bước 2.1: Tạo Dự Án Mới (New Project)
1. Đăng nhập vào Railway Dashboard.
2. Bấm **+ New Project** -> Chọn **Deploy from GitHub repo**.
3. Chọn repository `thiep-moi-` của bạn.

### Bước 2.2: Thêm Cơ Sở Dữ Liệu PostgreSQL ("Origress")
1. Trong màn hình dự án vừa tạo, bấm **+ New** (hoặc dấu `+`).
2. Chọn **Database** -> Chọn **Add PostgreSQL**.
3. Railway sẽ tự động khởi tạo cụm cơ sở dữ liệu PostgreSQL cho bạn trong vài giây.

### Bước 2.3: Liên Kết Biến Môi Trường (Environment Variables)
Vào service web của bạn trên Railway -> chọn tab **Variables** -> thêm các biến sau:

| Tên biến | Giá trị mẫu / Mô tả |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (Chọn Reference từ Postgres service vừa tạo) |
| `NEXT_PUBLIC_APP_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` hoặc tên miền tuỳ chỉnh |
| `SESSION_SECRET` | Chuỗi ký tự bảo mật ngẫu nhiên (tối thiểu 32 ký tự) |
| `DATA_ENCRYPTION_KEY` | Chuỗi 32 ký tự dùng mã hoá dữ liệu nhạy cảm |
| `GIFT_CARD_ACTIVATION_PEPPER` | Chuỗi bí mật dùng băm mã thẻ cào |
| `ADMIN_BOOTSTRAP_EMAIL` | Email đăng nhập ban đầu của Super Admin (ví dụ: `admin@dingdonggift.com`) |
| `ADMIN_BOOTSTRAP_PASSWORD` | Mật khẩu ban đầu của Super Admin (ví dụ: `Admin@DingDongGift2026!`) |
| `PAYMENT_MODE` | `automatic` (nếu dùng PayOS) hoặc `manual_review` |
| `PAYOS_CLIENT_ID` | Client ID từ cổng PayOS |
| `PAYOS_API_KEY` | API Key từ cổng PayOS |
| `PAYOS_CHECKSUM_KEY` | Checksum Key từ cổng PayOS |
| `PAYOS_WEBHOOK_URL` | `https://ten-mien-cua-ban/api/v1/payments/webhooks/payos` |
| `STORAGE_PROVIDER` | `local` (hoặc `s3` nếu cấu hình Cloudflare R2 / AWS S3) |

> [!NOTE]
> Hệ thống đã có script tự động `scripts/prisma-prepare.js`. Khi phát hiện `DATABASE_URL` là PostgreSQL, Prisma sẽ tự động chuyển đổi sang provider `postgresql`, thực hiện `prisma db push` và tự động seed tài khoản Admin, các mẫu thiệp P0 và danh mục occasions!

### Bước 2.4: Khởi Chạy (Deploy)
1. Railway sẽ tự động kích hoạt tiến trình Build:
   - Cài đặt thư viện bằng `pnpm install`
   - Chạy `prisma-prepare.js` chuyển sang PostgreSQL
   - Đồng bộ bảng vào cơ sở dữ liệu Postgres bằng `prisma db push`
   - Khởi tạo dữ liệu mẫu và tài khoản quản trị bằng `prisma/seed.ts`
   - Biên dịch Next.js production build
2. Sau khi build hoàn tất, Railway sẽ kiểm tra sức khỏe tại endpoint:
   ```
   GET /api/v1/health
   ```
   Nếu database đã kết nối thành công, hệ thống chuyển sang trạng thái **Active (Green)**!

---

## 3. Tạo Tên Miền Công Khai (Public Domain)

1. Vào tab **Settings** của web service.
2. Tìm mục **Networking** -> Bấm **Generate Domain** (sẽ có dạng `xxx.up.railway.app`).
3. (Tuỳ chọn) Bấm **Custom Domain** để trỏ tên miền riêng như `dingdonggift.com`.
4. Cập nhật lại giá trị biến `NEXT_PUBLIC_APP_URL` khớp với tên miền này.

---

## 4. Quản Trị Hệ Thống & Phân Quyền Sau Khi Deploy

1. Truy cập đường dẫn: `https://<ten-mien>/login` hoặc `/auth/sign-in`
2. Đăng nhập bằng tài khoản bootstrap:
   - **Email**: Giá trị từ biến `ADMIN_BOOTSTRAP_EMAIL` (Mặc định: `admin@dingdonggift.com`)
   - **Mật khẩu**: Giá trị từ biến `ADMIN_BOOTSTRAP_PASSWORD` (Mặc định: `Admin@DingDongGift2026!`)
3. Truy cập vào **Admin Portal**:
   - `https://<ten-mien>/admin`
   - Quản lý tài khoản và phân quyền: `https://<ten-mien>/admin/users`
   - Quản lý đơn hàng & thanh toán: `https://<ten-mien>/admin/payments`
   - Quản lý đối tác hoa / quà: `https://<ten-mien>/admin/shops`
   - Quản lý cộng tác viên: `https://<ten-mien>/admin/affiliates`
   - Quản lý thẻ in QR: `https://<ten-mien>/admin/gift-cards`

---

## 5. Chuyển Đổi Database Ở Môi Trường Local (Máy cá nhân)

Nếu bạn muốn chuyển đổi giữa SQLite và PostgreSQL trên máy phát triển:
```bash
# Dùng PostgreSQL
pnpm run db:postgres

# Dùng SQLite (mặc định cho máy local không cài Postgres)
pnpm run db:sqlite

# Tự động chuẩn bị theo DATABASE_URL trong file .env
pnpm run db:prepare
```

