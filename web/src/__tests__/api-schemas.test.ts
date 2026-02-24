import { describe, it, expect } from "vitest";
import {
  chatSchema,
  voiceQuestionnaireSchema,
  voiceProfileSchema,
  voiceCreationSchema,
  generateEmailSchema,
  refineSchema,
  reportSchema,
  generateSummarySchema,
  screeningConfigCreateSchema,
  screeningSessionCreateSchema,
  screeningAgentSchema,
  screeningCompleteSchema,
  verificationStartSchema,
  verificationCompleteSchema,
} from "@/lib/api-schemas";

// --- chatSchema ---

describe("chatSchema", () => {
  const validChat = {
    message: "Bonjour, que pensez-vous de ce lieu ?",
    listing: {
      title: "Habitat groupé à Ixelles",
      source_url: "https://example.com/listing",
      description: "Un beau lieu communautaire.",
    },
  };

  it("accepts valid chat request", () => {
    expect(() => chatSchema.parse(validChat)).not.toThrow();
  });

  it("rejects message over 2000 chars", () => {
    expect(() =>
      chatSchema.parse({ ...validChat, message: "a".repeat(2001) })
    ).toThrow();
  });

  it("rejects missing listing.title", () => {
    expect(() =>
      chatSchema.parse({
        ...validChat,
        listing: { source_url: "https://x.com", description: "desc" },
      })
    ).toThrow();
  });

  it("accepts null optional fields", () => {
    expect(() =>
      chatSchema.parse({
        ...validChat,
        listing: { ...validChat.listing, location: null, province: null },
        evaluation: null,
      })
    ).not.toThrow();
  });

  it("accepts conversationHistory", () => {
    expect(() =>
      chatSchema.parse({
        ...validChat,
        conversationHistory: [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Bonjour" },
        ],
      })
    ).not.toThrow();
  });
});

// --- voiceQuestionnaireSchema ---

describe("voiceQuestionnaireSchema", () => {
  it("accepts valid transcript", () => {
    expect(() =>
      voiceQuestionnaireSchema.parse({ transcript: "Je cherche un habitat groupé à Bruxelles." })
    ).not.toThrow();
  });

  it("rejects transcript shorter than 10 chars", () => {
    expect(() =>
      voiceQuestionnaireSchema.parse({ transcript: "court" })
    ).toThrow();
  });

  it("rejects transcript over 10000 chars", () => {
    expect(() =>
      voiceQuestionnaireSchema.parse({ transcript: "a".repeat(10001) })
    ).toThrow();
  });
});

// --- voiceProfileSchema ---

describe("voiceProfileSchema", () => {
  it("accepts valid input", () => {
    expect(() =>
      voiceProfileSchema.parse({ transcript: "Je suis Marie.", questionId: "whoAreYou" })
    ).not.toThrow();
  });

  it("rejects missing questionId", () => {
    expect(() =>
      voiceProfileSchema.parse({ transcript: "Je suis Marie." })
    ).toThrow();
  });

  it("rejects too-short transcript", () => {
    expect(() =>
      voiceProfileSchema.parse({ transcript: "Hi", questionId: "q1" })
    ).toThrow();
  });
});

// --- voiceCreationSchema ---

describe("voiceCreationSchema", () => {
  it("accepts valid input", () => {
    expect(() =>
      voiceCreationSchema.parse({ transcript: "Nous voulons créer un écolieu." })
    ).not.toThrow();
  });

  it("rejects too-short transcript", () => {
    expect(() =>
      voiceCreationSchema.parse({ transcript: "court" })
    ).toThrow();
  });
});

// --- generateEmailSchema ---

describe("generateEmailSchema", () => {
  const validEmail = {
    listing: {
      title: "Lieu communautaire",
      source_url: "https://example.com/listing",
      description: "Un beau projet.",
    },
  };

  it("accepts valid email generation request", () => {
    expect(() => generateEmailSchema.parse(validEmail)).not.toThrow();
  });

  it("accepts without optional userProfile", () => {
    expect(() => generateEmailSchema.parse(validEmail)).not.toThrow();
  });

  it("accepts with userProfile", () => {
    expect(() =>
      generateEmailSchema.parse({
        ...validEmail,
        userProfile: { name: "Marie", context: "Je cherche un habitat." },
      })
    ).not.toThrow();
  });

  it("rejects missing source_url", () => {
    expect(() =>
      generateEmailSchema.parse({
        listing: { title: "T", description: "D" },
      })
    ).toThrow();
  });
});

// --- refineSchema ---

describe("refineSchema", () => {
  it("accepts valid refine request", () => {
    expect(() => refineSchema.parse({ message: "Moins cher" })).not.toThrow();
  });

  it("rejects message over 1000 chars", () => {
    expect(() =>
      refineSchema.parse({ message: "a".repeat(1001) })
    ).toThrow();
  });

  it("accepts with currentWeights and currentFilters", () => {
    expect(() =>
      refineSchema.parse({
        message: "Plus proche",
        currentWeights: { rental_price: 2.0 },
        currentFilters: {
          locations_include: ["Bruxelles"],
          max_price: 800,
        },
      })
    ).not.toThrow();
  });
});

// --- reportSchema ---

describe("reportSchema", () => {
  const validItem = {
    listing: { title: "Lieu" },
    notes: "Intéressant",
    status: "favorite",
  };

  it("accepts valid report with 1 listing", () => {
    expect(() =>
      reportSchema.parse({ listings: [validItem] })
    ).not.toThrow();
  });

  it("rejects empty listings array", () => {
    expect(() => reportSchema.parse({ listings: [] })).toThrow();
  });

  it("rejects more than 50 listings", () => {
    const items = Array.from({ length: 51 }, () => validItem);
    expect(() => reportSchema.parse({ listings: items })).toThrow();
  });
});

// --- generateSummarySchema ---

describe("generateSummarySchema", () => {
  it("accepts valid summary request", () => {
    expect(() =>
      generateSummarySchema.parse({
        questionnaireAnswers: { budget_max: 800 },
      })
    ).not.toThrow();
  });

  it("accepts empty object", () => {
    expect(() => generateSummarySchema.parse({})).not.toThrow();
  });

  it("accepts with introduction audio values", () => {
    expect(() =>
      generateSummarySchema.parse({
        introduction: {
          whoAreYou: {
            audio_url: "https://audio.com/file.mp3",
            audio_path: "/uploads/file.mp3",
            transcript: "Je suis Marie.",
            duration_seconds: 15,
          },
        },
      })
    ).not.toThrow();
  });

  it("accepts with introduction string values", () => {
    expect(() =>
      generateSummarySchema.parse({
        introduction: { whoAreYou: "Je suis Marie." },
      })
    ).not.toThrow();
  });

  it("accepts with introduction null values", () => {
    expect(() =>
      generateSummarySchema.parse({
        introduction: { whoAreYou: null },
      })
    ).not.toThrow();
  });
});

// --- screeningConfigCreateSchema ---

describe("screeningConfigCreateSchema", () => {
  const validConfig = {
    title: "Entretien standard",
    questions: [
      { id: "q1", text: "Question 1", required: true, order: 0 },
    ],
  };

  it("accepts valid config", () => {
    expect(() => screeningConfigCreateSchema.parse(validConfig)).not.toThrow();
  });

  it("rejects empty title", () => {
    expect(() =>
      screeningConfigCreateSchema.parse({ ...validConfig, title: "" })
    ).toThrow();
  });

  it("rejects empty questions array", () => {
    expect(() =>
      screeningConfigCreateSchema.parse({ ...validConfig, questions: [] })
    ).toThrow();
  });

  it("rejects questions over 20", () => {
    const questions = Array.from({ length: 21 }, (_, i) => ({
      id: `q${i}`,
      text: `Question ${i}`,
      required: true,
      order: i,
    }));
    expect(() =>
      screeningConfigCreateSchema.parse({ ...validConfig, questions })
    ).toThrow();
  });
});

// --- screeningSessionCreateSchema ---

describe("screeningSessionCreateSchema", () => {
  it("accepts valid session", () => {
    expect(() =>
      screeningSessionCreateSchema.parse({
        config_id: "550e8400-e29b-41d4-a716-446655440000",
        candidate_name: "Marie Dupont",
      })
    ).not.toThrow();
  });

  it("rejects invalid UUID for config_id", () => {
    expect(() =>
      screeningSessionCreateSchema.parse({
        config_id: "not-a-uuid",
        candidate_name: "Marie",
      })
    ).toThrow();
  });

  it("rejects missing candidate_name", () => {
    expect(() =>
      screeningSessionCreateSchema.parse({
        config_id: "550e8400-e29b-41d4-a716-446655440000",
      })
    ).toThrow();
  });
});

// --- screeningAgentSchema ---

describe("screeningAgentSchema", () => {
  it("accepts valid 64-char token", () => {
    expect(() =>
      screeningAgentSchema.parse({ token: "a".repeat(64) })
    ).not.toThrow();
  });

  it("rejects token shorter than 32 chars", () => {
    expect(() =>
      screeningAgentSchema.parse({ token: "short" })
    ).toThrow();
  });

  it("rejects token longer than 128 chars", () => {
    expect(() =>
      screeningAgentSchema.parse({ token: "a".repeat(129) })
    ).toThrow();
  });
});

// --- screeningCompleteSchema ---

describe("screeningCompleteSchema", () => {
  it("accepts valid completion", () => {
    expect(() =>
      screeningCompleteSchema.parse({
        session_id: "550e8400-e29b-41d4-a716-446655440000",
        conversation_id: "conv_123",
      })
    ).not.toThrow();
  });

  it("rejects invalid UUID", () => {
    expect(() =>
      screeningCompleteSchema.parse({
        session_id: "not-uuid",
        conversation_id: "conv_123",
      })
    ).toThrow();
  });
});

// --- verificationStartSchema ---

describe("verificationStartSchema", () => {
  it('accepts type "profile"', () => {
    expect(() =>
      verificationStartSchema.parse({ type: "profile", target_id: "user-123" })
    ).not.toThrow();
  });

  it('accepts type "project"', () => {
    expect(() =>
      verificationStartSchema.parse({ type: "project", target_id: "proj-456" })
    ).not.toThrow();
  });

  it("rejects invalid type", () => {
    expect(() =>
      verificationStartSchema.parse({ type: "custom", target_id: "x" })
    ).toThrow();
  });
});

// --- verificationCompleteSchema ---

describe("verificationCompleteSchema", () => {
  it("accepts valid completion", () => {
    expect(() =>
      verificationCompleteSchema.parse({
        session_id: "550e8400-e29b-41d4-a716-446655440000",
        conversation_id: "conv_abc",
      })
    ).not.toThrow();
  });

  it("rejects invalid session_id UUID", () => {
    expect(() =>
      verificationCompleteSchema.parse({
        session_id: "bad",
        conversation_id: "conv_abc",
      })
    ).toThrow();
  });
});
