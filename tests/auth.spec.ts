import { test, expect, type Page } from "@playwright/test";
async function registerAndLogin(page: Page) {
  const email = `alex-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Your name").fill("Alex Morgan");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Testpass1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/login\?registered=1/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Testpass1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page.getByLabel("Choose a username").fill(`alex_${Date.now()}`);
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await expect(page).toHaveURL(/\/play$/);
}
test("protected pages reject missing and forged credentials", async ({
  page,
  context,
}) => {
  for (const path of ["/play", "/account", "/onboarding"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
  }
  await context.addCookies([
    { name: "still_access", value: "forged", domain: "localhost", path: "/" },
  ]);
  await page.goto("/play");
  await expect(page).toHaveURL(/\/login/);
});
test("invalid credentials, visibility, and rate limit feedback", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("wrong@example.com");
  await page.screenshot({
    path: "test-results/login-desktop.png",
    fullPage: true,
    animations: "disabled",
    caret: "initial",
  });
  await page.getByLabel("Password", { exact: true }).fill("Wrong1");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "type",
    "text",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".notice[role=alert]")).toContainText(
    "Invalid email or password",
  );
  await page.getByLabel("Email address").fill("limited@example.com");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.locator(".notice[role=alert]")).toContainText(
    "wait a minute",
  );
});
test("registration, onboarding, game completion, refresh rotation, and logout", async ({
  page,
  context,
}) => {
  await registerAndLogin(page);
  const initial = await context.cookies();
  expect(
    initial
      .filter((c) => c.name.startsWith("still_"))
      .every((c) => c.httpOnly && c.sameSite === "Lax"),
  ).toBeTruthy();
  expect(await page.evaluate(() => document.cookie)).not.toContain("still_");
  await page.screenshot({
    animations: "disabled",
    caret: "initial",
    path: "test-results/play-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Let’s play" }).click();
  // Learn the board in pairs, then solve it. This also exercises mismatch timing.
  const known = new Map<string, number[]>();
  const cards = page.locator(".memory-card");
  for (let i = 0; i < 16; i += 2) {
    await cards.nth(i).click();
    await cards.nth(i + 1).click();
    for (const index of [i, i + 1]) {
      const label = (await cards.nth(index).getAttribute("aria-label"))!;
      const symbol = label.split(": ")[1].replace(", matched", "");
      known.set(symbol, [...(known.get(symbol) || []), index]);
    }
    await page.waitForTimeout(950);
  }
  for (const pair of known.values()) {
    if (await cards.nth(pair[0]).isDisabled()) continue;
    await cards.nth(pair[0]).click();
    await cards.nth(pair[1]).click();
  }
  await expect(
    page.getByRole("heading", { name: "Beautifully done." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play again" }).click();
  await expect(page.locator(".matched")).toHaveCount(0);
  const refreshBefore = initial.find((c) => c.name === "still_refresh")!.value;
  await context.addCookies([
    {
      name: "still_access",
      value: "expired",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "The essentials." }),
  ).toBeVisible();
  expect(
    (await context.cookies()).find((c) => c.name === "still_refresh")!.value,
  ).not.toBe(refreshBefore);
  await page.getByLabel("Profile photo", { exact: true }).setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: Buffer.from("fixture"),
  });
  await page.getByRole("button", { name: "Update photo" }).click();
  await expect(page.getByRole("status")).toContainText(
    "photo has been updated",
  );
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/loggedOut=1/);
  expect(
    (await context.cookies()).filter((c) => c.name.startsWith("still_")),
  ).toHaveLength(0);
  await page.goto("/account");
  await expect(page).toHaveURL(/login/);
});
test("expired refresh redirects and cross-origin refresh is rejected", async ({
  page,
  context,
  request,
}) => {
  await context.addCookies([
    {
      name: "still_refresh",
      value: "revoked",
      domain: "localhost",
      path: "/",
      httpOnly: true,
    },
  ]);
  await page.goto("/account");
  await expect(page).toHaveURL(/login\?expired=1/);
  const response = await request.post("/api/session/refresh", {
    headers: { origin: "https://evil.example" },
  });
  expect(response.status()).toBe(403);
});
test("mobile layout stays within viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await page.screenshot({
    animations: "disabled",
    caret: "initial",
    path: "test-results/login-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await registerAndLogin(page);
  await page.screenshot({
    animations: "disabled",
    caret: "initial",
    path: "test-results/play-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: "Let’s play" }).click();
  await expect(
    page.getByRole("button", { name: "Reveal card", exact: false }),
  ).toHaveCount(16);
});
