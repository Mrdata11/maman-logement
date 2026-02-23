import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (for API routes and server components)
// Uses the service role key or anon key depending on context
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
