'use client';

import { useRef } from 'react';
import type { MouseEvent } from 'react';
import ProjectCard from '@/components/ui/ProjectCard';
import Layout from '@/components/layout/Layout';
import type { Project } from '@/types';

interface Props {
  projects: Project[];
}

export default function ProjectsPage({ projects }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  function onMouseDown(e: MouseEvent<HTMLDivElement>) {
    if (!scrollRef.current) return;
    isDown.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
  }

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!isDown.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.2;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  }

  function onMouseUp() {
    isDown.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  }

  function onMouseLeave() {
    isDown.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  }

  return (
    <Layout>
      <section id="projects" className="bg-white mx-auto py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-solar-600 font-semibold text-sm uppercase tracking-widest mb-4 block">
            Our Work
          </span>
          <h2
            className="text-navy-900 font-black text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Projects &{' '}
            <span className="text-solar-500">Installations</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            From residential rooftops to large-scale industrial farms — browse our completed solar
            installations across Eastern Visayas.
          </p>
          <p className="text-slate-400 text-sm mt-3">Drag or swipe to explore →</p>
        </div>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-5 overflow-x-auto py-2 pb-4 px-1"
          style={{ cursor: 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </section>
    </Layout>
  );
}