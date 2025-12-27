"use client";

import { useEffect, useRef, useState } from "react";
import type { Project, ProjectCategory, ProjectType } from "@/lib/projects";

// ✅ Hook pour éviter de saturer l'API à chaque pression de touche
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
  onDelete,
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
  onDelete: (id: string) => void;
  onPlay: (text: string, projectId: string) => void;
  onStop: () => void;
  audio: { loading: boolean; playing: boolean; projectId: string | null };
  availableTypes: ProjectType[];
  availableCategories: ProjectCategory[];
  autoMode: boolean;
  onToggleAuto: (payload: { enabled: boolean; index: number; text: string; projectId: string }) => void;
  slideIndex: number;
}) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [githubLink, setGithubLink] = useState(project.githubLink || "");
  const [siteLink, setSiteLink] = useState(project.siteLink || "");
  const [selectedType, setSelectedType] = useState<ProjectType>(project.type);
  const [selectedCats, setSelectedCats] = useState<ProjectCategory[]>(project.categories || []);
  const [newCatName, setNewCatName] = useState("");

  // Gestion de la suppression
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedTitle = useDebounce(title, 1000);
  const debouncedDesc = useDebounce(description, 1000);
  const debouncedGithub = useDebounce(githubLink, 1000);
  const debouncedSite = useDebounce(siteLink, 1000);

  useEffect(() => {
    setTitle(project.title);
    setDescription(project.description);
    setGithubLink(project.githubLink || "");
    setSiteLink(project.siteLink || "");
    setSelectedType(project.type);
    setSelectedCats(project.categories || []);
  }, [project.id]);

  useEffect(() => {
    const hasChanged = 
      debouncedTitle !== project.title ||
      debouncedDesc !== project.description ||
      debouncedGithub !== (project.githubLink || "") ||
      debouncedSite !== (project.siteLink || "") ||
      selectedType !== project.type ||
      JSON.stringify(selectedCats) !== JSON.stringify(project.categories);

    if (hasChanged) {
      onUpdate({
        ...project,
        title: debouncedTitle,
        description: debouncedDesc,
        githubLink: debouncedGithub,
        siteLink: debouncedSite,
        type: selectedType,
        categories: selectedCats,
      });
    }
  }, [debouncedTitle, debouncedDesc, debouncedGithub, debouncedSite, selectedType, selectedCats]);

  const toggleCategory = (cat: ProjectCategory) => {
    const newCats = selectedCats.includes(cat)
      ? selectedCats.filter((c) => c !== cat)
      : [...selectedCats, cat];
    setSelectedCats(newCats);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const cat = newCatName.trim() as unknown as ProjectCategory;
    if (!selectedCats.includes(cat)) {
      setSelectedCats([...selectedCats, cat]);
    }
    setNewCatName("");
  };

  const handleDeleteConfirm = async () => {
    if (deleteInput !== "SUPPRIMER") return;
    setIsDeleting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id }),
      });
      if (res.ok) {
        onDelete(project.id);
      } else {
        alert("Erreur lors de la suppression");
        setIsDeleting(false);
      }
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  const getLinkStyle = (value: string) => {
    if (!value || value.trim() === "")
      return "bg-white/5 border border-dashed border-white/20 text-white/40";
    return "bg-green-600/20 border border-green-500/50 text-green-400 font-bold";
  };

  const isThisLoading = audio.projectId === project.id && audio.loading;
  const isThisPlaying = audio.projectId === project.id && audio.playing;

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="flex w-full max-w-5xl flex-col items-center text-center">
        
        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => onUpdate({ ...project, favorite: !project.favorite })}
            className="text-4xl transition-transform hover:scale-110 active:scale-95"
          >
            {project.favorite ? "⭐" : "☆"}
          </button>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-[400px] bg-transparent text-center text-5xl font-bold text-white outline-none placeholder-white/20"
            placeholder="Titre du projet..."
          />

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Lien GitHub"
              value={githubLink}
              onChange={(e) => setGithubLink(e.target.value)}
              className={`w-44 rounded-md px-3 py-1.5 text-xs outline-none transition-all ${getLinkStyle(githubLink)}`}
            />
            <input
              type="text"
              placeholder="Lien Site"
              value={siteLink}
              onChange={(e) => setSiteLink(e.target.value)}
              className={`w-44 rounded-md px-3 py-1.5 text-xs outline-none transition-all ${getLinkStyle(siteLink)}`}
            />
          </div>
          
          <div className="flex gap-3 ml-4">
            <button
              onClick={() => onPlay(buildTtsText(title, description), project.id)}
              disabled={isThisLoading}
              className="rounded-full bg-white/10 px-6 py-2 text-xs font-bold hover:bg-white/20 disabled:opacity-50"
            >
              {isThisLoading ? "..." : isThisPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
            <button
              onClick={() => onToggleAuto({ enabled: !autoMode, index: slideIndex, text: buildTtsText(title, description), projectId: project.id })}
              className={`rounded-full px-6 py-2 text-xs font-bold transition-all ${autoMode ? "bg-blue-600" : "bg-white/10 hover:bg-white/20"}`}
            >
              {autoMode ? "Auto ON" : "Auto Mode"}
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="rounded-full bg-red-600/20 px-6 py-2 text-xs font-bold text-red-500 hover:bg-red-600 hover:text-white transition-all"
            >
              SUPPRIMER
            </button>
          </div>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mb-10 w-full max-w-3xl resize-none bg-transparent text-center text-xl text-gray-300 outline-none placeholder-white/10"
          placeholder="Décrivez votre application ici..."
        />

        <div className="mb-8 flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Classification</span>
          <div className="flex gap-4">
            {["Pro", "Perso"].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t as ProjectType)}
                className={`rounded-full border px-8 py-2 text-xs font-bold transition-all ${
                  selectedType === t ? "border-green-500 bg-green-500/20 text-green-400" : "border-white/10 text-white/30 hover:bg-white/5"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
            {Array.from(new Set([...availableCategories, ...selectedCats])).map((cat) => (
              <button
                key={String(cat)}
                onClick={() => toggleCategory(cat as ProjectCategory)}
                className={`rounded-full border px-4 py-1.5 text-xs transition-all ${
                  selectedCats.includes(cat as ProjectCategory)
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-white/10 text-white/30 hover:bg-white/5"
                }`}
              >
                {String(cat)}
              </button>
            ))}
            <div className="flex items-center rounded-full border border-white/10 bg-white/5 px-3">
              <input
                type="text"
                placeholder="Nouvelle..."
                className="w-20 bg-transparent py-1 text-xs outline-none"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
              <button onClick={handleAddCategory} className="text-green-500 font-bold ml-1">+</button>
            </div>
          </div>
        </div>

        <div className="mt-12 flex items-center gap-2 opacity-20">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Synchronisation Cloud Active</span>
        </div>

        {/* --- MODAL SUPPRESSION --- */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md p-8 text-center border border-red-500/30 rounded-3xl bg-neutral-900 shadow-2xl">
              <h2 className="text-2xl font-bold text-red-500 mb-4">Action Irréversible</h2>
              <p className="text-gray-400 mb-6">
                Tapez <span className="text-white font-mono font-bold select-none">SUPPRIMER</span> pour confirmer la suppression définitive de <strong>{project.title}</strong>.
              </p>
              
              <input
                autoFocus
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                className="w-full bg-white/5 border-2 border-red-500/50 rounded-xl px-4 py-3 text-center text-xl font-bold uppercase tracking-widest text-white outline-none focus:border-red-500 transition-all"
                placeholder="..."
              />

              <div className="flex gap-4 mt-8">
                <button 
                  onClick={() => { setShowDeleteModal(false); setDeleteInput(""); }}
                  className="flex-1 py-3 text-sm font-bold text-white/50 hover:text-white transition-colors"
                >
                  ANNULER
                </button>
                <button 
                  disabled={deleteInput !== "SUPPRIMER" || isDeleting}
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-3 bg-red-600 rounded-xl text-sm font-bold text-white disabled:opacity-20 transition-all hover:bg-red-500 shadow-lg shadow-red-900/20"
                >
                  {isDeleting ? "CHARGEMENT..." : "CONFIRMER"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectViewer({
  projects,
  index,
  onClose,
  onUpdate,
  onDelete, // Nouvelle prop passée par page.tsx
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

  const stopAudio = () => {
    playTokenRef.current++;
    if (ttsAbortRef.current) ttsAbortRef.current.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
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
          } else {
            setAutoMode(false);
          }
        }
      };
      await a.play();
    } catch (e) {
      setAudio({ loading: false, playing: false, projectId: null });
    }
  };

  useEffect(() => {
    containerRef.current?.scrollTo({ left: index * window.innerWidth, behavior: "instant" });
  }, [index]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button onClick={onClose} className="absolute right-8 top-8 z-50 text-white/50 hover:text-white font-bold">Fermer ✕</button>
      <div
        ref={containerRef}
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {projects.map((p, i) => (
          <section key={p.id} className="h-full w-screen shrink-0 snap-center bg-neutral-950 text-white">
            <ProjectSlide
              project={p}
              onUpdate={onUpdate}
              onDelete={(id) => {
                stopAudio();
                onDelete(id);
              }}
              availableTypes={availableTypes}
              availableCategories={availableCategories}
              audio={audio}
              onPlay={playProjectTTS}
              onStop={stopAudio}
              autoMode={autoMode}
              onToggleAuto={(payload) => {
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