// lib/projects.ts

/** =====================
 * Types stricts autorisés
 * ===================== */

export const PROJECT_TYPES = ["pro", "perso"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_CATEGORIES = ["formation", "appartement"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/** =====================
 * Helpers runtime (safe)
 * ===================== */

export function isProjectType(v: unknown): v is ProjectType {
  return typeof v === "string" && PROJECT_TYPES.includes(v as ProjectType);
}

export function isProjectCategory(v: unknown): v is ProjectCategory {
  return (
    typeof v === "string" &&
    PROJECT_CATEGORIES.includes(v as ProjectCategory)
  );
}

export function toProjectType(
  v: unknown,
  fallback: ProjectType = "perso"
): ProjectType {
  return isProjectType(v) ? v : fallback;
}

export function toProjectCategories(v: unknown): ProjectCategory[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isProjectCategory);
}

/** =====================
 * Modèle principal
 * ===================== */

export type Project = {
  id: string;
  title: string;
  description: string;

  type: ProjectType;
  categories: ProjectCategory[];

  // ✅ Favori (Airtable checkbox)
  favorite?: boolean;

  // Liens (optionnels) – anciennes versions
  githubUrl?: string;
  websiteUrl?: string;

  // Liens (optionnels) – versions Airtable
  githubLink?: string;
  siteLink?: string;
  geminiLink?: string; // ✅ Ajout du champ Gemini

  // UI / viewer
  images?: string[];
  tags?: string[];
  year?: number;
};

/** =====================
 * Données locales
 * ===================== */

export const PROJECTS: Project[] = [
  {
    id: "toutes-mes-apps",
    title: "ToutesMesApps",
    description:
      "Dashboard central de tous mes projets avec filtres et viewer fullscreen.",
    type: "perso",
    categories: ["formation"],
    githubUrl: "https://github.com/devgitbrice/ToutesMesApps",
    websiteUrl: "https://toutesmesapps.vercel.app",
    tags: ["Next.js", "Tailwind", "TypeScript"],
    year: 2025,
    images: [
      "/projects/toutesmesapps/1.png",
      "/projects/toutesmesapps/2.png",
    ],
    favorite: false,
  },
  {
    id: "note-speak-ai",
    title: "NoteSpeak AI",
    description: "Application de prise de notes avec lecture vocale et IA.",
    type: "perso",
    categories: ["formation"],
    githubUrl: "https://github.com/devgitbrice/NoteSpeakAi",
    tags: ["AI", "Speech", "Next.js"],
    year: 2024,
    favorite: false,
  },
  {
    id: "gestion-appartement",
    title: "Gestion Appartement",
    description:
      "Outil de suivi et gestion d’un appartement (charges, documents).",
    type: "pro",
    categories: ["appartement"],
    websiteUrl: "https://gestion-appartement.vercel.app",
    tags: ["Dashboard", "CRUD"],
    year: 2023,
    favorite: false,
  },
  {
    id: "formation-web",
    title: "Formation Web",
    description:
      "Projet pédagogique pour apprendre le développement web moderne.",
    type: "pro",
    categories: ["formation"],
    tags: ["Formation", "Frontend"],
    year: 2022,
    favorite: false,
  },
];