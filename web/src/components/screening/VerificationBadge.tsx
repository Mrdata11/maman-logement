import { CheckCircle } from "lucide-react";

interface VerificationBadgeProps {
  size?: "sm" | "md";
}

export function VerificationBadge({ size = "md" }: VerificationBadgeProps) {
  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
        <CheckCircle size={12} />
        Qualifié
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
      <CheckCircle size={16} />
      Profil qualifié
    </span>
  );
}
