import type { Project } from "@/lib/projects";

type Props = {
  project: Project;
  onClick: () => void;
  isDarkMode?: boolean; // ✅ AJOUT
};

// ✅ Fonction utilitaire : limite l’affichage à 30 caractères
const truncate30 = (s?: string) => {
  const v = (s ?? "").toString();
  return v.length > 30 ? v.slice(0, 30) + "…" : v;
};

export default function ProjectCard({
  project,
  onClick,
  isDarkMode = false,
}: Props) {
  const containerClasses = isDarkMode
    ? "cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-5 transition hover:bg-slate-800"
    : "cursor-pointer rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md";

  const titleClasses = isDarkMode ? "text-white" : "text-neutral-900";
  const textClasses = isDarkMode ? "text-slate-300" : "text-neutral-600";
  const tagClasses = isDarkMode
    ? "rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300 border border-slate-700"
    : "rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700";

  const actionClasses = isDarkMode ? "text-slate-400" : "text-neutral-500";

  return (
    <article onClick={onClick} className={containerClasses}>
      {/* Titre */}
      <h3 className={`text-lg font-semibold ${titleClasses}`}>
        {project.title}
      </h3>

      {/* Description (tronquée à 30 caractères) */}
      {project.description && (
        <p className={`mt-2 text-sm ${textClasses}`}>
          {truncate30(project.description)}
        </p>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className={tagClasses}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Indicateur d’action */}
      <div className={`mt-4 text-xs font-medium ${actionClasses}`}>
        {project.websiteUrl && "🌐 Ouvrir le site"}
        {!project.websiteUrl && project.githubUrl && " Voir sur GitHub"}
        {!project.websiteUrl && !project.githubUrl && "🔍 Voir le projet"}
      </div>
    </article>
  );
}
