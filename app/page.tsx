"use client";

import { useEffect, useMemo, useState } from "react";
import Filters, { type FiltersState } from "./components/Filters";
import ProjectCard from "./components/ProjectCard";
import ProjectViewer from "./components/ProjectViewer";

type Project = {
  id: string;
  title: string;
  description: string;
  type: string; // Airtable peut renvoyer "Perso" / "Pro" / "perso" / "pro" etc.
  categories: string[]; // multi-select Airtable -> string[]
  githubLink?: string;
  siteLink?: string;
  favorite?: boolean;

  // (optionnel selon ton UI)
  images?: string[];
  tags?: string[];
  year?: number;
};

const normalizeKey = (v: unknown) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

const normalizeType = (t: unknown) => {
  const s = normalizeKey(t);
  // adapte si Airtable renvoie d'autres libellés
  if (s === "pro" || s === "professionnel" || s === "professionnelle") return "pro";
  if (s === "perso" || s === "personal" || s === "personnel" || s === "personnelle") return "perso";
  // si inconnu, on garde la valeur normalisée (ça évite de “casser”)
  return s || "perso";
};

const normalizeCategory = (c: unknown) => {
  // Ici on normalise juste en lower+trim.
  // (Si tu veux supprimer les accents, on peut le faire aussi.)
  return normalizeKey(c);
};

export default function Page() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDarkMode, setIsDarkMode] = useState(false);

  const [filters, setFilters] = useState<FiltersState>({
    types: {},
    categories: {},
    favoriteOnly: false,
  });

  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // --- FETCH PROJECTS ---
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) throw new Error(`API error: ${res.status}`);

        const data = (await res.json()) as Project[];

        if (cancelled) return;

        // IMPORTANT : on normalise au moment de charger
        const normalized = (Array.isArray(data) ? data : []).map((p) => ({
          ...p,
          type: normalizeType(p.type),
          categories: Array.isArray(p.categories)
            ? p.categories.map(normalizeCategory).filter(Boolean)
            : [],
        }));

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

  // --- AVAILABLE FILTER VALUES (depuis Airtable) ---
  const availableTypes = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      const t = normalizeType(p.type);
      if (t) set.add(t);
    }
    // ordre stable : perso puis pro, puis le reste
    const all = Array.from(set);
    const order = ["perso", "pro"];
    return [
      ...order.filter((x) => all.includes(x)),
      ...all.filter((x) => !order.includes(x)).sort(),
    ];
  }, [projects]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      for (const c of Array.isArray(p.categories) ? p.categories : []) {
        const cc = normalizeCategory(c);
        if (cc) set.add(cc);
      }
    }
    return Array.from(set).sort();
  }, [projects]);

  // --- FILTERING ---
  const filteredProjects = useMemo(() => {
    const activeTypes = Object.entries(filters.types)
      .filter(([, on]) => on)
      .map(([k]) => normalizeType(k));

    const activeCats = Object.entries(filters.categories)
      .filter(([, on]) => on)
      .map(([k]) => normalizeCategory(k));

    return projects.filter((p) => {
      const t = normalizeType(p.type);
      const cats = Array.isArray(p.categories) ? p.categories.map(normalizeCategory) : [];

      // ✅ Type
      const typeOk = activeTypes.length === 0 || activeTypes.includes(t);

      // ✅ Categories
      const catOk =
        activeCats.length === 0 || activeCats.some((c) => cats.includes(c));

      // ✅ Favori
      const favOk = !filters.favoriteOnly || p.favorite === true;

      return typeOk && catOk && favOk;
    });
  }, [projects, filters]);

  // --- UI ---
  return (
    <div className={isDarkMode ? "min-h-screen bg-slate-950 text-white" : "min-h-screen bg-neutral-50 text-neutral-900"}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">ToutesMesApps</h1>
            <p className={isDarkMode ? "text-slate-400" : "text-neutral-600"}>
              Dashboard de tes projets (Airtable)
            </p>
          </div>

          <button
            onClick={() => setIsDarkMode((v) => !v)}
            className={
              isDarkMode
                ? "rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm hover:opacity-90"
                : "rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm hover:opacity-90"
            }
          >
            {isDarkMode ? "☀️ Clair" : "🌙 Sombre"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* LEFT: Filters */}
          <Filters
            value={filters}
            onChange={setFilters}
            total={projects.length}
            shown={filteredProjects.length}
            isDarkMode={isDarkMode}
            availableTypes={availableTypes}
            availableCategories={availableCategories}
          />

          {/* RIGHT: Projects */}
          <div className="space-y-4">
            {loading ? (
              <div className={isDarkMode ? "rounded-2xl border border-slate-800 bg-slate-900 p-5" : "rounded-2xl border border-neutral-200 bg-white p-5"}>
                Chargement…
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className={isDarkMode ? "rounded-2xl border border-slate-800 bg-slate-900 p-5" : "rounded-2xl border border-neutral-200 bg-white p-5"}>
                Aucun projet ne correspond aux filtres.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredProjects.map((p) => (
                  <div key={p.id} onClick={() => setActiveProject(p)} className="cursor-pointer">
                    <ProjectCard project={p} isDarkMode={isDarkMode} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Viewer fullscreen (si ton composant l’utilise comme ça) */}
      {activeProject && (
        <ProjectViewer
          project={activeProject}
          onClose={() => setActiveProject(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
