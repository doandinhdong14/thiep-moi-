import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const SHOP_SETTINGS_KEY = "shop_store_settings_v1";

const TS = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const PRODUCT_SLUG = `e2e-khan-len-${TS}`;
const SKU_1 = `E2E-SKU-${TS}-1`;
const ADMIN_EMAIL = `e2e_admin_${TS}@dingdonggift.test`;
const ADMIN_PASSWORD = "AdminE2ePassword!123";

let originalSettingsValue: string | null = null;
let hadOriginalSettings = false;
let createdAdminId = "";
let createdProductId = "";
let createdVariantId = "";
let createdOrderCode = "";
let createdOrderId = "";
let existingTemplateSlug = "";

async function checkNoOverflow(page: import("@playwright/test").Page, routeLabel: string) {
  const overflow = await page.evaluate(() => {
    const docEl = document.documentElement;
    const offenders: string[] = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 1 && r.width > 0 && r.height > 0) {
        const cls = typeof el.className === "string" ? el.className.slice(0, 60) : "";
        offenders.push(`${el.tagName.toLowerCase()}.${cls}[r=${Math.round(r.right)}]`);
      }
    });
    return {
      scrollWidth: docEl.scrollWidth,
      innerWidth: window.innerWidth,
      diff: docEl.scrollWidth - window.innerWidth,
      offenders: offenders.slice(0, 5),
    };
  });
  expect(
    overflow.diff,
    `Horizontal overflow on ${routeLabel} (${overflow.scrollWidth} > ${overflow.innerWidth}): ${overflow.offenders.join(", ")}`,
  ).toBeLessThanOrEqual(2);
}

async function cleanupE2eRecords() {
  const e2eOrders = await prisma.storeOrder.findMany({
    where: {
      OR: [
        ...(createdOrderId ? [{ id: createdOrderId }] : []),
        { customerName: "Khách E2E Đặt Hàng" },
      ],
    },
    select: { id: true },
  });
  for (const o of e2eOrders) {
    await prisma.storeAuditLog.deleteMany({
      where: { OR: [{ orderId: o.id }, { targetId: o.id }] },
    });
    await prisma.storeInventoryMovement.deleteMany({ where: { orderId: o.id } });
    await prisma.storeStockReservation.deleteMany({ where: { orderId: o.id } });
    await prisma.storePayment.deleteMany({ where: { orderId: o.id } });
    await prisma.storeShipment.deleteMany({ where: { orderId: o.id } });
    await prisma.storeOrderGiftUnit.deleteMany({ where: { orderId: o.id } });
    await prisma.storeOrderItem.deleteMany({ where: { orderId: o.id } });
    await prisma.storeOrder.deleteMany({ where: { id: o.id } });
  }

  const e2eProducts = await prisma.storeProduct.findMany({
    where: {
      OR: [
        ...(createdProductId ? [{ id: createdProductId }] : []),
        { slug: { startsWith: "e2e-khan-len-" } },
      ],
    },
    include: { variants: { select: { id: true } } },
  });
  for (const p of e2eProducts) {
    for (const v of p.variants) {
      await prisma.storeCartItem.deleteMany({ where: { variantId: v.id } });
      await prisma.storeInventoryMovement.deleteMany({ where: { variantId: v.id } });
      await prisma.storeStockReservation.deleteMany({ where: { variantId: v.id } });
      await prisma.storeOrderItem.deleteMany({ where: { variantId: v.id } });
      await prisma.storeInventory.deleteMany({ where: { variantId: v.id } });
      await prisma.storeVariant.deleteMany({ where: { id: v.id } });
    }
    await prisma.storeProduct.deleteMany({ where: { id: p.id } });
  }

  const e2eAdmins = await prisma.user.findMany({
    where: {
      OR: [
        ...(createdAdminId ? [{ id: createdAdminId }] : []),
        { email: { startsWith: "e2e_admin_" } },
      ],
    },
    select: { id: true },
  });
  for (const a of e2eAdmins) {
    await prisma.storeAuditLog.deleteMany({ where: { actorId: a.id } });
    await prisma.session.deleteMany({ where: { userId: a.id } });
    await prisma.roleAssignment.deleteMany({ where: { userId: a.id } });
    await prisma.user.deleteMany({ where: { id: a.id } });
  }
}

test.describe("Cửa hàng quà (Shop) E2E, Responsive & Regression Verification", () => {
  test.beforeAll(async () => {
    // 0. Remove any leftover records from interrupted prior E2E runs first
    await cleanupE2eRecords();

    // 1. Backup existing ShopSettings
    const prevSetting = await prisma.systemSetting.findUnique({
      where: { key: SHOP_SETTINGS_KEY },
    });
    let baseSettings: Record<string, unknown> = {};
    if (prevSetting) {
      hadOriginalSettings = true;
      originalSettingsValue = prevSetting.valueJson;
      try {
        baseSettings = JSON.parse(prevSetting.valueJson);
      } catch {
        baseSettings = {};
      }
    }

    // Configure clean E2E shop settings (temporarily enabling VietQR bank + shipping)
    const e2eSettings = {
      ...baseSettings,
      storeOpen: true,
      announcementBar: {
        enabled: true,
        text: "Đang chạy kiểm thử E2E Cửa hàng quà",
        href: "/qua-tang/tat-ca",
      },
      bankTransfer: {
        ...((baseSettings.bankTransfer as Record<string, unknown>) || {}),
        enabled: true,
        bankCode: "MB",
        bankName: "MB Bank (Quân Đội)",
        accountNo: "9988776655",
        accountName: "DING DONG E2E TEST",
        branch: "TP.HCM",
      },
      shipping: {
        ...((baseSettings.shipping as Record<string, unknown>) || {}),
        configured: true,
        freeshipThresholdVnd: 500000,
      },
    };
    await prisma.systemSetting.upsert({
      where: { key: SHOP_SETTINGS_KEY },
      update: { valueJson: JSON.stringify(e2eSettings) },
      create: { key: SHOP_SETTINGS_KEY, valueJson: JSON.stringify(e2eSettings) },
    });

    // 2. Pick a real published card template from existing library
    const tpl = await prisma.template.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { sortOrder: "asc" },
    });
    existingTemplateSlug = tpl?.slug || "thiep-8";

    // 3. Ensure category exists & create an ACTIVE E2E product with stock=6
    const category = await prisma.storeCategory.upsert({
      where: { slug: "khan-quang" },
      update: {},
      create: {
        slug: "khan-quang",
        name: "Khăn quàng cổ",
        isActive: true,
      },
    });

    const product = await prisma.storeProduct.create({
      data: {
        slug: PRODUCT_SLUG,
        name: `Khăn Len Cashmere E2E ${TS}`,
        subtitle: "Sản phẩm kiểm thử E2E — tự xóa sau test",
        categoryId: category.id,
        status: "ACTIVE",
        isFeatured: true,
        imagesJson: JSON.stringify(["/assets/shop/scarf-suong-mai.svg"]),
        shortDesc: "Khăn len mềm mịn kèm thiệp QR độc bản.",
        description: "Sản phẩm phục vụ kiểm thử E2E tự động.",
        cardIncluded: true,
        defaultTemplateId: tpl?.id || null,
        eligibleTemplateIdsJson: "[]",
        variants: {
          create: {
            sku: SKU_1,
            name: "Kem Yến Mạch",
            colorName: "Kem",
            colorHex: "#F3E5D8",
            priceVnd: 240000,
            compareAtVnd: 290000,
            isActive: true,
            isDefault: true,
            inventory: {
              create: {
                onHand: 6,
                reserved: 0,
                lowStockThreshold: 2,
              },
            },
          },
        },
      },
      include: { variants: true },
    });
    createdProductId = product.id;
    createdVariantId = product.variants[0].id;

    // 4. Create isolated ADMIN user for UI verification
    const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const adminUser = await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        name: "Admin E2E Shop",
        passwordHash: adminPasswordHash,
        status: "ACTIVE",
        roles: {
          create: { role: "ADMIN" },
        },
      },
    });
    createdAdminId = adminUser.id;
  });

  test.afterAll(async () => {
    // Restore original settings cleanly
    if (hadOriginalSettings && originalSettingsValue) {
      await prisma.systemSetting.upsert({
        where: { key: SHOP_SETTINGS_KEY },
        update: { valueJson: originalSettingsValue },
        create: { key: SHOP_SETTINGS_KEY, valueJson: originalSettingsValue },
      });
    } else {
      await prisma.systemSetting.deleteMany({ where: { key: SHOP_SETTINGS_KEY } });
    }

    await cleanupE2eRecords();
    await prisma.$disconnect();
  });

  test("1. Responsive (320px–1440px), prefers-reduced-motion, and existing website regression", async ({
    browser,
  }) => {
    const runtimeConsoleErrors: string[] = [];
    const failedResponses: string[] = [];
    const pageErrors: string[] = [];
    let checkingLegacyRoutes = false;

    const context = await browser.newContext({
      viewport: { width: 320, height: 568 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (err) => pageErrors.push(err.message));
    page.on("response", (res) => {
      const url = res.url();
      if (
        !checkingLegacyRoutes &&
        res.status() >= 400 &&
        !url.includes("/api/v1/auth/me") &&
        !url.includes("/report")
      ) {
        failedResponses.push(`${res.status()} ${url}`);
      }
    });
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Browser logs network 401 line when Navbar probes /api/v1/auth/me for guests
        if (!checkingLegacyRoutes && !text.includes("status of 401") && !text.includes("status of 404")) {
          runtimeConsoleErrors.push(text);
        }
      }
    });

    // Storefront pages across narrow mobile + tablet + desktop
    const shopRoutes = [
      "/qua-tang",
      "/qua-tang/tat-ca",
      `/qua-tang/san-pham/${PRODUCT_SLUG}`,
      "/qua-tang/gio-hang",
      "/qua-tang/tra-cuu-don",
    ];

    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
    ];

    for (const vp of [viewports[0], viewports[2], viewports[4]]) {
      await page.setViewportSize(vp);
      for (const route of shopRoutes) {
        const res = await page.goto(route, { waitUntil: "domcontentloaded" });
        expect(res?.status(), `Unexpected status for ${route}`).toBeLessThan(400);
        await page.waitForTimeout(250);
        await checkNoOverflow(page, `${route} @ ${vp.width}x${vp.height}`);
      }
    }

    // Also test remaining viewports on key landing & product detail pages
    for (const vp of [viewports[1], viewports[3], viewports[5]]) {
      await page.setViewportSize(vp);
      for (const route of ["/qua-tang", `/qua-tang/san-pham/${PRODUCT_SLUG}`]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(200);
        await checkNoOverflow(page, `${route} @ ${vp.width}x${vp.height}`);
      }
    }

    // Verify Navbar minimalist cleanup (no "Đơn hàng của tôi" / "Liên hệ" links on bar, cart button shows icon + count only)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/qua-tang", { waitUntil: "domcontentloaded" });
    await expect(page.locator("header nav a", { hasText: "Đơn hàng của tôi" })).toHaveCount(0);
    await expect(page.locator("header nav a", { hasText: "Liên hệ" })).toHaveCount(0);
    const navCartText = await page.locator("#ddg-nav-cart-btn").innerText();
    expect(navCartText.trim()).toMatch(/^\d+$/);

    // Clicking cart icon opens Drawer with integrated "Đơn hàng của tôi" tab
    await page.locator("#ddg-nav-cart-btn").click();
    await expect(page.getByRole("tab", { name: /Giỏ quà/i })).toBeVisible();
    await page.getByRole("tab", { name: /Đơn hàng của tôi/i }).click();
    await expect(page.getByText(/Tra cứu nhanh theo mã đơn/i)).toBeVisible();
    await page.getByRole("button", { name: "Đóng giỏ quà" }).click();

    // Floating Contact circle opens responsive panel on both Desktop and 320px Mobile with zero overflow
    await page.locator("#ddg-floating-contact-btn").click();
    await expect(page.getByRole("dialog", { name: /Liên hệ DingDong Gift/i })).toBeVisible();
    await checkNoOverflow(page, "floating contact desktop @ 1280x800");
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(150);
    await checkNoOverflow(page, "floating contact mobile @ 320x568");
    await page.getByRole("button", { name: "Đóng khung liên hệ" }).click();

    // Verify 3-stripe mobile hamburger menu button & overlay drawer on 320px and 640px
    const menuBtn = page.locator("#ddg-mobile-menu-btn");
    await expect(menuBtn).toBeVisible();
    const menuBox = await menuBtn.boundingBox();
    expect(menuBox).toBeTruthy();
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(320);
    await menuBtn.click();
    await expect(page.locator("#ddg-mobile-drawer")).toBeVisible();
    await checkNoOverflow(page, "mobile menu drawer @ 320x568");
    await menuBtn.click();
    await expect(page.locator("#ddg-mobile-drawer")).toBeHidden();

    await page.setViewportSize({ width: 640, height: 800 });
    await page.waitForTimeout(100);
    await expect(menuBtn).toBeVisible();
    const menuBox640 = await menuBtn.boundingBox();
    expect(menuBox640).toBeTruthy();
    expect(menuBox640!.x + menuBox640!.width).toBeLessThanOrEqual(640);
    await checkNoOverflow(page, "navbar @ 640x800");

    // Verify sticky header & hamburger stay visible when scrolled AND when embedded in a phone simulator iframe
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(150);
    const stickyHeaderBox = await page.locator("header").boundingBox();
    expect(stickyHeaderBox).toBeTruthy();
    expect(Math.abs(stickyHeaderBox!.y)).toBeLessThanOrEqual(2);
    await expect(page.locator("#ddg-mobile-menu-btn")).toBeVisible();

    await page.setContent(
      `<iframe id="sim-frame" src="${new URL("/qua-tang", page.url()).toString()}" style="width:375px;height:667px;border:0"></iframe>`,
    );
    const simFrame = page.frameLocator("#sim-frame");
    await expect(simFrame.locator("#ddg-mobile-menu-btn")).toBeVisible({ timeout: 15000 });
    await expect(simFrame.locator("#ddg-floating-contact-btn")).toBeVisible({ timeout: 15000 });

    // Verify prefers-reduced-motion honors near-zero animation duration in CSS
    await page.goto("/qua-tang", { waitUntil: "domcontentloaded" });
    const reducedMotionResult = await page.evaluate(() => {
      const matches = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const animated = document.querySelector(".ddg-float-gentle, .ddg-reveal-stagger");
      const duration = animated ? getComputedStyle(animated).animationDuration : null;
      return { matches, duration };
    });
    expect(reducedMotionResult.matches).toBe(true);
    if (reducedMotionResult.duration) {
      expect(["0.001s", "0s", "1ms"]).toContain(reducedMotionResult.duration);
    }

    // Existing website regression routes (preserve core product)
    checkingLegacyRoutes = true;
    await page.setViewportSize({ width: 1280, height: 800 });
    for (const oldRoute of ["/", "/products", "/collections", `/templates/${existingTemplateSlug}`]) {
      const res = await page.goto(oldRoute, { waitUntil: "domcontentloaded" });
      expect(res?.status(), `Regression route ${oldRoute} failed`).toBeLessThan(400);
      await page.waitForTimeout(250);
      await checkNoOverflow(page, `regression ${oldRoute}`);
    }

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join("; ")}`).toEqual([]);
    expect(failedResponses, `Unexpected >=400 HTTP responses: ${failedResponses.join("; ")}`).toEqual(
      [],
    );
    expect(runtimeConsoleErrors, `Console errors: ${runtimeConsoleErrors.join("; ")}`).toEqual([]);
    await context.close();
  });

  test("2. Full E2E: Product Detail -> 4-Step Wizard + Live Preview -> Cart -> Checkout -> VietQR -> Privacy -> Admin Packing & QR -> Recipient Atomic 'Mở thiệp'", async ({
    browser,
  }) => {
    test.setTimeout(180000);
    const context = await browser.newContext({
      viewport: { width: 1280, height: 850 },
    });
    const page = await context.newPage();

    // Visit minimalist storefront and open product detail page via product card link
    await page.goto(`/qua-tang`, { waitUntil: "domcontentloaded" });
    const cardLink = page.getByRole("link", { name: new RegExp(TS) }).first();
    await expect(cardLink).toBeVisible({ timeout: 15000 });
    await cardLink.click();
    await page.waitForURL(`**/qua-tang/san-pham/${PRODUCT_SLUG}**`, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: new RegExp(TS) })).toBeVisible({ timeout: 15000 });

    // Open 4-step Gift Personalization Wizard
    await page.getByRole("button", { name: /Chọn mẫu & Viết thiệp ngay/i }).click();
    const dialog = page.getByRole("dialog", { name: /Cá nhân hóa thiệp online/i });
    await expect(dialog).toBeVisible();

    // Step 1 -> Step 2
    await dialog.getByRole("button", { name: /Tiếp tục bước 2\/4/i }).click();
    await dialog.locator('input[placeholder*="Minh Anh"]').fill("Thảo Nhi E2E");
    await dialog.locator('input[placeholder*="Tuấn"]').fill("Minh Khang E2E");
    await dialog.locator('input[placeholder*="Gửi em một chút ấm áp"]').fill("Chúc mừng sinh nhật Nhi");
    await dialog.locator("textarea").fill("Mong hộp khăn và tấm thiệp nhỏ mang lại sự ấm áp cho bạn.");

    // Step 2 -> Step 3 (Live Template Preview)
    const previewResPromise = page.waitForResponse(
      (res) => res.url().includes("/api/shop/templates/preview") && res.status() === 200,
    );
    await dialog.getByRole("button", { name: /Tiếp tục bước 3\/4/i }).click();
    const previewRes = await previewResPromise;
    expect(previewRes.ok()).toBe(true);

    // Step 3 -> Step 4 & Persist customization
    await dialog.getByRole("button", { name: /Tiếp tục bước 4\/4/i }).click();
    await dialog.getByRole("button", { name: /Lưu & Gắn thiệp vào hộp quà/i }).click();
    await expect(dialog).toBeHidden({ timeout: 15000 });
    await expect(page.getByText("Thảo Nhi E2E")).toBeVisible();

    // Set quantity = 2 ("Nhận 2 mã QR độc lập") & Add to cart
    await page.getByRole("button", { name: "Tăng số lượng" }).click();
    await expect(page.getByText("Nhận 2 mã QR độc lập")).toBeVisible();
    await page.getByRole("button", { name: /Thêm vào giỏ quà/i }).click();

    // Cart Drawer opens showing the 2 gift boxes
    await expect(page.getByRole("link", { name: /Xem giỏ chi tiết/i })).toBeVisible({
      timeout: 15000,
    });
    await page.getByRole("link", { name: /Xem giỏ chi tiết/i }).click();
    await page.waitForURL("**/qua-tang/gio-hang", { timeout: 15000 });
    await expect(page.getByText("Hộp #1", { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Hộp #2", { exact: true })).toBeVisible();

    // Navigate to Checkout
    await page.goto("/qua-tang/thanh-toan", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Thanh toán & Địa chỉ nhận quà/i })).toBeVisible({
      timeout: 15000,
    });

    // Fill Buyer & Recipient details
    await page.locator('input[placeholder="Nguyễn Minh Anh"]').fill("Khách E2E Đặt Hàng");
    await page.locator('input[placeholder="0901234567"]').fill("0912345001");
    await page.locator('input[placeholder="Trần Thảo Vy"]').fill("Người Nhận E2E");
    await page.locator('input[placeholder="0912345678"]').fill("0987654002");
    await page.locator('input[placeholder="Quận 1 / Cầu Giấy..."]').fill("Quận 1");
    await page.locator('input[placeholder="Phường Bến Nghé"]').fill("Phường Bến Nghé");
    await page.locator('input[placeholder="Ví dụ: 123 Nguyễn Huệ"]').fill("99 Lê Lợi, Q.1");

    // Select bank_transfer (VietQR) & accept terms
    await page.locator('input[type="radio"][value="bank_transfer"]').check();
    const termsCheckbox = page.getByLabel(/Tôi xác nhận địa chỉ nhận quà chính xác/i);
    if (!(await termsCheckbox.isChecked())) {
      await termsCheckbox.check();
    }

    // Submit checkout & wait for navigation to /qua-tang/thanh-toan/[orderCode]
    const checkoutResponsePromise = page.waitForResponse(
      (res) => res.url().includes("/api/shop/checkout") && res.request().method() === "POST",
    );
    await page.getByRole("button", { name: /Tạo đơn & Chuyển tới bước thanh toán/i }).click();
    const checkoutRes = await checkoutResponsePromise;
    expect(checkoutRes.status()).toBe(201);
    const checkoutJson = await checkoutRes.json();
    createdOrderCode = checkoutJson.data.orderCode;
    expect(createdOrderCode).toMatch(/^DDG-/);

    await page.waitForURL(`**/qua-tang/thanh-toan/${createdOrderCode}**`, { timeout: 15000 });

    // Confirm VietQR shows Shop's bank account (NEVER auto-PAID)
    await expect(page.getByText("9988776655")).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("img", { name: new RegExp(createdOrderCode) })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tôi đã chuyển khoản/i })).toBeVisible();

    // Submit "Tôi đã chuyển khoản" -> status becomes PAYMENT_REVIEW_REQUESTED (NOT PAID)
    await page.locator('input[placeholder*="4 số cuối"]').fill("FT-E2E-123456");
    await page.getByRole("button", { name: /Tôi đã chuyển khoản/i }).click();
    await expect(page.getByText("Chờ Admin đối soát ngân hàng")).toBeVisible({ timeout: 15000 });

    const dbOrderAfterReview = await prisma.storeOrder.findUnique({
      where: { orderCode: createdOrderCode },
      include: { giftUnits: { orderBy: { unitIndex: "asc" } } },
    });
    expect(dbOrderAfterReview).toBeTruthy();
    createdOrderId = dbOrderAfterReview!.id;
    expect(dbOrderAfterReview!.paymentStatus).not.toBe("PAID");
    expect(dbOrderAfterReview!.status).toBe("PAYMENT_REVIEW_REQUESTED");
    expect(dbOrderAfterReview!.giftUnits).toHaveLength(2);
    expect(dbOrderAfterReview!.giftUnits[0].giftTokenHash).toBeTruthy();
    expect(dbOrderAfterReview!.giftUnits[1].giftTokenHash).toBeTruthy();
    expect(dbOrderAfterReview!.giftUnits[0].giftTokenHash).not.toBe(
      dbOrderAfterReview!.giftUnits[1].giftTokenHash,
    );
    expect(dbOrderAfterReview!.giftUnits[0].giftTokenEncrypted).not.toBe(
      dbOrderAfterReview!.giftUnits[1].giftTokenEncrypted,
    );

    await context.close();

    // Incognito Privacy Verification: unauthenticated user without lookup cookie CANNOT see PII
    const guestCtx: import("@playwright/test").BrowserContext = await browser.newContext();
    const guestPage = await guestCtx.newPage();
    await guestPage.goto(`/qua-tang/don-hang/${createdOrderCode}`, { waitUntil: "domcontentloaded" });
    await expect(guestPage.getByText(/Xác thực chủ đơn hàng/i)).toBeVisible({
      timeout: 15000,
    });
    await expect(guestPage.getByText("0912345001")).toHaveCount(0);
    await expect(guestPage.getByText("0987654002")).toHaveCount(0);

    // Lookup form unlocks safely using orderCode + customer phone
    await guestPage.goto(`/qua-tang/tra-cuu-don`, { waitUntil: "domcontentloaded" });
    await expect(guestPage.locator('input[placeholder*="DDG"]')).toBeVisible({ timeout: 15000 });
    await guestPage.locator('input[placeholder*="DDG"]').fill(createdOrderCode);
    await guestPage.locator('input[placeholder*="0901234567"]').fill("0912345001");
    await guestPage.getByRole("button", { name: /Tra cứu đơn hàng/i }).click();
    await guestPage.getByRole("button", { name: /Mở chi tiết đơn/i }).click({ timeout: 15000 });
    await guestPage.waitForURL(`**/qua-tang/don-hang/${createdOrderCode}**`, { timeout: 15000 });
    await expect(guestPage.getByText(createdOrderCode)).toBeVisible({ timeout: 15000 });
    await guestCtx.close();

    // Admin Operations, Packing Card Lock, Per-Box QR, GET Non-Mutating & Atomic "Mở thiệp"
    expect(createdOrderId).toBeTruthy();
    const adminContext = await browser.newContext({ viewport: { width: 1366, height: 850 } });
    const adminPage = await adminContext.newPage();

    await adminPage.goto("/auth/sign-in", { waitUntil: "domcontentloaded" });
    await expect(adminPage.locator('input[placeholder="Email"]')).toBeVisible({ timeout: 15000 });
    await adminPage.locator('input[placeholder="Email"]').fill(ADMIN_EMAIL);
    await adminPage.locator('input[placeholder="Mật khẩu"]').fill(ADMIN_PASSWORD);
    await adminPage.getByRole("button", { name: "Đăng nhập", exact: true }).click();
    await adminPage.waitForURL("**/dashboard", { timeout: 15000 });

    // Visit Admin Shop Overview, Inventory, Catalog, Orders, and Settings
    for (const adminRoute of [
      "/admin/qua-tang",
      "/admin/qua-tang/kho",
      "/admin/qua-tang/san-pham",
      "/admin/qua-tang/don-hang",
      "/admin/qua-tang/cau-hinh",
    ]) {
      const r = await adminPage.goto(adminRoute, { waitUntil: "domcontentloaded" });
      expect(r?.status()).toBeLessThan(400);
      await adminPage.waitForTimeout(200);
      await checkNoOverflow(adminPage, adminRoute);
    }

    // Open E2E Order Detail in Admin
    await adminPage.goto(`/admin/qua-tang/don-hang/${createdOrderId}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(adminPage.getByText(createdOrderCode).first()).toBeVisible({ timeout: 15000 });
    await expect(adminPage.getByText("FT-E2E-123456").first()).toBeVisible();

    // Admin verifies manual bank payment -> CONFIRM_PAID
    await adminPage.locator('input[placeholder="Mã FT / Ref ngân hàng"]').fill("MB-REAL-999");
    await adminPage.getByRole("button", { name: /Xác nhận ĐÃ NHẬN TIỀN/i }).click();
    await expect(adminPage.getByText(/Đã xác nhận đã nhận tiền/i)).toBeVisible({
      timeout: 15000,
    });

    // Admin transitions order to PACKING (locks per-box card editing)
    await adminPage.getByRole("button", { name: /Đang gói quà/i }).click();
    await expect(adminPage.getByText(/Đã cập nhật trạng thái đơn hàng/i)).toBeVisible({
      timeout: 15000,
    });

    const unitsAfterPacking = await prisma.storeOrderGiftUnit.findMany({
      where: { orderId: createdOrderId },
      orderBy: { unitIndex: "asc" },
    });
    expect(unitsAfterPacking).toHaveLength(2);
    expect(unitsAfterPacking[0].isCardLocked).toBe(true);
    expect(unitsAfterPacking[1].isCardLocked).toBe(true);
    const unit1Id = unitsAfterPacking[0].id;
    const unit2Id = unitsAfterPacking[1].id;

    // Admin loads all per-box unique QR codes via UI and gets preview URLs
    await adminPage.getByRole("button", { name: /Tải QR tất cả hộp/i }).click();
    const previewLinks = adminPage.locator('a:has-text("Mở kiểm tra nội bộ")');
    await expect(previewLinks).toHaveCount(2, { timeout: 15000 });
    const previewHref1 = await previewLinks.nth(0).getAttribute("href");
    const previewHref2 = await previewLinks.nth(1).getAttribute("href");
    expect(previewHref1).toBeTruthy();
    expect(previewHref2).toBeTruthy();
    expect(previewHref1).not.toBe(previewHref2);

    const token1Match = previewHref1!.match(/\/mo-qua\/([^/?#]+)/);
    expect(token1Match?.[1]).toBeTruthy();
    const token1 = token1Match![1];

    // Preview mode must show banner and NOT set firstOpenedAt
    await adminPage.goto(`/mo-qua/${token1}?mode=preview`, { waitUntil: "domcontentloaded" });
    await expect(adminPage.getByText(/Admin Preview/i).first()).toBeVisible({ timeout: 15000 });
    const afterPreviewUnit = await prisma.storeOrderGiftUnit.findUnique({
      where: { id: unit1Id },
    });
    expect(afterPreviewUnit?.firstOpenedAt).toBeNull();
    await adminContext.close();

    // Anonymous Recipient scans QR #1 -> /mo-qua/[token1]
    const recipientCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const recipientPage = await recipientCtx.newPage();

    await recipientPage.goto(`/mo-qua/${token1}`, { waitUntil: "load" });
    const openBtn = recipientPage.getByRole("button", { name: /Mở thiệp/i });
    await expect(openBtn).toBeVisible({ timeout: 15000 });
    await expect(openBtn).toHaveAttribute("data-ready", "1", { timeout: 15000 });
    await checkNoOverflow(recipientPage, `/mo-qua/${token1} @ 390x844`);

    // GET alone NEVER triggers expiry countdown!
    const beforeOpenUnit1 = await prisma.storeOrderGiftUnit.findUnique({
      where: { id: unit1Id },
    });
    expect(beforeOpenUnit1?.firstOpenedAt).toBeNull();
    expect(beforeOpenUnit1?.expiresAt).toBeNull();

    // Recipient clicks "Mở thiệp ♡" -> activates firstOpenedAt & renders real template
    const openResPromise = recipientPage.waitForResponse(
      (res) => res.url().includes(`/api/gifts/`) && res.url().endsWith("/open") && res.request().method() === "POST",
      { timeout: 20000 },
    );
    await openBtn.click();
    const openRes = await openResPromise;
    expect(openRes.status()).toBe(200);

    const afterOpenUnit1 = await prisma.storeOrderGiftUnit.findUnique({
      where: { id: unit1Id },
    });
    const untouchedUnit2 = await prisma.storeOrderGiftUnit.findUnique({
      where: { id: unit2Id },
    });
    expect(afterOpenUnit1?.firstOpenedAt).toBeTruthy();
    expect(afterOpenUnit1?.expiresAt).toBeTruthy();
    expect(afterOpenUnit1?.openCount).toBeGreaterThanOrEqual(1);
    expect(untouchedUnit2?.firstOpenedAt).toBeNull(); // Box #2 QR remains independent!

    await recipientCtx.close();
  });
});
