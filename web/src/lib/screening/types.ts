export interface ScreeningQuestion {
  id: string;
  text: string;
  followUp?: string;
  required: boolean;
  order: number;
}

export const DEFAULT_SCREENING_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "motivation",
    text: "Qu'est-ce qui vous attire dans ce projet d'habitat groupé ?",
    followUp:
      "Si la réponse est vague, demande des précisions sur les motivations concrètes.",
    required: true,
    order: 0,
  },
  {
    id: "experience",
    text: "Avez-vous déjà vécu en communauté ou en habitat groupé ?",
    followUp:
      "Si oui, demande ce qui a bien fonctionné et ce qui était difficile.",
    required: true,
    order: 1,
  },
  {
    id: "values",
    text: "Quelles sont les valeurs les plus importantes pour vous dans une vie en communauté ?",
    required: true,
    order: 2,
  },
  {
    id: "contribution",
    text: "Comment imaginez-vous contribuer au projet au quotidien ?",
    required: true,
    order: 3,
  },
  {
    id: "concerns",
    text: "Y a-t-il des sujets qui vous préoccupent ou des questions que vous aimeriez poser ?",
    required: false,
    order: 4,
  },
];

export type VerificationType = "profile" | "project" | "custom";

export const VERIFICATION_PROFILE_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "identity",
    text: "Pouvez-vous vous présenter brièvement ? Votre prénom, votre âge, d'où vous venez ?",
    followUp:
      "Si la personne est très succincte, demande-lui ce qu'elle fait dans la vie.",
    required: true,
    order: 0,
  },
  {
    id: "motivation",
    text: "Qu'est-ce qui vous motive à chercher un habitat groupé ?",
    followUp: "Demande si c'est un projet récent ou de longue date.",
    required: true,
    order: 1,
  },
  {
    id: "values",
    text: "Quelles valeurs sont essentielles pour vous dans une vie en communauté ?",
    required: true,
    order: 2,
  },
  {
    id: "situation",
    text: "Quelle est votre situation actuelle ? Êtes-vous seul(e), en couple, avec des enfants ?",
    required: true,
    order: 3,
  },
  {
    id: "expectations",
    text: "Qu'attendez-vous concrètement de cette plateforme ?",
    followUp:
      "Si vague, demande quel type de lieu ou quelle région l'intéresse.",
    required: true,
    order: 4,
  },
];

export const VERIFICATION_PROJECT_QUESTIONS: ScreeningQuestion[] = [
  {
    id: "project_nature",
    text: "Pouvez-vous décrire votre projet d'habitat groupé en quelques mots ?",
    followUp:
      "Demande le type de lieu (écolieu, coopérative, colocation...) et la localisation.",
    required: true,
    order: 0,
  },
  {
    id: "progress",
    text: "Où en êtes-vous dans l'avancement du projet ? Est-ce une idée, un projet en cours, ou déjà existant ?",
    required: true,
    order: 1,
  },
  {
    id: "governance",
    text: "Comment fonctionne la gouvernance du projet ? Comment sont prises les décisions ?",
    followUp: "Si pas encore défini, demande quelle approche est envisagée.",
    required: true,
    order: 2,
  },
  {
    id: "welcome",
    text: "Quel type de personnes cherchez-vous à accueillir ?",
    required: true,
    order: 3,
  },
  {
    id: "vision",
    text: "Quelle est votre vision à long terme pour ce projet ?",
    required: true,
    order: 4,
  },
];

export interface ScreeningConfig {
  id: string;
  title: string;
  description: string | null;
  questions: ScreeningQuestion[];
  system_prompt_template: string | null;
  voice_id: string;
  language: string;
  elevenlabs_agent_id: string | null;
  is_system: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ScreeningSessionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed";

export interface TranscriptEntry {
  role: "user" | "agent";
  message: string;
  timestamp?: number;
}

export interface ScreeningSession {
  id: string;
  config_id: string;
  candidate_name: string;
  candidate_email: string | null;
  conversation_id: string | null;
  status: ScreeningSessionStatus;
  transcript: TranscriptEntry[] | null;
  ai_summary: string | null;
  audio_url: string | null;
  duration_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  created_by: string;
  verification_type: VerificationType | null;
  verification_target_id: string | null;
  config?: ScreeningConfig;
  link?: ScreeningLink;
}

export interface ScreeningLink {
  id: string;
  session_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export const SESSION_STATUS_CONFIG: Record<
  ScreeningSessionStatus,
  { label: string; color: string }
> = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-800" },
  in_progress: { label: "Discussion en cours", color: "bg-blue-100 text-blue-800" },
  completed: { label: "Terminé", color: "bg-emerald-100 text-emerald-800" },
  failed: { label: "Échoué", color: "bg-red-100 text-red-800" },
};
