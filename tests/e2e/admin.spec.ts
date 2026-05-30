import { expect, test } from "@playwright/test";

test("admin defaults to Spanish and shows client onboarding workspace", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Rosa Admin" })).toBeVisible();
  await page.getByLabel("Contraseña").fill("test-admin");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("heading", { name: "Clientes", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agregar cliente actual" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Clientes actuales" })).toBeVisible();
  await expect(page.getByText(/\d+\/13 registrados/)).toBeVisible();
  await expect(page.locator(".admin-header-actions").getByRole("link", { name: "English" })).toBeVisible();
  const phoneField = page.getByRole("textbox", { name: "Teléfono" });
  await expect(phoneField).toHaveAttribute("required", "");
  await expect(phoneField).toHaveAttribute("autocomplete", "tel");
  await expect(phoneField).toHaveAttribute("inputmode", "tel");
  await expect(phoneField).toHaveAttribute("placeholder", "(470) 443-4817");
});

test("admin language switch stays in the same header location", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Contraseña").fill("test-admin");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.locator(".admin-header-actions").getByRole("link", { name: "English" })).toBeVisible();

  await page.getByRole("link", { name: "Calendario" }).click();
  await expect(page.locator(".admin-header-actions").getByRole("link", { name: "English" })).toBeVisible();

  await page.getByRole("link", { name: "Reseñas" }).click();
  await expect(page.locator(".admin-header-actions").getByRole("link", { name: "English" })).toBeVisible();
});

test("admin navigation includes Rosa's task inbox", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Contraseña").fill("test-admin");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page.getByRole("link", { name: "Tareas" })).toBeVisible();
});

test("admin form validates required client name before submit", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Contraseña").fill("test-admin");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.getByRole("button", { name: "Guardar cliente" }).click();

  await expect(page.getByLabel("Nombre")).toBeFocused();
});

test("admin client phone validates on blur without losing typed client data", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Contraseña").fill("test-admin");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.locator('form[action="/api/admin/clients"]')).toHaveAttribute("data-ready", "true");

  await page.getByLabel("Nombre").fill("Client With Typo");
  await page.getByRole("textbox", { name: "Teléfono" }).fill("555");
  await page.getByRole("textbox", { name: "Email" }).fill("typo@example.com");
  await page.getByLabel("Dirección").fill("100 Keep This Street");
  await page.getByLabel("ZIP").fill("30188");
  await page.getByLabel("Notas").fill("Do not lose this text.");
  await page.getByRole("textbox", { name: "Teléfono" }).blur();

  await expect(page.getByText("Ingrese un número de teléfono de EE. UU. de 10 dígitos.")).toBeVisible();
  await page.getByRole("button", { name: "Guardar cliente" }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByLabel("Nombre")).toHaveValue("Client With Typo");
  await expect(page.getByRole("textbox", { name: "Teléfono" })).toHaveValue("555");
  await expect(page.getByRole("textbox", { name: "Email" })).toHaveValue("typo@example.com");
  await expect(page.getByLabel("Dirección")).toHaveValue("100 Keep This Street");
  await expect(page.getByLabel("Notas")).toHaveValue("Do not lose this text.");
});

test("admin client phone validation does not run on submit before blur", async ({ page }) => {
  await page.goto("/admin?lang=en");
  await page.getByLabel("Password").fill("test-admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator('form[action="/api/admin/clients"]')).toHaveAttribute("data-ready", "true");

  await page.route("**/api/admin/clients", async (route) => {
    await route.fulfill({
      status: 303,
      headers: { location: "/admin?lang=en&created=1" }
    });
  });

  await page.getByLabel("Name").fill("Client With Unblurred Phone");
  await page.getByRole("textbox", { name: "Phone" }).fill("222-133-2323");

  const clientRequest = page.waitForRequest((request) => request.url().includes("/api/admin/clients"));
  await page.getByRole("button", { name: "Save client" }).click();
  await clientRequest;

  await expect(page.getByText("Enter a 10-digit US phone number.")).not.toBeVisible();
});

test("admin client visible defaults are saved when untouched", async ({ page }) => {
  await page.goto("/admin?lang=en");
  await page.getByLabel("Password").fill("test-admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator('form[action="/api/admin/clients"]')).toHaveAttribute("data-ready", "true");

  await page.route("**/api/admin/clients", async (route) => {
    await route.fulfill({
      status: 303,
      headers: { location: "/admin?lang=en&created=1" }
    });
  });

  await page.getByLabel("Name").fill("Client With Defaults");
  await page.getByRole("textbox", { name: "Phone" }).fill("(470) 555-0123");

  const clientRequest = page.waitForRequest((request) => request.url().includes("/api/admin/clients"));
  await page.getByRole("button", { name: "Save client" }).click();

  const submitted = new URLSearchParams((await clientRequest).postData() || "");
  expect(submitted.get("currentPriceUsd")).toBe("150");
  expect(submitted.get("usualTime")).toBe("Morning");
});

test("admin can switch to English", async ({ page }) => {
  await page.goto("/admin?lang=en");

  await expect(page.getByRole("heading", { name: "Rosa Admin" })).toBeVisible();
  await page.getByLabel("Password").fill("test-admin");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Client Onboarding" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Add existing client" })).toBeVisible();
});
