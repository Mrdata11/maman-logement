import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("screening_sessions")
    .select("*, screening_configs(*), screening_links(*)")
    .eq("id", id)
    .eq("created_by", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Session introuvable." },
      { status: 404 }
    );
  }

  const { screening_configs, screening_links, ...session } = data;

  return NextResponse.json({
    session: {
      ...session,
      config: screening_configs,
      link: screening_links?.[0] || null,
    },
  });
}
