"use client";

import { useEffect, useRef, useState } from "react";
import type { Project, ProjectCategory, ProjectType } from "@/lib/projects";
import ProjectSlide from "./ProjectSlide";

export default function ProjectViewer({
  projects,
  index,
  onClose,
  onUpdate,
  onDelete,
  availableTypes = [],
  availableCategories = [],
}: {
  projects: Project[];
  index: number;
  onClose: () => void;
  onUpdate: (p: Project) => void;
  onDelete: (id: string) => void;
  availableTypes: ProjectType[];
  availableCategories: ProjectCategory[];
}) {
  // Plus besoin de containerRef pour le scroll horizontal
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const playTokenRef = useRef(0);

  const [audio, setAudio] = useState({ loading: false, playing: false, projectId: null as string | null });
  const [autoMode, setAutoMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(index);
  const autoModeRef = useRef(false);

  useEffect(() => { autoModeRef.current = autoMode; }, [autoMode]);

  /* =========================================================
   * 🔒 LOCK BODY (Empêche le fond de bouger)
   * ========================================================= */
  useEffect(() => {
    const scrollY = window.scrollY;
    document.body.classList.add("viewer-open");
    document.body.style.top = `-${scrollY}px`;

    return () => {
      document.body.classList.remove("viewer-open");
      document.body.style.top = "";
      window.scrollTo(0, scrollY);
    };
  }, []);

  const stopAudio = () => {
    playTokenRef.current++;
    if (ttsAbortRef.current) ttsAbortRef.current.abort();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ""; }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    setAudio({ loading: false, playing: false, projectId: null });
  };

  const playProjectTTS = async (text: string, projectId: string) => {
    stopAudio();
    const token = playTokenRef.current;
    setAudio({ loading: true, playing: false, projectId });
    const controller = new AbortController();
    ttsAbortRef.current = controller;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "alloy" }),
        signal: controller.signal,
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const a = new Audio(url);
      audioRef.current = a;
      a.onplay = () => token === playTokenRef.current && setAudio({ loading: false, playing: true, projectId });
      a.onended = () => {
        stopAudio();
        if (autoModeRef.current) {
          handleNext(); // Passage automatique au suivant
        }
      };
      await a.play();
    } catch (e) { setAudio({ loading: false, playing: false, projectId: null }); }
  };

  // ✅ NAVIGATION MANUELLE (Remplace le swipe)
  const handleNext = () => {
    if (currentIndex < projects.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setAutoMode(false); // Fin de la liste
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Le projet actif
  const currentProject = projects[currentIndex];

  if (!currentProject) return null;

  return (
    // ✅ CONTAINER FIXE : Aucune overflow horizontal possible
    <div className="fixed inset-0 z-50 bg-black w-screen h-[100dvh] overflow-hidden flex flex-col">
      
      {/* HEADER DE NAVIGATION (Flèches + Fermer) */}
      <div className="absolute top-0 left-0 right-0 z-[60] flex items-center justify-between p-4 pointer-events-none">
        
        {/* Flèches de navigation (Pointer events auto pour qu'elles soient cliquables) */}
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="text-white/50 hover:text-white disabled:opacity-20 text-2xl font-bold bg-black/20 p-2 rounded-full backdrop-blur-sm"
          >
            ←
          </button>
          <button 
            onClick={handleNext}
            disabled={currentIndex === projects.length - 1}
            className="text-white/50 hover:text-white disabled:opacity-20 text-2xl font-bold bg-black/20 p-2 rounded-full backdrop-blur-sm"
          >
            →
          </button>
        </div>

        <button 
          onClick={onClose} 
          className="text-white/50 hover:text-white font-bold bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm pointer-events-auto"
        >
          Fermer ✕
        </button>
      </div>

      {/* ✅ UN SEUL PROJET RENDU À LA FOIS */}
      {/* w-full et h-full : Prend toute la place. Le scroll vertical est géré DANS ProjectSlide */}
      <div className="w-full h-full">
        <ProjectSlide
          key={currentProject.id} // Clé importante pour forcer le re-render propre
          project={currentProject}
          onUpdate={onUpdate}
          onDelete={(id: string) => { stopAudio(); onDelete(id); }}
          availableTypes={availableTypes}
          availableCategories={availableCategories}
          audio={audio}
          onPlay={playProjectTTS}
          onStop={stopAudio}
          autoMode={autoMode}
          onToggleAuto={(payload: any) => {
            if (!payload.enabled) return stopAudio();
            setAutoMode(true);
            playProjectTTS(payload.text, payload.projectId);
          }}
          slideIndex={currentIndex}
        />
      </div>
    </div>
  );
}