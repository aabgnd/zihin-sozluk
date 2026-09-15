import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: slug } = await supabase.rpc("random_topic_slug");
  const target = typeof slug === "string" ? `/baslik/${slug}` : "/";
  return NextResponse.redirect(new URL(target, request.url));
}
