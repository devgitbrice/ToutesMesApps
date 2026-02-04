"use client";

import type { Project } from "@/lib/projects";

type Props = {
  projects: Project[];
  isDarkMode: boolean;
  onEdit: (index: number) => void;
  onToggleFavorite: (project: Project) => void;
};

/** Cellule lien : fond rouge si vide, sinon cliquable */
function LinkCell({
  url,
  label,
  isDarkMode,
}: {
  url?: string;
  label: string;
  isDarkMode: boolean;
}) {
  const empty = !url || url.trim() === "";

  if (empty) {
    return (
      <td className="px-3 py-2 text-center">
        <span className="inline-block rounded px-2 py-0.5 text-xs font-medium bg-red-600/80 text-white">
          —
        </span>
      </td>
    );
  }

  return (
    <td className="px-3 py-2 text-center">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block rounded px-2 py-0.5 text-xs font-medium transition-colors ${
          isDarkMode
            ? "bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50"
            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
        }`}
      >
        {label}
      </a>
    </td>
  );
}

export default function ProjectListTable({
  projects,
  isDarkMode,
  onEdit,
  onToggleFavorite,
}: Props) {
  const thClass = isDarkMode
    ? "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700"
    : "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-200";

  const thCenterClass = thClass.replace("text-left", "text-center");

  const rowClass = (i: number) =>
    isDarkMode
      ? `border-b border-slate-800 ${i % 2 === 0 ? "bg-slate-900/50" : "bg-slate-900"} hover:bg-slate-800 transition-colors`
      : `border-b border-neutral-100 ${i % 2 === 0 ? "bg-white" : "bg-neutral-50"} hover:bg-neutral-100 transition-colors`;

  const titleClass = isDarkMode ? "text-white" : "text-neutral-900";
  const catBg = isDarkMode
    ? "bg-slate-700 text-slate-200"
    : "bg-neutral-200 text-neutral-700";
  const emptyCatClass = "bg-red-600/80 text-white";

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/50">
      <table className="w-full text-sm">
        <thead>
          <tr className={isDarkMode ? "bg-slate-800/80" : "bg-neutral-100"}>
            <th className={thClass}>Nom du projet</th>
            <th className={thCenterClass}>Web</th>
            <th className={thCenterClass}>Github</th>
            <th className={thCenterClass}>Vercel</th>
            <th className={thCenterClass}>Favori</th>
            <th className={thClass}>Catégories</th>
            <th className={thCenterClass}>Action</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p, i) => (
            <tr key={p.id} className={rowClass(i)}>
              {/* Nom du projet */}
              <td className={`px-3 py-2 font-medium ${titleClass}`}>
                {p.title}
              </td>

              {/* Lien Web */}
              <LinkCell
                url={p.siteLink}
                label="WEB"
                isDarkMode={isDarkMode}
              />

              {/* Lien Github */}
              <LinkCell
                url={p.githubLink}
                label="GITHUB"
                isDarkMode={isDarkMode}
              />

              {/* Lien Vercel */}
              <LinkCell
                url={p.vercelLink}
                label="VERCEL"
                isDarkMode={isDarkMode}
              />

              {/* Favori */}
              <td className="px-3 py-2 text-center">
                <button
                  onClick={() => onToggleFavorite(p)}
                  className="text-lg transition-transform hover:scale-125 active:scale-95"
                >
                  {p.favorite ? "⭐" : "☆"}
                </button>
              </td>

              {/* Catégories */}
              <td className="px-3 py-2">
                {p.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {p.categories.map((c) => (
                      <span
                        key={c}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${catBg}`}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${emptyCatClass}`}
                  >
                    —
                  </span>
                )}
              </td>

              {/* Bouton édition */}
              <td className="px-3 py-2 text-center">
                <button
                  onClick={() => onEdit(i)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    isDarkMode
                      ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-600/30"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200"
                  }`}
                >
                  EDIT
                </button>
              </td>
            </tr>
          ))}

          {projects.length === 0 && (
            <tr>
              <td
                colSpan={7}
                className="px-3 py-8 text-center opacity-50 italic"
              >
                Aucun projet trouvé
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
