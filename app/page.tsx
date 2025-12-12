"use client";

import { useEffect, useMemo, useState } from "react";
import Filters from "@/app/components/Filters";
import ProjectCard from "@/app/components/ProjectCard";
import ProjectViewer from "@/app/components/ProjectViewer";
import { PROJECTS } from "@/lib/projects";
import type { ProjectCategory, ProjectType } from "@/lib/projects";

type FiltersState = {
  types: Record<ProjectType, boolean>;
  categories: Record<ProjectCategory, boolean>;
};

const DEFAULT_FILTERS: FiltersState = {
  types: { pro: false, perso: false },
  categories: { formation: false, appartement: false },
};

export default function Home() {
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const filteredProjects = useMemo(() => {
    const activeTypes = (Object.entries(filters.types) as [ProjectType, boolean][])
      .filter(([, v]) => v)
      .map(([k]) => k);

    const activeCats = (
      Object.entries(filters.categories) as [ProjectCategory, boolean][]
    )
      .filter(([, v]) => v)
      .map(([k]) => k);

    return PROJECTS.filter((p) => {
      const typeOk = activeTypes.length === 0 || activeTypes.includes(p.type);
      const catOk =
        activeCats.length === 0 ||
        activeCats.some((c) => p.categories.includes(c));
      return typeOk && catOk;
    });
  }, [filters]);

  // Bloquer le scroll du body quand le viewer est ouvert
  useEffect(() => {
    if (activeIndex !== null) {
      document.body.classList.add("viewer-open");
      return;
    }
    document.body.classList.remove("viewer-open");
  }, [activeIndex]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5">
          <h1 className="text-xl font-bold">ToutesMesApps</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Mes projets en cartes + filtres + swipe fullscreen
          </p>
        </div>
      </header>

      {/* Layout: sidebar + grid */}
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[260px_1fr]">
        {/* Sidebar filtres */}
        <Filters
          value={filters}
          onChange={setFilters}
          total={PROJECTS.length}
          shown={filteredProjects.length}
        />

        {/* Grille centre (4 max par rangée) */}
        <section>
          {filteredProjects.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-neutral-700 shadow-sm">
              Aucun projet ne correspond aux filtres.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Viewer fullscreen + swipe trackpad */}
      {activeIndex !== null && (
        <ProjectViewer
          projects={filteredProjects}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
        />
      )}
    </div>
  );
}