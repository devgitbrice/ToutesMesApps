"use client";

import { useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function ProjectDescription({ value, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Synchroniser le scroll entre le textarea et le calque arrière
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
    // --- Logique du saut de ligne avec Puces ---
    if (e.key === "Enter") {
      const input = e.currentTarget;
      const cursor = input.selectionStart;
      const val = input.value;
      const lineStart = val.lastIndexOf("\n", cursor - 1) + 1;
      const currentLine = val.slice(lineStart, cursor);

      if (currentLine.trim().startsWith("•")) {
        e.preventDefault();
        if (currentLine.trim() === "•") {
          onChange(val.slice(0, lineStart) + val.slice(cursor));
          return;
        }
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
    // Regex : Repère les mots de 2 lettres ou plus entièrement en majuscules (A-Z et accents)
    const regex = /\b([A-ZÀ-ÖØ-Þ0-9']{2,})\b/g;
    
    // On découpe le texte
    const parts = text.split(regex);

    return parts.map((part, i) => {
      // Si la partie correspond exactement à une majuscule -> Bleu
      if (part.match(/^[A-ZÀ-ÖØ-Þ0-9']{2,}$/)) {
        return <span key={i} className="text-blue-400 font-bold">{part}</span>;
      }
      // Sinon -> Gris standard
      return <span key={i}>{part}</span>;
    });
  };

  // Styles partagés pour garantir l'alignement parfait
  const sharedStyles = "p-6 text-xl font-sans leading-relaxed tracking-wide";

  return (
    <div className="relative w-full max-w-4xl min-h-[500px]">
      
      {/* 1. Calque Arrière (Backdrop) : Affiche les couleurs */}
      <div
        ref={backdropRef}
        className={`absolute inset-0 z-0 h-full w-full overflow-hidden whitespace-pre-wrap break-words border border-transparent bg-transparent text-left text-gray-300 ${sharedStyles}`}
        aria-hidden="true"
      >
        {renderHighlightedText(value)}
        {/* Ajout d'un saut de ligne fantôme pour éviter le décalage en fin de fichier */}
        <br />
      </div>

      {/* 2. Zone de Saisie (Foreground) : Texte transparent, Curseur Blanc */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        rows={22}
        className={`relative z-10 h-full w-full resize-none bg-transparent text-left text-transparent caret-white outline-none placeholder-white/10 focus:border-white/20 border border-white/5 rounded-xl transition-colors ${sharedStyles}`}
        placeholder="Décrivez votre projet... (Astuce : '* ' pour une liste, MAJUSCULES pour bleu)"
        spellCheck={false}
      />
    </div>
  );
}