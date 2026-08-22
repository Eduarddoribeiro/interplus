import { supabase } from "../../config/supabase.js";

export async function getAll() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("order_index", {
      ascending: true,
    });

  if (error) throw error;

  return data ?? [];
}