import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialisation Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = 'force-dynamic';

// --- GET ---
export async function GET() {
  // ✅ On appelle la table "toutesmesapps"
  const { data, error } = await supabase
    .from("toutesmesapps")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mapping BDD (snake_case) -> App (camelCase)
  const projects = data.map((p) => ({
    id: p.id,
    title: p.title || "Sans titre",
    description: p.description || "",
    type: p.type || "perso",
    categories: p.categories || [],
    favorite: p.favorite || false,
    
    githubLink: p.github_link || "",
    siteLink: p.site_link || "",
    geminiLink: p.gemini_link || "",
    vercelLink: p.vercel_link || "",

    logs: p.logs || [],
    todos: p.todos || [],

    images: p.images || [],
    tags: p.tags || [],
    year: p.year
  }));

  return NextResponse.json(projects);
}

// --- PUT ---
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    const toUpdate: any = {};
    if (updates.title !== undefined) toUpdate.title = updates.title;
    if (updates.description !== undefined) toUpdate.description = updates.description;
    if (updates.type !== undefined) toUpdate.type = updates.type;
    if (updates.categories !== undefined) toUpdate.categories = updates.categories;
    if (updates.favorite !== undefined) toUpdate.favorite = updates.favorite;
    
    // Mapping Liens
    if (updates.githubLink !== undefined) toUpdate.github_link = updates.githubLink;
    if (updates.siteLink !== undefined) toUpdate.site_link = updates.siteLink;
    if (updates.geminiLink !== undefined) toUpdate.gemini_link = updates.geminiLink;
    if (updates.vercelLink !== undefined) toUpdate.vercel_link = updates.vercelLink;

    // Mapping JSON
    if (updates.logs !== undefined) toUpdate.logs = updates.logs;
    if (updates.todos !== undefined) toUpdate.todos = updates.todos;

    // ✅ Update sur "toutesmesapps"
    const { error } = await supabase
      .from("toutesmesapps")
      .update(toUpdate)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- POST ---
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // ✅ Insert dans "toutesmesapps"
    const { data, error } = await supabase
      .from("toutesmesapps")
      .insert([{
        title: body.title || "Nouveau Projet",
        description: body.description || "",
        type: body.type || "perso",
        categories: body.categories || [],
        favorite: body.favorite || false,
        logs: [],
        todos: []
      }])
      .select();

    if (error) throw error;

    return NextResponse.json({ id: data[0].id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- DELETE ---
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    // ✅ Delete dans "toutesmesapps"
    const { error } = await supabase.from("toutesmesapps").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}