import { expect, test } from "@playwright/test";

// Guards that the home "AI booking" section reflects the live Claude connector and publishes the
// MCP endpoint URL for developers (EN + ES), across desktop and mobile projects.
test("AI booking section is live on Claude and shows the MCP endpoint", async ({ page }) => {
  await page.route("**/googletagmanager.com/**", (route) => route.abort());
  await page.goto("/en");

  const section = page.locator("#assistants");
  await expect(section.getByText("https://medinaclean.com/mcp")).toBeVisible();
  await expect(section.getByText("Live — add the Medina Clean connector", { exact: false })).toBeVisible();
});
