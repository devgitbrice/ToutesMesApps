import type { ProjectCategory, ProjectType } from "@/lib/projects";

type FiltersState = {
  types: Record<ProjectType, boolean>;
  categories: Record<ProjectCategory, boolean>;
};

interface FiltersProps {
  value: FiltersState;
  onChange: (value: FiltersState) => void;
  total: number;
  shown: number;
  isDarkMode: boolean; // <-- NOUVELLE PROP
}

export default function Filters({
  value,
  onChange,
  total,
  shown,
  isDarkMode,
}: FiltersProps) {
  const toggleType = (type: ProjectType) => {
    onChange({
      ...value,
      types: { ...value.types, [type]: !value.types[type] },
    });
  };

  const toggleCategory = (cat: ProjectCategory) => {
    onChange({
      ...value,
      categories: { ...value.categories, [cat]: !value.categories[cat] },
    });
  };

  // Définition des classes CSS conditionnelles
  const containerClasses = isDarkMode
    ? "rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-colors" // Mode nuit : fond foncé
    : "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-colors"; // Mode jour : fond blanc

  const titleClasses = isDarkMode ? "text-white" : "text-neutral-900";
  const textClasses = isDarkMode ? "text-slate-300" : "text-neutral-700";
  const subTitleClasses = isDarkMode ? "text-slate-500" : "text-neutral-500";

  return (
    <div className={containerClasses}>
      <h2 className={`text-lg font-semibold ${titleClasses}`}>Filtres</h2>
      <div className={`mb-4 text-sm ${isDarkMode ? "text-slate-400" : "text-neutral-600"}`}>
        {shown} / {total} projets
      </div>

      <div className="space-y-6">
        {/* Section Type */}
        <div>
          <h3 className={`mb-3 text-sm font-medium uppercase tracking-wider ${subTitleClasses}`}>
            Type
          </h3>
          <div className="space-y-2">
            <label className={`flex items-center gap-2 text-sm ${textClasses} cursor-pointer hover:opacity-80`}>
              <input
                type="checkbox"
                checked={value.types.pro}
                onChange={() => toggleType("pro")}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              Pro
            </label>
            <label className={`flex items-center gap-2 text-sm ${textClasses} cursor-pointer hover:opacity-80`}>
              <input
                type="checkbox"
                checked={value.types.perso}
                onChange={() => toggleType("perso")}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              Perso
            </label>
          </div>
        </div>

        {/* Section Catégories */}
        <div>
          <h3 className={`mb-3 text-sm font-medium uppercase tracking-wider ${subTitleClasses}`}>
            Projets
          </h3>
          <div className="space-y-2">
            <label className={`flex items-center gap-2 text-sm ${textClasses} cursor-pointer hover:opacity-80`}>
              <input
                type="checkbox"
                checked={value.categories.formation}
                onChange={() => toggleCategory("formation")}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              Formation
            </label>
            <label className={`flex items-center gap-2 text-sm ${textClasses} cursor-pointer hover:opacity-80`}>
              <input
                type="checkbox"
                checked={value.categories.appartement}
                onChange={() => toggleCategory("appartement")}
                className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              Appartement
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}