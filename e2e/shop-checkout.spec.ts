import { test, expect, type Page } from '@playwright/test';

/**
 * Phase 3 e-commerce checkout E2E (PAYMENT_PROVIDER=stub).
 * Based on docs/manual-tests/ecommerce-phase3.md.
 *
 * Catalog seeded by scripts/seed-shop-items.mjs:
 *  - Solar Garden Light  (simple) id=solar-garden-light  ₱499  stock 40
 *  - Solar Motion Light  (simple) id=solar-motion-light  ₱649  stock 28
 *  - Solar Flood Light    (variant) id=solar-flood-light
 */

const ART = 'e2e/__artifacts__';

// A client-cart line matching components/shop/CartContext.ts CartLine shape.
function gardenLine(quantity: number, maxStock = 40) {
  return {
    shopItemId: 'solar-garden-light',
    variantId: null,
    name: 'Solar Garden Light',
    variantLabel: null,
    sku: 'LGT-GARDEN-01',
    slug: 'solar-garden-light',
    unitPriceCentavos: 49900,
    imageUrl: null,
    quantity,
    maxStock,
  };
}

// Inject a cart into localStorage before any page script runs, on every nav.
async function seedCart(page: Page, lines: unknown[]) {
  await page.addInitScript((l) => {
    window.localStorage.setItem('jmc-shop-cart', JSON.stringify(l));
  }, lines);
}

async function fillCustomer(
  page: Page,
  c: { name: string; email: string; phone: string },
) {
  await page.locator('label:has-text("Full name") input').fill(c.name);
  await page.locator('label:has-text("Phone") input').fill(c.phone);
  await page.locator('label:has-text("Email") input').fill(c.email);
}

// Warm up Turbopack route compilation so per-assertion timeouts aren't spent on
// the first cold compile of each route (a dev-server artifact, not the app).
test.beforeAll(async ({ browser }) => {
  const p = await browser.newPage();
  for (const r of [
    '/shop',
    '/shop/cart',
    '/shop/checkout',
    '/shop/solar-garden-light',
    '/shop/stub-checkout',
    '/shop/confirmation',
    '/booking/consultation',
    '/booking/stub-checkout',
  ]) {
    await p.goto(r, { waitUntil: 'load' }).catch(() => {});
  }
  await p.close();
});

// Collect uncaught page errors for each test (framework noise excluded).
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  (page as unknown as { __errs: string[] }).__errs = errors;
});

test('Happy path — DELIVERY: UI cart, region fee, stub pay, confirmation, cart clears', async ({
  page,
}) => {
  // Build the cart through the real UI: 2x Garden Light (detail page) + 1x Motion Light (card).
  await page.goto('/shop/solar-garden-light');
  await expect(page.getByRole('heading', { name: 'Solar Garden Light' })).toBeVisible();
  await page.getByRole('button', { name: 'Increase quantity' }).click(); // qty -> 2
  await page.getByRole('button', { name: 'Add to cart' }).click();

  await page.goto('/shop');
  await page.getByRole('button', { name: 'Add Solar Motion Light to cart' }).click();

  // Cart: verify lines + subtotal (2*499 + 649 = 1,647).
  await page.goto('/shop/cart');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('link', { name: 'Solar Garden Light' }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Solar Motion Light' }).first()).toBeVisible();
  await expect(page.getByText('Items (3)')).toBeVisible();
  await expect(page.locator('text=₱1,647').first()).toBeVisible();
  await page.screenshot({ path: `${ART}/01-cart.png`, fullPage: true });

  // Checkout (delivery + ormoc_city => ₱300 shipping; total ₱1,947).
  await page.goto('/shop/checkout');
  await fillCustomer(page, {
    name: 'E2E Delivery',
    email: 'e2e-delivery@jmc-test.local',
    phone: '09171234567',
  });
  await page.getByRole('button', { name: /Delivery/ }).click();
  await page.locator('label:has-text("Delivery address") textarea').fill('123 Test St, Ormoc City');
  await page.locator('select').selectOption('ormoc_city');

  const summary = page.locator('div:has(> h2:has-text("Order summary"))');
  await expect(summary.getByText('₱300')).toBeVisible(); // shipping non-zero
  await expect(summary.getByText('₱1,947')).toBeVisible(); // total = subtotal + shipping
  await page.screenshot({ path: `${ART}/02-checkout-delivery.png`, fullPage: true });

  await page.getByRole('button', { name: 'Place order' }).click();

  // Stub hosted checkout.
  await page.waitForURL(/\/shop\/stub-checkout/, { timeout: 20_000 });
  await expect(page.getByText('₱1,947')).toBeVisible();
  await page.getByRole('button', { name: /PAY NOW/ }).click();

  // Confirmation (paid).
  await page.waitForURL(/\/shop\/confirmation/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Order Confirmed!' })).toBeVisible();
  await expect(page.getByText('Paid', { exact: true })).toBeVisible();
  await expect(page.getByText(/JMC-[A-Z0-9]{8}/)).toBeVisible();
  await expect(page.getByText('₱1,947').first()).toBeVisible();
  await page.screenshot({ path: `${ART}/03-confirmation-paid.png`, fullPage: true });

  // Cart clears after paid confirmation.
  await page.goto('/shop/cart');
  await expect(page.getByText('Your cart is empty.')).toBeVisible();

  expect((page as unknown as { __errs: string[] }).__errs).toEqual([]);
});

test('Happy path — PICKUP: free shipping, total = subtotal', async ({ page }) => {
  await seedCart(page, [gardenLine(1)]); // subtotal ₱499
  await page.goto('/shop/checkout');

  await fillCustomer(page, {
    name: 'E2E Pickup',
    email: 'e2e-pickup@jmc-test.local',
    phone: '09170000000',
  });
  await page.getByRole('button', { name: /Store pickup/ }).click();

  const summary = page.locator('div:has(> h2:has-text("Order summary"))');
  await expect(summary.getByText('Free')).toBeVisible();
  await expect(summary.getByText('₱499').first()).toBeVisible(); // total = subtotal, no shipping
  // No address/region field rendered for pickup.
  await expect(page.locator('label:has-text("Delivery address")')).toHaveCount(0);

  await page.getByRole('button', { name: 'Place order' }).click();
  await page.waitForURL(/\/shop\/stub-checkout/, { timeout: 20_000 });
  await page.getByRole('button', { name: /PAY NOW/ }).click();

  await page.waitForURL(/\/shop\/confirmation/, { timeout: 20_000 });
  await expect(page.getByRole('heading', { name: 'Order Confirmed!' })).toBeVisible();
  await expect(page.getByText('Store pickup (Ormoc)')).toBeVisible();
  await expect(page.getByText('Free')).toBeVisible();
});

test('Stock guard: over-stock cart is rejected server-side, no order', async ({ page }) => {
  // Tamper the cart directly (UI stepper clamps to maxStock; this drives the server guard).
  await seedCart(page, [gardenLine(9999, 9999)]);
  await page.goto('/shop/checkout');

  await fillCustomer(page, {
    name: 'E2E Overstock',
    email: 'e2e-overstock@jmc-test.local',
    phone: '09170000001',
  });
  await page.getByRole('button', { name: /Store pickup/ }).click(); // skip address/region
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page.locator('p[role="alert"]')).toContainText(/Not enough stock/i);
  await expect(page).toHaveURL(/\/shop\/checkout/); // never reached stub-checkout
});

test('Empty-cart checkout shows empty state, cannot order', async ({ page }) => {
  await page.goto('/shop/checkout');
  await expect(page.getByText('Your cart is empty.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Place order' })).toHaveCount(0);
});

test('Saved checkout info (#12) prefills after a successful order', async ({ page }) => {
  const info = {
    name: 'Saved Customer',
    email: 'e2e-saved@jmc-test.local',
    phone: '09175550123',
    address: '88 Persist Ave, Ormoc City',
  };
  await seedCart(page, [gardenLine(1)]);

  // First order — writes jmc-shop-checkout on submit.
  await page.goto('/shop/checkout');
  await fillCustomer(page, info);
  await page.getByRole('button', { name: /Delivery/ }).click();
  await page.locator('label:has-text("Delivery address") textarea').fill(info.address);
  await page.locator('select').selectOption('ormoc_city');
  await page.getByRole('button', { name: 'Place order' }).click();
  await page.waitForURL(/\/shop\/stub-checkout/, { timeout: 20_000 });
  await page.getByRole('button', { name: /PAY NOW/ }).click();
  await page.waitForURL(/\/shop\/confirmation/, { timeout: 20_000 });

  // Revisit checkout (addInitScript re-seeds the cart so the form renders).
  await page.goto('/shop/checkout');
  await expect(page.locator('label:has-text("Full name") input')).toHaveValue(info.name);
  await expect(page.locator('label:has-text("Email") input')).toHaveValue(info.email);
  await expect(page.locator('label:has-text("Phone") input')).toHaveValue(info.phone);
  await expect(page.locator('label:has-text("Delivery address") textarea')).toHaveValue(info.address);
});

test('Regression: booking consultation still reaches its stub checkout', async ({ page }) => {
  await page.goto('/booking/consultation');
  await page.waitForLoadState('networkidle');
  // Controlled inputs: fill then assert value so a pre-hydration fill can't slip through.
  const nameField = page.locator('#name');
  await expect(nameField).toBeVisible();
  await nameField.fill('Booking Regression');
  await expect(nameField).toHaveValue('Booking Regression');
  await page.locator('#phone').fill('09170009999');
  await page.locator('#city').selectOption({ index: 1 });
  await page.getByRole('button', { name: /CONTINUE/ }).click();

  // Step 2: pick the first available date + a time slot.
  const dateInput = page.locator('#preferred_date');
  await expect(dateInput).toBeVisible();
  const min = await dateInput.getAttribute('min');
  await dateInput.fill(min ?? '');
  await page.getByRole('button', { name: '9:00 AM' }).click();

  await page.getByRole('button', { name: /PROCEED TO PAYMENT/ }).click();
  await page.waitForURL(/\/booking\/stub-checkout/, { timeout: 20_000 });
  await expect(page.getByRole('button', { name: /PAY NOW/ })).toBeVisible();
});
