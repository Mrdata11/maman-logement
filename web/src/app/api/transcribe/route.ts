import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/api-auth";

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) return unauthorizedResponse();

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json(
      { error: "Service de transcription non configur\u00e9." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "Pas de fichier audio." }, { status: 400 });
    }

    if (audioFile.size > MAX_AUDIO_SIZE) {
      return NextResponse.json(
        { error: "Fichier audio trop volumineux (max 25 Mo)." },
        { status: 413 }
      );
    }

    if (!audioFile.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "Type de fichier non support\u00e9." },
        { status: 415 }
      );
    }

    const whisperForm = new FormData();
    whisperForm.append("file", audioFile, `recording.${audioFile.type.includes("mp4") ? "m4a" : "webm"}`);
    whisperForm.append("model", "whisper-large-v3");
    whisperForm.append("language", "fr");
    whisperForm.append("response_format", "json");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
      },
      body: whisperForm,
    });

    if (!response.ok) {
      console.error("Groq Whisper API error:", response.status, await response.text());
      return NextResponse.json(
        { error: "Erreur de transcription audio." },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (error) {
    console.error("Route error [transcribe]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la transcription." },
      { status: 500 }
    );
  }
}
