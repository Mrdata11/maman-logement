"use client";

import { useState } from "react";
import type { VenueFormData } from "@/lib/venue-form/schema";

interface StepPhotosProps {
  formData: Partial<VenueFormData>;
  onChange: (data: Partial<VenueFormData>) => void;
}

const IMAGE_CATEGORIES = [
  { key: "exterior", label: "Exterieur / Vue d'ensemble" },
  { key: "practice_spaces", label: "Espaces de pratique" },
  { key: "rooms", label: "Chambres / Hebergement" },
  { key: "surroundings", label: "Environnement / Nature" },
  { key: "dining", label: "Salle a manger / Cuisine" },
  { key: "other", label: "Autres" },
];

export function StepPhotos({ formData, onChange }: StepPhotosProps) {
  const [newUrl, setNewUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("exterior");
  const [urlError, setUrlError] = useState("");

  const images = formData.images || [];
  const imageCategories = formData.image_categories || {};

  const addImage = () => {
    setUrlError("");

    if (!newUrl.trim()) return;

    try {
      new URL(newUrl);
    } catch {
      setUrlError("URL invalide. Veuillez entrer une URL valide.");
      return;
    }

    if (images.includes(newUrl)) {
      setUrlError("Cette image est deja ajoutee.");
      return;
    }

    const updatedImages = [...images, newUrl];
    const updatedCategories: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(imageCategories)) {
      updatedCategories[k] = Array.isArray(v) ? (v as string[]) : [];
    }
    if (!updatedCategories[selectedCategory]) {
      updatedCategories[selectedCategory] = [];
    }
    updatedCategories[selectedCategory] = [
      ...updatedCategories[selectedCategory],
      newUrl,
    ];

    onChange({
      ...formData,
      images: updatedImages,
      image_categories: updatedCategories,
    });
    setNewUrl("");
  };

  const removeImage = (url: string) => {
    const updatedImages = images.filter((img) => img !== url);
    const updatedCategories: Record<string, string[]> = {};
    for (const [cat, urls] of Object.entries(imageCategories)) {
      const arr = Array.isArray(urls) ? (urls as string[]) : [];
      const filtered = arr.filter((u) => u !== url);
      if (filtered.length > 0) {
        updatedCategories[cat] = filtered;
      }
    }

    onChange({
      ...formData,
      images: updatedImages,
      image_categories: updatedCategories,
    });
  };

  const getCategoryForImage = (url: string): string => {
    for (const [cat, urls] of Object.entries(imageCategories)) {
      if (Array.isArray(urls) && (urls as string[]).includes(url)) return cat;
    }
    return "other";
  };

  const getCategoryLabel = (key: string): string => {
    return IMAGE_CATEGORIES.find((c) => c.key === key)?.label || key;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-[var(--foreground)] mb-1">
          Photos
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Ajoutez des URLs de photos de votre lieu pour donner envie aux
          organisateurs.
        </p>
      </div>

      {/* Ajout de photo */}
      <div className="bg-[var(--surface)] rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs text-[var(--muted)] mb-1">
              URL de l&apos;image
            </label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                setUrlError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImage();
                }
              }}
              placeholder="https://example.com/photo.jpg"
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] placeholder:text-[var(--muted-light)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
            />
          </div>
          <div className="sm:w-48">
            <label className="block text-xs text-[var(--muted)] mb-1">
              Categorie
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]/30 focus:border-[#8B6F47] transition-colors"
            >
              {IMAGE_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:self-end">
            <button
              type="button"
              onClick={addImage}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#8B6F47] text-white rounded-lg hover:bg-[#705A39] transition-colors text-sm font-medium"
            >
              Ajouter
            </button>
          </div>
        </div>
        {urlError && (
          <p className="text-red-500 text-xs mt-2">{urlError}</p>
        )}
      </div>

      {/* Liste des images */}
      {images.length === 0 ? (
        <div className="text-center py-8 text-[var(--muted)]">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-[var(--muted-light)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="text-sm">
            Aucune photo ajoutee pour le moment.
          </p>
          <p className="text-xs mt-1">
            Ajoutez des URLs d&apos;images pour illustrer votre lieu.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((url, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-4 py-3 bg-[var(--card-bg)] rounded-lg border border-[var(--border-light)]"
            >
              <div className="w-12 h-12 rounded-lg bg-[var(--surface)] overflow-hidden flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--foreground)] truncate">
                  {url}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  {getCategoryLabel(getCategoryForImage(url))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeImage(url)}
                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                aria-label="Supprimer cette photo"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
          <p className="text-xs text-[var(--muted)] text-center">
            {images.length} photo{images.length > 1 ? "s" : ""} ajoutee
            {images.length > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
