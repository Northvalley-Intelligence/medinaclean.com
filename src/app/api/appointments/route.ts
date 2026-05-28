import { NextResponse } from "next/server";
import { extractZip, validateServiceArea } from "@/lib/service-area";
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

  const row = {
    language: body.language === "es" ? "es" : "en",
    name: clean(body.name, 120),
    phone: clean(body.phone, 40),
    address: clean(body.address, 260),
    zip_code: zipCode,
    service_type: clean(body.serviceType, 120),
    bedrooms: Number(body.bedrooms),
    bathrooms: Number(body.bathrooms),
    preferred_time_1: new Date(String(body.preferredTime1)).toISOString(),
    preferred_time_2: new Date(String(body.preferredTime2)).toISOString(),
    preferred_time_3: new Date(String(body.preferredTime3)).toISOString(),
    notes: clean(body.notes || "", 1200) || null,
    distance_miles: validation.distanceMiles
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet. Add environment variables before accepting live requests." },
      { status: 503 }
    );
  }

  await insertRow("appointment_requests", row);
  return NextResponse.json({ ok: true });
}

function clean(value: unknown, max: number) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
