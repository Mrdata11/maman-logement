import type { ProfileCard } from "./profile-types";

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export interface Application {
  id: string;
  profile_id: string;
  project_id: string;
  status: ApplicationStatus;
  motivation: string | null;
  reviewer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationWithProfile extends Application {
  profiles: ProfileCard;
}

export interface ApplicationWithProject extends Application {
  projects: { id: string; name: string; vision: string | null };
}

export const APPLICATION_STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; color: string }
> = {
  pending: { label: "En attente", color: "bg-amber-100 text-amber-800" },
  accepted: { label: "Accept\u00e9e", color: "bg-green-100 text-green-800" },
  rejected: { label: "Refus\u00e9e", color: "bg-red-100 text-red-700" },
  withdrawn: { label: "Retir\u00e9e", color: "bg-gray-100 text-gray-500" },
};
