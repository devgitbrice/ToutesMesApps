"use client";

export type FiltersState = {
  types: Record<string, boolean>;
  categories: Record<string, boolean>;
  favoriteOnly: boolean;
};

interface FiltersProps {
  value: FiltersState;
  onChange: (value: FiltersState) => void;
  total: number;
  shown: number;
  isDarkMode: boolean;
  availableTypes: string[];
  availableCategories: string[];
}

const norm = (s: string) => s.trim().toLowerCase();
const dedupeNormalized = (arr: string[]) => {
  const map = new Map<string, string>();
  for (const raw of arr) {
    const v = (raw ?? "").toString().trim();
    if (!v) continue;
    const k = norm(v);
    if (!map.has(k)) map.set(k, v);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, original]) => original);
};

export default function Filters({
  value,
  onChange,
  total,
  shown,
  isDarkMode,
  availableTypes,
  availableCategories,
}: FiltersProps) {
  const types = dedupeNormalized(availableTypes);
  const categories = dedupeNormalized(availableCategories);

  const toggleType = (type: string) => {
    const key = norm(type);
    onChange({
      ...value,
      types: { ...value.types, [key]: !value.types[key] },
    });
  };

  const toggleCategory = (cat: string) => {
    const key = norm(cat);
    onChange({
      ...value,
      categories: { ...value.categories, [key]: !value.categories[key] },
    });
  };

  const toggleFavoriteOnly = () => {
    onChange({ ...value, favoriteOnly: !value.favoriteOnly });
  };

  // Styles de badges pour un look "App"
  const getBadgeClass = (active: boolean) => {
    if (active) {
      return "bg-blue-600 text-white border-blue-500 shadow-sm";
    }
    return isDarkMode 
      ? "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700" 
      : "bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200";
  };

  return (
    <div className={`flex flex-wrap items-center gap-x-8 gap-y-4 ${isDarkMode ? "text-white" : "text-neutral-900"}`}>
      
      {/* 🧩 TYPES & FAVORIS (Groupe 1) */}
      <div className="flex items-center gap-3">
        {/* ⭐ FAVORIS */}
        <button
          onClick={toggleFavoriteOnly}
          className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${getBadgeClass(value.favoriteOnly)}`}
        >
          <span>{value.favoriteOnly ? "⭐" : "☆"}</span>
          <span>Favoris</span>
        </button>

        <div className="h-6 w-px bg-current opacity-10 mx-1" />

        {/* TYPES */}
        <div className="flex gap-2">
          {types.map((type) => {
            const key = norm(type);
            const active = !!value.types[key];
            return (
              <button
                key={key}
                onClick={() => toggleType(type)}
                className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all capitalize ${getBadgeClass(active)}`}
              >
                {type}
              </button>
            );
          })}
        </div>
      </div>

      {/* 🏷️ CATÉGORIES (Groupe 2) */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] font-bold uppercase tracking-widest opacity-40 mr-1`}>Catégories</span>
        {categories.map((cat) => {
          const key = norm(cat);
          const active = !!value.categories[key];
          return (
            <button
              key={key}
              onClick={() => toggleCategory(cat)}
              className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all capitalize ${getBadgeClass(active)}`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* COMPTEUR (À droite) */}
      <div className="ml-auto text-[11px] font-medium opacity-50">
        {shown} / {total} apps
      </div>
    </div>
  );
}