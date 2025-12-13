type FiltersState = {
  types: Record<string, boolean>;
  categories: Record<string, boolean>;
};

interface FiltersProps {
  value: FiltersState;
  onChange: (value: FiltersState) => void;
  total: number;
  shown: number;
  isDarkMode: boolean;
  availableTypes: string[];        // <-- Reçoit la liste d'Airtable
  availableCategories: string[];   // <-- Reçoit la liste d'Airtable
}

export default function Filters({
  value,
  onChange,
  total,
  shown,
  isDarkMode,
  availableTypes,
  availableCategories,
}: FiltersProps) {
  
  // Fonction générique pour cocher/décocher
  const toggleType = (type: string) => {
    onChange({
      ...value,
      types: { ...value.types, [type]: !value.types[type] },
    });
  };

  const toggleCategory = (cat: string) => {
    onChange({
      ...value,
      categories: { ...value.categories, [cat]: !value.categories[cat] },
    });
  };

  const containerClasses = isDarkMode
    ? "rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-colors h-fit"
    : "rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-colors h-fit";

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
        {/* Section TYPES Dynamique */}
        <div>
          <h3 className={`mb-3 text-sm font-medium uppercase tracking-wider ${subTitleClasses}`}>
            Type
          </h3>
          <div className="space-y-2">
            {availableTypes.length === 0 && <p className="text-xs italic opacity-50">Aucun type</p>}
            
            {availableTypes.map((type) => (
              <label key={type} className={`flex items-center gap-2 text-sm ${textClasses} cursor-pointer hover:opacity-80`}>
                <input
                  type="checkbox"
                  checked={!!value.types[type]} // "!!" convertit undefined en false
                  onChange={() => toggleType(type)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                {/* On met la première lettre en majuscule pour faire joli */}
                <span className="capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section CATÉGORIES Dynamique */}
        <div>
          <h3 className={`mb-3 text-sm font-medium uppercase tracking-wider ${subTitleClasses}`}>
            Catégories
          </h3>
          <div className="space-y-2">
            {availableCategories.length === 0 && <p className="text-xs italic opacity-50">Aucune catégorie</p>}

            {availableCategories.map((cat) => (
              <label key={cat} className={`flex items-center gap-2 text-sm ${textClasses} cursor-pointer hover:opacity-80`}>
                <input
                  type="checkbox"
                  checked={!!value.categories[cat]}
                  onChange={() => toggleCategory(cat)}
                  className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="capitalize">{cat}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}