"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { Project, ProjectTodo } from "@/lib/projects";

type CombinedTodo = ProjectTodo & {
  projectId: string;
  projectName: string;
};

export default function FullTodoPage() {
  const [todos, setTodos] = useState<CombinedTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [projectsMap, setProjectsMap] = useState<Record<string, Project>>({});

  // Refs pour les interactions
  const lastSwipeTime = useRef(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) throw new Error("Erreur");
        const projects: Project[] = await res.json();

        const flatTodos: CombinedTodo[] = [];
        const map: Record<string, Project> = {};

        projects.forEach((p) => {
          map[p.id] = p;
          if (p.todos && p.todos.length > 0) {
            p.todos.forEach((t) => {
              flatTodos.push({ ...t, projectId: p.id, projectName: p.title });
            });
          }
        });

        setProjectsMap(map);
        setTodos(flatTodos);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleNext = useCallback(() => {
    setFocusedIndex((prev) => {
      if (prev === null) return null;
      return prev < todos.length - 1 ? prev + 1 : prev;
    });
  }, [todos.length]);

  const handlePrev = useCallback(() => {
    setFocusedIndex((prev) => {
      if (prev === null) return null;
      return prev > 0 ? prev - 1 : prev;
    });
  }, []);

  // GESTION DU SWIPE TRACKPAD
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    if (now - lastSwipeTime.current < 500) return;

    if (Math.abs(e.deltaX) > 40 && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      if (e.deltaX > 0) {
        handleNext();
        lastSwipeTime.current = now;
      } else {
        handlePrev();
        lastSwipeTime.current = now;
      }
    }
  };

  // GESTION DU SWIPE TACTILE
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  // Gestion Clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedIndex === null) return;

      if (e.key === "Escape") setFocusedIndex(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, handleNext, handlePrev]);

  // ✅ CORRECTION DE L'ERREUR DE BUILD ICI
  const handleDone = async (todoId: string, projectId: string) => {
    if (focusedIndex !== null) setFocusedIndex(null);
    setTodos((prev) => prev.filter((t) => t.id !== todoId));

    const project = projectsMap[projectId];
    if (!project) return;

    // ✅ La correction est ici : (project.todos || [])
    const newProjectTodos = (project.todos || []).filter((t) => t.id !== todoId);
    
    projectsMap[projectId] = { ...project, todos: newProjectTodos };

    try {
      await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectId, todos: newProjectTodos }),
      });
    } catch (err) { console.error("Erreur save", err); }
  };

  const activeTodo = focusedIndex !== null ? todos[focusedIndex] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      
      {/* HEADER */}
      <div className="max-w-4xl mx-auto mb-8 flex items-center gap-4">
        <Link 
          href="/" 
          className="text-white/50 hover:text-white text-sm font-bold bg-white/10 px-4 py-2 rounded-full transition-colors"
        >
          ← RETOUR
        </Link>
        <h1 className="text-3xl font-bold">Toutes les Tâches ({todos.length})</h1>
      </div>

      {/* LISTE CLASSIQUE */}
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {loading && <div className="text-white/30 italic">Chargement...</div>}
        
        {!loading && todos.length === 0 && (
          <div className="text-center py-20 text-white/30 text-xl">
            Tout est propre ! Aucune tâche en cours. 🎉
          </div>
        )}

        {todos.map((todo, index) => (
          <div 
            key={todo.id} 
            className="group flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/20 transition-all hover:bg-white/10"
          >
            <button
              onClick={() => handleDone(todo.id, todo.projectId)}
              className="h-6 w-6 shrink-0 rounded-md border border-white/30 flex items-center justify-center hover:bg-green-500 hover:border-green-500 transition-all group-hover:border-white/60"
            >
              <span className="hidden group-hover:block text-xs font-bold text-black">✓</span>
            </button>
            <span className="flex-1 text-base font-medium text-gray-200 truncate">{todo.text}</span>
            <span className="hidden sm:inline-block text-xs font-bold text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full whitespace-nowrap">{todo.projectName}</span>
            <button
              onClick={() => setFocusedIndex(index)}
              title="Mode Focus"
              className="opacity-0 group-hover:opacity-100 p-2 rounded-full hover:bg-white/10 transition-all text-white/50 hover:text-white"
            >
              ⤢
            </button>
          </div>
        ))}
      </div>

      {/* MODALE PLEIN ÉCRAN */}
      {activeTodo && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 transition-all duration-300"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button 
            onClick={() => setFocusedIndex(null)}
            className="absolute top-8 right-8 text-white/50 hover:text-white text-xl font-bold px-4 py-2 border border-white/10 rounded-full hover:bg-white/10 transition-all z-50"
          >
            Fermer (Echap)
          </button>

          <div className="max-w-4xl w-full text-center flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300 select-none">
            
            <span className="text-blue-400 tracking-widest font-bold text-sm uppercase border border-blue-500/30 px-4 py-1 rounded-full bg-blue-500/10">
              {activeTodo.projectName}
            </span>

            <h2 className="text-4xl md:text-6xl font-bold leading-tight text-white">
              {activeTodo.text}
            </h2>

            <div className="flex items-center gap-8 mt-8">
              <button 
                onClick={handlePrev}
                disabled={focusedIndex === 0}
                className="text-white/30 hover:text-white disabled:opacity-10 text-4xl transition-colors p-4"
              >
                ←
              </button>

              <button
                onClick={() => handleDone(activeTodo.id, activeTodo.projectId)}
                className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-[0_0_30px_rgba(22_163_74_0.4)] hover:shadow-[0_0_50px_rgba(22_163_74_0.6)] transition-all transform hover:scale-105 active:scale-95"
              >
                FAIT !
              </button>

              <button 
                onClick={handleNext}
                disabled={focusedIndex === todos.length - 1}
                className="text-white/30 hover:text-white disabled:opacity-10 text-4xl transition-colors p-4"
              >
                →
              </button>
            </div>

            <p className="absolute bottom-8 text-white/20 text-xs font-mono">
              Swipe Trackpad / Flèches
            </p>
          </div>
        </div>
      )}
    </div>
  );
}