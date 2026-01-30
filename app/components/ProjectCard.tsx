"use client";

import Link from "next/link";
import type { Project } from "@/lib/projects";

type Props = {
  project: Project;
  onClick: () => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onEdit?: (e: React.MouseEvent) => void;
  isDarkMode: boolean;
};

const truncate30 = (s?: string) => {
  const v = (s ?? "").toString();
  return v.length > 30 ? v.slice(0, 30) + "…" : v;
};

export default function ProjectCard({ project, onClick, onToggleFavorite, onEdit, isDarkMode }: Props) {
  // Styles dynamiques
  const cardClasses = isDarkMode
    ? "group relative cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-5 pb-14 shadow-sm transition hover:shadow-md hover:border-green-500"
    : "group relative cursor-pointer rounded-2xl border border-neutral-200 bg-white p-5 pb-14 shadow-sm transition hover:shadow-md hover:border-green-500";

  const titleClasses = isDarkMode ? "text-white" : "text-neutral-900";
  const descClasses = isDarkMode ? "text-slate-300" : "text-neutral-600";
  const tagBg = isDarkMode ? "bg-slate-800" : "bg-neutral-100";
  const tagText = isDarkMode ? "text-slate-200" : "text-neutral-700";

  const btnBase = "flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all";
  const btnWebClass = isDarkMode
    ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 border border-emerald-600/30"
    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200";
  const btnEditClass = isDarkMode
    ? "bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 border border-blue-600/30"
    : "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200";

  return (
    <article onClick={onClick} className={cardClasses}>

      {/* ⭐ BOUTON ÉTOILE (Apparaît au survol ou si déjà favori) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
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

      {/* 🔗 BOUTONS WEB & EDIT en bas de la carte */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
        {/* Bouton WEB à gauche */}
        {project.siteLink ? (
          <a
            href={project.siteLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`${btnBase} ${btnWebClass}`}
          >
            <span>🌐</span>
            <span>WEB</span>
          </a>
        ) : (
          <span className={`${btnBase} opacity-30 cursor-not-allowed ${isDarkMode ? "text-slate-500" : "text-neutral-400"}`}>
            <span>🌐</span>
            <span>WEB</span>
          </span>
        )}

        {/* Bouton EDIT à droite */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onEdit) onEdit(e);
          }}
          className={`${btnBase} ${btnEditClass}`}
        >
          <span>✏️</span>
          <span>EDIT</span>
        </button>
      </div>
    </article>
  );
}