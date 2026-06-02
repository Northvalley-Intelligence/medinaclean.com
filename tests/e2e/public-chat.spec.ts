import { expect, test } from "@playwright/test";

test("public hero makes Medina Clean the primary heading without repeating the hero logo", async ({ page }) => {
  await page.route("**/googletagmanager.com/**", async (route) => route.abort());
  await page.goto("/en");

  await expect(page.getByRole("heading", { name: "Medina Clean", level: 1 })).toBeVisible();
  await expect(page.locator(".hero-logo")).toHaveCount(0);
  await expect(page.getByText("post-construction cleaning near Woodstock, Marietta")).toBeVisible();
  await expect(page.getByRole("link", { name: "Instagram" })).toHaveAttribute(
    "href",
    "https://www.instagram.com/medinaclean845/"
  );
  await expect(page.locator("script#google-tag-manager")).toHaveCount(1);
  await expect
    .poll(async () => page.locator("script#google-tag-manager").evaluate((script) => script.innerHTML))
    .toContain("GTM-M3DMSPQW");
  await expect
    .poll(async () => page.locator("noscript").first().evaluate((element) => element.innerHTML))
    .toContain("https://www.googletagmanager.com/ns.html?id=GTM-M3DMSPQW");
});

test("website gallery previews before-and-after YouTube Shorts instead of placeholders", async ({ page }) => {
  await page.goto("/en");

  await expect(page.getByRole("heading", { name: "Before-and-after videos" })).toBeVisible();
  await expect(page.getByText("Before / after")).toHaveCount(0);
  await expect(page.locator(".video-links")).toHaveCSS("overflow-x", "auto");
  await expect(page.locator(".video-links")).toHaveCSS("scroll-snap-type", /x mandatory/);

  await expect(page.locator(".video-card").first()).toBeVisible();
  await expect(page.locator(".video-card").first().locator("iframe")).toHaveAttribute(
    "src",
    /https:\/\/www\.youtube-nocookie\.com\/embed\//
  );
  await expect(page.locator(".video-card").first().getByRole("link", { name: "Watch on YouTube" })).toHaveAttribute(
    "href",
    /https:\/\/(www\.)?youtube\.com\//
  );
  await expect(page.locator('iframe[src*="wQJ6qMZX0Ks"]')).toHaveCount(0);
});

test("website services use a balanced desktop layout with distinct icons", async ({ page }) => {
  await page.goto("/en");

  const services = page.locator("#services");
  await expect(services.locator(".service-card")).toHaveCount(5);
  await expect(services.locator(".service-card.featured")).toHaveCount(2);
  await expect(services.locator(".service-card svg")).toHaveCount(5);
});

test("website chat shows an AI assistant layer before the guided fallback", async ({ page }) => {
  await page.route("**/api/chat-estimate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Rough estimate: first cleaning $300; recurring $150 every 2 weeks. Use the guided estimator below.",
        mode: "deterministic_fallback",
        provider: "rules",
        model: "deterministic-chat-estimator"
      })
    });
  });

  await page.goto("/en");
  const chat = page.locator("#chat");

  await expect(chat.getByRole("heading", { name: "Ask a question" })).toBeVisible();
  await expect(chat.getByRole("heading", { name: "Guided form" })).toBeVisible();
  await expect(chat.getByRole("heading", { name: "Chat estimate" })).toHaveCount(0);
  await chat.getByPlaceholder(/Example: I have 3 bedrooms/).fill("3 bedrooms, 2 bathrooms, every 2 weeks in 30188");
  await chat.getByRole("button", { name: "Ask" }).click();

  await expect(chat.getByText("3 bedrooms, 2 bathrooms, every 2 weeks in 30188")).toBeVisible();
  await expect(chat.getByText("Rough estimate: first cleaning $300")).toBeVisible();
  await expect(chat.locator(".ai-chat-form textarea")).toHaveAttribute("placeholder", "");
  await expect(chat.getByRole("link", { name: "Check ZIP and enter contact details" })).toHaveAttribute(
    "href",
    "#guided-estimate"
  );
});

test("website chat submits the assistant message with Enter", async ({ page }) => {
  await page.route("**/api/chat-estimate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Starting rates assume Rosa brings standard cleaning materials.",
        mode: "deterministic_fallback",
        provider: "rules",
        model: "deterministic-chat-estimator"
      })
    });
  });

  await page.goto("/en");
  const chat = page.locator("#chat");
  await chat.getByPlaceholder(/Example: I have 3 bedrooms/).fill("What cleaning materials does Rosa use?");
  await chat.locator(".ai-chat-form textarea").press("Enter");

  await expect(chat.getByText("What cleaning materials does Rosa use?")).toBeVisible();
  await expect(chat.locator(".ai-chat-message.assistant").getByText("Starting rates assume Rosa brings standard cleaning materials.")).toBeVisible();
});

test("website chat sends a hidden session turn index for provider rotation", async ({ page }) => {
  const turnIndexes: unknown[] = [];
  await page.route("**/api/chat-estimate", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    turnIndexes.push(body.turnIndex);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reply: "Use the guided estimate below to send Rosa your details.",
        mode: "llm",
        provider: "gemini",
        model: "gemini-2.5-flash"
      })
    });
  });

  await page.goto("/en");
  const chat = page.locator("#chat");
  await chat.getByPlaceholder(/Example: I have 3 bedrooms/).fill("First question");
  await chat.getByRole("button", { name: "Ask" }).click();
  await expect(chat.getByText("First question")).toBeVisible();

  await chat.locator(".ai-chat-form textarea").fill("Second question");
  await chat.getByRole("button", { name: "Ask" }).click();
  await expect(chat.getByText("Second question")).toBeVisible();

  expect(turnIndexes).toEqual([0, 1]);
});

test("website chat qualifies a lead, adjusts an every-two-week estimate, and submits appointment details", async ({
  page
}) => {
  await page.route("**/api/appointments", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  await page.goto("/en");
  await page.getByRole("link", { name: "Chat estimate" }).click();
  const chat = page.locator("#chat");

  await chat.getByLabel("ZIP code").fill("30188");
  await chat.getByRole("button", { name: "Check ZIP" }).click();
  await expect(chat.getByText("Great, that ZIP is in Rosa's current service area.")).toBeVisible();

  await chat.getByLabel("Cleaning frequency").selectOption("every_2_weeks");
  await chat.getByLabel("Bedrooms").selectOption("3");
  await chat.getByLabel("Bathrooms").fill("2");
  await chat.getByLabel("Oven and refrigerator").selectOption("very_dirty");
  await chat.getByRole("button", { name: "Get estimate" }).click();

  await expect(chat.locator(".chat-estimate")).toContainText("First cleaning rough estimate:");
  await expect(chat.locator(".chat-estimate")).toContainText("$460");
  await expect(chat.locator(".chat-estimate")).toContainText("Recurring estimate:");
  await expect(chat.locator(".chat-estimate")).toContainText("$230");
  await expect(chat.locator(".chat-estimate")).toContainText("every 2 weeks");

  await chat.getByRole("button", { name: "Price feels high" }).click();
  await chat.getByLabel("Reasonable recurring amount").fill("200");
  await chat.getByLabel("I am ready for every-two-week cleaning").check();
  await chat.getByRole("button", { name: "Review amount" }).click();

  await expect(chat.getByText("Rosa can honor $200 every 2 weeks as a rough recurring estimate.")).toBeVisible();

  await chat.getByLabel("Name").fill("Taylor Client");
  await chat.getByLabel("Phone").fill("470-555-0111");
  await chat.getByLabel("Street address").fill("100 Main Street, Woodstock, GA");
  await chat.getByLabel("Preferred time 1").fill("2026-06-02T09:00");
  await chat.getByLabel("Preferred time 2").fill("2026-06-03T10:00");
  await chat.getByLabel("Preferred time 3").fill("2026-06-04T13:00");

  const appointmentRequest = page.waitForRequest((request) => request.url().includes("/api/appointments"));
  await chat.getByRole("button", { name: "Send to Rosa" }).click();

  const submitted = JSON.parse((await appointmentRequest).postData() || "{}");
  expect(submitted).toMatchObject({
    language: "en",
    name: "Taylor Client",
    phone: "+14705550111",
    zipCode: "30188",
    address: "100 Main Street, Woodstock, GA",
    bedrooms: "3",
    bathrooms: "2",
    source: "chat_agent"
  });
  expect(submitted.serviceType).toContain("Every 2 weeks");
  expect(submitted.notes).toContain("first cleaning $400, recurring $200 every 2 weeks");
  expect(submitted.notes).toContain("Add-ons: oven and refrigerator $80.");
  await expect(chat.getByText("Thanks. Rosa will review the calendar and contact you to confirm.")).toBeVisible();
  await expect(chat.getByRole("link", { name: "Download estimate PDF" })).toHaveAttribute(
    "download",
    "medina-clean-estimate.pdf"
  );
  await expect(chat.getByRole("link", { name: "Download estimate PDF" })).toHaveClass(/button primary/);
});

test("website chat accepts the default 30188 ZIP when checking service area", async ({ page }) => {
  await page.goto("/en");

  const chat = page.locator("#chat");
  await expect(chat.getByLabel("ZIP code")).toHaveValue("30188");
  await chat.getByRole("button", { name: "Check ZIP" }).click();

  await expect(chat).toContainText("Great, that ZIP is in Rosa's current service area.");
});

test("website chat accepts ad landing ZIP from Meta campaign links", async ({ page }) => {
  await page.goto("/en?utm_source=meta&utm_medium=paid_social&utm_campaign=woodstock-cleaning&zip=30189#chat");

  await expect(page.locator("#chat").getByLabel("ZIP code")).toHaveValue("30189");
});

test("website chat validates phone and street address on blur", async ({ page }) => {
  await page.goto("/en");

  const chat = page.locator("#chat");
  await chat.getByRole("button", { name: "Check ZIP" }).click();
  await chat.getByRole("button", { name: "Get estimate" }).click();

  const phone = chat.getByLabel("Phone");
  await phone.fill("555");
  await phone.blur();
  await expect(chat).toContainText("Enter a 10-digit US phone number.");

  await phone.fill("470-555-0111");
  await phone.blur();
  await expect(phone).toHaveValue("(470) 555-0111");
  await expect(chat).toContainText("Valid US phone number.");

  const bathrooms = chat.getByLabel("Bathrooms");
  await bathrooms.fill("24");
  await bathrooms.blur();
  await expect(chat).toContainText("Enter 1 to 6 bathrooms.");

  const address = chat.getByLabel("Street address");
  await address.focus();
  await address.blur();
  await expect(chat).toContainText("Enter the street address.");
});

test("website appointment form validates empty street address on blur", async ({ page }) => {
  await page.goto("/en");

  const schedule = page.locator("#schedule");
  const address = schedule.getByLabel("Address");
  await address.focus();
  await address.blur();

  await expect(schedule).toContainText("Enter the street address.");
});

test("website pricing table shows Rosa's current estimate amounts", async ({ page }) => {
  await page.goto("/en");

  const pricing = page.locator("#pricing");
  await expect(pricing).toContainText("Use the guided estimate below to customize bedrooms, bathrooms, frequency, and add-ons");
  await expect(pricing).toContainText("$30 per bedroom + bathroom");
  await expect(pricing).toContainText("$40 per bedroom + bathroom");
  await expect(pricing).toContainText("First cleaning is double");
  await expect(pricing).toContainText("Oven and refrigerator cleaning");
  await expect(pricing).toContainText("$50");
  await expect(pricing).toContainText("$80 if very dirty");
  await expect(pricing).toContainText("Post-construction cleanup");
  await expect(pricing).toContainText("Onsite inspection required");
});

test("website chat includes site-detail answers and post-construction onsite estimate", async ({ page }) => {
  await page.goto("/en");

  const chat = page.locator("#chat");
  await expect(chat).toContainText("Cleaning materials");
  await chat.locator("summary").filter({ hasText: "Cleaning materials" }).click();
  await expect(chat).toContainText("Rosa brings standard cleaning materials");

  await chat.getByLabel("ZIP code").fill("30188");
  await chat.getByRole("button", { name: "Check ZIP" }).click();
  await chat.getByLabel("Cleaning frequency").selectOption("post_construction");
  await chat.getByRole("button", { name: "Get estimate" }).click();

  await expect(chat).toContainText("Post-construction cleanup is estimated after Rosa sees the property onsite.");
});

test("website chat stops automatic scheduling outside Rosa's service ZIP list", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("link", { name: "Chat estimate" }).click();
  const chat = page.locator("#chat");

  await chat.getByLabel("ZIP code").fill("99999");
  await chat.getByRole("button", { name: "Check ZIP" }).click();

  await expect(chat.getByText("That ZIP appears outside Rosa's automatic service area.")).toBeVisible();
  await expect(chat.getByRole("button", { name: "Get estimate" })).not.toBeVisible();
});

test("website chat supports Spanish appointment submissions", async ({ page }) => {
  await page.route("**/api/appointments", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true })
    });
  });

  await page.goto("/es");
  await page.getByRole("link", { name: "Estimado por chat" }).click();
  const chat = page.locator("#chat");

  await chat.getByLabel("Código ZIP").fill("30188");
  await chat.getByRole("button", { name: "Revisar ZIP" }).click();
  await expect(chat.getByText("Muy bien, ese ZIP está dentro del área de servicio actual de Rosa.")).toBeVisible();

  await chat.getByLabel("Frecuencia de limpieza").selectOption("every_3_weeks");
  await chat.getByLabel("Habitaciones").selectOption("2");
  await chat.getByLabel("Baños").fill("1");
  await chat.getByRole("button", { name: "Calcular estimado" }).click();

  await expect(chat.getByText("Estimado inicial de primera limpieza:")).toBeVisible();
  await expect(chat.getByText("Estimado recurrente:")).toBeVisible();

  await chat.getByLabel("Nombre").fill("Cliente Español");
  await chat.getByLabel("Teléfono").fill("470-555-0112");
  await chat.getByLabel("Dirección").fill("200 Main Street, Woodstock, GA");
  await chat.getByLabel("Horario preferido 1").fill("2026-06-02T09:00");
  await chat.getByLabel("Horario preferido 2").fill("2026-06-03T10:00");
  await chat.getByLabel("Horario preferido 3").fill("2026-06-04T13:00");

  const appointmentRequest = page.waitForRequest((request) => request.url().includes("/api/appointments"));
  await chat.getByRole("button", { name: "Enviar a Rosa" }).click();

  const submitted = JSON.parse((await appointmentRequest).postData() || "{}");
  expect(submitted).toMatchObject({
    language: "es",
    name: "Cliente Español",
    phone: "+14705550112",
    source: "chat_agent"
  });
  await expect(chat.getByText("Gracias. Rosa revisará el calendario y se comunicará para confirmar.")).toBeVisible();
});
