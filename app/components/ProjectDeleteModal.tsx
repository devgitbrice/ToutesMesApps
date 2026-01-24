"use client";

import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  projectName: string;
};

export default function ProjectDeleteModal({ isOpen, onClose, onConfirm, projectName }: Props) {
  const [input, setInput] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4">
      <div className="bg-neutral-900 p-8 rounded-2xl border border-red-500/30 text-center max-w-md w-full">
        <h2 className="text-red-500 font-bold mb-4">Supprimer {projectName} ?</h2>
        <p className="text-xs text-gray-400 mb-4">Cette action est irréversible.</p>
        <input autoFocus type="text" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Taper SUPPRIMER"
          className="bg-white/5 p-2 rounded text-center mb-4 w-full text-white font-bold"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 rounded text-xs opacity-50 hover:bg-white/10">Annuler</button>
          <button disabled={input !== "SUPPRIMER"} onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 rounded font-bold disabled:opacity-20 hover:bg-red-500 transition-all">
            CONFIRMER
          </button>
        </div>
      </div>
    </div>
  );
}