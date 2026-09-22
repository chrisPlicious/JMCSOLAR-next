"use client";

import { useMemo, useState } from "react";
import { Images } from "lucide-react";
import ProjectCard from "@/components/ui/ProjectCard";
import PageHero from "@/components/ui/PageHero";
import CtaBand from "@/components/ui/CtaBand";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import ProjectCarouselModal from "@/components/ui/ProjectCarouselModal";
import { Timeline } from "@/components/ui/timeline";
import Layout from "@/components/layout/Layout";
import { SERVICE_AREA } from "@/lib/seo/business";
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
      <PageHero
        title="Solar Projects & Installations"
        lead={`From residential rooftops to large-scale industrial farms — browse our completed solar installations across ${SERVICE_AREA}.`}
      />

      <Section id="projects" tone="white" spacing="compact">
        {timelineData.length > 0 ? (
          <Timeline data={timelineData} />
        ) : (
          <EmptyState
            icon={Images}
            title="No projects yet"
            body="Our completed installations will appear here soon."
            action={<Button href="/booking">Get a quote</Button>}
          />
        )}
      </Section>

      <CtaBand
        title="Planning a system like these?"
        body="Tell us about your site and we'll size a system for it."
      />

      <ProjectCarouselModal
        project={selectedProject}
        open={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </Layout>
  );
}
