// app/components/ProjectCard.tsx
import type { Project } from "@/lib/projects";

/**
 * Libellé lisible pour le statut
 */
function statusLabel(status?: Project["status"]) {
  if (status === "idea") return "Idée";
  if (status === "wip") return "En cours";
  if (status === "done") return "Terminé";
  return "";
}

export default function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick?: () => void;
}) {
  return (
    <article
      onClick={onClick}
      className="
        cursor-pointer
        rounded-2xl
        border
        bg-white
        p-4
        shadow-sm
        transition
        hover:-translate-y-1
        hover:shadow-md
        active:scale-[0.98]
      "
    >
      {/* Conteneur carré */}
      <div className="aspect-square w-full rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 p-4">
        <div className="flex h-full flex-col justify-between">
          {/* Haut */}
          <div>
            <h3 className="text-base font-semibold leading-tight">
              {project.title}
            </h3>

            {project.description && (
              <p className="mt-2 text-sm text-neutral-600 line-clamp-3">
                {project.description}
              </p>
            )}
          </div>

          {/* Bas : tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-medium text-white">
              {project.type === "pro" ? "Pro" : "Perso"}
            </span>

            {project.status && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-800">
                {statusLabel(project.status)}
              </span>
            )}

            {project.categories.map((c) => (
              <span
                key={c}
                className="rounded-full border px-2.5 py-1 text-xs font-medium text-neutral-700"
              >
                {c === "formation" ? "Formation" : "Appartement"}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
