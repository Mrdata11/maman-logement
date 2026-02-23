import { z } from "zod";

// /api/chat
export const chatSchema = z.object({
  message: z.string().max(2000),
  listing: z.object({
    title: z.string().max(500),
    location: z.string().max(200).nullable().optional(),
    province: z.string().max(200).nullable().optional(),
    price: z.string().max(100).nullable().optional(),
    listing_type: z.string().max(100).nullable().optional(),
    contact: z.string().max(500).nullable().optional(),
    source_url: z.string().max(2000),
    description: z.string().max(50000),
  }),
  evaluation: z
    .object({
      quality_score: z.number().min(0).max(100).optional(),
      quality_summary: z.string().max(2000).optional(),
      highlights: z.array(z.string().max(300)).max(20).optional(),
      concerns: z.array(z.string().max(300)).max(20).optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(5000),
      })
    )
    .max(20)
    .optional(),
});

// /api/voice-questionnaire
export const voiceQuestionnaireSchema = z.object({
  transcript: z.string().min(10).max(10000),
});

// /api/voice-profile
export const voiceProfileSchema = z.object({
  transcript: z.string().min(5).max(10000),
  questionId: z.string().max(100),
});

// /api/voice-creation
export const voiceCreationSchema = z.object({
  transcript: z.string().min(10).max(10000),
});

// /api/generate-email
export const generateEmailSchema = z.object({
  listing: z.object({
    title: z.string().max(500),
    location: z.string().max(200).nullable().optional(),
    province: z.string().max(200).nullable().optional(),
    price: z.string().max(100).nullable().optional(),
    listing_type: z.string().max(100).nullable().optional(),
    contact: z.string().max(500).nullable().optional(),
    source_url: z.string().max(2000),
    description: z.string().max(50000),
  }),
  evaluation: z
    .object({
      quality_score: z.number().min(0).max(100).optional(),
      quality_summary: z.string().max(2000).optional(),
      highlights: z.array(z.string().max(300)).max(20).optional(),
      concerns: z.array(z.string().max(300)).max(20).optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
  userProfile: z
    .object({
      name: z.string().max(100).optional(),
      context: z.string().max(2000).optional(),
    })
    .optional(),
});

// /api/refine
export const refineSchema = z.object({
  message: z.string().max(1000),
  currentWeights: z.record(z.string(), z.number().min(0).max(5)).optional(),
  currentFilters: z
    .object({
      listing_types_include: z.array(z.string()).optional(),
      listing_types_exclude: z.array(z.string()).optional(),
      locations_include: z.array(z.string()).optional(),
      locations_exclude: z.array(z.string()).optional(),
      max_price: z.number().nullable().optional(),
      min_score: z.number().nullable().optional(),
      keywords_include: z.array(z.string()).optional(),
      keywords_exclude: z.array(z.string()).optional(),
    })
    .optional(),
});

// /api/report
export const reportSchema = z.object({
  listings: z
    .array(
      z.object({
        listing: z.object({
          title: z.string().max(500),
          location: z.string().max(200).nullable().optional(),
          province: z.string().max(200).nullable().optional(),
          price: z.string().max(100).nullable().optional(),
        }),
        evaluation: z
          .object({
            quality_score: z.number().optional(),
            quality_summary: z.string().max(2000).optional(),
            highlights: z.array(z.string().max(300)).optional(),
            concerns: z.array(z.string().max(300)).optional(),
          })
          .passthrough()
          .nullable()
          .optional(),
        notes: z.string().max(2000),
        status: z.string().max(50),
      })
    )
    .min(1)
    .max(50),
});

// /api/profiles/generate-summary
export const generateSummarySchema = z.object({
  questionnaireAnswers: z.record(z.string(), z.unknown()).optional(),
  introduction: z
    .object({
      whoAreYou: z.string().max(2000).optional(),
      whyGroupHousing: z.string().max(2000).optional(),
      communityValues: z.string().max(2000).optional(),
      whatYouBring: z.string().max(2000).optional(),
      idealDay: z.string().max(2000).optional(),
      additionalInfo: z.string().max(2000).optional(),
    })
    .optional(),
});

// /api/screening/configs
export const screeningConfigCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  questions: z
    .array(
      z.object({
        id: z.string().max(100),
        text: z.string().min(1).max(500),
        followUp: z.string().max(500).optional(),
        required: z.boolean(),
        order: z.number().int().min(0),
      })
    )
    .min(1)
    .max(20),
  voice_id: z.string().max(100).optional(),
  language: z.string().max(10).optional(),
});

export const screeningConfigUpdateSchema = screeningConfigCreateSchema.partial();

// /api/screening/sessions
export const screeningSessionCreateSchema = z.object({
  config_id: z.string().uuid(),
  candidate_name: z.string().min(1).max(200),
  candidate_email: z.string().email().max(300).nullable().optional(),
});

// /api/screening/agent (public, validated by token)
export const screeningAgentSchema = z.object({
  token: z.string().min(32).max(128),
});

// /api/screening/complete
export const screeningCompleteSchema = z.object({
  session_id: z.string().uuid(),
  conversation_id: z.string().max(200),
});
