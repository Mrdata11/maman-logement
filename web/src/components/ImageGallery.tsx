"use client";

import { useState, useEffect, useCallback } from "react";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const navigateLightbox = useCallback(
    (direction: "prev" | "next") => {
      if (lightboxIndex === null) return;
      if (direction === "prev" && lightboxIndex > 0) {
        setLightboxIndex(lightboxIndex - 1);
      }
      if (direction === "next" && lightboxIndex < images.length - 1) {
        setLightboxIndex(lightboxIndex + 1);
      }
    },
    [lightboxIndex, images.length]
  );

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") navigateLightbox("prev");
      if (e.key === "ArrowRight") navigateLightbox("next");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [lightboxIndex, closeLightbox, navigateLightbox]);

  if (images.length === 0) return null;

  // Single image: full width
  if (images.length === 1) {
    return (
      <>
        <button
          onClick={() => setLightboxIndex(0)}
          className="group relative w-full overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt={title}
            className="w-full h-64 sm:h-80 object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="eager"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
        <Lightbox
          images={images}
          index={lightboxIndex}
          title={title}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
          onSetIndex={setLightboxIndex}
        />
      </>
    );
  }

  // 2-3 images: hero + side column
  if (images.length <= 3) {
    return (
      <>
        <div className="grid grid-cols-3 gap-2 rounded-xl overflow-hidden">
          <button
            onClick={() => setLightboxIndex(0)}
            className="group relative col-span-2 overflow-hidden focus:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt={`${title} - 1`}
              className="w-full h-64 sm:h-72 object-cover group-hover:scale-[1.02] transition-transform duration-300"
              loading="eager"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <div className="flex flex-col gap-2">
            {images.slice(1, 3).map((src, i) => (
              <button
                key={i + 1}
                onClick={() => setLightboxIndex(i + 1)}
                className="group relative flex-1 overflow-hidden focus:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${title} - ${i + 2}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).parentElement!.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
        <Lightbox
          images={images}
          index={lightboxIndex}
          title={title}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
          onSetIndex={setLightboxIndex}
        />
      </>
    );
  }

  // 4+ images: hero + 2x2 grid with "show all" overlay
  const visibleSide = images.slice(1, 5);
  const remainingCount = images.length - 5;

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-xl overflow-hidden h-64 sm:h-80">
        {/* Hero (left half, full height) */}
        <button
          onClick={() => setLightboxIndex(0)}
          className="group relative col-span-2 row-span-2 overflow-hidden focus:outline-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt={`${title} - 1`}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="eager"
            onError={(e) => {
              (e.target as HTMLImageElement).parentElement!.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Side grid (right half, 2x2) */}
        {visibleSide.map((src, i) => (
          <button
            key={i + 1}
            onClick={() => setLightboxIndex(i + 1)}
            className="group relative overflow-hidden focus:outline-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${title} - ${i + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).parentElement!.style.display = "none";
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            {/* "Show all" overlay on last visible image */}
            {i === visibleSide.length - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  +{remainingCount + 1} photos
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
      <Lightbox
        images={images}
        index={lightboxIndex}
        title={title}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
        onSetIndex={setLightboxIndex}
      />
    </>
  );
}

function Lightbox({
  images,
  index,
  title,
  onClose,
  onNavigate,
  onSetIndex,
}: {
  images: string[];
  index: number | null;
  title: string;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  onSetIndex: (i: number) => void;
}) {
  if (index === null) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 text-white/70 text-sm">
        {index + 1} / {images.length}
      </div>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate("prev"); }}
          className="absolute left-4 p-3 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[index]}
        alt={`${title} - ${index + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next */}
      {index < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate("next"); }}
          className="absolute right-4 p-3 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 max-w-[80vw] overflow-x-auto py-2 px-1">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onSetIndex(i); }}
              className={`shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-all ${
                i === index ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
