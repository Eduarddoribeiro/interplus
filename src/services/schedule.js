import { supabase } from "../lib/supabase";

export async function getAvailableSessions(category) {
  if (!category) return [];

  const today = new Date();
  const limitDate = new Date();
  limitDate.setDate(today.getDate() + 30);

  const start = today.toISOString().split("T")[0];
  const end = limitDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("contacts")
    .select("experimental_date")
    .eq("category_id", category.id)
    .in("status", ["pending_confirmation", "confirmed"])
    .gte("experimental_date", start)
    .lte("experimental_date", end);

  if (error) throw error;

  return data;
}