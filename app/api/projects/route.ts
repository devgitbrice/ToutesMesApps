import { NextResponse } from "next/server";
import Airtable from "airtable";

// Vérification de sécurité pour les clés API
if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  console.error("❌ ERREUR CRITIQUE : Clés Airtable manquantes dans .env.local");
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

// --- HELPERS ---
const asString = (v: unknown, fallback = "") => {
  if (typeof v === "string") return v;
  if (v === null || v === undefined) return fallback;
  return String(v);
};

const asBool = (v: unknown, fallback = false) => {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true") return true;
  if (v === 0 || v === "0" || v === "false") return false;
  return fallback;
};

const asStringArray = (v: unknown, fallback: string[] = []) => {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[];
  if (typeof v === "string") return [v];
  return fallback;
};

const normalizeTypeOut = (v: unknown): "pro" | "perso" => {
  const raw = asString(v, "Perso").trim().toLowerCase();
  return raw.includes("pro") ? "pro" : "perso";
};

const normalizeTypeIn = (v: unknown): "Pro" | "Perso" => {
  const raw = asString(v, "Perso").trim().toLowerCase();
  return raw === "pro" ? "Pro" : "Perso";
};

const normalizeCategoriesOut = (v: unknown): string[] => {
  return asStringArray(v, []).map((c) => c.trim().toLowerCase()).filter(Boolean);
};

const normalizeCategoriesIn = (v: unknown): string[] => {
  return asStringArray(v, []).map((c) => c.trim()).filter(Boolean);
};

// 1. GET : Récupérer tous les projets
export async function GET() {
  try {
    const records = await base("Projects")
      .select({
        view: "Grid view",
        // ✅ TRI MODIFIÉ : On utilise le champ "Created" (Created time dans Airtable)
        // pour que les nouveaux projets restent en haut de la liste après refresh.
        sort: [{ field: "Created", direction: "desc" }],
      })
      .all();

    const projects = records.map((record) => ({
      id: record.id,
      title: asString(record.get("Title"), "Sans titre"),
      description: asString(record.get("Description"), ""),
      type: normalizeTypeOut(record.get("Type")),
      categories: normalizeCategoriesOut(record.get("Categories")),
      githubLink: asString(record.get("GithubLink"), ""),
      siteLink: asString(record.get("SiteLink"), ""),
      favorite: asBool(record.get("favorite"), false),
    }));

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("❌ ERREUR AIRTABLE GET :", error);
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

// 2. PUT : Mettre à jour (Favoris et éditions)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("📥 [API PUT] Requête reçue :", body);

    const id = asString(body?.id);
    if (!id || id.startsWith("temp-")) {
      console.error("❌ [API PUT] ID manquant ou invalide");
      return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
    }

    const fields: Record<string, any> = {};

    if ("title" in body) fields.Title = asString(body.title);
    if ("description" in body) fields.Description = asString(body.description);
    if ("type" in body) fields.Type = normalizeTypeIn(body.type);
    if ("categories" in body) fields.Categories = normalizeCategoriesIn(body.categories);
    if ("githubLink" in body) fields.GithubLink = asString(body.githubLink);
    if ("siteLink" in body) fields.SiteLink = asString(body.siteLink);
    
    if ("favorite" in body) {
      fields.favorite = asBool(body.favorite);
    }

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    console.log(`📤 [API PUT] Update Airtable ID ${id} :`, fields);
    await base("Projects").update([{ id, fields }]);

    console.log("✅ [API PUT] Airtable mis à jour");
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ ERREUR AIRTABLE PUT :", error);
    return NextResponse.json({ error: error?.message || "Erreur sauvegarde" }, { status: 500 });
  }
}

// 3. POST : Créer un nouveau projet
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const createdRecords = await base("Projects").create([
      {
        fields: {
          Title: asString(body?.title, "Nouveau Projet"),
          Description: asString(body?.description, ""),
          Type: normalizeTypeIn(body?.type),
          Categories: normalizeCategoriesIn(body?.categories),
          GithubLink: asString(body?.githubLink, ""),
          SiteLink: asString(body?.siteLink, ""),
          favorite: asBool(body?.favorite, false),
        },
      },
    ]);

    return NextResponse.json({ id: createdRecords[0].id });
  } catch (error: any) {
    console.error("❌ ERREUR AIRTABLE POST :", error);
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}