'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Project, ProjectImage } from '@/types';

interface Props {
  project: Project | null;
  open: boolean;
  onClose: () => void;
}

export default function ProjectCarouselModal({ project, open, onClose }: Props) {
  const [current, setCurrent] = useState(0);

  const images: ProjectImage[] = project?.images && project.images.length > 0
    ? project.images
    : project?.cover_image_path
      ? [{ id: 'cover', storage_path: project.cover_image_path, caption: null, display_order: 0 }]
      : [];

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    if (open) setCurrent(0);
  }, [open, project?.id]);

  // Preload neighbor slides so arrow clicks render instantly
  const neighborSrcs = useMemo(() => {
    if (!open || images.length <= 1) return [];
    const nextIdx = (current + 1) % images.length;
    const prevIdx = (current - 1 + images.length) % images.length;
    return [images[nextIdx]?.storage_path, images[prevIdx]?.storage_path].filter(Boolean) as string[];
  }, [open, current, images]);

  useEffect(() => {
    neighborSrcs.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [neighborSrcs]);

  useEffect(() => {
    if (!open || images.length <= 1) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, prev, next, images.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !project) return null;

  const img = images[current];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-md">
      {/* Close Background Area */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-[60] p-2 md:p-3 bg-white/10 hover:bg-white/25 text-white rounded-full backdrop-blur-md transition-all cursor-pointer"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      <div className="relative z-10 w-full max-w-6xl flex flex-col gap-4">
        {/* Main Image Container */}
        <div className="relative w-full aspect-video max-h-[70vh] bg-transparent rounded-lg overflow-hidden flex items-center justify-center select-none">
          {img ? (
            <img
              key={img.id}
              src={img.storage_path}
              alt={project.title}
              className="w-full h-full object-contain drop-shadow-2xl"
              draggable={false}
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <span className="text-white/40 text-sm">No images available</span>
          )}

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-4 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all cursor-pointer"
                aria-label="Previous image"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 md:p-4 bg-black/40 hover:bg-black/70 text-white rounded-full backdrop-blur-sm transition-all cursor-pointer"
                aria-label="Next image"
              >
                <ChevronRight size={32} />
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-black/40 px-3 py-2 rounded-full backdrop-blur-md">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
                    className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                      idx === current ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Thumbnails row */}
        {images.length > 1 && (
          <div className="w-full flex gap-3 overflow-x-auto py-2 px-1 justify-start md:justify-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {images.map((im, idx) => (
              <button
                key={im.id}
                onClick={() => setCurrent(idx)}
                className={`relative h-20 md:h-24 aspect-video flex-shrink-0 rounded-md overflow-hidden transition-all cursor-pointer border-2 ${
                  idx === current
                    ? 'border-white opacity-100 scale-105 shadow-lg'
                    : 'border-transparent opacity-40 hover:opacity-100 hover:scale-100'
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <img
                  src={im.storage_path}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
