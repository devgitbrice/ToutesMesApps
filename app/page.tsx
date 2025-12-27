"use client";

import { useEffect, useMemo, useState } from "react";

import Filters, { type FiltersState } from "./components/Filters";
import ProjectCard from "./components/ProjectCard";
import ProjectViewer from "./components/ProjectViewer";

// ✅ TYPES + HELPERS OFFICIELS
import type { Project, ProjectType, ProjectCategory } from "@/lib/projects";
import {
  toProjectType,
  toProjectCategories,
  PROJECT_TYPES,
  PROJECT_CATEGORIES,
} from "@/lib/projects";

export default function Page() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(false);

  const [filters, setFilters] = useState<FiltersState>({
    types: {},
    categories: {},
    favoriteOnly: false,
  });

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

        // ✅ NORMALISATION STRICTE
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
   * VALEURS DISPONIBLES
   * ===================== */
  const availableTypes = useMemo<ProjectType[]>(() => {
    return PROJECT_TYPES.filter((t) => projects.some((p) => p.type === t));
  }, [projects]);

  const availableCategories = useMemo<ProjectCategory[]>(() => {
    return PROJECT_CATEGORIES.filter((c) =>
      projects.some((p) => p.categories.includes(c))
    );
  }, [projects]);

  /* =====================
   * ACTIONS
   * ===================== */
  const toggleProjectFavorite = async (project: Project) => {
    const newStatus = !project.favorite;
    console.log(`[Front] Tentative de favori pour ${project.title} -> ${newStatus}`);

    // 1. Mise à jour locale immédiate (Optimistic UI)
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, favorite: newStatus } : p))
    );

    // 2. Sauvegarde réelle dans Airtable via PUT
    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: project.id, 
          favorite: newStatus 
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur API lors de la mise à jour");
      }
      
      console.log("[Front] Airtable mis à jour avec succès");
    } catch (err) {
      console.error("[Front] Erreur sauvegarde Airtable:", err);
      // Rollback en cas d'échec pour synchroniser l'UI avec la réalité
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? project : p))
      );
    }
  };

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

    return projects.filter((p) => {
      const typeOk = activeTypes.length === 0 || activeTypes.includes(p.type);

      const catOk =
        activeCats.length === 0 ||
        activeCats.some((c) => p.categories.includes(c));

      const favOk = !filters.favoriteOnly || p.favorite === true;

      return typeOk && catOk && favOk;
    });
  }, [projects, filters]);

  /* =====================
   * UI
   * ===================== */
  return (
    <div
      className={
        isDarkMode
          ? "min-h-screen bg-slate-950 text-white transition-colors duration-300"
          : "min-h-screen bg-neutral-50 text-neutral-900 transition-colors duration-300"
      }
    >
      <div className="mx-auto max-w-[1600px] px-8 py-8">
        
        {/* HEADER & FILTRES : ALIGNÉS HORIZONTALEMENT */}
        <header className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-6 shrink-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">ToutesMesApps</h1>
              <p className="text-sm opacity-50">Dashboard connecté à Airtable</p>
            </div>
            
            <button
              onClick={() => setIsDarkMode((v) => !v)}
              className="rounded-full border border-current opacity-60 px-3 py-3 text-lg hover:opacity-100 transition-all active:scale-90"
              title="Changer le thème"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>

          {/* Barre de filtres horizontale */}
          <div className="flex-1 w-full overflow-x-auto pb-2 lg:pb-0">
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

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* GRILLE DE PROJETS (4 COLONNES SUR LARGE SCREEN) */}
        <main className="w-full">
          {loading ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 opacity-50">
              <span className="animate-pulse font-medium">Chargement de la collection...</span>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 opacity-50">
              <p>Aucun projet ne correspond à vos critères.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredProjects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isDarkMode={isDarkMode}
                  onClick={() => setActiveIndex(i)}
                  onToggleFavorite={() => toggleProjectFavorite(p)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* VIEWER MODAL */}
      {activeIndex !== null && (
        <ProjectViewer
          projects={filteredProjects}
          index={activeIndex}
          onClose={() => setActiveIndex(null)}
          onUpdate={(updated) => {
            setProjects((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
          }}
          availableTypes={availableTypes}
          availableCategories={availableCategories}
        />
      )}
    </div>
  );
}