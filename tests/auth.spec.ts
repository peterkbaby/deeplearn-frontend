import { expect, test, type Page } from "@playwright/test";

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

test("protected pages send an anonymous visitor to sign in", async ({
  page,
}) => {
  for (const path of ["/play", "/account", "/onboarding"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?next=/);
  }
});

test("Google begins at the FastAPI OAuth route", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("link", { name: "Continue with Google" }),
  ).toHaveAttribute("href", "/auth/google");
});

test("invalid credentials and password visibility provide clear feedback", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill("wrong@example.com");
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
});

test("login, refresh rotation, onboarding, and logout use the browser session", async ({
  page,
  context,
}) => {
  await registerAndLogin(page);

  const accessBefore = await page.evaluate(() =>
    localStorage.getItem("still_access"),
  );
  expect(accessBefore).toBeTruthy();
  const refreshBefore = (await context.cookies()).find(
    (cookie) => cookie.name === "refresh_token",
  );
  expect(refreshBefore?.httpOnly).toBeTruthy();
  expect(await page.evaluate(() => document.cookie)).not.toContain(
    "refresh_token",
  );

  // An expired access token is retried once with the HttpOnly refresh cookie.
  await page.evaluate(() => localStorage.setItem("still_access", "expired"));
  await page.goto("/account");
  await expect(
    page.getByRole("heading", { name: "The essentials." }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("still_access")))
    .not.toBe("expired");
  expect(
    (await context.cookies()).find((cookie) => cookie.name === "refresh_token")
      ?.value,
  ).not.toBe(refreshBefore?.value);

  await page.getByLabel("Sign out").click();
  await expect(page).toHaveURL(/loggedOut=1/);
  expect(
    await page.evaluate(() => localStorage.getItem("still_access")),
  ).toBeNull();
  expect(
    (await context.cookies()).find((cookie) => cookie.name === "refresh_token"),
  ).toBeUndefined();
});

test("a revoked refresh cookie returns the visitor to login", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: "refresh_token",
      value: "revoked",
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login\?next=/);
});
