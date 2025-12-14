import { NextResponse } from "next/server";
import Airtable from "airtable";

// Vérification de sécurité pour les clés API
if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  console.error("❌ ERREUR CRITIQUE : Clés Airtable manquantes dans .env.local");
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

// Helpers
const asString = (v: unknown, fallback = "") => {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return fallback;
  return String(v);
};

const asBool = (v: unknown, fallback = false) => {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true") return true;
  if (v === 0 || v === "0" || v === "false") return false;
  if (v === null || v === undefined) return fallback;
  return fallback;
};

const asStringArray = (v: unknown, fallback: string[] = []) => {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[];
  if (typeof v === "string") return [v];
  if (v === null || v === undefined) return fallback;
  return fallback;
};

// Normalisation Type (API -> front)
const normalizeTypeOut = (v: unknown): "pro" | "perso" => {
  const raw = asString(v, "Perso").trim().toLowerCase();
  if (raw === "pro") return "pro";
  if (raw === "perso") return "perso";

  // parfois Airtable renvoie "Pro"/"Perso" ou autre label
  if (raw.includes("pro")) return "pro";
  return "perso";
};

// Normalisation Type (front -> Airtable)
const normalizeTypeIn = (v: unknown): "Pro" | "Perso" => {
  const raw = asString(v, "Perso").trim().toLowerCase();
  return raw === "pro" ? "Pro" : "Perso";
};

// Normalisation Categories (API -> front)
const normalizeCategoriesOut = (v: unknown): string[] => {
  return asStringArray(v, []).map((c) => c.trim().toLowerCase()).filter(Boolean);
};

// Normalisation Categories (front -> Airtable)
const normalizeCategoriesIn = (v: unknown): string[] => {
  // Ici on renvoie des strings telles quelles vers Airtable (Multiple select)
  // Si tes options Airtable sont en lowercase, c’est parfait.
  // Si elles sont en "Formation", "Appartement", tu peux adapter ici.
  return asStringArray(v, []).map((c) => c.trim()).filter(Boolean);
};

// 1. GET : Récupérer tous les projets
export async function GET() {
  try {
    const records = await base("Projects")
      .select({
        view: "Grid view",
        sort: [{ field: "Title", direction: "asc" }],
      })
      .all();

    const projects = records.map((record) => {
      const title = record.get("Title");
      const description = record.get("Description");
      const type = record.get("Type");
      const categories = record.get("Categories");
      const githubLink = record.get("GithubLink");
      const siteLink = record.get("SiteLink");
      const favorite = record.get("favorite");

      return {
        id: record.id,
        title: asString(title, "Sans titre"),
        description: asString(description, ""),

        // ✅ IMPORTANT : on renvoie "pro" | "perso" pour que tes filtres aient des valeurs cohérentes
        type: normalizeTypeOut(type),

        // ✅ IMPORTANT : tableau de catégories toujours présent et normalisé
        categories: normalizeCategoriesOut(categories),

        githubLink: asString(githubLink, ""),
        siteLink: asString(siteLink, ""),

        // ✅ FAVORITE (checkbox Airtable)
        favorite: asBool(favorite, false),
      };
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("❌ ERREUR AIRTABLE GET :", error);

    if (error?.error === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Table 'Projects' introuvable ou Base ID incorrect" },
        { status: 404 }
      );
    }
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      return NextResponse.json(
        { error: "Problème de clé API ou de permissions" },
        { status: 403 }
      );
    }

    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

// 2. PUT : Mettre à jour un projet existant (supporte update partiel, ex: favorite uniquement)
export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = asString(body?.id);
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    // Protection : on ne peut pas update un ID temporaire
    if (id.startsWith("temp-")) {
      return NextResponse.json({ error: "Cannot update temp ID" }, { status: 400 });
    }

    // ✅ On construit fields dynamiquement pour ne PAS écraser ce qui n'est pas envoyé
    const fields: Record<string, any> = {};

    if ("title" in body) fields.Title = asString(body.title, "");
    if ("description" in body) fields.Description = asString(body.description, "");

    // ✅ On accepte "pro"/"perso" côté front et on écrit "Pro"/"Perso" dans Airtable
    if ("type" in body) fields.Type = normalizeTypeIn(body.type);

    // ✅ Toujours un tableau pour Airtable (Multiple select)
    if ("categories" in body) fields.Categories = normalizeCategoriesIn(body.categories);

    // ✅ Liens
    if ("githubLink" in body) fields.GithubLink = asString(body.githubLink, "");
    if ("siteLink" in body) fields.SiteLink = asString(body.siteLink, "");

    // ✅ FAVORITE (checkbox)
    if ("favorite" in body) fields.favorite = asBool(body.favorite, false);

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await base("Projects").update([{ id, fields }]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ ERREUR AIRTABLE PUT :", error);
    return NextResponse.json({ error: "Erreur sauvegarde" }, { status: 500 });
  }
}

// 3. POST : Créer un nouveau projet
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("✨ Création d'un nouveau projet...");

    const createdRecords = await base("Projects").create([
      {
        fields: {
          Title: asString(body?.title, "Nouveau Projet"),
          Description: asString(body?.description, ""),

          // ✅ On accepte "pro"/"perso" côté front
          Type: normalizeTypeIn(body?.type),

          // ✅ tableau attendu par Airtable (Multiple select)
          Categories: normalizeCategoriesIn(body?.categories),

          GithubLink: asString(body?.githubLink, ""),
          SiteLink: asString(body?.siteLink, ""),

          // ✅ FAVORITE : par défaut false
          favorite: asBool(body?.favorite, false),
        },
      },
    ]);

    const newId = createdRecords[0].id;
    console.log("✅ Projet créé avec ID:", newId);

    return NextResponse.json({ id: newId });
  } catch (error: any) {
    console.error("❌ ERREUR AIRTABLE POST :", error);
    return NextResponse.json({ error: "Impossible de créer le projet" }, { status: 500 });
  }
}
