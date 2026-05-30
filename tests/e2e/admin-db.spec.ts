import { expect, test } from "@playwright/test";

test.describe("admin operations with local database", () => {
  test.skip(process.env.RUN_DB_E2E !== "1", "Run with npm run test:e2e:db after starting local Supabase.");

  test("saves a client, schedules a job, creates a follow-up, blocks calendar time, and approves a review", async ({
    page
  }) => {
    const testRun = Date.now();
    const clientName = `Test Client ${testRun}`;
    const reviewName = `Review Client ${testRun}`;
    const blockReason = `Doctor ${testRun}`;
    const jobDate = tomorrowDateTimeInput();
    const jobDay = jobDate.slice(0, 10);

    await page.goto("/admin");
    await page.getByLabel("Contraseña").fill("test-admin");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.getByRole("heading", { name: "Clientes", exact: true })).toBeVisible();
    await expect(page.getByText("Supabase service access is not configured.")).not.toBeVisible();

    await page.getByRole("link", { name: "Equipo" }).click();
    await expect(page.getByRole("heading", { name: "Equipo", exact: true })).toBeVisible();
    await expect(page.locator('input[value="Rosa Medina"]')).toBeVisible();
    await page.getByLabel("Nombre").first().fill(`Crew Member ${testRun}`);
    await page.getByRole("textbox", { name: "Teléfono" }).first().fill("(470) 555-0199");
    await page.getByRole("textbox", { name: "Email" }).first().fill(`crew-${testRun}@example.com`);
    await page.getByLabel("Rol").first().selectOption("cleaner");
    await page.getByLabel("Estado").first().selectOption("active");
    await page.getByLabel("Inicio entre semana").first().fill("10:00");
    await page.getByLabel("Fin entre semana").first().fill("17:00");
    await page.getByRole("button", { name: "Guardar miembro" }).click();
    await expect(page.getByText("Miembro guardado.")).toBeVisible();
    await expect(page.locator(`input[value="Crew Member ${testRun}"]`)).toBeVisible();
    await page.getByLabel("Equipo asignado").selectOption({ label: `Crew Member ${testRun}` });
    await page.getByLabel("Inicio no disponible").fill(`${jobDay}T08:00`);
    await page.getByLabel("Fin no disponible").fill(`${jobDay}T17:00`);
    await page.getByLabel("Razón").fill("Family appointment");
    await page.getByRole("button", { name: "Guardar bloqueo" }).click();
    await expect(page.getByText("No disponibilidad guardada.")).toBeVisible();
    await expect(page.getByText("Family appointment").first()).toBeVisible();

    await page.getByRole("link", { name: "Clientes" }).click();
    await page.getByLabel("Nombre").fill(clientName);
    await page.getByRole("textbox", { name: "Teléfono" }).fill("(470) 555-0100");
    await page.getByRole("textbox", { name: "Email" }).fill(`client-${testRun}@example.com`);
    await page.getByLabel("Canal preferido").selectOption("email");
    await page.getByLabel("Dirección").fill("100 Test Street, Woodstock, GA");
    await page.getByLabel("ZIP").fill("30188");
    await page.getByLabel("Idioma").selectOption("en");
    await page.getByLabel("Frecuencia").selectOption("every_2_weeks");
    await page.getByLabel("Precio").fill("150");
    await page.getByLabel("Día usual").fill("Tuesday");
    await page.getByLabel("Hora usual").fill("Morning");
    await page.getByLabel("Notas").fill("Synthetic Playwright client. Safe to delete.");
    await page.getByRole("checkbox", { name: "Puede pedir reseña" }).check();
    await page.getByRole("checkbox", { name: "Puede pedir referido" }).check();
    await page.getByRole("button", { name: "Guardar cliente" }).click();

    await expect(page.getByText("Cliente guardado.")).toBeVisible();
    const clientRow = page.getByRole("article").filter({ hasText: clientName });
    await expect(clientRow).toBeVisible();
    await expect(clientRow.getByText("Cada 2 semanas · $150")).toBeVisible();
    await expect(clientRow.getByRole("link", { name: "Ver detalles" })).toBeVisible();

    await clientRow.getByRole("link", { name: "Ver detalles" }).click();
    await expect(page.getByRole("heading", { name: clientName })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Memoria del cliente" })).toBeVisible();
    const clientMemory = page.locator(".admin-facts");
    await expect(clientMemory.getByText("Teléfono")).toBeVisible();
    await expect(clientMemory.getByText("(470) 555-0100")).toBeVisible();

    await page.getByLabel("Fecha y hora").fill(jobDate);
    await page.getByLabel("Duración en minutos").fill("180");
    await page.getByRole("textbox", { name: "Precio" }).fill("165");
    await page.getByLabel("Servicio").fill("First cleaning");
    await page.getByLabel("Estado").selectOption("needs_confirmation");
    await page.getByLabel("Notas").first().fill("Synthetic scheduled job.");
    await page.getByRole("button", { name: "Guardar trabajo" }).click();

    await expect(page.getByText("Trabajo guardado.")).toBeVisible();
    const jobRow = page.getByRole("article").filter({ hasText: "First cleaning" });
    await expect(jobRow).toBeVisible();
    await expect(jobRow.locator("span").filter({ hasText: "Necesita confirmación" })).toBeVisible();
    await expect(jobRow.getByText(/Equipo asignado: .+/)).toBeVisible();
    await expect(jobRow.getByText(`Equipo asignado: Crew Member ${testRun}`)).not.toBeVisible();
    await jobRow.getByRole("button", { name: "Enviar invitación" }).click();
    await expect(page.getByText("Invitación enviada.")).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: "First cleaning" }).locator("span").filter({ hasText: "Invitación enviada" })).toBeVisible();
    await jobRow.getByLabel("Actualizar estado").selectOption("confirmed");
    await jobRow.getByRole("button", { name: "Actualizar" }).click();
    await expect(page.getByText("Estado actualizado.")).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: "First cleaning" }).locator("span").filter({ hasText: "Confirmado" })).toBeVisible();
    await page.getByRole("article").filter({ hasText: "First cleaning" }).getByLabel("Actualizar estado").selectOption("completed");
    await page.getByRole("article").filter({ hasText: "First cleaning" }).getByRole("button", { name: "Actualizar" }).click();
    await expect(page.getByText("Estado actualizado.")).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: "First cleaning" }).locator("span").filter({ hasText: "Completado" })).toBeVisible();

    await page.getByLabel("Fecha de seguimiento").fill("2026-06-16T10:00");
    await page.getByLabel("Tipo").selectOption("ask_for_review");
    await page.getByLabel("Notas").last().fill("Ask for a review after the first cleaning.");
    await page.getByRole("button", { name: "Guardar seguimiento" }).click();

    await expect(page.getByText("Seguimiento guardado.")).toBeVisible();
    const followUpRow = page.getByRole("article").filter({ hasText: "Pedir reseña" });
    await expect(followUpRow).toBeVisible();
    await expect(followUpRow.getByText("Ask for a review after the first cleaning.")).toBeVisible();

    await page.getByRole("link", { name: "Calendario" }).click();
    await expect(page.getByRole("heading", { name: "Calendario" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Día" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Semana" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Mes" })).toBeVisible();

    await page.goto(`/admin/calendar?date=${jobDay}&view=day`);
    await expect(page.getByRole("link", { name: "Anterior" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Siguiente" })).toBeVisible();
    await expect(page.getByLabel("Ir a fecha")).toHaveValue(jobDay);
    await expect(page.getByText(`Trabajo: ${clientName}`)).toBeVisible();
    await expect(page.getByText(/First cleaning .* Necesita confirmación .* (Rosa Medina|Crew Member)/)).toBeVisible();
    await expect(page.getByText(new RegExp(`First cleaning .* Crew Member ${testRun}`))).not.toBeVisible();
    await page.getByRole("link", { name: "Siguiente" }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/calendar\\?view=day&date=${nextDate(jobDay)}`));
    await expect(page.getByText(`Trabajo: ${clientName}`)).not.toBeVisible();
    await page.getByRole("link", { name: "Anterior" }).click();
    await expect(page.getByText(`Trabajo: ${clientName}`)).toBeVisible();
    await page.getByRole("link", { name: "Semana" }).click();
    await expect(page.getByText(`Trabajo: ${clientName}`)).toBeVisible();
    await page.getByRole("link", { name: "Siguiente" }).click();
    await expect(page.getByText(`Trabajo: ${clientName}`)).not.toBeVisible();
    await page.getByLabel("Ir a fecha").fill(jobDay);
    await page.getByRole("button", { name: "Ver fecha" }).click();
    await expect(page.getByText(`Trabajo: ${clientName}`)).toBeVisible();

    await page.getByLabel("Inicio").fill(`${jobDay}T13:00`);
    await page.getByLabel("Fin").fill(`${jobDay}T15:00`);
    await page.getByLabel("Razón").fill(blockReason);
    await page.getByLabel("Estado").selectOption("blocked");
    await page.getByLabel("Notas").fill("No appointments during this time.");
    await page.getByRole("button", { name: "Guardar bloqueo" }).click();

    await expect(page.getByText("Bloque guardado.")).toBeVisible();
    await expect(page.getByText(`Bloqueo: ${blockReason}`)).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: blockReason }).getByText("Bloqueado")).toBeVisible();

    const reviewResponse = await page.request.post("/api/reviews", {
      multipart: {
        language: "es",
        name: reviewName,
        rating: "5",
        message: "Rosa hizo un trabajo excelente en la limpieza.",
        consent: "true"
      }
    });
    expect(reviewResponse.ok()).toBeTruthy();

    await page.getByRole("link", { name: "Tareas" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Tareas" })).toBeVisible();
    const reviewTask = page.getByRole("article").filter({ hasText: reviewName });
    await expect(reviewTask).toBeVisible();
    await expect(reviewTask.getByRole("link", { name: "Necesita aprobación" })).toBeVisible();
    const nextJobTask = page.getByRole("article").filter({ hasText: clientName }).filter({ hasText: "Planear próxima limpieza" });
    await expect(nextJobTask).toBeVisible();
    await nextJobTask.getByRole("button", { name: "Crear próxima limpieza" }).click();
    await expect(page.getByText("Próxima limpieza creada.")).toBeVisible();
    await page.getByRole("link", { name: "Clientes" }).click();
    await page.getByRole("article").filter({ hasText: clientName }).getByRole("link", { name: "Ver detalles" }).click();
    await expect(page.locator("article span").filter({ hasText: "Necesita confirmación" }).first()).toBeVisible();

    await page.getByRole("link", { name: "Reseñas" }).click();
    await expect(page.getByRole("heading", { name: "Aprobar reseñas" })).toBeVisible();
    await expect(page.getByText(reviewName).first()).toBeVisible();
    await page.getByRole("article").filter({ hasText: reviewName }).getByRole("button", { name: "Aprobar" }).click();

    await expect(page.getByText("Reseña aprobada.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Aprobadas" })).toBeVisible();
    await expect(page.getByRole("article").filter({ hasText: reviewName })).toBeVisible();
  });
});

function tomorrowDateTimeInput() {
  const value = new Date();
  do {
    value.setDate(value.getDate() + 1);
  } while (value.getDay() === 0 || value.getDay() === 6);
  value.setHours(10, 0, 0, 0);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T10:00`;
}

function nextDate(dateInput: string) {
  const date = new Date(`${dateInput}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
