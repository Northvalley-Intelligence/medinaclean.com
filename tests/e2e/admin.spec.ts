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

test("admin navigation includes Rosa's video uploads", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Contraseña").fill("test-admin");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.getByRole("link", { name: "Videos" }).click();

  await expect(page.getByRole("heading", { name: "Videos", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Subir video" })).toBeVisible();
  await expect(page.getByLabel("Título del video")).not.toHaveAttribute("required", "");
  await expect(page.getByLabel("Título del video")).toHaveAttribute("placeholder", "Video de Medina Clean");
  await expect(page.getByLabel("Título en inglés opcional")).not.toHaveAttribute("required", "");
  await expect(page.getByLabel("Tipo de video opcional")).toHaveValue("");
  await expect(page.getByLabel("Tipo de video opcional")).toContainText("Limpieza de cocina");
  await expect(page.getByLabel("Archivo de video")).toHaveAttribute("accept", "video/mp4,video/quicktime,video/webm");
  await expect(page.getByText("Por ahora, suba videos de 75 MB o menos.")).toBeVisible();
  await expect(page.getByText("Por defecto se prepara para YouTube Shorts.")).toBeVisible();
  await expect(page.getByLabel("Privacidad")).toHaveValue("public");
});

test("admin ads planner prepares Meta campaigns that send clicks to chat", async ({ page }) => {
  const adRequests: unknown[] = [];
  await page.route("**/api/admin/ads", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    adRequests.push(body);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        mode: "dry_run",
        liveConfigured: false,
        missingConfig: ["META_ACCESS_TOKEN"],
        draft: {
          landingUrl:
            "https://medinaclean.com/es?utm_source=meta&utm_medium=paid_social&utm_campaign=woodstock-limpieza-recurrente&utm_content=instagram-facebook&zip=30188#chat",
          campaign: { name: "Woodstock limpieza recurrente", objective: "OUTCOME_TRAFFIC", status: "PAUSED" },
          adSet: { daily_budget: 2000, status: "PAUSED" },
          creative: { name: "Woodstock limpieza recurrente chat creative" },
          ad: { status: "PAUSED" }
        }
      })
    });
  });

  await page.goto("/admin");
  await page.getByLabel("Contraseña").fill("test-admin");
  await page.getByRole("button", { name: "Entrar" }).click();

  await page.getByRole("link", { name: "Anuncios" }).click();

  await expect(page.getByRole("heading", { name: "Anuncios", exact: true })).toBeVisible();
  await expect(page.locator("#admin-ads-planner-form")).toHaveAttribute("data-ready", "true");
  await expect(page.getByRole("heading", { name: "Meta Ads Manager" })).toBeVisible();
  await expect(page.getByLabel("Presupuesto diario")).toHaveValue("20");
  await expect(page.getByLabel("ZIPs para mostrar anuncios")).toContainText("30188");
  await expect(page.getByLabel("Instagram")).toBeChecked();
  await expect(page.getByLabel("Facebook")).toBeChecked();

  await page.getByLabel("Nombre de campaña").fill("Woodstock limpieza recurrente");
  await page.getByLabel("ZIPs para mostrar anuncios").fill("30188, 30189");

  const landingLink = page.getByRole("link", { name: "Abrir enlace de chat" });
  await expect(landingLink).toHaveAttribute(
    "href",
    /\/es\?utm_source=meta&utm_medium=paid_social&utm_campaign=woodstock-limpieza-recurrente&utm_content=instagram-facebook&zip=30188#chat/
  );

  await page.getByRole("button", { name: "Preparar borrador seguro" }).click();
  await expect(page.getByText("Borrador seguro listo. No se gastó dinero.")).toBeVisible();
  await expect(page.getByText("META_ACCESS_TOKEN")).toBeVisible();
  expect(adRequests).toEqual([
    {
      lang: "es",
      campaignName: "Woodstock limpieza recurrente",
      dailyBudgetUsd: "20",
      zipCodes: "30188, 30189",
      platforms: ["instagram", "facebook"],
      publishMode: "dry_run"
    }
  ]);
});

test("admin video list shows previews so Rosa can choose site visibility", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Contraseña").fill("test-admin");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.goto("/admin/videos");

  const previews = page.locator(".admin-video-preview");
  const previewCount = await previews.count();
  if (previewCount === 0) {
    await expect(page.getByText("No hay videos todavía.")).toBeVisible();
    return;
  }

  await expect(previews.first()).toBeVisible();
  const firstPreview = page.locator(".admin-video-preview").first();
  const tagName = await firstPreview.evaluate((element) => element.tagName.toLowerCase());
  if (tagName === "iframe") {
    await expect(firstPreview).toHaveAttribute("src", /youtube-nocookie\.com\/embed\//);
  } else {
    await expect(firstPreview).toContainText("Este video ya no está disponible en YouTube.");
  }
  await expect(page.getByRole("button", { name: /Ocultar del sitio|Mostrar en el sitio/ }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Quitar registro" }).first()).toBeVisible();
});

test("admin video upload submits public YouTube video details", async ({ page }) => {
  await page.goto("/admin?lang=en");
  await page.getByLabel("Password").fill("test-admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("link", { name: "Videos" }).click();
  await expect(page.locator("#admin-video-upload-form")).toHaveAttribute("data-ready", "true");

  await page.route("**/api/admin/videos", async (route) => {
    await route.fulfill({
      status: 303,
      headers: { location: "/admin/videos?lang=en&uploaded=1" }
    });
  });

  await page.getByLabel("English title").fill("Clean kitchen reveal");
  await page.getByLabel("Spanish title").fill("Cocina limpia");
  await page.getByLabel("Description").fill("Real Medina Clean project video.");
  await page.getByLabel("Optional video type").selectOption("kitchen_cleaning");
  await page.getByLabel("Description").blur();
  await page.getByLabel("Video file").setInputFiles({
    name: "kitchen.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("fake video")
  });

  const uploadRequest = page.waitForRequest((request) => request.url().includes("/api/admin/videos"));
  await page.getByRole("button", { name: "Upload to YouTube" }).focus();
  await page.keyboard.press("Enter");

  const submitted = (await uploadRequest).postData() || "";
  expect(submitted).toContain('name="titleEn"');
  expect(submitted).toContain("Clean kitchen reveal");
  expect(submitted).toContain('name="titleEs"');
  expect(submitted).toContain("Cocina limpia");
  expect(submitted).toContain('name="serviceFocus"');
  expect(submitted).toContain("kitchen_cleaning");
  expect(submitted).toContain('name="privacyStatus"');
  expect(submitted).toContain("public");
  expect(submitted).toContain('filename="kitchen.mp4"');
});

test("admin video upload shows progress while YouTube is receiving the file", async ({ page }) => {
  await page.goto("/admin");
  await page.getByLabel("Contraseña").fill("test-admin");
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.getByRole("link", { name: "Videos" }).click();
  await expect(page.locator("#admin-video-upload-form")).toHaveAttribute("data-ready", "true");

  let releaseUpload: (() => void) | undefined;
  await page.route("**/api/admin/videos", async (route) => {
    await new Promise<void>((resolve) => {
      releaseUpload = resolve;
    });
    await route.fulfill({
      status: 303,
      headers: { location: "/admin/videos?uploaded=1" }
    });
  });

  await page.getByLabel("Archivo de video").setInputFiles({
    name: "kitchen.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("fake video")
  });

  await page.getByRole("button", { name: "Subir a YouTube" }).click({ noWaitAfter: true });
  await expect(page.getByRole("button", { name: "Subiendo a YouTube..." })).toBeDisabled();
  await expect(page.getByText("Mantenga esta página abierta.")).toBeVisible();

  releaseUpload?.();
  await expect(page).toHaveURL(/uploaded=1/);
});

test("admin video upload errors show as readable admin feedback", async ({ page }) => {
  await page.goto("/admin?lang=en");
  await page.getByLabel("Password").fill("test-admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.goto("/admin/videos?lang=en&error=The+video+form+could+not+be+read.");

  await expect(page.getByText("The video form could not be read.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Upload video" })).toBeVisible();
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

test("admin client phone accepts formatted 10-digit numbers on blur", async ({ page }) => {
  await page.goto("/admin?lang=en");
  await page.getByLabel("Password").fill("test-admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator('form[action="/api/admin/clients"]')).toHaveAttribute("data-ready", "true");

  const phone = page.getByRole("textbox", { name: "Phone" });
  await phone.fill("112-233-4566");
  await phone.blur();

  await expect(phone).toHaveValue("(112) 233-4566");
  await expect(page.getByText("Enter a 10-digit US phone number.")).not.toBeVisible();
  await expect(page.getByText("Valid US phone number.")).toBeVisible();
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
