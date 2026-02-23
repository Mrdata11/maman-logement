/**
 * Themed gradient placeholder for listings without photos.
 * Uses the site's warm earthy palette with subtle organic texture.
 */
export function PlaceholderImage({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={{
        background:
          "linear-gradient(135deg, #EDE7DF 0%, #E2DDD4 30%, #DDD5C8 60%, #E5DDD0 100%)",
      }}
    >
      {/* Subtle dot texture */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.05,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%235B8C5A'/%3E%3C/svg%3E")`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Soft colored blurs for organic texture */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -right-8 -top-8 w-32 h-32 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(91,140,90,0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(194,114,78,0.06) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute right-1/4 bottom-1/4 w-16 h-16 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(212,168,75,0.05) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* House icon in frosted container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="p-3 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.4)" }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: "var(--muted-light)", opacity: 0.6 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
