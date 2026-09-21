import { expect, test, type Page } from "@playwright/test";

async function registerAndLogin(page: Page) {
  const email = `reader-${Date.now()}@example.com`;
  await page.goto("/register");
  await page.getByLabel("Your name").fill("Riley Reader");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Testpass1");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/login\?registered=1/);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Testpass1");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/onboarding/);
  await page.getByLabel("Choose a username").fill(`reader_${Date.now()}`);
  await page.getByRole("button", { name: "Let’s begin" }).click();
  await expect(page).toHaveURL(/\/play$/);
}

test("DocMind sends an anonymous visitor to sign in", async ({ page }) => {
  await page.goto("/docmind");
  await expect(page).toHaveURL(/\/login\?next=%2Fdocmind/);
});

test("uploads, opens, chats with, and deletes a document", async ({ page }) => {
  await registerAndLogin(page);
  await page.getByRole("link", { name: "DocMind" }).click();
  await expect(page.getByRole("heading", { name: "Documents" })).toBeVisible();
  await expect(page.getByText("Your library is quiet.")).toBeVisible();

  await page.getByLabel("Choose PDF").setInputFiles({
    name: "sample.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 sample"),
  });
  await expect(page.getByRole("link", { name: /sample\.pdf/ })).toBeVisible();
  await page.getByRole("link", { name: /sample\.pdf/ }).click();

  await expect(page.getByRole("heading", { name: "sample.pdf" })).toBeVisible();
  await expect(page.locator(".summary-text strong")).toHaveText("Main idea");
  await expect(page.locator(".summary-text li")).toHaveCount(2);
  await expect(page.getByTitle("Preview of sample.pdf")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "What is the main idea?" }),
  ).toBeVisible();

  await page
    .getByLabel("Ask about this document")
    .fill("What is the main idea?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(
    page.getByText(/The document answers: What is the main idea/),
  ).toBeVisible();
  await expect(page.getByRole("log").getByText("Page 2")).toBeVisible();

  await page.getByRole("button", { name: "Delete document" }).click();
  await expect(
    page.getByRole("alertdialog", { name: "Delete this document?" }),
  ).toBeVisible();
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Delete document" })
    .click();
  await expect(page.getByText("Document deleted.")).toBeVisible();
  await expect(page).toHaveURL(/\/docmind$/);
  await expect(page.getByText("Your library is quiet.")).toBeVisible();
});
