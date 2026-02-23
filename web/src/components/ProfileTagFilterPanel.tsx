"use client";

import { useCallback } from "react";
import {
  ProfileTagFilters,
  ProfileFilterCounts,
  PROFILE_LABELS,
} from "@/lib/profile-filter-types";
import { CollapsibleSection, CheckboxGroup } from "./TagFilterPanel";
import {
  Handshake,
  Users,
  Home,
  Building2,
} from "lucide-react";

interface ProfileTagFilterPanelProps {
  filters: ProfileTagFilters;
  onChange: (filters: ProfileTagFilters) => void;
  availableCounts: ProfileFilterCounts;
}

type MultiSelectKey = keyof ProfileTagFilters;

export function ProfileTagFilterPanel({
  filters,
  onChange,
  availableCounts,
}: ProfileTagFilterPanelProps) {
  const toggleIn = useCallback(
    (key: MultiSelectKey, value: string) => {
      const current = filters[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      onChange({ ...filters, [key]: next });
    },
    [filters, onChange]
  );

  return (
    <div>
      {/* Valeurs & Vision */}
      <CollapsibleSection
        title="Valeurs & Vision"
        icon={<Handshake className="w-5 h-5" />}
        defaultOpen={true}
      >
        <CheckboxGroup
          title="Valeurs essentielles"
          items={availableCounts.coreValues}
          selected={filters.coreValues}
          labelMap={PROFILE_LABELS.coreValues}
          onToggle={(v) => toggleIn("coreValues", v)}
          onClear={() => onChange({ ...filters, coreValues: [] })}
        />
        <CheckboxGroup
          title="Cadre de vie préféré"
          items={availableCounts.settingType}
          selected={filters.settingType}
          labelMap={PROFILE_LABELS.settingType}
          onToggle={(v) => toggleIn("settingType", v)}
          onClear={() => onChange({ ...filters, settingType: [] })}
        />
        <CheckboxGroup
          title="Public visé"
          items={availableCounts.targetAudience}
          selected={filters.targetAudience}
          labelMap={PROFILE_LABELS.targetAudience}
          onToggle={(v) => toggleIn("targetAudience", v)}
          onClear={() => onChange({ ...filters, targetAudience: [] })}
        />
      </CollapsibleSection>

      {/* Vie communautaire */}
      <CollapsibleSection
        title="Vie communautaire"
        icon={<Users className="w-5 h-5" />}
        defaultOpen={false}
      >
        <CheckboxGroup
          title="Repas partagés"
          items={availableCounts.mealsTogether}
          selected={filters.mealsTogether}
          labelMap={PROFILE_LABELS.mealsTogether}
          onToggle={(v) => toggleIn("mealsTogether", v)}
          onClear={() => onChange({ ...filters, mealsTogether: [] })}
        />
        <CheckboxGroup
          title="Espaces partagés souhaités"
          items={availableCounts.sharedSpaces}
          selected={filters.sharedSpaces}
          labelMap={PROFILE_LABELS.sharedSpaces}
          onToggle={(v) => toggleIn("sharedSpaces", v)}
          onClear={() => onChange({ ...filters, sharedSpaces: [] })}
        />
        <CheckboxGroup
          title="Mode de gouvernance"
          items={availableCounts.governance}
          selected={filters.governance}
          labelMap={PROFILE_LABELS.governance}
          onToggle={(v) => toggleIn("governance", v)}
          onClear={() => onChange({ ...filters, governance: [] })}
        />
      </CollapsibleSection>

      {/* Logement & Finances */}
      <CollapsibleSection
        title="Logement & Finances"
        icon={<Home className="w-5 h-5" />}
        defaultOpen={false}
      >
        <CheckboxGroup
          title="Type de logement recherché"
          items={availableCounts.unitTypes}
          selected={filters.unitTypes}
          labelMap={PROFILE_LABELS.unitTypes}
          onToggle={(v) => toggleIn("unitTypes", v)}
          onClear={() => onChange({ ...filters, unitTypes: [] })}
        />
        <CheckboxGroup
          title="Modèle financier"
          items={availableCounts.financialModel}
          selected={filters.financialModel}
          labelMap={PROFILE_LABELS.financialModel}
          onToggle={(v) => toggleIn("financialModel", v)}
          onClear={() => onChange({ ...filters, financialModel: [] })}
        />
        <CheckboxGroup
          title="Type de projet immobilier"
          items={availableCounts.housingType}
          selected={filters.housingType}
          labelMap={PROFILE_LABELS.housingType}
          onToggle={(v) => toggleIn("housingType", v)}
          onClear={() => onChange({ ...filters, housingType: [] })}
        />
      </CollapsibleSection>

      {/* Pratique */}
      <CollapsibleSection
        title="Pratique"
        icon={<Building2 className="w-5 h-5" />}
        defaultOpen={false}
      >
        <CheckboxGroup
          title="Animaux acceptés"
          items={availableCounts.petsAllowed}
          selected={filters.petsAllowed}
          labelMap={PROFILE_LABELS.petsAllowed}
          onToggle={(v) => toggleIn("petsAllowed", v)}
          onClear={() => onChange({ ...filters, petsAllowed: [] })}
        />
        <CheckboxGroup
          title="Accessibilité PMR"
          items={availableCounts.accessibility}
          selected={filters.accessibility}
          labelMap={PROFILE_LABELS.accessibility}
          onToggle={(v) => toggleIn("accessibility", v)}
          onClear={() => onChange({ ...filters, accessibility: [] })}
        />
        <CheckboxGroup
          title="Stade du projet"
          items={availableCounts.projectStage}
          selected={filters.projectStage}
          labelMap={PROFILE_LABELS.projectStage}
          onToggle={(v) => toggleIn("projectStage", v)}
          onClear={() => onChange({ ...filters, projectStage: [] })}
        />
      </CollapsibleSection>
    </div>
  );
}
