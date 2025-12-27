"use client";

import { useEffect, useMemo, useState } from "react";

import Filters, { type FiltersState } from "./components/Filters";
import ProjectCard from "./components/ProjectCard";
import ProjectViewer from "./components/ProjectViewer";

// ✅ TYPES + HELPERS OFFICIELS
import type { Project, ProjectCategory, ProjectType } from "@/lib/projects";
import {
  toProjectType,
  toProjectCategories,
  PROJECT_TYPES,
  PROJECT_CATEGORIES,
} from "@/lib/projects";

/** * ✅ CORRECTION CRITIQUE POUR VERCEL :
 * L'objet ci-dessous doit contenir toutes les propriétés de FiltersState
 */
const DEFAULT_FILTERS: FiltersState = {
  types: {},
  categories: {},
  favoriteOnly: false,
  search: "", // <--- Cette ligne manquante causait l'erreur de build
};

export default function Page() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // ✅ Mode nuit par défaut
  const [isDarkMode, setIsDarkMode] = useState(true);

  // ✅ Utilisation de l'objet de base corrigé
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);

  /* =====================
   * FETCH PROJECTS
   * ===================== */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) throw new Error("Erreur API");

        const raw = await res.json();
        if (cancelled) return;

        const normalized: Project[] = (Array.isArray(raw) ? raw : []).map(
          (p: any) => ({
            ...p,
            type: toProjectType(p.type),
            categories: toProjectCategories(p.categories),
          })
        );

        setProjects(normalized);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Erreur chargement projets");
          setProjects([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* =====================
   * ACTIONS
   * ===================== */

  const handleCreateProject = async () => {
    try {
      setIsCreating(true);
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Nouveau Projet",
          description: "",
          type: "perso",
          categories: [],
          favorite: false,
        }),
      });

      if (!res.ok) throw new Error("Erreur lors de la création");

      const data = await res.json();

      const newProject: Project = {
        id: data.id,
        title: "Nouveau Projet",
        description: "",
        type: "perso",
        categories: [],
        githubLink: "",
        siteLink: "",
        favorite: false,
      };

      setProjects((prev) => [newProject, ...prev]);
      setActiveIndex(0);

    } catch (err) {
      console.error("Erreur création projet:", err);
      alert("Erreur lors de la création du projet dans Airtable");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateProject = async (updated: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );

    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.warn("⚠️ Airtable refuse la mise à jour :", errorData);
      }
    } catch (err) {
      console.error("❌ Erreur réseau :", err);
    }
  };

  /* =====================
   * VALEURS DISPONIBLES
   * ===================== */
  
  const availableTypes = useMemo(() => {
    return PROJECT_TYPES.filter((t) => projects.some((p) => p.type === t));
  }, [projects]);
  
  const availableCategories = useMemo(() => {
      const allUsedCats = projects.flatMap(p => p.categories);
      const combined = new Set([...PROJECT_CATEGORIES, ...allUsedCats]);
      return Array.from(combined).sort() as ProjectCategory[];
  }, [projects]);

  /* =====================
   * FILTRAGE
   * ===================== */
  const filteredProjects = useMemo(() => {
    const activeTypes = Object.entries(filters.types)
      .filter(([, v]) => v)
      .map(([k]) => k as ProjectType);

    const activeCats = Object.entries(filters.categories)
      .filter(([, v]) => v)
      .map(([k]) => k as ProjectCategory);

    const searchTerm = (filters.search || "").toLowerCase().trim();

    return projects.filter((p) => {
      const typeOk = activeTypes.length === 0 || activeTypes.includes(p.type);
      const catOk = activeCats.length === 0 || activeCats.some((c) => p.categories.includes(c));
      const favOk = !filters.favoriteOnly || p.favorite === true;
      
      const searchOk = !searchTerm || 
        p.title.toLowerCase().includes(searchTerm) || 
        (p.description && p.description.toLowerCase().includes(searchTerm));

      return typeOk && catOk && favOk && searchOk;
    });
  }, [projects, filters]);

  /* =====================
   * UI
   * ===================== */
  return (
    <div className={isDarkMode 
      ? "min-h-screen bg-slate-950 text-white transition-colors duration-500" 
      : "min-h-screen bg-neutral-50 text-neutral-900 transition-colors duration-500"
    }>
      <div className="mx-auto max-w-[1600px] px-8 py-8">
        
        <header className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-center">
          
          <div className="flex items-center gap-6 shrink-0">
            <button
              onClick={handleCreateProject}
              disabled={isCreating}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
            >
              <span className="text-lg leading-none">{isCreating ? "..." : "+"}</span>
              <span>Nouveau Projet</span>
            </button>

            <div className="h-8 w-px bg-current opacity-10" />

            <div>
              <h1 className="text-3xl font-bold tracking-tight">ToutesMesApps</h1>
              <p className="text-sm opacity-50 font-medium">Dashboard Airtable</p>
            </div>
            
            <button
              onClick={() => setIsDarkMode((v) => !v)}
              className="rounded-full border border-current opacity-40 px-2 py-2 text-sm hover:opacity-100 transition-all active:rotate-12"
              title={isDarkMode ? "Passer en mode jour" : "Passer en mode nuit"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>

          <div className="flex-1 w-full overflow-x-auto">
            <Filters
              value={filters}
              onChange={setFilters}
              total={projects.length}
              shown={filteredProjects.length}
              isDarkMode={isDarkMode}
              availableTypes={availableTypes}
              availableCategories={availableCategories}
            />
          </div>
        </header>

        {error && <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <main className="w-full">
          {loading ? (
            <div className="flex h-64 items-center justify-center opacity-50 italic animate-pulse">Chargement de la collection...</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProjects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isDarkMode={isDarkMode}
                  onClick={() => setActiveIndex(i)}
                  onToggleFavorite={() => handleUpdateProject({ ...p, favorite: !p.favorite })}
                />
              ))}
            </div>
          )}
        </main>
      </div>

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