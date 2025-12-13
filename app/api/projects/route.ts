import { NextResponse } from "next/server";
import Airtable from "airtable";

// Vérification de sécurité pour les clés API
if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  console.error("❌ ERREUR CRITIQUE : Clés Airtable manquantes dans .env.local");
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

// 1. GET : Récupérer tous les projets
export async function GET() {
  try {
    const records = await base("Projects")
      .select({
        view: "Grid view", // Assure-toi que cette vue existe dans ton Airtable
        sort: [{ field: "Title", direction: "asc" }],
      })
      .all();

    const projects = records.map((record) => ({
      id: record.id,
      title: record.get("Title") || "Sans titre",
      description: record.get("Description") || "",
      type: record.get("Type") || "Perso", // Valeur par défaut
      categories: record.get("Categories") || [],
      githubLink: record.get("GithubLink") || "",
      siteLink: record.get("SiteLink") || "",
    }));

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error("❌ ERREUR AIRTABLE GET :", error);
    
    // Gestion spécifique des erreurs courantes
    if (error.error === 'NOT_FOUND') {
      return NextResponse.json({ error: "Table 'Projects' introuvable ou Base ID incorrect" }, { status: 404 });
    }
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json({ error: "Problème de clé API ou de permissions" }, { status: 403 });
    }

    return NextResponse.json({ error: "Erreur chargement" }, { status: 500 });
  }
}

// 2. PUT : Mettre à jour un projet existant
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Protection : on ne peut pas update un ID temporaire
    if (body.id.startsWith("temp-")) {
      return NextResponse.json({ error: "Cannot update temp ID" }, { status: 400 });
    }

    await base("Projects").update([
      {
        id: body.id,
        fields: {
          Title: body.title,
          Description: body.description,
          Type: body.type,
          Categories: body.categories,
          GithubLink: body.githubLink,
          SiteLink: body.siteLink,
        },
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
          Title: body.title || "Nouveau Projet",
          Description: body.description || "",
          Type: body.type || "Perso",
          Categories: body.categories || [],
          GithubLink: body.githubLink || "",
          SiteLink: body.siteLink || "",
        },
      },
    ]);

    const newId = createdRecords[0].id;
    console.log("✅ Projet créé avec ID:", newId);

    // On renvoie l'ID généré par Airtable pour que l'app remplace l'ID temporaire
    return NextResponse.json({ id: newId });

  } catch (error: any) {
    console.error("❌ ERREUR AIRTABLE POST :", error);
    return NextResponse.json({ error: "Impossible de créer le projet" }, { status: 500 });
  }
}