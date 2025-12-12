"use client";

import type { ProjectCategory, ProjectType } from "@/lib/projects";

type FiltersState = {
  types: Record<ProjectType, boolean>;
  categories: Record<ProjectCategory, boolean>;
};

export default function Filters({
  value,
  onChange,
  total,
  shown,
}: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
  total: number;
  shown: number;
}) {
  function toggleType(type: ProjectType) {
    onChange({
      ...value,
      types: { ...value.types, [type]: !value.types[type] },
    });
  }

  function toggleCategory(category: ProjectCategory) {
    onChange({
      ...value,
      categories: {
        ...value.categories,
        [category]: !value.categories[category],
      },
    });
  }

  function reset() {
    onChange({
      types: { pro: false, perso: false },
      categories: { formation: false, appartement: false },
    });
  }

  return (
    <aside className="sticky top-6 h-fit rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Filtres</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {shown} / {total} projets
          </p>
        </div>

        <button
          onClick={reset}
          className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
          type="button"
        >
          Reset
        </button>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-neutral-800">Type</p>

        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.types.pro}
            onChange={() => toggleType("pro")}
            className="h-4 w-4"
          />
          Pro
        </label>

        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.types.perso}
            onChange={() => toggleType("perso")}
            className="h-4 w-4"
          />
          Perso
        </label>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold text-neutral-800">Projets</p>

        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.categories.formation}
            onChange={() => toggleCategory("formation")}
            className="h-4 w-4"
          />
          Formation
        </label>

        <label className="mt-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.categories.appartement}
            onChange={() => toggleCategory("appartement")}
            className="h-4 w-4"
          />
          Appartement
        </label>
      </div>
    </aside>
  );
}
