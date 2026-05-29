import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { parseClientPayload } from "@/lib/client-records";
import { deleteServiceRows, isSupabaseServiceConfigured, updateServiceRows } from "@/lib/supabase-rest";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = parseClientPayload(payload);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.errors.join(" ") }, { status: 400 });
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Supabase service access is not configured." }, { status: 503 });
  }

  try {
    await updateServiceRows("clients", `id=eq.${encodeURIComponent(id)}`, {
      ...parsed.row,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The client could not be updated." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Supabase service access is not configured." }, { status: 503 });
  }

  try {
    await deleteServiceRows("clients", `id=eq.${encodeURIComponent(id)}`);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "The client could not be deleted." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
