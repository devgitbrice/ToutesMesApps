import type { Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  isDarkMode: boolean; // <-- NOUVELLE PROP
}

export default function ProjectCard({ project, onClick, isDarkMode }: ProjectCardProps) {
  
  // Classes conditionnelles pour la carte
  const cardClasses = isDarkMode
    ? "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-all hover:border-slate-700 hover:shadow-md cursor-pointer" // Mode nuit
    : "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:border-neutral-300 hover:shadow-md cursor-pointer"; // Mode jour

  const titleClasses = isDarkMode
    ? "text-white group-hover:text-blue-400"
    : "text-neutral-900 group-hover:text-blue-600";
    
  const descriptionClasses = isDarkMode ? "text-slate-300" : "text-neutral-600";
  
  // Style des badges de catégorie
  const badgeClasses = isDarkMode
    ? "bg-slate-800 text-slate-200 border border-slate-700"
    : "bg-neutral-100 text-neutral-600";

  // Style du badge Type (Pro/Perso)
  const typeBadgeBase = "ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase";
  const typeBadgeClasses = isDarkMode
      ? project.type === 'pro' ? "bg-blue-950 text-blue-200 border border-blue-800" : "bg-purple-950 text-purple-200 border border-purple-800"
      : project.type === 'pro' ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800";


  return (
    <div className={cardClasses} onClick={onClick}>
      <div>
        <div className="flex items-start justify-between mb-3">
          <h3 className={`text-lg font-semibold transition-colors ${titleClasses}`}>
            {project.title}
          </h3>
           {/* Badge de type (Pro/Perso) */}
          <span className={`${typeBadgeBase} ${typeBadgeClasses}`}>
            {project.type}
          </span>
        </div>
        <p className={`mb-4 line-clamp-3 text-sm ${descriptionClasses}`}>
          {project.description}
        </p>
      </div>

      {/* Footer avec les catégories */}
      <div className="mt-4 flex flex-wrap gap-2">
        {project.categories.map((cat) => (
          <span
            key={cat}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${badgeClasses}`}
          >
            {cat}
          </span>
        ))}
      </div>
    </div>
  );
}