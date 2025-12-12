// lib/projects.ts

/**
 * Type de projet : pro ou perso
 */
export type ProjectType = "pro" | "perso";

/**
 * Catégories de projet
 */
export type ProjectCategory = "formation" | "appartement";

/**
 * Statut d’avancement (optionnel)
 */
export type ProjectStatus = "idea" | "wip" | "done";

/**
 * Modèle de données d’un projet
 */
export type Project = {
  id: string;
  title: string;
  description?: string;
  type: ProjectType;
  categories: ProjectCategory[];
  status?: ProjectStatus;
};

/**
 * Liste centrale des projets
 * (source de vérité pour la grille + le viewer fullscreen)
 */
export const PROJECTS: Project[] = [
  {
    id: "dashboard",
    title: "ToutesMesApps",
    description: "Dashboard central de tous mes projets",
    type: "pro",
    categories: ["formation"],
    status: "wip",
  },
  {
    id: "appartement",
    title: "Gestion Appartement",
    description: "Suivi des documents, travaux et dépenses",
    type: "perso",
    categories: ["appartement"],
    status: "idea",
  },
  {
    id: "formation-aws",
    title: "Formation AWS",
    description: "Notes, labs et rappels AWS",
    type: "pro",
    categories: ["formation"],
    status: "done",
  },
  {
    id: "projet-perso-x",
    title: "Projet Perso X",
    description: "Prototype et expérimentations personnelles",
    type: "perso",
    categories: ["formation"],
    status: "wip",
  },
];
