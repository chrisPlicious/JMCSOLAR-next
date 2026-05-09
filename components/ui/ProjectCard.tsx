'use client';

import Image from 'next/image';
import { MapPin, Zap, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Project } from '../../types';

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const categoryGradients: Record<Project['category'], string> = {
  residential:  'from-blue-700 via-blue-500 to-blue-400',
  commercial:   'from-purple-700 via-purple-500 to-purple-400',
  industrial:   'from-orange-700 via-orange-500 to-orange-400',
  agricultural: 'from-green-700 via-green-500 to-green-400',
  school:       'from-solar-700 via-solar-500 to-solar-400',
};

const categoryIcons: Record<Project['category'], string> = {
  residential:  '🏠',
  commercial:   '🏢',
  industrial:   '🏭',
  agricultural: '🌾',
  school:       '🏫',
};

const categoryLabels: Record<Project['category'], string> = {
  residential:  'Residential',
  commercial:   'Commercial',
  industrial:   'Industrial',
  agricultural: 'Agricultural',
  school:       'School',
};

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const hasGallery = (project.images?.length ?? 0) > 0;

  return (
    <motion.div
      className={`relative w-full h-[220px] sm:h-[340px] md:h-[460px] lg:h-[580px] rounded-2xl overflow-hidden select-none ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.015, transition: { duration: 0.3, ease: 'easeOut' } }}
    >

      {/* Background: image if available, gradient fallback */}
      {project.cover_image_path ? (
        // M7: next/image for Vercel optimisation + LCP
        <Image
          src={project.cover_image_path}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          draggable={false}
        />
      ) : (
        <div className={`absolute inset-0 bg-linear-to-br ${categoryGradients[project.category]}`} />
      )}

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/20 hover:bg-black/0 transition-colors duration-500" />

      {/* Category label — top left */}
      <div className="absolute top-4 left-4 z-10">
        <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-xs md:text-xl font-semibold px-3 py-1 rounded-full">
          {categoryLabels[project.category]}
        </span>
      </div>

      {/* Facebook link — top right */}
      {project.facebook_url && (
        <a
          href={project.facebook_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-4 right-4 z-10 inline-flex items-center justify-center bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/40 transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={18} />
        </a>
      )}

      {/* Centered emoji — only when no image */}
      {!project.cover_image_path && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-7xl opacity-20">{categoryIcons[project.category]}</span>
        </div>
      )}

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/75 via-black/40 to-transparent p-5 pt-10 z-10">
        <h3
          className="text-white font-bold text-sm md:text-xl leading-snug mb-2"
          style={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {project.title}
        </h3>
        <div className="flex items-center gap-3 text-white/80 text-xs">
          {project.system_size && (
            <span className="flex items-center gap-1">
              <Zap size={15} className="text-solar-400" />
              {project.system_size}
            </span>
          )}
          {project.location && (
            <span className="flex items-center gap-1">
              <MapPin size={15} />
              {project.location}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
