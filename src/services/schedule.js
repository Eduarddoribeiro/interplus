import { supabase } from "../lib/supabase";

export async function getAvailableSessions(category) {
  if (!category) return [];

  const today = new Date();

  const limitDate = new Date();
  limitDate.setDate(today.getDate() + 30);

  const start = today.toISOString().split("T")[0];
  const end = limitDate.toISOString().split("T")[0];

  const { data, error } = await supabase.rpc(
    "get_experimental_occupation",
    {
      p_category_id: category.id,
      p_start_date: start,
      p_end_date: end,
    }
  );

  if (error) throw error;

  return data ?? [];
}