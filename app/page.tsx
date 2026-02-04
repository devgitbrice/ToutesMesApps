"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link"; // ✅ 1. Import nécessaire pour le lien

import Filters, { type FiltersState } from "./components/Filters";
import FilterSidebar, { type SidebarFiltersState } from "./components/FilterSidebar";
import ProjectCard from "./components/ProjectCard";
import ProjectListTable from "./components/ProjectListTable";
import ProjectViewer from "./components/ProjectViewer";

import { useIosScrollLock } from "@/hooks/useIosScrollLock";

import type { Project, ProjectCategory, ProjectType } from "@/lib/projects";
import {
  toProjectType,
  toProjectCategories,
  PROJECT_TYPES,
  PROJECT_CATEGORIES,
} from "@/lib/projects";

const DEFAULT_FILTERS: FiltersState = {
  types: {},
  categories: {},
  favoriteOnly: false,
  search: "",
};

const DEFAULT_SIDEBAR_FILTERS: SidebarFiltersState = {
  favoriteOnly: false,
  categories: {},
};

export default function Page() {
  useIosScrollLock();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFiltersState>(DEFAULT_SIDEBAR_FILTERS);

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
      alert("Erreur lors de la création du projet dans Supabase");
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
        console.warn("⚠️ Supabase refuse la mise à jour :", errorData);
      }
    } catch (err) {
      console.error("❌ Erreur réseau :", err);
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setActiveIndex(null);
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

    // Combiner les catégories du header et de la sidebar
    const headerCats = Object.entries(filters.categories)
      .filter(([, v]) => v)
      .map(([k]) => k as ProjectCategory);
    const sidebarCats = Object.entries(sidebarFilters.categories)
      .filter(([, v]) => v)
      .map(([k]) => k as ProjectCategory);
    const activeCats = [...new Set([...headerCats, ...sidebarCats])];

    const searchTerm = (filters.search || "").toLowerCase().trim();

    // Combiner favoriteOnly du header et de la sidebar
    const favoriteOnly = filters.favoriteOnly || sidebarFilters.favoriteOnly;

    return projects.filter((p) => {
      const typeOk = activeTypes.length === 0 || activeTypes.includes(p.type);
      const catOk = activeCats.length === 0 || activeCats.some((c) => p.categories.includes(c.toLowerCase() as ProjectCategory));
      const favOk = !favoriteOnly || p.favorite === true;

      const searchOk = !searchTerm ||
        p.title.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm));

      return typeOk && catOk && favOk && searchOk;
    });
  }, [projects, filters, sidebarFilters]);

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
          
          <div className="flex items-center gap-4 shrink-0">
            {/* BOUTON CRÉER */}
            <button
              onClick={handleCreateProject}
              disabled={isCreating}
              className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50"
            >
              <span className="text-lg leading-none">{isCreating ? "..." : "+"}</span>
              <span>Nouveau Projet</span>
            </button>

            {/* ✅ 2. BOUTON FULLTODO (Ajouté) */}
            <Link
              href="/fulltodo"
              className="flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-orange-500 active:scale-95"
            >
              <span>✅</span>
              <span>FullTodo</span>
            </Link>

            <div className="h-8 w-px bg-current opacity-10 mx-2" />

            <div>
              <h1 className="text-3xl font-bold tracking-tight">ToutesMesApps</h1>
              <p className="text-sm opacity-50 font-medium">Dashboard Supabase</p>
            </div>
            
            <button
              onClick={() => setIsDarkMode((v) => !v)}
              className="rounded-full border border-current opacity-40 px-2 py-2 text-sm hover:opacity-100 transition-all active:rotate-12"
              title={isDarkMode ? "Passer en mode jour" : "Passer en mode nuit"}
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>

            <button
              onClick={() => setViewMode((v) => (v === "grid" ? "list" : "grid"))}
              className={`rounded-full border border-current px-3 py-2 text-sm transition-all ${
                viewMode === "list" ? "opacity-100" : "opacity-40 hover:opacity-100"
              }`}
              title={viewMode === "grid" ? "Vue liste" : "Vue grille"}
            >
              {viewMode === "grid" ? "☰" : "▦"}
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

        {/* Layout avec sidebar à gauche et grille à droite */}
        <div className="flex gap-6">
          {/* Sidebar de filtres */}
          <FilterSidebar
            value={sidebarFilters}
            onChange={setSidebarFilters}
            availableCategories={availableCategories}
            isDarkMode={isDarkMode}
            total={projects.length}
            shown={filteredProjects.length}
          />

          {/* Contenu principal */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex h-64 items-center justify-center opacity-50 italic animate-pulse">Chargement de la collection...</div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProjects.map((p, i) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    isDarkMode={isDarkMode}
                    onClick={() => setActiveIndex(i)}
                    onToggleFavorite={() => handleUpdateProject({ ...p, favorite: !p.favorite })}
                    onEdit={() => setActiveIndex(i)}
                  />
                ))}
              </div>
            ) : (
              <ProjectListTable
                projects={filteredProjects}
                isDarkMode={isDarkMode}
                onEdit={(i) => setActiveIndex(i)}
                onToggleFavorite={(p) => handleUpdateProject({ ...p, favorite: !p.favorite })}
              />
            )}
          </main>
        </div>
      </div>

      {activeIndex !== null && (
        <ProjectViewer
          projects={filteredProjects}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onUpdate={handleUpdateProject}
          onDelete={handleDeleteProject}
          availableTypes={availableTypes}
          availableCategories={availableCategories}
        />
      )}
    </div>
  );
}