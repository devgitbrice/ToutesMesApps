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
  const containerRef = useRef<HTMLDivElement>(null);
  
  // ... (Tes refs existantes pour audio, etc. restent ici) ...
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
   * 🔒 LOCK ULTIME iOS (JS INTERCEPTOR)
   * ========================================================= */
  useEffect(() => {
    // 1. Bloquer le scroll global
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width = "100%";
    document.body.style.height = "100%";

    // 2. Empêcher le "Rubber Band" (Swipe retour navigateur)
    const preventRubberBand = (e: TouchEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const isScrollable = container.scrollWidth > container.clientWidth;
      if (!isScrollable) {
        e.preventDefault(); // Si pas de scroll possible, on tue l'événement
        return;
      }

      // Si on est tout au début (gauche) et qu'on tire vers la droite -> Bloquer
      if (container.scrollLeft <= 0 && e.touches[0].clientX > (e as any)._startX) {
        e.preventDefault();
      }
      
      // Si on est tout à la fin (droite) et qu'on tire vers la gauche -> Bloquer
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll && e.touches[0].clientX < (e as any)._startX) {
        e.preventDefault();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      (e as any)._startX = e.touches[0].clientX;
    };

    // On attache les événements directement au document pour être prioritaire
    document.addEventListener("touchmove", preventRubberBand, { passive: false });
    document.addEventListener("touchstart", handleTouchStart, { passive: true });

    return () => {
      // Nettoyage
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.removeEventListener("touchmove", preventRubberBand);
      document.removeEventListener("touchstart", handleTouchStart);
    };
  }, []);

  // ... (Tes fonctions audio restent identiques : stopAudio, playProjectTTS...) ...
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
          const next = currentIndex + 1;
          if (next < projects.length) {
            setCurrentIndex(next);
            containerRef.current?.scrollTo({ left: next * window.innerWidth, behavior: "smooth" });
          } else { setAutoMode(false); }
        }
      };
      await a.play();
    } catch (e) { setAudio({ loading: false, playing: false, projectId: null }); }
  };

  useEffect(() => {
    containerRef.current?.scrollTo({ left: index * window.innerWidth, behavior: "instant" });
  }, [index]);

  return (
    <div className="fixed inset-0 z-50 bg-black overscroll-none">
      <button onClick={onClose} className="absolute right-8 top-8 z-50 text-white/50 hover:text-white font-bold">Fermer ✕</button>
      
      {/* On retire les classes utilitaires CSS de scroll ici pour laisser le JS gérer.
         overflow-x-auto est nécessaire pour que ça bouge.
      */}
      <div 
        ref={containerRef} 
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory" 
        style={{ scrollbarWidth: "none", overscrollBehaviorX: "none" }} // Inline style pour forcer
      >
        {projects.map((p, i) => (
          <section key={p.id} className="h-full w-screen shrink-0 snap-center bg-neutral-950 text-white">
            <ProjectSlide
              project={p}
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
              slideIndex={i}
            />
          </section>
        ))}
      </div>
    </div>
  );
}