"use client";

import { useState, useEffect } from "react";
import type { Project, ProjectCategory, ProjectType } from "@/lib/projects";
import { useDebounce, buildTtsText } from "@/lib/projectUtils";
import ProjectLinks from "./ProjectLinks";
import ProjectClassification from "./ProjectClassification";
import ProjectDeleteModal from "./ProjectDeleteModal";
import ProjectDescription from "./ProjectDescription";

export default function ProjectSlide({ project, onUpdate, onDelete, onPlay, audio, availableCategories = [], autoMode, onToggleAuto, slideIndex }: any) {
  const [title, setTitle] = useState(project.title);
  const [desc, setDesc] = useState(project.description);
  const [links, setLinks] = useState({ github: project.githubLink || "", site: project.siteLink || "", gemini: project.geminiLink || "" });
  const [type, setType] = useState<ProjectType>(project.type);
  const [cats, setCats] = useState<ProjectCategory[]>(project.categories || []);
  const [showModal, setShowModal] = useState(false);

  const dTitle = useDebounce(title, 1000);
  const dDesc = useDebounce(desc, 1000);
  const dLinks = useDebounce(links, 1000);

  useEffect(() => {
    if (dTitle !== project.title || dDesc !== project.description || dLinks.github !== (project.githubLink || "") || dLinks.site !== (project.siteLink || "") || dLinks.gemini !== (project.geminiLink || "") || type !== project.type || JSON.stringify(cats) !== JSON.stringify(project.categories)) {
      onUpdate({ ...project, title: dTitle, description: dDesc, githubLink: dLinks.github, siteLink: dLinks.site, geminiLink: dLinks.gemini, type, categories: cats });
    }
  }, [dTitle, dDesc, dLinks, type, cats]); // eslint-disable-line

  const isLoading = audio.projectId === project.id && audio.loading;
  const isPlaying = audio.projectId === project.id && audio.playing;

  return (
    // ✅ MODIF ICI : 'items-start' (au lieu de center) et 'pt-24' pour descendre le tout
    <div className="flex h-full w-full items-start justify-center overflow-y-auto p-4 pt-24 pb-24">
      <div className="flex w-full max-w-6xl flex-col items-center text-center gap-4">
        
        {/* Titre */}
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => onUpdate({ ...project, favorite: !project.favorite })} className="text-3xl hover:scale-110 transition-transform">{project.favorite ? "⭐" : "☆"}</button>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="min-w-[300px] bg-transparent text-center text-5xl font-bold text-white outline-none placeholder-white/20" placeholder="Titre..." />
        </div>

        {/* Liens */}
        <div className="scale-90 origin-top">
             <ProjectLinks github={links.github} setGithub={(v) => setLinks({ ...links, github: v })} site={links.site} setSite={(v) => setLinks({ ...links, site: v })} gemini={links.gemini} setGemini={(v) => setLinks({ ...links, gemini: v })} />
        </div>
        
        {/* Contrôles */}
        <div className="flex gap-3 mb-2">
          <button onClick={() => onPlay(buildTtsText(title, desc), project.id)} disabled={isLoading} className="rounded-full bg-white/10 px-5 py-1.5 text-[10px] font-bold hover:bg-white/20 disabled:opacity-50">
            {isLoading ? "..." : isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>
          <button onClick={() => onToggleAuto({ enabled: !autoMode, index: slideIndex, text: buildTtsText(title, desc), projectId: project.id })} className={`rounded-full px-5 py-1.5 text-[10px] font-bold ${autoMode ? "bg-blue-600" : "bg-white/10 hover:bg-white/20"}`}>
            {autoMode ? "Auto ON" : "Auto Mode"}
          </button>
          <button onClick={() => setShowModal(true)} className="rounded-full bg-red-600/20 px-5 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-600 hover:text-white transition-all">SUPP</button>
        </div>

        {/* Description */}
        <ProjectDescription value={desc} onChange={setDesc} />

        {/* Classification */}
        <div className="scale-90 origin-bottom mt-4">
            <ProjectClassification type={type} setType={setType} cats={cats} setCats={setCats} availableCats={availableCategories} />
        </div>

        <ProjectDeleteModal isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={() => onDelete(project.id)} projectName={title} />
      </div>
    </div>
  );
}