"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  User,
  Mail,
  Calendar,
  RefreshCw,
} from "lucide-react";
import type { ScreeningSession, TranscriptEntry } from "@/lib/screening/types";
import { SESSION_STATUS_CONFIG } from "@/lib/screening/types";

interface ScreeningSessionDetailProps {
  sessionId: string;
}

export function ScreeningSessionDetail({
  sessionId,
}: ScreeningSessionDetailProps) {
  const [session, setSession] = useState<ScreeningSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/screening/sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
      } else {
        setError("Session introuvable.");
      }
    } catch {
      setError("Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleComplete = async () => {
    if (!session?.conversation_id) return;
    setCompleting(true);
    try {
      const res = await fetch("/api/screening/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          conversation_id: session.conversation_id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSession((prev) => (prev ? { ...prev, ...data.session } : null));
      }
    } catch {
      setError("Erreur lors de la finalisation.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--muted)]">{error || "Session introuvable."}</p>
        <Link
          href="/screening"
          className="text-[var(--primary)] text-sm mt-2 inline-block"
        >
          Retour au dashboard
        </Link>
      </div>
    );
  }

  const statusConfig = SESSION_STATUS_CONFIG[session.status];

  return (
    <div>
      <Link
        href="/screening"
        className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Retour au dashboard
      </Link>

      {/* En-tête */}
      <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6 mb-6" style={{ boxShadow: "var(--card-shadow)" }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--foreground)]">
              {session.candidate_name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--muted)]">
              {session.candidate_email && (
                <span className="flex items-center gap-1">
                  <Mail size={14} />
                  {session.candidate_email}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(session.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              {session.duration_seconds && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {Math.floor(session.duration_seconds / 60)}:
                  {String(session.duration_seconds % 60).padStart(2, "0")}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusConfig.color}`}
            >
              {statusConfig.label}
            </span>
            {session.status === "in_progress" && session.conversation_id && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={completing ? "animate-spin" : ""}
                />
                Finaliser
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Résumé IA */}
      {session.ai_summary && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
          <h2 className="font-medium text-emerald-900 mb-3 flex items-center gap-2">
            <User size={18} />
            Résumé de l&apos;entretien
          </h2>
          <div className="text-sm text-emerald-800 whitespace-pre-line leading-relaxed">
            {session.ai_summary}
          </div>
        </div>
      )}

      {/* Transcript */}
      {session.transcript && session.transcript.length > 0 ? (
        <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] p-6" style={{ boxShadow: "var(--card-shadow)" }}>
          <h2 className="font-medium text-[var(--foreground)] mb-4">
            Transcript de l&apos;entretien
          </h2>
          <div className="space-y-3">
            {session.transcript.map(
              (entry: TranscriptEntry, index: number) => (
                <div
                  key={index}
                  className={`flex ${
                    entry.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                      entry.role === "user"
                        ? "bg-[var(--primary)] text-white rounded-br-md"
                        : "bg-[var(--surface)] text-[var(--foreground)] rounded-bl-md"
                    }`}
                  >
                    <p>{entry.message}</p>
                    {entry.timestamp !== undefined && (
                      <p
                        className={`text-xs mt-1 ${
                          entry.role === "user"
                            ? "text-white/60"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {Math.floor(entry.timestamp / 60)}:
                        {String(Math.floor(entry.timestamp % 60)).padStart(
                          2,
                          "0"
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      ) : (
        session.status !== "pending" && (
          <div className="text-center py-8 text-[var(--muted)]">
            <p>Pas de transcript disponible.</p>
            {session.conversation_id && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="mt-3 text-sm text-[var(--primary)] hover:underline"
              >
                Récupérer le transcript
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
