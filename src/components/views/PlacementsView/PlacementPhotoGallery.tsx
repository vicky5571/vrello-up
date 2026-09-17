"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, X, Camera } from "lucide-react";
import { parsePlacementPhotos } from "@/lib/marcom/photoUtils";
import { cn } from "@/lib/utils";

interface PlacementPhotoGalleryProps {
  photoUrl?: string | null;
  className?: string;
  thumbnailHeight?: string;
}

export function PlacementPhotoGallery({
  photoUrl,
  className,
  thumbnailHeight = "h-32",
}: PlacementPhotoGalleryProps) {
  const photos = parsePlacementPhotos(photoUrl);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (photos.length === 0) {
    return null;
  }

  const activePhoto = photos[currentIndex] || photos[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Main Image Container */}
      <div
        className={cn(
          "group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 cursor-pointer",
          thumbnailHeight,
        )}
        onClick={() => setLightboxIndex(currentIndex)}
      >
        <img
          src={activePhoto}
          alt={`Bukti Pemasangan ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-102"
          onError={(e) => {
            (e.target as HTMLElement).style.opacity = "0.2";
          }}
        />

        {/* Counter Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white flex items-center gap-1">
          <Camera className="w-3 h-3 text-emerald-400" />
          <span>
            {currentIndex + 1} / {photos.length}
          </span>
        </div>

        {/* Hover Click to Expand Hint */}
        <div className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Eye className="w-3.5 h-3.5" />
        </div>

        {/* Navigation Arrows for Multiple Photos */}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              title="Foto Sebelumnya"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Foto Selanjutnya"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Mini Thumbnails Strip if > 1 photo */}
      {photos.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {photos.map((url, idx) => (
            <button
              key={`${url}-${idx}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={cn(
                "relative w-10 h-10 rounded-lg overflow-hidden border shrink-0 transition-all cursor-pointer",
                idx === currentIndex
                  ? "border-emerald-500 ring-2 ring-emerald-500/40 scale-105"
                  : "border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100",
              )}
            >
              <img
                src={url}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex(null);
          }}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Lightbox Image */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
              <img
                src={photos[lightboxIndex]}
                alt={`Bukti Pemasangan ${lightboxIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain"
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((prev) =>
                        prev !== null && prev > 0 ? prev - 1 : photos.length - 1,
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((prev) =>
                        prev !== null && prev < photos.length - 1 ? prev + 1 : 0,
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Lightbox Counter */}
            <div className="mt-2 text-xs font-semibold text-white/80">
              Foto {lightboxIndex + 1} dari {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
