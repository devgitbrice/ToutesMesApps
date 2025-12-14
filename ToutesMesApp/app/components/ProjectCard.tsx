import type { Project } from "@/lib/projects";

type Props = {
  project: Project;
  onClick: () => void;
};

// ✅ Fonction utilitaire : limite l’affichage à 30 caractères
const truncate30 = (s?: string) => {
  const v = (s ?? "").toString();
  return v.length > 30 ? v.slice(0, 30) + "…" : v;
};

export default function ProjectCard({ project, onClick }: Props) {
  return (
    <article
      onClick={onClick}
      className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      {/* Titre */}
      <h3 className="text-lg font-semibold text-neutral-900">
        {project.title}
      </h3>

      {/* Description (tronquée à 30 caractères) */}
      {project.description && (
        <p className="mt-2 text-sm text-neutral-600">
          {truncate30(project.description)}
        </p>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Indicateur d’action */}
      <div className="mt-4 text-xs font-medium text-neutral-500">
        {project.websiteUrl && "🌐 Ouvrir le site"}
        {!project.websiteUrl && project.githubUrl && " Voir sur GitHub"}
        {!project.websiteUrl && !project.githubUrl && "🔍 Voir le projet"}
      </div>
    </article>
  );
}
