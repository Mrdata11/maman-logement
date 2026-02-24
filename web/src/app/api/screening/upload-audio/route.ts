import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  // Route publique - le candidat n'est pas forcément connecté
  // Validée par session_id existant

  const formData = await request.formData();
  const audioFile = formData.get("audio") as File | null;
  const sessionId = formData.get("session_id") as string | null;

  if (!audioFile || !sessionId) {
    return NextResponse.json(
      { error: "Fichier audio et session_id requis." },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Vérifier que la session existe
  const { data: session } = await supabase
    .from("screening_sessions")
    .select("id")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return NextResponse.json(
      { error: "Session introuvable." },
      { status: 404 }
    );
  }

  try {
    const fileName = `${sessionId}_${Date.now()}.webm`;
    const filePath = `recordings/${fileName}`;

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("screening-recordings")
      .upload(filePath, buffer, {
        contentType: audioFile.type || "audio/webm",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Erreur lors de l'upload audio." },
        { status: 500 }
      );
    }

    // Mettre à jour la session avec l'URL audio
    await supabase
      .from("screening_sessions")
      .update({ audio_url: filePath })
      .eq("id", sessionId);

    return NextResponse.json({ success: true, path: filePath });
  } catch (error) {
    console.error("Error uploading audio:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement audio." },
      { status: 500 }
    );
  }
}
