import { NextResponse } from "next/server";
import Airtable from "airtable";

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  console.error("❌ ERREUR CRITIQUE : Clés Airtable manquantes dans .env.local");
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

// --- HELPERS ---
const asString = (v: unknown, fallback = "") => typeof v === "string" ? v : (v == null ? fallback : String(v));
const asBool = (v: unknown, fallback = false) => {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true") return true;
  return fallback;
};
const asStringArray = (v: unknown, fallback: string[] = []) => Array.isArray(v) ? v.filter((x) => typeof x === "string") as string[] : fallback;

const normalizeTypeOut = (v: unknown): "pro" | "perso" => asString(v, "Perso").trim().toLowerCase().includes("pro") ? "pro" : "perso";
const normalizeTypeIn = (v: unknown): "Pro" | "Perso" => asString(v, "Perso").trim().toLowerCase() === "pro" ? "Pro" : "Perso";
const normalizeCategoriesOut = (v: unknown): string[] => asStringArray(v, []).map((c) => c.trim().toLowerCase()).filter(Boolean);
const normalizeCategoriesIn = (v: unknown): string[] => asStringArray(v, []).map((c) => c.trim()).filter(Boolean);

// GET : Récupérer
export async function GET() {
  try {
    const records = await base("Projects").select({ view: "Grid view", sort: [{ field: "Created", direction: "desc" }] }).all();
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
  } catch (error) {
    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

// PUT : Mettre à jour
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = asString(body?.id);
    if (!id || id.startsWith("temp-")) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

    const fields: Record<string, any> = {};
    if ("title" in body) fields.Title = asString(body.title);
    if ("description" in body) fields.Description = asString(body.description);
    if ("type" in body) fields.Type = normalizeTypeIn(body.type);
    if ("categories" in body) fields.Categories = normalizeCategoriesIn(body.categories);
    if ("githubLink" in body) fields.GithubLink = asString(body.githubLink);
    if ("siteLink" in body) fields.SiteLink = asString(body.siteLink);
    if ("favorite" in body) fields.favorite = asBool(body.favorite);

    await base("Projects").update([{ id, fields }]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

// POST : Créer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await base("Projects").create([{
      fields: {
        Title: asString(body?.title, "Nouveau Projet"),
        Description: asString(body?.description, ""),
        Type: normalizeTypeIn(body?.type),
        Categories: normalizeCategoriesIn(body?.categories),
        favorite: asBool(body?.favorite, false),
      }
    }]);
    return NextResponse.json({ id: created[0].id });
  } catch (error) {
    return NextResponse.json({ error: "Erreur création" }, { status: 500 });
  }
}

// ✅ NOUVEAU : DELETE
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    await base("Projects").destroy(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}