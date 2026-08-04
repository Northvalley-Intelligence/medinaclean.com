import { NextResponse } from "next/server";
import { persistAppointmentIntake, prepareAppointmentIntake } from "@/lib/appointment-intake";
import { isSupabaseConfigured } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const prepared = prepareAppointmentIntake(body);
  if (!prepared.ok) {
    return NextResponse.json({ error: prepared.error }, { status: prepared.status });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet. Add environment variables before accepting live requests." },
      { status: 503 }
    );
  }

  try {
    await persistAppointmentIntake(prepared.row);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The appointment request could not be saved." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
