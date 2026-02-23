import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    return NextResponse.json(
      { error: "Transcription serveur non configur\u00e9e. Ajoute GROQ_API_KEY dans .env.local." },
      { status: 501 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "Pas de fichier audio." }, { status: 400 });
    }

    // Forward to Groq Whisper API (free, ultra-fast)
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
      const errorText = await response.text();
      console.error("Groq Whisper API error:", errorText);
      return NextResponse.json(
        { error: "Erreur de transcription audio." },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text || "" });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la transcription." },
      { status: 500 }
    );
  }
}
