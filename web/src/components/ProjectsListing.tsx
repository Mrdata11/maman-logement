"use client";

import { useState, useMemo } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import type { ProjectCardData } from "@/components/ProjectCard";

interface ProjectsListingProps {
  projects: ProjectCardData[];
}

type SortType = "recent" | "members";

export function ProjectsListing({ projects }: ProjectsListingProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortType>("recent");

  const filtered = useMemo(() => {
    let list = projects;

    // Recherche textuelle
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.vision || "").toLowerCase().includes(q)
      );
    }

    // Tri
    if (sort === "recent") {
      list = [...list].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sort === "members") {
      list = [...list].sort((a, b) => b.member_count - a.member_count);
    }

    return list;
  }, [projects, search, sort]);

  return (
    <div>
      {/* Barre de recherche + tri */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-light)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un projet..."
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--muted-light)] focus:outline-none focus:border-[var(--primary)] transition-colors"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="px-4 py-2.5 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)] transition-colors"
        >
          <option value="recent">Plus r&eacute;cents</option>
          <option value="members">Plus de membres</option>
        </select>
      </div>

      {/* R\u00e9sultats */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--muted)]">
            {search
              ? "Aucun projet ne correspond \u00e0 votre recherche."
              : "Aucun projet publi\u00e9 pour le moment."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-2 text-sm text-[var(--primary)] hover:underline"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Compteur */}
      {filtered.length > 0 && (
        <p className="text-xs text-[var(--muted-light)] text-center mt-6">
          {filtered.length} projet{filtered.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
