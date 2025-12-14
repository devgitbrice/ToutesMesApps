"use client";

import { useEffect, useRef, useState } from "react";
import type { Project, ProjectCategory, ProjectType } from "@/lib/projects";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function normalizeUrl(raw: string) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

function buildTtsText(title: string, description: string) {
  const t = (title ?? "").toString().trim();
  const d = (description ?? "").toString().trim();
  return [t, d].filter(Boolean).join(". ").slice(0, 1500);
}

function ProjectSlide({
  project,
  onUpdate,
  onPlay,
  onStop,
  audio,
  availableTypes = [],
  availableCategories = [],
  autoMode,
  onToggleAuto,
  slideIndex,
}: {
  project: Project;
  onUpdate: (p: Project) => void;

  onPlay: (text: string, projectId: string) => void;
  onStop: () => void;

  audio: { loading: boolean; playing: boolean; projectId: string | null };

  availableTypes: ProjectType[];
  availableCategories: ProjectCategory[];

  autoMode: boolean;
  onToggleAuto: (payload: {
    enabled: boolean;
    index: number;
    text: string;
    projectId: string;
  }) => void;
  slideIndex: number;
}) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [githubLink, setGithubLink] = useState((project as any).githubLink || "");
  const [siteLink, setSiteLink] = useState((project as any).siteLink || "");

  // Airtable est sensible aux majuscules : "Perso" par défaut
  const [selectedType, setSelectedType] = useState<ProjectType>(
    ((project as any).type as ProjectType) || ("Perso" as ProjectType)
  );

  const [selectedCats, setSelectedCats] = useState<ProjectCategory[]>(
    Array.isArray((project as any).categories)
      ? ((project as any).categories as ProjectCategory[])
      : []
  );

  const [newCatName, setNewCatName] = useState("");

  // 1. SÉCURITÉ
  const safeTypes: ProjectType[] = Array.isArray(availableTypes) ? availableTypes : [];
  const safeCats: ProjectCategory[] = Array.isArray(availableCategories) ? availableCategories : [];

  // 2. FUSION INTELLIGENTE
  const allDisplayTypes: ProjectType[] = Array.from(
    new Set<ProjectType>([...safeTypes, "Pro" as ProjectType, "Perso" as ProjectType])
  );

  // Important : garder le typage ProjectCategory pour éviter le "string vs ProjectCategory"
  const allDisplayCats: ProjectCategory[] = Array.from(
    new Set<ProjectCategory>([...safeCats, ...selectedCats])
  ).sort((a, b) => String(a).localeCompare(String(b)));

  // 3. SAUVEGARDE
  const debouncedTitle = useDebounce(title, 1000);
  const debouncedDesc = useDebounce(description, 1000);
  const debouncedGithub = useDebounce(githubLink, 1000);
  const debouncedSite = useDebounce(siteLink, 1000);

  useEffect(() => {
    const updatedProject: Project = {
      ...project,
      title: debouncedTitle,
      description: debouncedDesc,
      githubLink: debouncedGithub,
      siteLink: debouncedSite,
      type: selectedType as any,
      categories: selectedCats as any,
      // ✅ favorite n'est pas touché ici
    };

    if (JSON.stringify(updatedProject) !== JSON.stringify(project)) {
      onUpdate(updatedProject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedDesc, debouncedGithub, debouncedSite, selectedType, selectedCats]);

  // Actions
  const toggleCategory = (cat: ProjectCategory) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter((c) => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const catRaw = newCatName.trim();

    /**
     * NOTE:
     * Si ProjectCategory est un union strict (ex: "ai" | "web" | ...),
     * ajouter une nouvelle valeur "hors union" est impossible sans l’étendre.
     * Ici on assume que tu acceptes des catégories “custom” côté Airtable
     * => cast en ProjectCategory pour satisfaire TS.
     */
    const cat = catRaw as unknown as ProjectCategory;

    if (!selectedCats.includes(cat)) {
      setSelectedCats([...selectedCats, cat]);
    }
    setNewCatName("");
  };

  const getLinkStyle = (value: string) => {
    if (value.trim() === "")
      return "bg-red-600/50 ring-2 ring-red-500 placeholder-white text-white font-bold";
    return "bg-white/10 ring-1 ring-green-500 text-white placeholder-white/40";
  };

  const isThisLoading = audio.projectId === project.id && audio.loading;
  const isThisPlaying = audio.projectId === project.id && audio.playing;

  // ✅ FAVORI (synchro Airtable via onUpdate -> page.tsx)
  const toggleFavorite = () => {
    onUpdate({
      ...project,
      favorite: !project.favorite,
    });
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="flex w-full max-w-5xl flex-col items-center text-center">
        {/* Titre + Liens */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
          {/* ✅ ÉTOILE AVANT LE TITRE */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite();
            }}
            className="text-4xl leading-none transition-transform hover:scale-110 active:scale-95"
            title={project.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            {project.favorite ? "⭐" : "☆"}
          </button>

          <input
            type="text"
            value={title ?? ""}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-[300px] bg-transparent text-center text-5xl font-bold text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-500/50 rounded-lg py-2"
            placeholder="Titre..."
          />

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="GitHub"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
              className={`w-40 rounded-md px-3 py-1 text-xs focus:outline-none transition-colors ${getLinkStyle(
                githubLink
              )}`}
            />
            <input
              type="text"
              placeholder="Site Web"
              value={siteLink}
              onChange={(e) => setSiteLink(e.target.value)}
              className={`w-40 rounded-md px-3 py-1 text-xs focus:outline-none transition-colors ${getLinkStyle(
                siteLink
              )}`}
            />
          </div>

          {/* Boutons GitHub / Site Web (cliquables) */}
          <div className="flex gap-2">
            {githubLink.trim() !== "" && (
              <a
                href={normalizeUrl(githubLink)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-40 rounded-md px-3 py-1 text-xs focus:outline-none transition-colors bg-white/10 ring-1 ring-green-500 text-white placeholder-white/40 font-bold"
              >
                GitHub
              </a>
            )}

            {siteLink.trim() !== "" && (
              <a
                href={normalizeUrl(siteLink)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-40 rounded-md px-3 py-1 text-xs focus:outline-none transition-colors bg-red-600/50 ring-2 ring-red-500 placeholder-white text-white font-bold"
              >
                Site Web
              </a>
            )}
          </div>

          {/* PLAY */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const textToSpeak = buildTtsText(title ?? "", description ?? "");
              onPlay(textToSpeak, project.id);
            }}
            disabled={isThisLoading}
            className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
          >
            {isThisLoading ? "Lecture..." : isThisPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          {/* AUTO */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const textToSpeak = buildTtsText(title ?? "", description ?? "");
              onToggleAuto({
                enabled: !autoMode,
                index: slideIndex,
                text: textToSpeak,
                projectId: project.id,
              });
            }}
            className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
          >
            {autoMode ? "Auto ✓" : "Auto"}
          </button>

          {isThisPlaying && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStop();
              }}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/20 transition-colors"
            >
              ⏹ Stop
            </button>
          )}
        </div>

        {/* Description */}
        <textarea
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mb-10 w-full max-w-2xl resize-none rounded-lg bg-transparent p-2 text-center text-xl text-gray-300 focus:outline-none focus:ring-1 focus:ring-white/20"
          placeholder="Ajouter une description..."
        />

        {/* --- TYPES --- */}
        <div className="mb-6 flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-white/50">Type</span>
          <div className="flex flex-wrap justify-center gap-3">
            {allDisplayTypes.map((type) => (
              <button
                key={String(type)}
                onClick={() => setSelectedType(type)}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
                  selectedType === type
                    ? "border-green-500 bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    : "border-white/20 bg-transparent text-white/50 hover:bg-white/10"
                }`}
                type="button"
              >
                {String(type)}
              </button>
            ))}
          </div>
        </div>

        {/* --- CATÉGORIES --- */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-white/50">Catégories</span>

          <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
            {allDisplayCats.map((cat) => {
              const isActive = selectedCats.includes(cat);
              return (
                <button
                  key={String(cat)}
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full border px-5 py-2 text-sm transition-all hover:scale-105 active:scale-95 ${
                    isActive
                      ? "border-green-500 bg-green-600 text-white font-medium shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                      : "border-white/20 bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
                  type="button"
                >
                  {String(cat)}
                </button>
              );
            })}

            {/* Input Nouveau */}
            <div className="flex items-center rounded-full border border-white/10 bg-white/5 pl-3">
              <input
                type="text"
                className="w-24 bg-transparent text-sm text-white focus:outline-none placeholder-white/20"
                placeholder="Nouveau..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <button
                onClick={handleAddCategory}
                className="px-3 py-2 text-green-400 hover:text-green-300 font-bold"
                type="button"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <p className="mt-16 text-xs text-white/30">Sauvegarde automatique...</p>
      </div>
    </div>
  );
}

export default function ProjectViewer({
  projects,
  index,
  onClose,
  onUpdate,
  availableTypes = [],
  availableCategories = [],
}: {
  projects: Project[];
  index: number;
  onClose: () => void;
  onUpdate: (p: Project) => void;
  availableTypes: ProjectType[];
  availableCategories: ProjectCategory[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Audio global
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  // ✅ Anti “2 voix” : on annule fetch + on invalide les lectures en cours
  const ttsAbortRef = useRef<AbortController | null>(null);
  const playTokenRef = useRef(0);

  const [audio, setAudio] = useState<{
    loading: boolean;
    playing: boolean;
    projectId: string | null;
  }>({ loading: false, playing: false, projectId: null });

  // ✅ AUTO state
  const [autoMode, setAutoMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(index);

  // ✅ refs pour éviter valeurs périmées dans les callbacks (onended / timers)
  const autoModeRef = useRef(false);
  const currentIndexRef = useRef(index);

  useEffect(() => {
    autoModeRef.current = autoMode;
  }, [autoMode]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // timers AUTO
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollSettleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutoTimers = () => {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
    if (scrollSettleTimerRef.current) {
      clearTimeout(scrollSettleTimerRef.current);
      scrollSettleTimerRef.current = null;
    }
  };

  const stopAudioInternal = (invalidate: boolean) => {
    if (invalidate) playTokenRef.current++;

    // annule la requête TTS en cours
    if (ttsAbortRef.current) {
      try {
        ttsAbortRef.current.abort();
      } catch {}
      ttsAbortRef.current = null;
    }

    try {
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.currentTime = 0;
        a.src = "";
      }
      audioRef.current = null;

      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    } finally {
      setAudio({ loading: false, playing: false, projectId: null });
    }
  };

  const stopAudio = () => stopAudioInternal(true);

  const scrollToIndex = (i: number) => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      left: i * window.innerWidth,
      behavior: "smooth",
    });
  };

  const scheduleNextAuto = (fromIndex: number) => {
    clearAutoTimers();

    autoAdvanceTimerRef.current = setTimeout(() => {
      if (!autoModeRef.current) return;

      const next = fromIndex + 1;
      if (next >= projects.length) {
        setAutoMode(false);
        return;
      }

      setCurrentIndex(next);
      scrollToIndex(next);

      // démarre la lecture après le scroll
      setTimeout(() => {
        if (!autoModeRef.current) return;
        const p = projects[next];
        const txt = buildTtsText((p as any).title ?? "", (p as any).description ?? "");
        playProjectTTS(txt, p.id);
      }, 450);
    }, 3000);
  };

  const playProjectTTS = async (text: string, projectId: string) => {
    const safeText = (text ?? "").toString().trim().slice(0, 1500);
    if (!safeText) return;

    // stop propre (annule fetch + audio) ET invalide l'ancienne lecture
    stopAudioInternal(true);

    const token = playTokenRef.current;

    setAudio({ loading: true, playing: false, projectId });

    // controller pour annuler le fetch si un nouveau play arrive
    const controller = new AbortController();
    ttsAbortRef.current = controller;

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: safeText, voice: "alloy" }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "TTS error");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const a = new Audio(url);
      audioRef.current = a;

      a.onplay = () => {
        if (token !== playTokenRef.current) return;
        setAudio({ loading: false, playing: true, projectId });
      };

      a.onpause = () => {
        if (token !== playTokenRef.current) return;
        setAudio((s) => ({ ...s, playing: false }));
      };

      a.onended = () => {
        if (token !== playTokenRef.current) return;
        stopAudioInternal(false);
        if (autoModeRef.current) scheduleNextAuto(currentIndexRef.current);
      };

      try {
        await a.play();
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        throw err;
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      console.error(e);
      stopAudioInternal(false);
      if (autoModeRef.current) setAutoMode(false);
    } finally {
      if (ttsAbortRef.current === controller) {
        ttsAbortRef.current = null;
      }
    }
  };

  // scroll initial vers l’index demandé
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      left: index * window.innerWidth,
      behavior: "instant" as ScrollBehavior,
    });
    setCurrentIndex(index);
  }, [index]);

  // Swipe manuel :
  // - stop audio
  // - si autoMode, reprend sur la slide où on arrive
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (audio.playing || audio.loading) stopAudioInternal(true);
      if (autoModeRef.current) clearAutoTimers();

      if (scrollSettleTimerRef.current) clearTimeout(scrollSettleTimerRef.current);
      scrollSettleTimerRef.current = setTimeout(() => {
        const newIndex = Math.round(el.scrollLeft / window.innerWidth);
        setCurrentIndex(newIndex);

        if (autoModeRef.current) {
          const p = projects[newIndex];
          const txt = buildTtsText((p as any).title ?? "", (p as any).description ?? "");
          playProjectTTS(txt, p.id);
        }
      }, 140);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, audio.playing, audio.loading]);

  // ESC ferme
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearAutoTimers();
        setAutoMode(false);
        stopAudioInternal(true);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // cleanup
  useEffect(() => {
    return () => {
      clearAutoTimers();
      stopAudioInternal(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleAuto = (payload: {
    enabled: boolean;
    index: number;
    text: string;
    projectId: string;
  }) => {
    if (!payload.enabled) {
      clearAutoTimers();
      setAutoMode(false);
      stopAudioInternal(true);
      return;
    }

    clearAutoTimers();
    setAutoMode(true);
    setCurrentIndex(payload.index);

    // démarre tout de suite à partir de la slide courante
    playProjectTTS(payload.text, payload.projectId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button
        onClick={() => {
          clearAutoTimers();
          setAutoMode(false);
          stopAudioInternal(true);
          onClose();
        }}
        className="absolute right-6 top-6 z-50 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        type="button"
      >
        Fermer ✕
      </button>

      {/* ✅ IMPORTANT : on garde EXACTEMENT tes classes + 1 slide par écran */}
      <div
        ref={containerRef}
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory overscroll-x-contain"
        style={{ scrollbarWidth: "none" }}
      >
        {projects.map((p, i) => (
          <section key={p.id} className="h-full w-screen shrink-0 snap-center bg-neutral-950 text-white">
            <ProjectSlide
              project={p}
              onUpdate={onUpdate}
              availableTypes={availableTypes}
              availableCategories={availableCategories}
              audio={audio}
              onPlay={playProjectTTS}
              onStop={() => {
                clearAutoTimers();
                stopAudioInternal(true);
              }}
              autoMode={autoMode}
              onToggleAuto={handleToggleAuto}
              slideIndex={i}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
