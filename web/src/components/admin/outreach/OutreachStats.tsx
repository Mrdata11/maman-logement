"use client";

import {
  Search,
  Mail,
  Send,
  MessageSquare,
  FileCheck,
} from "lucide-react";

interface FunnelStep {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface OutreachStatsProps {
  stats: {
    total_venues_discovered: number;
    contacts_extracted: number;
    emails_sent: number;
    replies: number;
    form_submissions: number;
  };
}

export function OutreachStats({ stats }: OutreachStatsProps) {
  const steps: FunnelStep[] = [
    {
      label: "Lieux decouverts",
      value: stats.total_venues_discovered,
      icon: <Search size={18} />,
      color: "text-[#8B6F47]",
      bgColor: "bg-[#8B6F47]/10",
    },
    {
      label: "Contacts extraits",
      value: stats.contacts_extracted,
      icon: <Mail size={18} />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Emails envoyes",
      value: stats.emails_sent,
      icon: <Send size={18} />,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      label: "Reponses",
      value: stats.replies,
      icon: <MessageSquare size={18} />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Formulaires soumis",
      value: stats.form_submissions,
      icon: <FileCheck size={18} />,
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
    },
  ];

  // Valeur maximale pour la barre de proportion
  const maxValue = Math.max(...steps.map((s) => s.value), 1);

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {steps.map((step) => (
          <div
            key={step.label}
            className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-4"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <div className={`inline-flex p-2 rounded-lg ${step.bgColor} ${step.color} mb-2`}>
              {step.icon}
            </div>
            <div className="text-2xl font-semibold text-[var(--foreground)]">
              {step.value.toLocaleString("fr-FR")}
            </div>
            <div className="text-xs text-[var(--muted)] mt-0.5">{step.label}</div>
          </div>
        ))}
      </div>

      {/* Visualisation du funnel */}
      <div
        className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-5"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <h3 className="font-serif text-lg font-semibold text-[var(--foreground)] mb-4">
          Entonnoir de conversion
        </h3>
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const widthPercent = maxValue > 0 ? (step.value / maxValue) * 100 : 0;
            // Taux de conversion par rapport a l'etape precedente
            const prevValue = idx > 0 ? steps[idx - 1].value : null;
            const conversionRate =
              prevValue && prevValue > 0
                ? ((step.value / prevValue) * 100).toFixed(1)
                : null;

            return (
              <div key={step.label} className="flex items-center gap-3">
                <div className="w-36 sm:w-44 shrink-0 text-sm text-[var(--foreground)] flex items-center gap-2">
                  <span className={step.color}>{step.icon}</span>
                  <span className="truncate">{step.label}</span>
                </div>
                <div className="flex-1 bg-[var(--surface)] rounded-full h-7 overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                    style={{
                      width: `${Math.max(widthPercent, 2)}%`,
                      backgroundColor:
                        idx === 0
                          ? "#8B6F47"
                          : idx === 1
                          ? "#3B82F6"
                          : idx === 2
                          ? "#6366F1"
                          : idx === 3
                          ? "#16A34A"
                          : "#059669",
                    }}
                  >
                    <span className="text-xs font-medium text-white drop-shadow-sm">
                      {step.value}
                    </span>
                  </div>
                </div>
                <div className="w-16 text-right text-xs text-[var(--muted)] shrink-0">
                  {conversionRate !== null ? `${conversionRate}%` : "—"}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-[var(--muted)] mt-3">
          Les pourcentages indiquent le taux de conversion par rapport a l&apos;etape precedente.
        </p>
      </div>
    </div>
  );
}
