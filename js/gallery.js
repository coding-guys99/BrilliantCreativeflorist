import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY, BUCKET } from "./config.js";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function fetchPhotos(){
  const { data, error } = await supabase
    .from("photos")
    .select("file_path, sort, created_at")
    .eq("is_public", true)
    .order("sort", { ascending: false })
    .order("created_at", { ascending: false });

  if(error) throw error;
  return data || [];
}

export function publicUrl(file_path){
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(file_path);
  return data.publicUrl;
}
