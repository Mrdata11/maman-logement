"use client";

import { useState } from "react";

interface RetreatImageGalleryProps {
  images: string[];
  imageCategories: Record<string, string[]>;
  name: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  exterior: "Extérieur",
  rooms: "Chambres",
  practice_spaces: "Espaces de pratique",
  dining: "Restauration",
  surroundings: "Environnement",
  outdoor: "Extérieurs",
};

export function RetreatImageGallery({ images, imageCategories, name }: RetreatImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Object.entries(imageCategories).filter(([, urls]) => urls.length > 0);
  const displayImages = activeCategory
    ? imageCategories[activeCategory] || []
    : images;

  if (images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        Aucune photo disponible
      </div>
    );
  }

  return (
    <div>
      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 mb-3 overflow-x-auto">
          <button
            onClick={() => setActiveCategory(null)}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
              activeCategory === null
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Toutes ({images.length})
          </button>
          {categories.map(([cat, urls]) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setSelectedIndex(0);
              }}
              className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                activeCategory === cat
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {CATEGORY_LABELS[cat] || cat} ({urls.length})
            </button>
          ))}
        </div>
      )}

      {/* Main image */}
      <div
        className="relative w-full h-72 sm:h-96 rounded-lg overflow-hidden bg-gray-100 cursor-pointer mb-2"
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={displayImages[selectedIndex] || images[0]}
          alt={`${name} - photo ${selectedIndex + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {selectedIndex + 1} / {displayImages.length}
        </div>
      </div>

      {/* Thumbnails */}
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {displayImages.map((url, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 ${
                i === selectedIndex ? "border-gray-900" : "border-transparent"
              }`}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            onClick={() => setLightboxOpen(false)}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex((i) => (i - 1 + displayImages.length) % displayImages.length);
            }}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <img
            src={displayImages[selectedIndex]}
            alt={`${name} - photo ${selectedIndex + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedIndex((i) => (i + 1) % displayImages.length);
            }}
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {selectedIndex + 1} / {displayImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
