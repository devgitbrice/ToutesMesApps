"use client";

import { normalizeUrl } from "@/lib/projectUtils";

type Props = {
  github: string; setGithub: (v: string) => void;
  site: string; setSite: (v: string) => void;
  gemini: string; setGemini: (v: string) => void;
};

export default function ProjectLinks({ github, setGithub, site, setSite, gemini, setGemini }: Props) {
  const handleGo = (url: string) => {
    const target = normalizeUrl(url);
    if (target) window.open(target, "_blank");
  };

  const fields = [
    { label: "GITHUB", val: github, set: setGithub, ph: "github.com/..." },
    { label: "WEB", val: site, set: setSite, ph: "monsite.com" },
    { label: "GEMINI", val: gemini, set: setGemini, ph: "gemini.google..." },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {fields.map((f, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-white/50 tracking-[0.1em]">{f.label}</span>
          <div className="relative flex items-center">
            <input
              type="text" placeholder={f.ph} value={f.val} onChange={(e) => f.set(e.target.value)}
              className={`w-40 rounded-md px-3 py-1.5 text-xs outline-none transition-all pr-8 ${
                f.val ? "bg-green-600/20 border border-green-500/50 text-green-400 font-bold" : "bg-white/5 border border-dashed border-white/20 text-white/40"
              }`}
            />
            {f.val && (
              <button onClick={() => handleGo(f.val)} className="absolute right-1 text-[9px] bg-green-500 text-black font-bold px-1.5 py-0.5 rounded hover:bg-white transition-colors">
                GO
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}