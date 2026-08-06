import { expect, test } from "@playwright/test";

test("homepage links to the full reviews page, which renders", async ({ page }) => {
  await page.route("**/googletagmanager.com/**", (route) => route.abort());

  await page.goto("/en");
  await expect(page.getByRole("link", { name: "See all reviews" })).toHaveAttribute("href", "/en/reviews");

  await page.goto("/en/reviews");
  await expect(page.getByRole("heading", { name: "Client reviews", level: 1 })).toBeVisible();
});
