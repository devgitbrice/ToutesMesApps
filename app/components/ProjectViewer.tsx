"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/projects";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function ProjectSlide({ 
  project, 
  onUpdate,
  availableTypes = [],       
  availableCategories = []   
}: { 
  project: Project; 
  onUpdate: (p: Project) => void;
  availableTypes: string[];
  availableCategories: string[];
}) {
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [githubLink, setGithubLink] = useState(project.githubLink || "");
  const [siteLink, setSiteLink] = useState(project.siteLink || "");
  
  // Airtable est sensible aux majuscules : "Perso" par défaut
  const [selectedType, setSelectedType] = useState<string>(project.type || "Perso");
  const [selectedCats, setSelectedCats] = useState<string[]>(project.categories || []);
  const [newCatName, setNewCatName] = useState("");

  // 1. SÉCURITÉ : On s'assure que ce sont des tableaux
  const safeTypes = Array.isArray(availableTypes) ? availableTypes : [];
  const safeCats = Array.isArray(availableCategories) ? availableCategories : [];

  // 2. FUSION INTELLIGENTE : Toutes les catégories connues + celles du projet
  const allDisplayTypes = Array.from(new Set([...safeTypes, "Pro", "Perso"]));
  const allDisplayCats = Array.from(new Set([...safeCats, ...selectedCats])).sort();

  // 3. SAUVEGARDE
  const debouncedTitle = useDebounce(title, 1000);
  const debouncedDesc = useDebounce(description, 1000);
  const debouncedGithub = useDebounce(githubLink, 1000);
  const debouncedSite = useDebounce(siteLink, 1000);

  useEffect(() => {
    const updatedProject = {
      ...project,
      title: debouncedTitle,
      description: debouncedDesc,
      githubLink: debouncedGithub,
      siteLink: debouncedSite,
      type: selectedType as any,
      categories: selectedCats
    };
    
    if (JSON.stringify(updatedProject) !== JSON.stringify(project)) {
      onUpdate(updatedProject);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedDesc, debouncedGithub, debouncedSite, selectedType, selectedCats]);

  // Actions
  const toggleCategory = (cat: string) => {
    if (selectedCats.includes(cat)) {
      setSelectedCats(selectedCats.filter((c) => c !== cat));
    } else {
      setSelectedCats([...selectedCats, cat]);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const cat = newCatName.trim();
    if (!selectedCats.includes(cat)) {
      setSelectedCats([...selectedCats, cat]);
    }
    setNewCatName("");
  };

  const getLinkStyle = (value: string) => {
    if (value.trim() === "") return "bg-red-600/50 ring-2 ring-red-500 placeholder-white text-white font-bold";
    return "bg-white/10 ring-1 ring-green-500 text-white placeholder-white/40";
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="flex w-full max-w-5xl flex-col items-center text-center">
        
        {/* Titre + Liens */}
        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
          <input
            type="text"
            value={title}
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
              className={`w-40 rounded-md px-3 py-1 text-xs focus:outline-none transition-colors ${getLinkStyle(githubLink)}`}
            />
            <input 
              type="text" 
              placeholder="Site Web"
              value={siteLink}
              onChange={(e) => setSiteLink(e.target.value)}
              className={`w-40 rounded-md px-3 py-1 text-xs focus:outline-none transition-colors ${getLinkStyle(siteLink)}`}
            />
          </div>
        </div>

        {/* Description */}
        <textarea
          value={description}
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
                key={type}
                onClick={() => setSelectedType(type)}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
                  selectedType === type
                    ? "border-green-500 bg-green-600 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    : "border-white/20 bg-transparent text-white/50 hover:bg-white/10"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* --- CATÉGORIES (VUE GLOBALE) --- */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-white/50">Catégories</span>
          
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
            {/* Boucle sur TOUTES les catégories existantes */}
            {allDisplayCats.map((cat) => {
              const isActive = selectedCats.includes(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full border px-5 py-2 text-sm transition-all hover:scale-105 active:scale-95 ${
                    isActive
                      ? "border-green-500 bg-green-600 text-white font-medium shadow-[0_0_10px_rgba(34,197,94,0.3)]" // ACTIF (Vert)
                      : "border-white/20 bg-white/5 text-white/60 hover:bg-white/10" // INACTIF (Gris)
                  }`}
                >
                  {cat}
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
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
              />
              <button 
                onClick={handleAddCategory}
                className="px-3 py-2 text-green-400 hover:text-green-300 font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <p className="mt-16 text-xs text-white/30">
          Sauvegarde automatique...
        </p>
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
  availableCategories = []
}: {
  projects: Project[];
  index: number;
  onClose: () => void;
  onUpdate: (p: Project) => void;
  availableTypes: string[];
  availableCategories: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      left: index * window.innerWidth,
      behavior: "instant" as ScrollBehavior,
    });
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <button
        onClick={onClose}
        className="absolute right-6 top-6 z-50 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
        type="button"
      >
        Fermer ✕
      </button>

      <div
        ref={containerRef}
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory overscroll-x-contain"
        style={{ scrollbarWidth: 'none' }}
      >
        {projects.map((p) => (
          <section
            key={p.id}
            className="h-full w-screen shrink-0 snap-center bg-neutral-950 text-white"
          >
            <ProjectSlide 
              project={p} 
              onUpdate={onUpdate}
              availableTypes={availableTypes}
              availableCategories={availableCategories}
            />
          </section>
        ))}
      </div>
    </div>
  );
}