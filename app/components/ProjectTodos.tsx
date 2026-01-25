"use client";

import { useState } from "react";
import type { ProjectTodo } from "@/lib/projects";

type Props = {
  todos: ProjectTodo[];
  onChange: (todos: ProjectTodo[]) => void;
};

export default function ProjectTodos({ todos = [], onChange }: Props) {
  const [inputValue, setInputValue] = useState("");
  
  // État pour suivre l'élément en cours de déplacement
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // État pour l'animation de copie (stocke l'ID de la tâche copiée)
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newTodo: ProjectTodo = {
      id: crypto.randomUUID(),
      text: inputValue,
      done: false,
    };
    onChange([newTodo, ...todos]);
    setInputValue("");
  };

  const handleDone = (id: string) => {
    onChange(todos.filter((t) => t.id !== id));
  };

  const handleUpdate = (id: string, newText: string) => {
    onChange(todos.map((t) => (t.id === id ? { ...t, text: newText } : t)));
  };

  // --- LOGIQUE COPIE PRESSE-PAPIERS ---
  const copyToClipboard = async (text: string, id: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      // On remet l'icône normale après 2 secondes
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Erreur de copie", err);
    }
  };

  // --- LOGIQUE DRAG & DROP ---
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const updatedTodos = [...todos];
    const [movedItem] = updatedTodos.splice(draggedIndex, 1);
    updatedTodos.splice(dropIndex, 0, movedItem);

    onChange(updatedTodos);
    setDraggedIndex(null);
  };

  return (
    <div className="flex flex-col h-full w-full min-w-[300px] gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
      
      {/* En-tête */}
      <span className="text-xs font-bold tracking-widest text-white/50">TODO LIST</span>

      {/* Champ d'ajout rapide */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nouvelle tâche..."
          className="flex-1 bg-black/20 rounded-lg px-3 py-2 text-sm text-white outline-none border border-white/5 focus:border-blue-500/50 transition-colors"
        />
        <button 
          onClick={handleAdd}
          className="bg-blue-600 text-white px-3 rounded-lg font-bold text-lg hover:bg-blue-500 transition-colors"
        >
          +
        </button>
      </div>

      {/* Liste des Todos */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
        {todos.length === 0 && (
          <div className="text-center text-white/20 text-xs italic mt-4">Rien à faire, bravo !</div>
        )}

        {todos.map((todo, index) => {
          const isFirst = index === 0;
          const bgClass = isFirst 
            ? "bg-red-600 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
            : "bg-black/20 border-white/5 hover:border-white/10";

          return (
            <div
              key={todo.id}
              draggable
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDrop={(e) => onDrop(e, index)}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-move ${bgClass} ${draggedIndex === index ? "opacity-50" : "opacity-100"}`}
            >
              
              {/* Bouton DONE */}
              <button
                onClick={() => handleDone(todo.id)}
                title="Fait !"
                className={`h-5 w-5 shrink-0 rounded border flex items-center justify-center transition-all ${isFirst ? "border-white/50 hover:bg-white hover:text-red-600" : "border-white/30 hover:bg-green-500 hover:border-green-500"}`}
              >
                <span className={`opacity-0 hover:opacity-100 text-[10px] font-bold ${isFirst ? "text-red-600" : "text-black"}`}>✓</span>
              </button>

              {/* Texte éditable */}
              <input
                type="text"
                value={todo.text}
                onChange={(e) => handleUpdate(todo.id, e.target.value)}
                className="flex-1 bg-transparent text-sm text-white font-medium outline-none placeholder-white/30"
                onMouseDown={(e) => e.stopPropagation()} 
              />
              
              {/* ✅ BOUTON COPIER */}
              <button
                onClick={() => copyToClipboard(todo.text, todo.id)}
                title="Copier le texte"
                className="text-white/40 hover:text-white transition-colors p-1"
              >
                {copiedId === todo.id ? (
                  <span className="text-green-400 font-bold text-xs">OK</span>
                ) : (
                  <span className="text-xs">📋</span>
                )}
              </button>

              {/* Poignée Drag */}
              <span className="text-white/20 text-xs">☰</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}