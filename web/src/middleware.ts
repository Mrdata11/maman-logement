import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiter with periodic cleanup
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_GENERAL = 30;
const RATE_LIMIT_MAX_AI = 10;
let requestCounter = 0;

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

function isRateLimited(ip: string, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

// All routes that call paid external APIs (Anthropic, Groq)
const AUTH_REQUIRED_ROUTES = [
  "/api/chat",
  "/api/generate-email",
  "/api/refine",
  "/api/report",
  "/api/transcribe",
  "/api/voice-questionnaire",
  "/api/voice-profile",
  "/api/voice-creation",
  "/api/profiles/generate-summary",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Periodic cleanup of rate limit map
  requestCounter++;
  if (requestCounter % 100 === 0) cleanupRateLimitMap();

  // Rate limiting: stricter for AI-backed routes
  const ip = getClientIP(request);
  const isAiRoute = AUTH_REQUIRED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const limit = isAiRoute ? RATE_LIMIT_MAX_AI : RATE_LIMIT_MAX_GENERAL;

  if (isRateLimited(ip, limit)) {
    return NextResponse.json(
      { error: "Trop de requ\u00eates. Veuillez r\u00e9essayer dans une minute." },
      { status: 429 }
    );
  }

  // Auth check with real JWT validation for protected routes
  if (isAiRoute) {
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
