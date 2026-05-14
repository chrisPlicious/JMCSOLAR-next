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

  const CATEGORY_ORDER: Project["category"][] = [
    "industrial",
    "commercial",
    "agricultural",
    "residential",
  ];

  const CATEGORY_LABELS: Record<Project["category"], string> = {
    industrial: "Industrial",
    commercial: "Commercial",
    agricultural: "Agricultural",
    residential: "Residential",
  };

  // Group projects by classification, fixed category order, hide empty
  const timelineData = useMemo(() => {
    const grouped: Record<Project["category"], Project[]> = {
      industrial: [],
      commercial: [],
      agricultural: [],
      residential: [],
    };

    for (const project of projects) {
      grouped[project.category]?.push(project);
    }

    return CATEGORY_ORDER.filter((cat) => grouped[cat].length > 0).map(
      (cat) => {
        const catProjects = [...grouped[cat]].sort((a, b) => {
          const aDate = a.completed_at ?? a.created_at;
          const bDate = b.completed_at ?? b.created_at;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        });
        return {
          title: CATEGORY_LABELS[cat],
          stats: { projectCount: catProjects.length },
          content: (
            <div className="flex flex-col gap-6">
              {catProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setSelectedProject(project)}
                />
              ))}
            </div>
          ),
        };
      }
    );
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
          <span className="text-solar-600 font-semibold text-lg uppercase tracking-widest mb-4 block">
            Our Work
          </span>
          <h2
            className="text-navy-900 font-black text-3xl sm:text-4xl lg:text-6xl leading-tight mb-4"
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
