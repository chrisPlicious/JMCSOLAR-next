'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Zap, ExternalLink, Images } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Project } from '../../types';
import { fadeUp, revealOnScroll } from '@/lib/motion';
import Badge from './Badge';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  // next/image throws (and 500s the whole page) on a src that isn't an absolute
  // URL or a root-relative path. Some Firestore project docs hold a bare storage
  // path (e.g. "project-images/…jpg"); guard so a bad path degrades to the
  // navy fallback instead of crashing a page we want indexed.
  const coverSrc =
    project.cover_image_path && /^(https?:\/\/|\/)/.test(project.cover_image_path)
      ? project.cover_image_path
      : null;

  // Warm cache for first gallery image so modal opens instantly
  const prefetchGallery = () => {
    const first = project.images?.[0]?.storage_path;
    if (!first) return;
    const img = new window.Image();
    img.src = first;
  };

  return (
    <motion.div
      className={`group surface-dark relative w-full aspect-[4/3] overflow-hidden rounded-card bg-navy-900 shadow-soft select-none transition-shadow duration-300 ease-out-quart hover:shadow-card-hover ${coverSrc ? '' : 'texture-module'}`}
      onMouseEnter={prefetchGallery}
      onTouchStart={prefetchGallery}
      variants={fadeUp}
      {...revealOnScroll}
    >
      {/* Background: image if available, navy fallback */}
      {coverSrc ? (
        // M7: next/image for Vercel optimisation + LCP
        <Image
          src={coverSrc}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out-quart group-hover:scale-[1.03]"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <Images className="size-12 text-fg-subtle" />
        </div>
      )}

      {/* Whole-card gallery trigger: a real button so keyboard users can open
          it. Overlay copy is pointer-transparent; links sit above at z-20. */}
      {onClick && (
        <button
          type="button"
          onClick={onClick}
          onFocus={prefetchGallery}
          aria-label={`View photos of ${project.title}`}
          className="absolute inset-0 z-10 cursor-pointer rounded-card"
        />
      )}

      {/* Category — top left */}
      <Badge variant={project.category} className="absolute top-4 left-4 z-20 capitalize">
        {project.category}
      </Badge>

      {/* Facebook link — top right */}
      {project.facebook_url && (
        <a
          href={project.facebook_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View ${project.title} on Facebook`}
          className="absolute top-4 right-4 z-20 inline-flex size-9 items-center justify-center rounded-full bg-navy-950/60 text-fg backdrop-blur-sm transition-colors duration-200 hover:bg-navy-950/80"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="size-4" aria-hidden />
        </a>
      )}

      {/* Bottom info overlay */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 z-10 bg-linear-to-t from-navy-950/85 via-navy-950/45 to-transparent p-5 pt-12">
        <h3 className="text-title text-fg mb-2">{project.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
          {project.system_size && (
            <span className="flex items-center gap-1">
              <Zap className="size-4 text-solar-ink" aria-hidden />
              {project.system_size}
            </span>
          )}
          {project.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-4" aria-hidden />
              {project.city_slug ? (
                <Link
                  href={`/locations/${project.city_slug}`}
                  className="pointer-events-auto relative z-20 hover:text-solar-ink hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {project.location}
                </Link>
              ) : (
                project.location
              )}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
