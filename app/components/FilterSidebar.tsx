"use client";

export type SidebarFiltersState = {
  favoriteOnly: boolean;
  categories: Record<string, boolean>;
};

interface FilterSidebarProps {
  value: SidebarFiltersState;
  onChange: (value: SidebarFiltersState) => void;
  availableCategories: string[];
  isDarkMode: boolean;
  total: number;
  shown: number;
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

export default function FilterSidebar({
  value,
  onChange,
  availableCategories,
  isDarkMode,
  total,
  shown,
}: FilterSidebarProps) {
  const categories = dedupeNormalized(availableCategories);

  const toggleFavoriteOnly = () => {
    onChange({ ...value, favoriteOnly: !value.favoriteOnly });
  };

  const toggleCategory = (cat: string) => {
    const key = norm(cat);
    onChange({
      ...value,
      categories: { ...value.categories, [key]: !value.categories[key] },
    });
  };

  const clearAllFilters = () => {
    onChange({
      favoriteOnly: false,
      categories: {},
    });
  };

  const hasActiveFilters =
    value.favoriteOnly || Object.values(value.categories).some(Boolean);

  const sidebarBg = isDarkMode ? "bg-slate-900/50" : "bg-white/80";
  const borderColor = isDarkMode ? "border-slate-800" : "border-neutral-200";
  const textColor = isDarkMode ? "text-white" : "text-neutral-900";
  const mutedText = isDarkMode ? "text-slate-400" : "text-neutral-500";
  const sectionTitle = isDarkMode ? "text-slate-300" : "text-neutral-700";

  const getBadgeClass = (active: boolean) => {
    if (active) return "bg-blue-600 text-white border-blue-500 shadow-sm";
    return isDarkMode
      ? "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
      : "bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200";
  };

  return (
    <aside
      className={`w-56 shrink-0 rounded-2xl border p-4 ${sidebarBg} ${borderColor} ${textColor}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider opacity-60">
          Filtres
        </h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className={`text-[10px] font-medium ${mutedText} hover:text-red-500 transition-colors`}
          >
            Effacer
          </button>
        )}
      </div>

      {/* Compteur */}
      <div
        className={`mb-5 text-center py-2 rounded-lg ${
          isDarkMode ? "bg-slate-800/50" : "bg-neutral-100"
        }`}
      >
        <span className="text-2xl font-bold">{shown}</span>
        <span className={`text-sm ${mutedText}`}> / {total}</span>
        <p className={`text-[10px] uppercase tracking-wider ${mutedText}`}>
          projets
        </p>
      </div>

      {/* Section Favoris */}
      <div className="mb-5">
        <h3
          className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${sectionTitle}`}
        >
          Favoris
        </h3>
        <button
          onClick={toggleFavoriteOnly}
          className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all ${getBadgeClass(
            value.favoriteOnly
          )}`}
        >
          <span className="text-lg">{value.favoriteOnly ? "⭐" : "☆"}</span>
          <span>Favoris uniquement</span>
        </button>
      </div>

      {/* Section Catégories */}
      <div>
        <h3
          className={`text-[11px] font-bold uppercase tracking-wider mb-3 ${sectionTitle}`}
        >
          Catégories
        </h3>
        <div className="flex flex-col gap-2">
          {categories.length === 0 ? (
            <p className={`text-xs italic ${mutedText}`}>Aucune catégorie</p>
          ) : (
            categories.map((cat) => {
              const key = norm(cat);
              const active = !!value.categories[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleCategory(cat)}
                  className={`w-full text-left rounded-xl border px-3 py-2 text-sm font-medium transition-all capitalize ${getBadgeClass(
                    active
                  )}`}
                >
                  {cat}
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
}
