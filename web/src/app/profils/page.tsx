"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  ProfileCard as ProfileCardType,
  deriveProfileCardData,
} from "@/lib/profile-types";
import { ProfileCard } from "@/components/ProfileCard";
import { ProfileFilterModal } from "@/components/ProfileFilterModal";
import { Pagination } from "@/components/Pagination";
import {
  ProfileUIFilters,
  ProfileTagFilters,
  ProfileFilterCounts,
  DEFAULT_PROFILE_UI_FILTERS,
  DEFAULT_PROFILE_TAG_FILTERS,
  getQAString,
  getQAStringArray,
} from "@/lib/profile-filter-types";
import type { ReactNode } from "react";

type ProfileFilter = "all" | "new" | "favorite" | "active" | "archived";
type ProfileSort = "date" | "name" | "location";

const SortIconDate = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const SortIconName = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
  </svg>
);
const SortIconLocation = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="6" cy="6" r="2" strokeWidth={2} />
    <circle cx="18" cy="18" r="2" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8v2a4 4 0 004 4h4a4 4 0 004-4V8" />
  </svg>
);

const SORT_OPTIONS: { value: ProfileSort; label: string; icon: ReactNode }[] = [
  { value: "date", label: "Date", icon: <SortIconDate /> },
  { value: "name", label: "Nom", icon: <SortIconName /> },
  { value: "location", label: "Lieu", icon: <SortIconLocation /> },
];

const SORT_LABELS: Record<ProfileSort, string> = {
  date: "Date",
  name: "Nom",
  location: "Lieu",
};

const PROFILES_PER_PAGE = 12;
const PROFILE_STATES_KEY = "profile_states";

const DEMO_PROFILES: ProfileCardType[] = [
  {
    id: "demo-1",
    display_name: "Marie",
    avatar_url: "https://randomuser.me/api/portraits/women/65.jpg",
    location: "Ixelles, Bruxelles",
    age: 62,
    gender: "femme",
    sexuality: null,
    ai_summary: "Marie, 62 ans, ancienne enseignante, cherche un habitat groupé chaleureux près de Bruxelles. Passionnée de jardinage et de biodanza, elle rêve d'un lieu où le partage et la bienveillance sont au coeur du quotidien.",
    ai_tags: ["Près de Bruxelles", "Jardin partagé", "Biodanza", "Spiritualité", "Budget modeste"],
    budget_range: "max 700€/mois",
    preferred_regions: ["Bruxelles", "Brabant Wallon"],
    community_size: "Moyen (8-15)",
    core_values: ["Solidarité", "Spiritualité", "Ecologie"],
    intro_snippet: "Je m'appelle Marie, j'ai 62 ans et je vis à Ixelles depuis plus de 20 ans. Ancienne enseignante de français, je suis maintenant retraitée et je profite de mon temps pour me consacrer à mes passions...",
    created_at: "2026-02-20T10:00:00Z",
    questionnaire_answers: {
      setting_type: "urban_green",
      target_audience: ["seniors", "intergenerational"],
      governance: "consensus",
      shared_spaces: ["garden", "common_room", "kitchen"],
      meals_together: "weekly",
      financial_model: "rental",
      unit_types: ["2_bedrooms"],
      pets_allowed: "to_discuss",
      accessibility: "planned",
      project_stage: "searching",
      housing_type: "existing",
    },
  },
  {
    id: "demo-2",
    display_name: "Jean-Pierre",
    avatar_url: "https://randomuser.me/api/portraits/men/72.jpg",
    location: "Namur",
    age: 68,
    gender: "homme",
    sexuality: null,
    ai_summary: "Jean-Pierre, retraité dynamique de 68 ans, cherche un écolieu où il pourrait mettre à profit ses compétences en menuiserie. Il souhaite un cadre semi-rural avec un potager collectif et des repas partagés.",
    ai_tags: ["Semi-rural", "Potager", "Menuiserie", "Repas partagés", "Intergénérationnel"],
    budget_range: "max 600€/mois",
    preferred_regions: ["Namur", "Luxembourg"],
    community_size: "Petit (4-8)",
    core_values: ["Ecologie", "Autonomie", "Respect"],
    intro_snippet: "Je suis Jean-Pierre, 68 ans, retraité depuis 3 ans. J'ai travaillé toute ma vie comme menuisier à Namur. Je vis seul depuis le décès de ma femme il y a 5 ans...",
    created_at: "2026-02-18T14:30:00Z",
    questionnaire_answers: {
      setting_type: "semi_rural",
      target_audience: ["intergenerational"],
      governance: "sociocracy",
      shared_spaces: ["garden", "workshop", "common_room"],
      meals_together: "daily",
      financial_model: "cooperative",
      unit_types: ["small_house"],
      pets_allowed: "yes",
      accessibility: "partial",
      project_stage: "idea",
      housing_type: "renovation",
    },
  },
  {
    id: "demo-3",
    display_name: "Sofia",
    avatar_url: "https://randomuser.me/api/portraits/women/44.jpg",
    location: "Liège",
    age: 45,
    gender: "femme",
    sexuality: null,
    ai_summary: "Sofia, 45 ans, artiste et mère de deux enfants, recherche une communauté ouverte et créative. Elle aimerait un espace où ses enfants grandissent entourés d'adultes bienveillants, avec des ateliers et de la musique.",
    ai_tags: ["Famille", "Ateliers créatifs", "Enfants bienvenus", "Musique", "Ouverture"],
    budget_range: "max 850€/mois",
    preferred_regions: ["Liège", "Bruxelles"],
    community_size: "Moyen (8-15)",
    core_values: ["Créativité", "Ouverture", "Solidarité"],
    intro_snippet: "Je suis Sofia, 45 ans, artiste plasticienne et mère de Noa (12 ans) et Lila (8 ans). On vit à Liège dans un appartement qui devient trop petit et trop isolé...",
    created_at: "2026-02-15T09:00:00Z",
    questionnaire_answers: {
      setting_type: "urban_green",
      target_audience: ["families", "intergenerational"],
      governance: "informal",
      shared_spaces: ["common_room", "workshop", "playground", "garden"],
      meals_together: "occasional",
      financial_model: "mixed",
      unit_types: ["2_bedrooms", "3_bedrooms"],
      pets_allowed: "yes",
      accessibility: "no",
      project_stage: "searching",
      housing_type: "not_decided",
    },
  },
  {
    id: "demo-4",
    display_name: "Thomas & Claire",
    avatar_url: "https://randomuser.me/api/portraits/men/32.jpg",
    location: "Louvain-la-Neuve",
    age: 33,
    gender: null,
    sexuality: null,
    ai_summary: "Couple trentenaire sans enfants, Thomas et Claire cherchent un habitat groupé écologique où ils pourront s'impliquer activement. Lui est développeur, elle est infirmière. Ils rêvent de permaculture et de gouvernance partagée.",
    ai_tags: ["Permaculture", "Écologique", "Couple", "Gouvernance partagée", "Engagés"],
    budget_range: "max 900€/mois",
    preferred_regions: ["Brabant Wallon", "Bruxelles"],
    community_size: "Grand (15+)",
    core_values: ["Ecologie", "Démocratie", "Solidarité", "Autonomie"],
    intro_snippet: "On est Thomas (33 ans, développeur web) et Claire (31 ans, infirmière). On vit ensemble depuis 8 ans à Louvain-la-Neuve et on n'a pas d'enfants pour l'instant...",
    created_at: "2026-02-12T16:00:00Z",
    questionnaire_answers: {
      setting_type: "rural",
      target_audience: ["young_adults", "intergenerational"],
      governance: "sociocracy",
      shared_spaces: ["garden", "kitchen", "coworking", "workshop"],
      meals_together: "weekly",
      financial_model: "cooperative",
      unit_types: ["1_bedroom", "2_bedrooms"],
      pets_allowed: "to_discuss",
      accessibility: "planned",
      project_stage: "idea",
      housing_type: "new_build",
    },
  },
];

// --- Helper: count occurrences for filter options ---

function countValues(map: Map<string, number>): { value: string; count: number }[] {
  return Array.from(map.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

function incrementMap(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

export default function ProfilsPage() {
  const [profiles, setProfiles] = useState<ProfileCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProfileFilter>("all");
  const [sort, setSort] = useState<ProfileSort>("date");
  const [showSearch, setShowSearch] = useState(false);
  const [profileStates, setProfileStates] = useState<Record<string, string>>({});

  const [page, setPage] = useState(1);

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [profileUiFilters, setProfileUiFilters] = useState<ProfileUIFilters>({ ...DEFAULT_PROFILE_UI_FILTERS });
  const [profileTagFilters, setProfileTagFilters] = useState<ProfileTagFilters>({ ...DEFAULT_PROFILE_TAG_FILTERS });

  // Dropdown states
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Invitation state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProject, setUserProject] = useState<{ id: string; name: string } | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

  const supabase = createClient();

  // Charger l'utilisateur et son projet
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
      if (user) {
        supabase
          .from("projects")
          .select("id, name")
          .eq("user_id", user.id)
          .eq("is_published", true)
          .limit(1)
          .then(({ data: projects }) => {
            if (projects && projects.length > 0) {
              setUserProject(projects[0]);
            }
          });
      }
    });
  }, [supabase]);

  const handleInvite = useCallback(async (profileId: string) => {
    if (!userProject) return;
    try {
      const res = await fetch("/api/projects/invite-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: userProject.id, profile_id: profileId }),
      });
      if (res.ok) {
        setInvitedIds((prev) => new Set(prev).add(profileId));
      }
    } catch {
      // Silently fail
    }
  }, [userProject]);

  // Load profile states from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PROFILE_STATES_KEY) || "{}");
      setProfileStates(saved);
    } catch {
      // Ignore
    }
  }, []);

  const toggleFavorite = (id: string) => {
    setProfileStates((prev) => {
      const next = { ...prev };
      if (next[id] === "favorite") {
        delete next[id];
      } else {
        next[id] = "favorite";
      }
      localStorage.setItem(PROFILE_STATES_KEY, JSON.stringify(next));
      return next;
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, display_name, avatar_url, location, age, gender, sexuality, ai_summary, ai_tags, questionnaire_answers, introduction, is_verified, created_at"
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      const realCards: ProfileCardType[] = (!error && data && data.length > 0)
        ? data.map((row) => {
          const derived = deriveProfileCardData(
            row.questionnaire_answers || {}
          );
          const rawIntro = (row.introduction as Record<string, unknown>)?.whoAreYou;
          const introText =
            typeof rawIntro === "string"
              ? rawIntro
              : rawIntro && typeof rawIntro === "object" && "transcript" in rawIntro
                ? (rawIntro as { transcript: string }).transcript || ""
                : "";
          const intro_snippet = introText.length > 150
            ? introText.slice(0, 147) + "..."
            : introText || undefined;
          return {
            id: row.id,
            display_name: row.display_name,
            avatar_url: row.avatar_url,
            location: row.location,
            age: row.age ?? null,
            gender: row.gender ?? null,
            sexuality: row.sexuality ?? null,
            ai_summary: row.ai_summary,
            ai_tags: row.ai_tags || [],
            ...derived,
            intro_snippet,
            is_verified: row.is_verified ?? false,
            created_at: row.created_at,
            questionnaire_answers: row.questionnaire_answers || undefined,
          };
        })
        : [];
      setProfiles([...realCards, ...DEMO_PROFILES]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  // Available filter counts (computed from all profiles)
  const availableCounts = useMemo((): ProfileFilterCounts => {
    const regions = new Map<string, number>();
    const genders = new Map<string, number>();
    const communitySize = new Map<string, number>();
    const coreValues = new Map<string, number>();
    const settingType = new Map<string, number>();
    const targetAudience = new Map<string, number>();
    const governance = new Map<string, number>();
    const sharedSpaces = new Map<string, number>();
    const mealsTogether = new Map<string, number>();
    const financialModel = new Map<string, number>();
    const unitTypes = new Map<string, number>();
    const petsAllowed = new Map<string, number>();
    const accessibility = new Map<string, number>();
    const projectStage = new Map<string, number>();
    const housingType = new Map<string, number>();

    for (const p of profiles) {
      // Derived fields
      for (const r of p.preferred_regions) incrementMap(regions, r);
      if (p.gender) incrementMap(genders, p.gender);
      if (p.community_size) incrementMap(communitySize, p.community_size);
      for (const v of p.core_values) incrementMap(coreValues, v);

      // Questionnaire answers
      const qa = p.questionnaire_answers;
      const st = getQAString(qa, "setting_type");
      if (st) incrementMap(settingType, st);

      for (const ta of getQAStringArray(qa, "target_audience")) incrementMap(targetAudience, ta);

      const gov = getQAString(qa, "governance");
      if (gov) incrementMap(governance, gov);

      for (const ss of getQAStringArray(qa, "shared_spaces")) incrementMap(sharedSpaces, ss);

      const mt = getQAString(qa, "meals_together");
      if (mt) incrementMap(mealsTogether, mt);

      const fm = getQAString(qa, "financial_model");
      if (fm) incrementMap(financialModel, fm);

      for (const ut of getQAStringArray(qa, "unit_types")) incrementMap(unitTypes, ut);

      const pa = getQAString(qa, "pets_allowed");
      if (pa) incrementMap(petsAllowed, pa);

      const acc = getQAString(qa, "accessibility");
      if (acc) incrementMap(accessibility, acc);

      const ps = getQAString(qa, "project_stage");
      if (ps) incrementMap(projectStage, ps);

      const ht = getQAString(qa, "housing_type");
      if (ht) incrementMap(housingType, ht);
    }

    return {
      regions: countValues(regions),
      genders: countValues(genders),
      communitySize: countValues(communitySize),
      coreValues: countValues(coreValues),
      settingType: countValues(settingType),
      targetAudience: countValues(targetAudience),
      governance: countValues(governance),
      sharedSpaces: countValues(sharedSpaces),
      mealsTogether: countValues(mealsTogether),
      financialModel: countValues(financialModel),
      unitTypes: countValues(unitTypes),
      petsAllowed: countValues(petsAllowed),
      accessibility: countValues(accessibility),
      projectStage: countValues(projectStage),
      housingType: countValues(housingType),
    };
  }, [profiles]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    // UI filters
    if (profileUiFilters.regions.length > 0) count++;
    if (profileUiFilters.genders.length > 0) count++;
    if (profileUiFilters.ageMin !== null || profileUiFilters.ageMax !== null) count++;
    if (profileUiFilters.communitySize.length > 0) count++;
    // Tag filters
    if (profileTagFilters.coreValues.length > 0) count++;
    if (profileTagFilters.settingType.length > 0) count++;
    if (profileTagFilters.targetAudience.length > 0) count++;
    if (profileTagFilters.governance.length > 0) count++;
    if (profileTagFilters.sharedSpaces.length > 0) count++;
    if (profileTagFilters.mealsTogether.length > 0) count++;
    if (profileTagFilters.financialModel.length > 0) count++;
    if (profileTagFilters.unitTypes.length > 0) count++;
    if (profileTagFilters.petsAllowed.length > 0) count++;
    if (profileTagFilters.accessibility.length > 0) count++;
    if (profileTagFilters.projectStage.length > 0) count++;
    if (profileTagFilters.housingType.length > 0) count++;
    return count;
  }, [profileUiFilters, profileTagFilters]);

  // Tab counts (before UI/tag filters)
  const tabCounts = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return {
      all: profiles.filter((p) => profileStates[p.id] !== "archived").length,
      new: profiles.filter((p) => new Date(p.created_at) >= sevenDaysAgo).length,
      favorite: profiles.filter((p) => profileStates[p.id] === "favorite").length,
      active: profiles.filter((p) => profileStates[p.id] === "contacted" || profileStates[p.id] === "in_discussion").length,
      archived: profiles.filter((p) => profileStates[p.id] === "archived").length,
    };
  }, [profiles, profileStates]);

  const filtered = useMemo(() => {
    let result = [...profiles];

    // Tab filter
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    switch (filter) {
      case "all":
        result = result.filter((p) => profileStates[p.id] !== "archived");
        break;
      case "new":
        result = result.filter((p) => new Date(p.created_at) >= sevenDaysAgo);
        break;
      case "favorite":
        result = result.filter((p) => profileStates[p.id] === "favorite");
        break;
      case "active":
        result = result.filter(
          (p) => profileStates[p.id] === "contacted" || profileStates[p.id] === "in_discussion"
        );
        break;
      case "archived":
        result = result.filter((p) => profileStates[p.id] === "archived");
        break;
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.display_name.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.ai_summary?.toLowerCase().includes(q) ||
          p.ai_tags.some((t) => t.toLowerCase().includes(q)) ||
          p.preferred_regions.some((r) => r.toLowerCase().includes(q)) ||
          p.core_values.some((v) => v.toLowerCase().includes(q))
      );
    }

    // --- Profile UI filters ---
    if (profileUiFilters.regions.length > 0) {
      result = result.filter((p) =>
        p.preferred_regions.some((r) => profileUiFilters.regions.includes(r))
      );
    }
    if (profileUiFilters.genders.length > 0) {
      result = result.filter((p) =>
        p.gender !== null && profileUiFilters.genders.includes(p.gender)
      );
    }
    if (profileUiFilters.ageMin !== null) {
      result = result.filter((p) =>
        p.age === null || p.age >= profileUiFilters.ageMin!
      );
    }
    if (profileUiFilters.ageMax !== null) {
      result = result.filter((p) =>
        p.age === null || p.age <= profileUiFilters.ageMax!
      );
    }
    if (profileUiFilters.communitySize.length > 0) {
      result = result.filter((p) =>
        p.community_size === null || profileUiFilters.communitySize.includes(p.community_size)
      );
    }

    // --- Profile tag filters (questionnaire-based) ---
    if (profileTagFilters.coreValues.length > 0) {
      result = result.filter((p) =>
        profileTagFilters.coreValues.some((v) => p.core_values.includes(v))
      );
    }
    if (profileTagFilters.settingType.length > 0) {
      result = result.filter((p) => {
        const val = getQAString(p.questionnaire_answers, "setting_type");
        return val === null || profileTagFilters.settingType.includes(val);
      });
    }
    if (profileTagFilters.targetAudience.length > 0) {
      result = result.filter((p) => {
        const vals = getQAStringArray(p.questionnaire_answers, "target_audience");
        return vals.length === 0 || profileTagFilters.targetAudience.some((v) => vals.includes(v));
      });
    }
    if (profileTagFilters.governance.length > 0) {
      result = result.filter((p) => {
        const val = getQAString(p.questionnaire_answers, "governance");
        return val === null || profileTagFilters.governance.includes(val);
      });
    }
    if (profileTagFilters.sharedSpaces.length > 0) {
      result = result.filter((p) => {
        const vals = getQAStringArray(p.questionnaire_answers, "shared_spaces");
        return vals.length === 0 || profileTagFilters.sharedSpaces.some((v) => vals.includes(v));
      });
    }
    if (profileTagFilters.mealsTogether.length > 0) {
      result = result.filter((p) => {
        const val = getQAString(p.questionnaire_answers, "meals_together");
        return val === null || profileTagFilters.mealsTogether.includes(val);
      });
    }
    if (profileTagFilters.financialModel.length > 0) {
      result = result.filter((p) => {
        const val = getQAString(p.questionnaire_answers, "financial_model");
        return val === null || profileTagFilters.financialModel.includes(val);
      });
    }
    if (profileTagFilters.unitTypes.length > 0) {
      result = result.filter((p) => {
        const vals = getQAStringArray(p.questionnaire_answers, "unit_types");
        return vals.length === 0 || profileTagFilters.unitTypes.some((v) => vals.includes(v));
      });
    }
    if (profileTagFilters.petsAllowed.length > 0) {
      result = result.filter((p) => {
        const val = getQAString(p.questionnaire_answers, "pets_allowed");
        return val === null || profileTagFilters.petsAllowed.includes(val);
      });
    }
    if (profileTagFilters.accessibility.length > 0) {
      result = result.filter((p) => {
        const val = getQAString(p.questionnaire_answers, "accessibility");
        return val === null || profileTagFilters.accessibility.includes(val);
      });
    }
    if (profileTagFilters.projectStage.length > 0) {
      result = result.filter((p) => {
        const val = getQAString(p.questionnaire_answers, "project_stage");
        return val === null || profileTagFilters.projectStage.includes(val);
      });
    }
    if (profileTagFilters.housingType.length > 0) {
      result = result.filter((p) => {
        const val = getQAString(p.questionnaire_answers, "housing_type");
        return val === null || profileTagFilters.housingType.includes(val);
      });
    }

    // Sort
    switch (sort) {
      case "date":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "name":
        result.sort((a, b) => a.display_name.localeCompare(b.display_name, "fr"));
        break;
      case "location":
        result.sort((a, b) => (a.location || "").localeCompare(b.location || "", "fr"));
        break;
    }

    return result;
  }, [profiles, filter, search, sort, profileStates, profileUiFilters, profileTagFilters]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filter, search, sort, profileUiFilters, profileTagFilters]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PROFILES_PER_PAGE));
  const paginatedProfiles = useMemo(() => {
    const start = (page - 1) * PROFILES_PER_PAGE;
    return filtered.slice(start, start + PROFILES_PER_PAGE);
  }, [filtered, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const hasActiveFilters = !!search.trim() || activeFilterCount > 0;

  const handleClearAll = () => {
    setSearch("");
    setFilter("all");
    setProfileUiFilters({ ...DEFAULT_PROFILE_UI_FILTERS });
    setProfileTagFilters({ ...DEFAULT_PROFILE_TAG_FILTERS });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            La perle rare se cache ici
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Ils veulent vivre autrement, ensemble.
          </p>
        </div>
        <div className="shrink-0 flex items-center gap-3">
          <a
            href="/profils/creer"
            className="px-5 py-2.5 border border-[var(--primary)]/40 text-[var(--primary)] rounded-xl text-sm font-medium hover:bg-[var(--primary)]/5 transition-colors inline-flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Ajouter mon profil
          </a>
        </div>
      </div>

      {/* CTA Banner — Personnalise tes résultats */}
      <div className="px-4 py-3 bg-gradient-to-r from-[var(--surface)] to-emerald-50/30 border border-[var(--primary)]/30 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-8 h-8 bg-[var(--primary)]/10 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Personnalise tes r&eacute;sultats
            </p>
            <p className="text-xs text-[var(--muted)] mt-0.5 hidden sm:block">
              2 min pour voir les profils qui te correspondent le mieux.
            </p>
          </div>
          <a
            href="/creer"
            className="shrink-0 px-3.5 py-1.5 bg-[var(--primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
          >
            Commencer
          </a>
        </div>
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-[var(--background)]/95 backdrop-blur-sm border-b border-[var(--border-color)]/80">
        <div className="flex items-center gap-2">
          {/* Scrollable status tabs */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
            {([
              ["all", "Actifs"],
              ["new", "Nouveaux"],
              ["favorite", "Favoris"],
              ["active", "Discussion en cours"],
              ["archived", "Archives"],
            ] as [ProfileFilter, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap flex items-center gap-1 ${
                  filter === key
                    ? key === "favorite"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-[var(--primary)] text-white shadow-sm"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border-color)]"
                }`}
              >
                {key === "favorite" && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={filter === "favorite" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )}
                {label}
                <span className={`text-xs font-medium ml-0.5 ${
                  filter === key
                    ? "opacity-80"
                    : "opacity-50"
                }`}>
                  {tabCounts[key]}
                </span>
              </button>
            ))}
          </div>

          {/* Sort + Search + Filters */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Sort dropdown */}
            <div ref={sortRef} className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm transition-colors ${
                  sortOpen
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-[var(--input-border)] bg-[var(--input-bg)] hover:border-[var(--primary)]/50"
                }`}
              >
                <svg className="w-3.5 h-3.5 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                <span className="font-medium text-[var(--foreground)]">{SORT_LABELS[sort]}</span>
                <svg className={`w-3 h-3 text-[var(--muted)] transition-transform ${sortOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {sortOpen && (
                <div className="absolute top-full mt-1.5 right-0 min-w-[220px] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden z-50 animate-fadeIn">
                  {SORT_OPTIONS.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => { setSort(value); setSortOpen(false); }}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                        sort === value
                          ? "text-[var(--primary)] font-medium bg-[var(--primary)]/5"
                          : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                      }`}
                    >
                      <span className="text-[var(--muted)] shrink-0">{icon}</span>
                      <span className="flex-1">{label}</span>
                      {sort === value && (
                        <svg className="w-4 h-4 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`flex items-center justify-center w-9 h-9 border rounded-xl text-sm transition-colors ${
                showSearch || !!search.trim()
                  ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-[var(--input-border)] text-[var(--muted)] hover:border-[var(--primary)]/50 bg-[var(--input-bg)]"
              }`}
              aria-label="Rechercher"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Filter button */}
            <button
              onClick={() => setShowFilterModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm transition-colors ${
                activeFilterCount > 0
                  ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-[var(--input-border)] text-[var(--muted)] hover:border-[var(--primary)]/50 bg-[var(--input-bg)]"
              }`}
              aria-label="Filtres"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-medium">Filtres</span>
              {activeFilterCount > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-[var(--primary)] text-white text-xs font-bold rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>

          </div>
        </div>

        {/* Expandable search panel */}
        {showSearch && (
          <div className="mt-3 pt-3 border-t border-[var(--border-color)]/50">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]"
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
                placeholder="Rechercher par nom, lieu, valeurs..."
                className="w-full pl-10 pr-4 py-2.5 border border-[var(--input-border)] rounded-xl text-sm bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      <ProfileFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        uiFilters={profileUiFilters}
        onUiFiltersChange={setProfileUiFilters}
        tagFilters={profileTagFilters}
        onTagFiltersChange={setProfileTagFilters}
        availableCounts={availableCounts}
        resultCount={filtered.length}
        activeFilterCount={activeFilterCount}
      />

      {/* Content area — min-height prevents page jump when switching tabs */}
      <div className="min-h-[50vh]">
      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="flex justify-center gap-1.5 mb-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 bg-[var(--primary)] rounded-full"
                style={{
                  animation: `recording-pulse 1s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
          <p className="text-sm text-[var(--muted)]">
            Chargement des profils...
          </p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 mx-auto bg-[var(--surface)] rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2"
              />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
          </div>
          {hasActiveFilters || filter !== "all" ? (
            <div>
              <p className="text-[var(--muted)]">
                Aucun profil ne correspond &agrave; ta recherche.
              </p>
              <button
                onClick={handleClearAll}
                className="mt-2 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
              >
                Effacer les filtres
              </button>
            </div>
          ) : (
            <>
              <p className="text-[var(--foreground)] font-medium">
                Pas encore de profils
              </p>
              <p className="text-sm text-[var(--muted)]">
                Sois le/la premier(&egrave;re) &agrave; cr&eacute;er ton profil !
              </p>
              <a
                href="/profils/creer"
                className="inline-block px-5 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                Cr&eacute;er mon profil
              </a>
            </>
          )}
        </div>
      )}

      {/* Profile grid */}
      {!loading && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginatedProfiles.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                isFavorite={profileStates[profile.id] === "favorite"}
                onToggleFavorite={toggleFavorite}
                onInvite={userProject ? handleInvite : undefined}
                invitedIds={invitedIds}
              />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
      </div>
    </div>
  );
}
