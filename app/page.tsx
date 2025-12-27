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
   * VALEURS DISPONIBLESS
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
          ? "min-h-screen bg-slate-950 text-white"
          : "min-h-screen bg-neutral-50 text-neutral-900"
      }
    >
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">ToutesMesApps</h1>
            <p className="text-sm opacity-70">Dashboard connecté à Airtable</p>
          </div>

          <button
            onClick={() => setIsDarkMode((v) => !v)}
            className="rounded-xl border px-3 py-2 text-sm hover:opacity-80"
          >
            {isDarkMode ? "☀️ Clair" : "🌙 Sombre"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* FILTRES */}
          <Filters
            value={filters}
            onChange={setFilters}
            total={projects.length}
            shown={filteredProjects.length}
            isDarkMode={isDarkMode}
            availableTypes={availableTypes}
            availableCategories={availableCategories}
          />

          {/* LISTE */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {loading ? (
              <div className="rounded-xl border p-4">Chargement…</div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-xl border p-4">
                Aucun projet ne correspond aux filtres.
              </div>
            ) : (
              filteredProjects.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  isDarkMode={isDarkMode}
                  onClick={() => setActiveIndex(i)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* VIEWER */}
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
