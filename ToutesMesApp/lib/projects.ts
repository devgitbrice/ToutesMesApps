// lib/projects.ts

/** Types stricts (ce que tu veux autoriser dans l'app) */
export const PROJECT_TYPES = ["pro", "perso"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_CATEGORIES = ["formation", "appartement"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

/** Helpers runtime (utile quand Airtable renvoie des strings) */
export function isProjectType(v: unknown): v is ProjectType {
  return typeof v === "string" && (PROJECT_TYPES as readonly string[]).includes(v);
}

export function isProjectCategory(v: unknown): v is ProjectCategory {
  return typeof v === "string" && (PROJECT_CATEGORIES as readonly string[]).includes(v);
}

export function toProjectType(v: unknown, fallback: ProjectType = "perso"): ProjectType {
  return isProjectType(v) ? v : fallback;
}

export function toProjectCategories(v: unknown): ProjectCategory[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isProjectCategory);
}

/** Ton modèle principal */
export type Project = {
  id: string;
  title: string;
  description: string;

  type: ProjectType;
  categories: ProjectCategory[];

  // ✅ Favori (Airtable checkbox)
  favorite?: boolean;

  // Liens (optionnels) - versions "lib" (anciennes)
  githubUrl?: string;
  websiteUrl?: string;

  // Liens (optionnels) - versions Airtable (actuelles dans ton API)
  githubLink?: string;
  siteLink?: string;

  // UI / viewer
  images?: string[];
  tags?: string[];
  year?: number;
};

/**
 * Normalisation d'un projet venant d'une source non typée (ex: Airtable)
 * -> garantit que `type` et `categories` sont stricts
 */
export function normalizeProject(input: Partial<Project> & { id: string }): Project {
  return {
    id: input.id,
    title: input.title ?? "",
    description: input.description ?? "",

    type: toProjectType(input.type),
    categories: toProjectCategories(input.categories),

    favorite: !!input.favorite,

    githubUrl: input.githubUrl || undefined,
    websiteUrl: input.websiteUrl || undefined,
    githubLink: input.githubLink || undefined,
    siteLink: input.siteLink || undefined,

    images: Array.isArray(input.images) ? input.images : undefined,
    tags: Array.isArray(input.tags) ? input.tags : undefined,
    year: typeof input.year === "number" ? input.year : undefined,
  };
}

/** Données locales (optionnel). Tu peux les garder ou les supprimer si 100% Airtable. */
export const PROJECTS: Project[] = [
  {
    id: "toutes-mes-apps",
    title: "ToutesMesApps",
    description: "Dashboard central de tous mes projets avec filtres et viewer fullscreen.",
    type: "perso",
    categories: ["formation"],
    githubUrl: "https://github.com/devgitbrice/ToutesMesApps",
    websiteUrl: "https://toutesmesapps.vercel.app",
    tags: ["Next.js", "Tailwind", "TypeScript"],
    year: 2025,
    images: ["/projects/toutesmesapps/1.png", "/projects/toutesmesapps/2.png"],
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
    description: "Outil de suivi et gestion d’un appartement (charges, documents).",
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
    description: "Projet pédagogique pour apprendre le développement web moderne.",
    type: "pro",
    categories: ["formation"],
    tags: ["Formation", "Frontend"],
    year: 2022,
    favorite: false,
  },
];
