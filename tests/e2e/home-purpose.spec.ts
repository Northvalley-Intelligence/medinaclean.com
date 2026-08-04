import { expect, test } from "@playwright/test";

// Guards Google OAuth home-page requirements: the root URL is static (no redirect) and clearly
// explains the app's purpose + Google data use, without login. Runs on desktop + mobile projects.
test("root home page is static (no redirect) and explains the app purpose", async ({ page }) => {
  await page.route("**/googletagmanager.com/**", (route) => route.abort());
  await page.goto("/");

  expect(new URL(page.url()).pathname).toBe("/");

  // Purpose + Google data use stated above the fold in the hero (Google OAuth reviewer sees it immediately).
  await expect(page.locator(".hero-purpose")).toContainText("Google Calendar to schedule appointments");

  const appInfo = page.locator("#app-info");
  await expect(appInfo.getByRole("heading", { name: "About Medina Clean" })).toBeVisible();
  await expect(appInfo.getByText("public website and private operations app")).toBeVisible();
  await expect(appInfo.getByText("Google user data this app requests and why")).toBeVisible();
  await expect(appInfo.getByRole("link", { name: "Read our privacy policy" })).toBeVisible();
});
