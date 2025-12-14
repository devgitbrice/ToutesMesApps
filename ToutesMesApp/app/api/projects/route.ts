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

// 1. GET : Récupérer tous les projets
export async function GET() {
  try {
    const records = await base("Projects")
      .select({
        view: "Grid view",
        sort: [{ field: "Title", direction: "asc" }],
      })
      .all();

    const projects = records.map((record) => ({
      id: record.id,
      title: (record.get("Title") as string) || "Sans titre",
      description: (record.get("Description") as string) || "",
      type: (record.get("Type") as string) || "Perso",
      categories: (record.get("Categories") as string[]) || [],
      githubLink: (record.get("GithubLink") as string) || "",
      siteLink: (record.get("SiteLink") as string) || "",

      // ✅ FAVORITE (checkbox Airtable)
      favorite: asBool(record.get("favorite"), false),
    }));

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
    if ("type" in body) fields.Type = asString(body.type, "Perso");
    if ("categories" in body) fields.Categories = Array.isArray(body.categories) ? body.categories : [];
    if ("githubLink" in body) fields.GithubLink = asString(body.githubLink, "");
    if ("siteLink" in body) fields.SiteLink = asString(body.siteLink, "");

    // ✅ FAVORITE (checkbox)
    if ("favorite" in body) fields.favorite = asBool(body.favorite, false);

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await base("Projects").update([
      {
        id,
        fields,
      },
    ]);

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
          Title: body?.title || "Nouveau Projet",
          Description: body?.description || "",
          Type: body?.type || "Perso",
          Categories: Array.isArray(body?.categories) ? body.categories : [],
          GithubLink: body?.githubLink || "",
          SiteLink: body?.siteLink || "",

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
