import { ProfileCard } from "./profile-types";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  vision: string | null;
  answers: Record<string, string | string[] | number>;
  images: string[];
  invite_token: string | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  profile_id: string;
  role: "creator" | "member";
  joined_at: string;
}

export interface ProjectMemberWithProfile extends ProjectMember {
  profiles: ProfileCard;
}

export interface ProjectWithMembers extends Project {
  project_members: ProjectMemberWithProfile[];
}
