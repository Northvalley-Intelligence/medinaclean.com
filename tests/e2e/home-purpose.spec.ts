import { expect, test } from "@playwright/test";

// Guards Google OAuth home-page requirements: the root URL is static (no redirect) and clearly
// explains the app's purpose + Google data use, without login. Runs on desktop + mobile projects.
//
// The full "About this app" / Google data-use disclosure lives on /privacy (linked from the
// footer on every page), not as a dedicated homepage section — that keeps the customer-facing
// homepage focused on the service while keeping the disclosure publicly reachable in one click,
// which is all Google's OAuth verification requires.
test("root home page is static (no redirect) and explains the app purpose", async ({ page }) => {
  await page.route("**/googletagmanager.com/**", (route) => route.abort());
  await page.goto("/");

  expect(new URL(page.url()).pathname).toBe("/");

  // Purpose + Google data use stated above the fold in the hero (Google OAuth reviewer sees it immediately).
  await expect(page.locator(".hero-purpose")).toContainText("Google Calendar to schedule appointments");

  // No dedicated "About this app" section in the homepage content flow.
  await expect(page.locator("#app-info")).toHaveCount(0);

  // Still reachable from every page's footer, one click away.
  const aboutThisAppLink = page.locator(".footer-links").getByRole("link", { name: "About this app" });
  await expect(aboutThisAppLink).toHaveAttribute("href", "/privacy");

  await aboutThisAppLink.click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await expect(page.getByText("Google Calendar access to create and update appointment calendar events")).toBeVisible();
  await expect(page.getByText("is not sold, and is not shared with third parties")).toBeVisible();
});
