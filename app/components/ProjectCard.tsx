"use client";

import type { Project } from "@/lib/projects";

type Props = {
  project: Project;
  onClick: () => void;
  onToggleFavorite?: (e: React.MouseEvent) => void; // ✅ Ajouté pour gérer le clic étoile
  isDarkMode: boolean;
};

const truncate30 = (s?: string) => {
  const v = (s ?? "").toString();
  return v.length > 30 ? v.slice(0, 30) + "…" : v;
};

export default function ProjectCard({ project, onClick, onToggleFavorite, isDarkMode }: Props) {
  // Styles dynamiques
  const cardClasses = isDarkMode
    ? "group relative cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm transition hover:shadow-md hover:border-slate-700"
    : "group relative cursor-pointer rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-neutral-300";

  const titleClasses = isDarkMode ? "text-white" : "text-neutral-900";
  const descClasses = isDarkMode ? "text-slate-300" : "text-neutral-600";
  const tagBg = isDarkMode ? "bg-slate-800" : "bg-neutral-100";
  const tagText = isDarkMode ? "text-slate-200" : "text-neutral-700";
  const hintText = isDarkMode ? "text-slate-400" : "text-neutral-500";

  return (
    <article onClick={onClick} className={cardClasses}>
      
      {/* ⭐ BOUTON ÉTOILE (Apparaît au survol ou si déjà favori) */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Évite d'ouvrir le viewer
          if (onToggleFavorite) onToggleFavorite(e);
        }}
        className={`absolute right-4 top-4 text-xl transition-all duration-200 
          ${project.favorite 
            ? "opacity-100 scale-110" 
            : "opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100"
          }`}
      >
        {project.favorite ? "⭐" : "☆"}
      </button>

      <h3 className={`text-lg font-semibold pr-6 ${titleClasses}`}>
        {project.title}
      </h3>

      {project.description && (
        <p className={`mt-2 text-sm ${descClasses}`}>
          {truncate30(project.description)}
        </p>
      )}

      {project.tags && project.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 text-xs ${tagBg} ${tagText}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className={`mt-4 text-xs font-medium ${hintText}`}>
        {project.siteLink && "🌐 Ouvrir le site"}
        {!project.siteLink && project.githubLink && " Voir sur GitHub"}
        {!project.siteLink && !project.githubLink && "🔍 Voir le projet"}
      </div>
    </article>
  );
}