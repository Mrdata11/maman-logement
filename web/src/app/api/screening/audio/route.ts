import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Path requis." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from("screening-recordings")
    .download(path);

  if (error || !data) {
    return NextResponse.json(
      { error: "Fichier introuvable." },
      { status: 404 }
    );
  }

  const arrayBuffer = await data.arrayBuffer();

  return new NextResponse(arrayBuffer, {
    headers: {
      "Content-Type": "audio/webm",
      "Content-Disposition": `inline; filename="${path.split("/").pop()}"`,
    },
  });
}
