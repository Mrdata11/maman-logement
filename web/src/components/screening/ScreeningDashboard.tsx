"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Settings, Users, Clock, ChevronRight, Trash2 } from "lucide-react";
import type { ScreeningConfig, ScreeningSession } from "@/lib/screening/types";
import { SESSION_STATUS_CONFIG } from "@/lib/screening/types";
import { ScreeningLinkGenerator } from "./ScreeningLinkGenerator";

export function ScreeningDashboard() {
  const [configs, setConfigs] = useState<ScreeningConfig[]>([]);
  const [sessions, setSessions] = useState<Record<string, ScreeningSession[]>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [expandedConfig, setExpandedConfig] = useState<string | null>(null);
  const [showLinkGenerator, setShowLinkGenerator] = useState<string | null>(
    null
  );

  const fetchConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/screening/configs");
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
      }
    } catch (e) {
      console.error("Erreur chargement configs:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async (configId: string) => {
    try {
      const res = await fetch(
        `/api/screening/sessions?config_id=${configId}`
      );
      if (res.ok) {
        const data = await res.json();
        setSessions((prev) => ({ ...prev, [configId]: data.sessions || [] }));
      }
    } catch (e) {
      console.error("Erreur chargement sessions:", e);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const toggleExpand = (configId: string) => {
    if (expandedConfig === configId) {
      setExpandedConfig(null);
    } else {
      setExpandedConfig(configId);
      if (!sessions[configId]) {
        fetchSessions(configId);
      }
    }
  };

  const deleteConfig = async (configId: string) => {
    if (!confirm("Supprimer cette configuration et toutes ses sessions ?"))
      return;
    const res = await fetch(`/api/screening/configs/${configId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setConfigs((prev) => prev.filter((c) => c.id !== configId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Screening vocal
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Gérez vos entretiens de pré-sélection par IA
          </p>
        </div>
        <Link
          href="/screening/configurer"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          Nouvelle config
        </Link>
      </div>

      {configs.length === 0 ? (
        <div className="text-center py-16 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)]">
          <Settings size={48} className="mx-auto text-[var(--muted-light)] mb-4" />
          <h2 className="text-lg font-medium text-[var(--foreground)] mb-2">
            Aucune configuration
          </h2>
          <p className="text-[var(--muted)] mb-6 max-w-md mx-auto">
            Créez votre première configuration de screening pour commencer à
            interviewer des candidats par IA.
          </p>
          <Link
            href="/screening/configurer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Créer une configuration
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-[var(--surface)] transition-colors"
                onClick={() => toggleExpand(config.id)}
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--foreground)] truncate">
                    {config.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-[var(--muted)]">
                    <span className="flex items-center gap-1">
                      <Settings size={14} />
                      {config.questions.length} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(config.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLinkGenerator(config.id);
                    }}
                    className="p-2 text-[var(--primary)] hover:bg-[var(--surface)] rounded-lg transition-colors"
                    title="Créer un lien de screening"
                  >
                    <Users size={18} />
                  </button>
                  <Link
                    href={`/screening/configurer/${config.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-[var(--muted)] hover:bg-[var(--surface)] rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Settings size={18} />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConfig(config.id);
                    }}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronRight
                    size={20}
                    className={`text-[var(--muted)] transition-transform ${
                      expandedConfig === config.id ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </div>

              {expandedConfig === config.id && (
                <div className="border-t border-[var(--border-color)] p-5">
                  {!sessions[config.id] ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[var(--primary)] border-t-transparent" />
                    </div>
                  ) : sessions[config.id].length === 0 ? (
                    <p className="text-center text-[var(--muted)] py-4">
                      Aucune session pour cette configuration.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sessions[config.id].map((session) => {
                        const statusConfig =
                          SESSION_STATUS_CONFIG[session.status];
                        return (
                          <Link
                            key={session.id}
                            href={`/screening/sessions/${session.id}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--surface)] transition-colors"
                          >
                            <div>
                              <span className="font-medium text-[var(--foreground)]">
                                {session.candidate_name}
                              </span>
                              {session.candidate_email && (
                                <span className="text-sm text-[var(--muted)] ml-2">
                                  ({session.candidate_email})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {session.duration_seconds && (
                                <span className="text-sm text-[var(--muted)]">
                                  {Math.floor(session.duration_seconds / 60)}:
                                  {String(
                                    session.duration_seconds % 60
                                  ).padStart(2, "0")}
                                </span>
                              )}
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${statusConfig.color}`}
                              >
                                {statusConfig.label}
                              </span>
                              <ChevronRight
                                size={16}
                                className="text-[var(--muted)]"
                              />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {showLinkGenerator === config.id && (
                <ScreeningLinkGenerator
                  configId={config.id}
                  configTitle={config.title}
                  onClose={() => setShowLinkGenerator(null)}
                  onSessionCreated={() => {
                    fetchSessions(config.id);
                    setExpandedConfig(config.id);
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
