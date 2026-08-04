import { expect, test } from "@playwright/test";

// Guards that the home "AI booking" section reflects the live cross-assistant support and publishes
// the MCP endpoint URL (EN), across desktop and mobile projects.
test("AI booking section lists Claude/ChatGPT/Gemini and shows the MCP endpoint", async ({ page }) => {
  await page.route("**/googletagmanager.com/**", (route) => route.abort());
  await page.goto("/en");

  const section = page.locator("#assistants");
  await expect(section.getByText("https://medinaclean.com/mcp")).toBeVisible();
  await expect(section.getByRole("heading", { name: "Claude" })).toBeVisible();
  await expect(section.getByRole("heading", { name: "ChatGPT" })).toBeVisible();
  await expect(section.getByRole("heading", { name: "Google Gemini" })).toBeVisible();
  await expect(section.getByText("Live — add a custom connector", { exact: false })).toBeVisible();
});
