import { NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET — Récupérer les invitations reçues par l'utilisateur courant
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const supabase = getSupabase();

  // Récupérer le profil du user courant
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, contact_email")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json([]);
  }

  // Chercher les invitations par profile_id OU par email
  const conditions = [`profile_id.eq.${profile.id}`];
  if (profile.contact_email) {
    conditions.push(`email.eq.${profile.contact_email}`);
  }

  const { data: invitations } = await supabase
    .from("project_invitations")
    .select("id, project_id, email, invited_by, status, created_at, profile_id")
    .eq("status", "pending")
    .or(conditions.join(","))
    .order("created_at", { ascending: false });

  if (!invitations || invitations.length === 0) {
    return NextResponse.json([]);
  }

  // Récupérer les infos des projets
  const projectIds = [...new Set(invitations.map((i) => i.project_id))];
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, vision, images, location, province, country")
    .in("id", projectIds);

  const projectMap: Record<string, Record<string, unknown>> = {};
  if (projects) {
    for (const p of projects) {
      projectMap[p.id] = p;
    }
  }

  // Récupérer les infos des inviteurs
  const inviterIds = [...new Set(invitations.map((i) => i.invited_by))];
  const { data: inviterProfiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, avatar_url")
    .in("user_id", inviterIds);

  const inviterMap: Record<string, Record<string, unknown>> = {};
  if (inviterProfiles) {
    for (const p of inviterProfiles) {
      inviterMap[p.user_id] = p;
    }
  }

  // Assembler la réponse
  const result = invitations.map((inv) => ({
    ...inv,
    project: projectMap[inv.project_id] || null,
    inviter: inviterMap[inv.invited_by] || null,
  }));

  return NextResponse.json(result);
}
