"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import ProjectCard from "@/components/ui/ProjectCard";
import ProjectCarouselModal from "@/components/ui/ProjectCarouselModal";
import { Timeline } from "@/components/ui/timeline";
import Layout from "@/components/layout/Layout";
import type { Project } from "@/types";

interface Props {
  projects: Project[];
}

export default function ProjectsPage({ projects }: Props) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const parseKwp = (sizeStr: string | null): number => {
    if (!sizeStr) return 0;
    const match = sizeStr.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Group projects by year (derived from created_at), sorted newest first
  const timelineData = useMemo(() => {
    const grouped: Record<string, Project[]> = {};

    for (const project of projects) {
      const date = project.completed_at
        ? new Date(project.completed_at)
        : new Date(project.created_at);
      const year = date.getFullYear().toString();
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(project);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([year, yearProjects]) => {
        const totalKwp = Math.round(
          yearProjects.reduce((sum, p) => sum + parseKwp(p.system_size), 0)
        );
        return {
          title: year,
          stats: { projectCount: yearProjects.length, totalKwp },
          content: (
            <div className="flex flex-col gap-6">
              {yearProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setSelectedProject(project)}
                />
              ))}
            </div>
          ),
        };
      });
  }, [projects]);

  return (
    <Layout>
      <section id="projects" className="bg-white mx-auto py-20 px-4 lg:py-28">
        {/* Header — kept as-is */}
        <motion.div
          className="text-center max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-solar-600 font-semibold text-sm uppercase tracking-widest mb-4 block">
            Our Work
          </span>
          <h2
            className="text-navy-900 font-black text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Projects & <span className="text-solar-500">Installations</span>
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            From residential rooftops to large-scale industrial farms — browse
            our completed solar installations across Eastern Visayas.
          </p>
        </motion.div>

        <Timeline data={timelineData} />
      </section>

      <ProjectCarouselModal
        project={selectedProject}
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </Layout>
  );
}
