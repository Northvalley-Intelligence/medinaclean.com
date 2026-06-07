import { NextResponse } from "next/server";
import { validateAppointmentRequestPayload } from "@/lib/appointment-request";
import { extractZip, validateServiceArea } from "@/lib/service-area";
import { buildAppointmentNotificationText, trySendSiteNotification } from "@/lib/site-notifications";
import { insertRow, isSupabaseConfigured } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const zipCode = String(body.zipCode || extractZip(String(body.address || ""))).trim();
  const validation = validateServiceArea(zipCode);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.message }, { status: 400 });
  }

  const required = [
    "language",
    "name",
    "phone",
    "address",
    "serviceType",
    "bedrooms",
    "bathrooms",
    "preferredTime1",
    "preferredTime2",
    "preferredTime3"
  ];

  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing ${field}.` }, { status: 400 });
    }
  }

  const payloadValidation = validateAppointmentRequestPayload({
    bedrooms: Number(body.bedrooms),
    bathrooms: Number(body.bathrooms),
    preferredTime1: String(body.preferredTime1),
    preferredTime2: String(body.preferredTime2),
    preferredTime3: String(body.preferredTime3)
  });
  if (!payloadValidation.ok) {
    return NextResponse.json({ error: payloadValidation.error }, { status: 400 });
  }

  const row = {
    language: body.language === "es" ? "es" : "en",
    name: clean(body.name, 120),
    phone: clean(body.phone, 40),
    address: clean(body.address, 260),
    zip_code: zipCode,
    service_type: clean(body.serviceType, 120),
    bedrooms: payloadValidation.bedrooms,
    bathrooms: payloadValidation.bathrooms,
    preferred_time_1: payloadValidation.preferredTime1,
    preferred_time_2: payloadValidation.preferredTime2,
    preferred_time_3: payloadValidation.preferredTime3,
    notes: clean(body.notes || "", 1200) || null,
    distance_miles: validation.distanceMiles,
    source: appointmentSource(body.source)
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet. Add environment variables before accepting live requests." },
      { status: 503 }
    );
  }

  try {
    await insertRow("appointment_requests", row);
    await trySendSiteNotification({
      subject: `New Medina Clean appointment request: ${row.name}`,
      text: buildAppointmentNotificationText({
        language: row.language,
        name: row.name,
        phone: row.phone,
        address: row.address,
        zipCode: row.zip_code,
        serviceType: row.service_type,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        preferredTimes: [row.preferred_time_1, row.preferred_time_2, row.preferred_time_3],
        notes: row.notes,
        source: row.source
      })
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The appointment request could not be saved." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function appointmentSource(value: unknown) {
  return value === "chat_agent" ? "chat_agent" : "website";
}
