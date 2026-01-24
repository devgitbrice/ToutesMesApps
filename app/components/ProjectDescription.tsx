"use client";

import { useRef } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function ProjectDescription({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Synchroniser le scroll
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const input = e.target;
    const val = input.value;
    const cursor = input.selectionStart;

    // --- Logique des puces (* + Espace) ---
    if (val.slice(cursor - 2, cursor) === "* ") {
      const lineStart = val.lastIndexOf("\n", cursor - 3) + 1;
      if (cursor - 2 === lineStart) {
        const newVal = val.slice(0, cursor - 2) + "• " + val.slice(cursor);
        onChange(newVal);
        requestAnimationFrame(() => {
          if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = cursor;
        });
        return;
      }
    }
    onChange(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      const input = e.currentTarget;
      const cursor = input.selectionStart;
      const val = input.value;
      const lineStart = val.lastIndexOf("\n", cursor - 1) + 1;
      const currentLine = val.slice(lineStart, cursor);

      // --- Logique du saut de ligne avec Puces ---
      if (currentLine.trim().startsWith("•")) {
        e.preventDefault();
        // Si la ligne ne contient que la puce, on l'efface (fin de liste)
        if (currentLine.trim() === "•") {
          onChange(val.slice(0, lineStart) + val.slice(cursor));
          return;
        }
        // Sinon, on ajoute une nouvelle puce à la ligne suivante
        const newVal = val.slice(0, cursor) + "\n• " + val.slice(cursor);
        onChange(newVal);
        requestAnimationFrame(() => {
          if (textareaRef.current) textareaRef.current.selectionStart = textareaRef.current.selectionEnd = cursor + 3;
        });
      }
    }
  };

  // Fonction pour transformer les MAJUSCULES en bleu
  const renderHighlightedText = (text: string) => {
    const regex = /\b([A-ZÀ-ÖØ-Þ0-9']{2,})\b/g;
    const parts = text.split(regex);

    return parts.map((part, i) => {
      if (part.match(/^[A-ZÀ-ÖØ-Þ0-9']{2,}$/)) {
        return <span key={i} className="text-blue-400 font-bold">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Styles partagés (Police, taille, hauteur de ligne)
  const sharedStyles = "p-0 text-base font-sans leading-relaxed tracking-wide";

  return (
    <div className="flex flex-col h-full w-full gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
      
      {/* ✅ 1. TITRE AJOUTÉ */}
      <span className="text-xs font-bold tracking-widest text-white/50">DESCRIPTION</span>

      {/* Container relatif pour l'éditeur qui prend tout l'espace restant */}
      <div className="relative flex-1 w-full overflow-hidden">
        
        {/* Calque Arrière (Backdrop) */}
        <div
          ref={backdropRef}
          className={`absolute inset-0 z-0 h-full w-full overflow-auto whitespace-pre-wrap break-words border border-transparent bg-transparent text-left text-gray-300 custom-scrollbar ${sharedStyles}`}
          aria-hidden="true"
        >
          {renderHighlightedText(value)}
          <br />
        </div>

        {/* Zone de Saisie (Foreground) */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className={`relative z-10 h-full w-full resize-none bg-transparent text-left text-transparent caret-white outline-none placeholder-white/10 custom-scrollbar ${sharedStyles}`}
          placeholder="Décrivez votre projet... (Astuce : '* ' pour une liste, MAJUSCULES pour bleu)"
          spellCheck={false}
        />
      </div>
    </div>
  );
}