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
   * ✅ LOCK ULTIME POUR iOS (La méthode "Position Fixed")
   * ========================================================= */
  useEffect(() => {
    // 1. On mémorise où était l'utilisateur dans la page
    const scrollY = window.scrollY;

    // 2. On fige le body (classe définie dans globals.css avec position: fixed)
    document.body.classList.add("viewer-open");
    
    // 3. IMPORTANT : On compense le décalage du "fixed" pour ne pas remonter tout en haut visuellement
    document.body.style.top = `-${scrollY}px`;

    // 4. Nettoyage à la fermeture
    return () => {
      document.body.classList.remove("viewer-open");
      document.body.style.top = "";
      // 5. On remet l'utilisateur exactement où il était
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
    // ✅ CONTENEUR PRINCIPAL : Bloque tout effet élastique global
    <div className="fixed inset-0 z-50 bg-black overscroll-none touch-none">
      
      <button onClick={onClose} className="absolute right-8 top-8 z-50 text-white/50 hover:text-white font-bold">Fermer ✕</button>
      
      {/* ✅ SCROLLER HORIZONTAL : 
          - touch-pan-x : AUTORISE le doigt à bouger horizontalement (pour changer de slide)
          - overscroll-x-contain : EMPÊCHE le doigt de faire bouger la page du dessous quand on arrive au bout
      */}
      <div 
        ref={containerRef} 
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory touch-pan-x overscroll-x-contain" 
        style={{ scrollbarWidth: "none" }}
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