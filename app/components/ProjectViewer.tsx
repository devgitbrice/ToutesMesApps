"use client";

import { useEffect, useRef } from "react";
import type { Project } from "@/lib/projects";

export default function ProjectViewer({
  projects,
  index,
  onClose,
}: {
  projects: Project[];
  index: number;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Se placer sur la bonne slide au moment de l’ouverture
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({
      left: index * window.innerWidth,
      behavior: "instant" as ScrollBehavior,
    });
  }, [index]);

  // ESC pour fermer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Fermer */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-50 rounded-full bg-white/90 px-4 py-2 text-sm font-medium hover:bg-white"
        type="button"
      >
        Fermer ✕
      </button>

      {/* Swipe horizontal (trackpad 2 doigts) */}
      <div
        ref={containerRef}
        className="flex h-full w-full overflow-x-auto snap-x snap-mandatory overscroll-x-contain"
      >
        {projects.map((p) => (
          <section
            key={p.id}
            className="h-full w-screen shrink-0 snap-center bg-neutral-950 text-white"
          >
            <div className="flex h-full items-center justify-center">
              <div className="max-w-2xl px-6 text-center">
                <h2 className="text-3xl font-bold">{p.title}</h2>

                {p.description && (
                  <p className="mt-4 text-lg text-neutral-300">
                    {p.description}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-sm text-black">
                    {p.type === "pro" ? "Pro" : "Perso"}
                  </span>

                  {p.categories.map((c) => (
                    <span
                      key={c}
                      className="rounded-full border border-white/30 px-3 py-1 text-sm text-white/90"
                    >
                      {c === "formation" ? "Formation" : "Appartement"}
                    </span>
                  ))}
                </div>

                <p className="mt-8 text-xs text-white/50">
                  Astuce : swipe 2 doigts ← → (trackpad) / ESC pour fermer
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
