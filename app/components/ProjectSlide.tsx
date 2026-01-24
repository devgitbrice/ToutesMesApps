"use client";

import { useState, useEffect } from "react";
import type { Project, ProjectCategory, ProjectType } from "@/lib/projects";
import { useDebounce, buildTtsText } from "@/lib/projectUtils";
import ProjectLinks from "./ProjectLinks";
import ProjectClassification from "./ProjectClassification";
import ProjectDeleteModal from "./ProjectDeleteModal";
import ProjectDescription from "./ProjectDescription";
import ProjectLogs from "./ProjectLogs"; // ✅ Import
import ProjectTodos from "./ProjectTodos"; // ✅ Import

export default function ProjectSlide({ project, onUpdate, onDelete, onPlay, audio, availableCategories = [], autoMode, onToggleAuto, slideIndex }: any) {
  const [title, setTitle] = useState(project.title);
  const [desc, setDesc] = useState(project.description);
  
  // Liens
  const [links, setLinks] = useState({ 
    github: project.githubLink || "", site: project.siteLink || "", 
    gemini: project.geminiLink || "", vercel: project.vercelLink || "" 
  });

  // ✅ Nouveaux States (Logs & Todos)
  const [logs, setLogs] = useState(project.logs || []);
  const [todos, setTodos] = useState(project.todos || []);

  const [type, setType] = useState<ProjectType>(project.type);
  const [cats, setCats] = useState<ProjectCategory[]>(project.categories || []);
  const [showModal, setShowModal] = useState(false);

  // Debounce pour éviter trop de requêtes
  const dTitle = useDebounce(title, 1000);
  const dDesc = useDebounce(desc, 1000);
  const dLinks = useDebounce(links, 1000);
  const dLogs = useDebounce(logs, 1000);
  const dTodos = useDebounce(todos, 1000);

  useEffect(() => {
    // ✅ Détection des changements (y compris logs et todos)
    if (
      dTitle !== project.title || dDesc !== project.description || 
      dLinks.github !== (project.githubLink || "") || dLinks.site !== (project.siteLink || "") || 
      dLinks.gemini !== (project.geminiLink || "") || dLinks.vercel !== (project.vercelLink || "") || 
      type !== project.type || JSON.stringify(cats) !== JSON.stringify(project.categories) ||
      JSON.stringify(dLogs) !== JSON.stringify(project.logs) || // Check Logs
      JSON.stringify(dTodos) !== JSON.stringify(project.todos)  // Check Todos
    ) {
      onUpdate({ 
        ...project, title: dTitle, description: dDesc, 
        githubLink: dLinks.github, siteLink: dLinks.site, 
        geminiLink: dLinks.gemini, vercelLink: dLinks.vercel,
        logs: dLogs, todos: dTodos, // Sauvegarde
        type, categories: cats 
      });
    }
  }, [dTitle, dDesc, dLinks, dLogs, dTodos, type, cats]); // eslint-disable-line

  const isLoading = audio.projectId === project.id && audio.loading;
  const isPlaying = audio.projectId === project.id && audio.playing;

  return (
    <div className="flex h-full w-full items-start justify-center overflow-y-auto p-4 pt-24 pb-24">
      <div className="flex w-full max-w-[1400px] flex-col items-center gap-6">
        
        {/* En-tête (Titre + Liens + Contrôles) */}
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex items-center gap-4">
            <button onClick={() => onUpdate({ ...project, favorite: !project.favorite })} className="text-3xl hover:scale-110 transition-transform">{project.favorite ? "⭐" : "☆"}</button>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="min-w-[300px] bg-transparent text-center text-5xl font-bold text-white outline-none placeholder-white/20" placeholder="Titre..." />
          </div>

          <div className="scale-90 origin-top">
             <ProjectLinks github={links.github} setGithub={(v) => setLinks({ ...links, github: v })} site={links.site} setSite={(v) => setLinks({ ...links, site: v })} gemini={links.gemini} setGemini={(v) => setLinks({ ...links, gemini: v })} vercel={links.vercel} setVercel={(v) => setLinks({ ...links, vercel: v })} />
          </div>
          
          <div className="flex gap-3">
            <button onClick={() => onPlay(buildTtsText(title, desc), project.id)} disabled={isLoading} className="rounded-full bg-white/10 px-5 py-1.5 text-[10px] font-bold hover:bg-white/20 disabled:opacity-50">{isLoading ? "..." : isPlaying ? "⏸ Pause" : "▶ Play"}</button>
            <button onClick={() => onToggleAuto({ enabled: !autoMode, index: slideIndex, text: buildTtsText(title, desc), projectId: project.id })} className={`rounded-full px-5 py-1.5 text-[10px] font-bold ${autoMode ? "bg-blue-600" : "bg-white/10 hover:bg-white/20"}`}>{autoMode ? "Auto ON" : "Auto Mode"}</button>
            <button onClick={() => setShowModal(true)} className="rounded-full bg-red-600/20 px-5 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-600 hover:text-white transition-all">SUPP</button>
          </div>
        </div>

        {/* ✅ DASHBOARD 3 COLONNES */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full h-[600px] mt-4">
          
          {/* Col 1: Description */}
          <div className="h-full overflow-hidden">
             <ProjectDescription value={desc} onChange={setDesc} />
          </div>

          {/* Col 2: Suivi (Logs) */}
          <div className="h-full">
            <ProjectLogs logs={logs} onChange={setLogs} />
          </div>

          {/* Col 3: Todos */}
          <div className="h-full">
            <ProjectTodos todos={todos} onChange={setTodos} />
          </div>
        </div>

        {/* Pied de page (Classification) */}
        <div className="scale-90 origin-bottom mt-8">
            <ProjectClassification type={type} setType={setType} cats={cats} setCats={setCats} availableCats={availableCategories} />
        </div>

        <ProjectDeleteModal isOpen={showModal} onClose={() => setShowModal(false)} onConfirm={() => onDelete(project.id)} projectName={title} />
      </div>
    </div>
  );
}