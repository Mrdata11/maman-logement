export interface Campaign {
  id: string;
  name: string;
  created_at: string;
  status: "draft" | "active" | "paused" | "completed";
  target_filter: {
    countries?: string[];
    regions?: string[];
    categories?: string[];
  };
  email_template_id: string;
  stats: {
    total: number;
    sent: number;
    opened: number;
    replied: number;
    bounced: number;
    form_submitted: number;
  };
}

export interface OutreachContact {
  venue_id: string;
  venue_name: string;
  email: string;
  status:
    | "pending"
    | "sent"
    | "opened"
    | "replied"
    | "bounced"
    | "form_submitted";
  campaign_id: string;
  sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  form_token: string;
  follow_up_count: number;
  next_follow_up_at: string | null;
  notes: string;
}

export interface OutreachData {
  campaigns: Campaign[];
  contacts: OutreachContact[];
}
