import { supabase } from "../lib/supabase";

export async function getCategoryByBirthDate(birthDate) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .lte("min_birth_date", birthDate)
    .gte("max_birth_date", birthDate)
    .eq("active", true)
    .maybeSingle();

  

  if (error) throw error;

  return data;
}