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
   * ✅ LOCK BODY SCROLL (Correction iOS)
   * ========================================================= */
  useEffect(() => {
    // 1. On fige le body quand le viewer s'ouvre
    document.body.classList.add("viewer-open");
    document.body.style.overflow = "hidden"; // Sécurité double

    // 2. Nettoyage quand on ferme
    return () => {
      document.body.classList.remove("viewer-open");
      document.body.style.overflow = "";
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
    // ✅ CORRECTION CSS SUR LE CONTENEUR PRINCIPAL
    // 1. z-50 : Au dessus de tout
    // 2. touch-action: none : Empêche le scroll de fond qui "transperce"
    // 3. overscroll-behavior: none : Empêche le rebond élastique de la page entière
    <div className="fixed inset-0 z-50 bg-black overscroll-none touch-none">
      
      <button onClick={onClose} className="absolute right-8 top-8 z-50 text-white/50 hover:text-white font-bold">Fermer ✕</button>
      
      {/* ✅ CORRECTION SUR LE SCROLLER 
         1. touch-pan-x touch-pan-y : On réactive le scroll ICI pour pouvoir slider
         2. overscroll-x-contain : Le swipe s'arrête net aux bords (pas de retour navigateur)
      */}
      <div 
        ref={containerRef} 
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory touch-pan-x touch-pan-y overscroll-x-contain" 
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