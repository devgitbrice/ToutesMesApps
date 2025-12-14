"use client";

import { useEffect, useMemo, useState } from "react";
import Filters from "@/app/components/Filters";
import ProjectCard from "@/app/components/ProjectCard";
import ProjectViewer from "@/app/components/ProjectViewer";

import type { Project, ProjectCategory, ProjectType } from "@/lib/projects";
import { isProjectCategory, isProjectType } from "@/lib/projects";

type FiltersState = {
  types: Partial<Record<ProjectType, boolean>>;
  categories: Partial<Record<ProjectCategory, boolean>>;
  favoriteOnly: boolean;
};

const DEFAULT_FILTERS: FiltersState = {
  types: {},
  categories: {},
  favoriteOnly: false,
};

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- CHARGEMENT ---
  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Erreur réseau");
        const data = await res.json();
        setProjects(data);
      } catch (e) {
        console.error("Impossible de charger les projets", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, []);

  // --- LISTES DYNAMIQUES (strictes) ---
  const availableTypes = useMemo((): ProjectType[] => {
    const types = new Set(projects.map((p) => p.type).filter(isProjectType));
    return Array.from(types).sort();
  }, [projects]);

  const availableCategories = useMemo((): ProjectCategory[] => {
    const cats = new Set(
      projects.flatMap((p) => p.categories).filter(isProjectCategory)
    );
    return Array.from(cats).sort();
  }, [projects]);

  // --- 1. CRÉATION DE PROJET ---
  const handleCreateProject = async () => {
    const newProject: Project = {
      id: "temp-" + Date.now(),
      title: "Nouveau Projet",
      description: "",
      type: "perso",
      categories: [],
      githubLink: "",
      siteLink: "",
      favorite: false,
    };

    const newIndex = projects.length;
    setProjects((prev) => [...prev, newProject]);
    setActiveIndex(newIndex);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      if (!res.ok) throw new Error("Erreur création");

      const data = await res.json();
      setProjects((prev) =>
        prev.map((p) => (p.id === newProject.id ? { ...p, id: data.id } : p))
      );
    } catch (e) {
      console.error("Erreur lors de la création !", e);
      alert("Erreur lors de la création du projet sur Airtable.");
    }
  };

  // --- 2. MISE À JOUR ---
  const handleUpdateProject = async (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );

    if (updatedProject.id.startsWith("temp-")) return;

    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProject),
      });
    } catch (e) {
      console.error("Erreur sauvegarde", e);
    }
  };

  // --- FILTRAGE (corrigé ProjectCategory) ---
  const filteredProjects = useMemo(() => {
    const activeTypes = (Object.entries(filters.types) as [
      ProjectType,
      boolean
    ][])
      .filter(([, isChecked]) => isChecked)
      .map(([type]) => type);

    const activeCats = (Object.entries(filters.categories) as [
      ProjectCategory,
      boolean
    ][])
      .filter(([, isChecked]) => isChecked)
      .map(([cat]) => cat);

    return projects.filter((p) => {
      const typeOk = activeTypes.length === 0 || activeTypes.includes(p.type);

      const catOk =
        activeCats.length === 0 ||
        activeCats.some((c) => p.categories.includes(c));

      const favOk = !filters.favoriteOnly || p.favorite === true;

      return typeOk && catOk && favOk;
    });
  }, [filters, projects]);

  useEffect(() => {
    if (activeIndex !== null) {
      document.body.classList.add("viewer-open");
    } else {
      document.body.classList.remove("viewer-open");
    }
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-900 text-white">
        Chargement...
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode ? "bg-slate-950 text-white" : "bg-neutral-50 text-neutral-900"
      }`}
    >
      <header
        className={`border-b transition-colors duration-300 ${
          isDarkMode
            ? "border-slate-800 bg-slate-950"
            : "bg-white border-neutral-200"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <div>
            <h1 className="text-xl font-bold">ToutesMesApps</h1>
            <p
              className={`mt-1 text-sm ${
                isDarkMode ? "text-slate-400" : "text-neutral-600"
              }`}
            >
              Mes projets en cartes + filtres + swipe fullscreen
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreateProject}
              className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-500 shadow-md hover:shadow-lg active:scale-95"
            >
              + Nouveau
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isDarkMode
                  ? "bg-slate-800 text-yellow-300 hover:bg-slate-700"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {isDarkMode ? "🌙 Nuit" : "☀️ Jour"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[260px_1fr]">
        <Filters
          value={filters}
          onChange={setFilters}
          total={projects.length}
          shown={filteredProjects.length}
          isDarkMode={isDarkMode}
          availableTypes={availableTypes}
          availableCategories={availableCategories}
        />

        <section>
          {filteredProjects.length === 0 ? (
            <div
              className={`rounded-2xl border p-6 text-sm shadow-sm transition-colors ${
                isDarkMode
                  ? "bg-slate-900 border-slate-800 text-slate-300"
                  : "bg-white border-neutral-200 text-neutral-700"
              }`}
            >
              Aucun projet ne correspond aux filtres.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onClick={() => setActiveIndex(i)}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {activeIndex !== null && (
        <ProjectViewer
          projects={filteredProjects}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onUpdate={handleUpdateProject}
          availableTypes={availableTypes}
          availableCategories={availableCategories}
        />
      )}
    </div>
  );
}
