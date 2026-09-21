'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Project, ProjectImage } from '@/types';
import Button from './Button';

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${project.title} photos`}
      className="surface-dark fixed inset-0 z-50 flex flex-col items-center justify-center p-4 md:p-8 bg-navy-950/95 backdrop-blur-md"
    >
      {/* Close Background Area */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-[60] bg-white/10 hover:bg-white/20 backdrop-blur-md"
        aria-label="Close gallery"
      >
        <X className="size-6" aria-hidden />
      </Button>

      <div className="relative z-10 w-full max-w-6xl flex flex-col gap-4">
        {/* Main Image Container */}
        <div className="relative w-full aspect-video max-h-[70vh] rounded-card overflow-hidden flex items-center justify-center select-none">
          {img ? (
            <img
              key={img.id}
              src={img.storage_path}
              alt={project.title}
              className="w-full h-full object-contain"
              draggable={false}
              decoding="async"
              fetchPriority="high"
            />
          ) : (
            <span className="text-fg-subtle text-sm">No images available</span>
          )}

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 md:size-14 bg-navy-950/60 hover:bg-navy-950/80 backdrop-blur-sm"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-7" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 md:size-14 bg-navy-950/60 hover:bg-navy-950/80 backdrop-blur-sm"
                aria-label="Next image"
              >
                <ChevronRight className="size-7" aria-hidden />
              </Button>

              {/* Dots Indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20 bg-navy-950/60 px-3 py-2 rounded-full backdrop-blur-md">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
                    className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                      idx === current ? 'bg-solar-500 w-6' : 'w-2.5 bg-white/60 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                    aria-current={idx === current || undefined}
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
                type="button"
                onClick={() => setCurrent(idx)}
                className={`relative h-20 md:h-24 aspect-video flex-shrink-0 rounded-control overflow-hidden transition-all duration-200 cursor-pointer border-2 ${
                  idx === current
                    ? 'border-solar-500 opacity-100 shadow-card'
                    : 'border-transparent opacity-60 hover:opacity-100'
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
