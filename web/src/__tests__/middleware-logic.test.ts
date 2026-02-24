import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase SSR before importing middleware
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } } }),
    },
  }),
}));

// Import after mock setup
import { middleware } from "@/middleware";

// Helper to create a minimal NextRequest-like object
function makeRequest(
  pathname: string,
  headers: Record<string, string> = {}
): Parameters<typeof middleware>[0] {
  const headerMap = new Map(Object.entries(headers));
  return {
    nextUrl: { pathname },
    headers: {
      get: (name: string) => headerMap.get(name) ?? null,
    },
    cookies: {
      getAll: () => [],
    },
  } as unknown as Parameters<typeof middleware>[0];
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes through non-API routes", async () => {
    const req = makeRequest("/habitats");
    const res = await middleware(req);
    // NextResponse.next() returns a response with no custom body
    expect(res.status).not.toBe(429);
    expect(res.status).not.toBe(401);
  });

  it("allows first API request", async () => {
    const req = makeRequest("/api/score", { "x-forwarded-for": "first-request-ip" });
    const res = await middleware(req);
    expect(res.status).not.toBe(429);
  });

  it("classifies /api/chat as AI route (auth required)", async () => {
    const req = makeRequest("/api/chat", { "x-forwarded-for": "auth-test-ip" });
    // With our mock returning a user, should pass auth
    const res = await middleware(req);
    expect(res.status).not.toBe(401);
  });

  it("classifies /api/refine as AI route", async () => {
    const req = makeRequest("/api/refine", { "x-forwarded-for": "refine-test-ip" });
    const res = await middleware(req);
    expect(res.status).not.toBe(401);
  });

  it("returns 429 when rate limit exceeded for general routes", async () => {
    const ip = `rate-limit-general-${Date.now()}`;
    // Send 31 requests (limit is 30 for general)
    let lastRes;
    for (let i = 0; i < 31; i++) {
      lastRes = await middleware(makeRequest("/api/score", { "x-forwarded-for": ip }));
    }
    expect(lastRes!.status).toBe(429);
  });

  it("returns 429 faster for AI routes (limit 10)", async () => {
    const ip = `rate-limit-ai-${Date.now()}`;
    // Send 11 requests (limit is 10 for AI routes)
    let lastRes;
    for (let i = 0; i < 11; i++) {
      lastRes = await middleware(makeRequest("/api/chat", { "x-forwarded-for": ip }));
    }
    expect(lastRes!.status).toBe(429);
  });

  it("uses x-forwarded-for header for IP extraction", async () => {
    const ip = `forwarded-ip-${Date.now()}`;
    const req = makeRequest("/api/score", { "x-forwarded-for": `${ip}, proxy1` });
    const res = await middleware(req);
    expect(res.status).not.toBe(429);
  });

  it("uses x-real-ip when x-forwarded-for is absent", async () => {
    const ip = `real-ip-${Date.now()}`;
    const req = makeRequest("/api/score", { "x-real-ip": ip });
    const res = await middleware(req);
    expect(res.status).not.toBe(429);
  });
});
