import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB

const VALID_QUESTION_IDS = [
  "whoAreYou",
  "whyGroupHousing",
  "communityValues",
  "whatYouBring",
  "idealDay",
  "additionalInfo",
];

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function transcribeWithGroq(audioFile: File): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return "";

  try {
    const whisperForm = new FormData();
    whisperForm.append(
      "file",
      audioFile,
      `recording.${audioFile.type.includes("mp4") ? "m4a" : "webm"}`
    );
    whisperForm.append("model", "whisper-large-v3");
    whisperForm.append("language", "fr");
    whisperForm.append("response_format", "json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${groqKey}` },
        body: whisperForm,
      }
    );

    if (!response.ok) {
      console.error("Groq Whisper error:", response.status);
      return "";
    }

    const data = await response.json();
    return data.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const formData = await request.formData();
  const audioFile = formData.get("audio") as File | null;
  const questionId = formData.get("questionId") as string | null;
  const duration = Number(formData.get("duration") || 0);

  if (!audioFile || !questionId) {
    return NextResponse.json(
      { error: "Fichier audio et questionId requis." },
      { status: 400 }
    );
  }

  if (!VALID_QUESTION_IDS.includes(questionId)) {
    return NextResponse.json(
      { error: "questionId invalide." },
      { status: 400 }
    );
  }

  if (audioFile.size > MAX_AUDIO_SIZE) {
    return NextResponse.json(
      { error: "Fichier audio trop volumineux (max 25 Mo)." },
      { status: 413 }
    );
  }

  if (!audioFile.type.startsWith("audio/")) {
    return NextResponse.json(
      { error: "Type de fichier non supporté." },
      { status: 415 }
    );
  }

  const supabase = getSupabaseAdmin();

  try {
    const ext = audioFile.type.includes("mp4") ? "m4a" : "webm";
    const fileName = `${user.id}/${questionId}_${Date.now()}.${ext}`;

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("profile-intros")
      .upload(fileName, buffer, {
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

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-intros").getPublicUrl(fileName);

    // Transcription en arrière-plan (non-bloquante pour l'UX, mais on attend ici côté serveur)
    const transcript = await transcribeWithGroq(audioFile);

    return NextResponse.json({
      audio_url: publicUrl,
      audio_path: fileName,
      transcript,
      duration_seconds: duration,
    });
  } catch (error) {
    console.error("Error uploading intro audio:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement audio." },
      { status: 500 }
    );
  }
}
