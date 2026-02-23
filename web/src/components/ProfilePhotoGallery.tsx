"use client";

import { useState, useEffect, useCallback } from "react";

interface ProfilePhotoGalleryProps {
  photos: string[];
  displayName: string;
}

export function ProfilePhotoGallery({ photos, displayName }: ProfilePhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const navigate = useCallback((direction: 1 | -1) => {
    setCurrentIndex((prev) => (prev + direction + photos.length) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") navigate(-1);
      if (e.key === "ArrowRight") navigate(1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [lightboxOpen, navigate]);

  if (photos.length === 0) return null;

  const openAt = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  // Single photo layout
  if (photos.length === 1) {
    return (
      <>
        <div className="rounded-2xl overflow-hidden">
          <button
            onClick={() => openAt(0)}
            className="w-full aspect-[2.5/1] relative group cursor-pointer block"
          >
            <img
              src={photos[0]}
              alt={`Photo de ${displayName}`}
              className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-[0.97]"
            />
          </button>
        </div>
        {lightboxOpen && (
          <Lightbox
            photos={photos}
            currentIndex={currentIndex}
            displayName={displayName}
            onClose={() => setLightboxOpen(false)}
            onNavigate={navigate}
            onGoTo={goTo}
          />
        )}
      </>
    );
  }

  // 2 photos layout
  if (photos.length === 2) {
    return (
      <>
        <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden">
          {photos.map((url, i) => (
            <button
              key={i}
              onClick={() => openAt(i)}
              className="aspect-[4/3] relative group cursor-pointer"
            >
              <img
                src={url}
                alt={`Photo ${i + 1} de ${displayName}`}
                className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-[0.97]"
              />
            </button>
          ))}
        </div>
        {lightboxOpen && (
          <Lightbox
            photos={photos}
            currentIndex={currentIndex}
            displayName={displayName}
            onClose={() => setLightboxOpen(false)}
            onNavigate={navigate}
            onGoTo={goTo}
          />
        )}
      </>
    );
  }

  // 3+ photos: Airbnb-style mosaic
  const visibleSmall = photos.slice(1, 5);
  const remaining = photos.length - 5;

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1" style={{ height: "clamp(240px, 36vw, 400px)" }}>
          {/* Large main image */}
          <button
            onClick={() => openAt(0)}
            className="relative group cursor-pointer h-full overflow-hidden"
          >
            <img
              src={photos[0]}
              alt={`Photo principale de ${displayName}`}
              className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-[0.97]"
            />
          </button>

          {/* Right side grid */}
          <div
            className={`hidden sm:grid gap-1 h-full ${
              visibleSmall.length <= 2 ? "grid-cols-1 grid-rows-2" : "grid-cols-2 grid-rows-2"
            }`}
          >
            {visibleSmall.map((url, i) => (
              <button
                key={i}
                onClick={() => openAt(i + 1)}
                className="relative group cursor-pointer overflow-hidden"
              >
                <img
                  src={url}
                  alt={`Photo ${i + 2} de ${displayName}`}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:brightness-[0.97]"
                />
                {i === visibleSmall.length - 1 && remaining > 0 && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-all group-hover:bg-black/40">
                    <span className="text-white font-medium text-sm">
                      +{remaining} photo{remaining > 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* "Show all" button overlay - Airbnb-style bottom-right */}
        {photos.length > 1 && (
          <button
            onClick={() => openAt(0)}
            className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 bg-white text-[var(--foreground)] text-xs sm:text-sm font-medium px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 1h6v6H1V1zm0 8h6v6H1V9zm8-8h6v6H9V1zm0 8h6v6H9V9z" opacity="0.8" />
            </svg>
            Voir les {photos.length} photos
          </button>
        )}
      </div>

      {/* Mobile: horizontal scroll strip */}
      {photos.length > 1 && (
        <div className="flex sm:hidden gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 snap-x snap-mandatory scrollbar-none">
          {photos.slice(1).map((url, i) => (
            <button
              key={i}
              onClick={() => openAt(i + 1)}
              className="shrink-0 w-20 h-20 rounded-lg overflow-hidden snap-start"
            >
              <img
                src={url}
                alt={`Photo ${i + 2}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <Lightbox
          photos={photos}
          currentIndex={currentIndex}
          displayName={displayName}
          onClose={() => setLightboxOpen(false)}
          onNavigate={navigate}
          onGoTo={goTo}
        />
      )}
    </>
  );
}

function Lightbox({
  photos,
  currentIndex,
  displayName,
  onClose,
  onNavigate,
  onGoTo,
}: {
  photos: string[];
  currentIndex: number;
  displayName: string;
  onClose: () => void;
  onNavigate: (direction: 1 | -1) => void;
  onGoTo: (index: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Fermer
        </button>
        <span className="text-white/50 text-sm tabular-nums">
          {currentIndex + 1} / {photos.length}
        </span>
      </div>

      {/* Main image */}
      <div className="flex-1 flex items-center justify-center relative px-12 sm:px-20 py-4 min-h-0">
        {photos.length > 1 && (
          <button
            onClick={() => onNavigate(-1)}
            className="absolute left-2 sm:left-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <img
          src={photos[currentIndex]}
          alt={`Photo ${currentIndex + 1} de ${displayName}`}
          className="max-w-full max-h-full object-contain rounded select-none"
          draggable={false}
        />

        {photos.length > 1 && (
          <button
            onClick={() => onNavigate(1)}
            className="absolute right-2 sm:right-6 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom thumbnails */}
      {photos.length > 1 && (
        <div className="px-4 py-3">
          <div className="flex justify-center gap-1.5 overflow-x-auto max-w-xl mx-auto scrollbar-none">
            {photos.map((url, i) => (
              <button
                key={i}
                onClick={() => onGoTo(i)}
                className={`shrink-0 w-12 h-12 rounded-md overflow-hidden transition-all ${
                  i === currentIndex
                    ? "ring-2 ring-white ring-offset-1 ring-offset-black opacity-100 scale-105"
                    : "opacity-40 hover:opacity-70"
                }`}
              >
                <img
                  src={url}
                  alt={`Miniature ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
