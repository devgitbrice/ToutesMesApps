"use client";

import { useState } from "react";
import type { ProjectCategory, ProjectType } from "@/lib/projects";

type Props = {
  type: ProjectType; setType: (t: ProjectType) => void;
  cats: ProjectCategory[]; setCats: (c: ProjectCategory[]) => void;
  availableCats: ProjectCategory[];
};

export default function ProjectClassification({ type, setType, cats, setCats, availableCats }: Props) {
  const [newCat, setNewCat] = useState("");

  const toggleCat = (c: ProjectCategory) => {
    setCats(cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c]);
  };

  const addCat = () => {
    if (newCat && !cats.includes(newCat as any)) {
      setCats([...cats, newCat as any]);
      setNewCat("");
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex gap-4">
        {["Pro", "Perso"].map((t) => (
          <button key={t} onClick={() => setType(t as ProjectType)}
            className={`rounded-full border px-6 py-1 text-xs font-bold transition-all ${
              type === t ? "border-green-500 bg-green-500/20 text-green-400" : "border-white/10 opacity-50"
            }`}>
            {t}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
        {Array.from(new Set([...availableCats, ...cats])).map((c) => (
          <button key={String(c)} onClick={() => toggleCat(c)}
            className={`rounded-full border px-3 py-1 text-[10px] transition-all ${
              cats.includes(c) ? "border-blue-500 bg-blue-500/20 text-blue-400" : "border-white/10 opacity-40"
            }`}>
            {String(c)}
          </button>
        ))}
        <input type="text" placeholder="+ Cat" value={newCat} onChange={(e) => setNewCat(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCat()}
          className="w-16 bg-transparent border-b border-white/20 text-center text-xs outline-none"
        />
      </div>
    </div>
  );
}