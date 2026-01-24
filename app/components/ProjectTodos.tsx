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

  const handleAdd = () => {
    if (!inputValue.trim()) return;
    const newTodo: ProjectTodo = {
      id: crypto.randomUUID(),
      text: inputValue,
      done: false,
    };
    // Ajout en haut de liste
    onChange([newTodo, ...todos]);
    setInputValue("");
  };

  const handleDone = (id: string) => {
    onChange(todos.filter((t) => t.id !== id));
  };

  const handleUpdate = (id: string, newText: string) => {
    onChange(todos.map((t) => (t.id === id ? { ...t, text: newText } : t)));
  };

  // --- LOGIQUE DRAG & DROP ---

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Petite astuce pour cacher l'image fantôme si besoin, ou laisser par défaut
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Nécessaire pour autoriser le drop
    e.dataTransfer.dropEffect = "move";
  };

  const onDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    // Réorganisation du tableau
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
          // Si c'est le premier élément (index 0), style rouge. Sinon style normal.
          const isFirst = index === 0;
          const bgClass = isFirst 
            ? "bg-red-600 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]" // Style ROUGE VIF
            : "bg-black/20 border-white/5 hover:border-white/10"; // Style normal

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
                // On empêche le drag si on clique dans l'input pour écrire
                onMouseDown={(e) => e.stopPropagation()} 
              />
              
              {/* Petite poignée visuelle pour le drag */}
              <span className="text-white/20 text-xs">☰</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}