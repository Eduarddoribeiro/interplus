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

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select(`
      *,
      training_groups(count)
    `)
    .order("order_index");

  if (error) throw error;

  return (data ?? []).map((category) => ({
    ...category,
    training_groups_count: category.training_groups?.[0]?.count ?? 0,
  }));
}

export async function getActiveCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("active", true)
    .order("order_index");

  if (error) throw error;

  return data ?? [];
}

export async function createCategory(category) {
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateCategory(id, category) {
  const { data, error } = await supabase
    .from("categories")
    .update(category)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function toggleCategory(id, active) {
  const { data, error } = await supabase
    .from("categories")
    .update({ active })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;
}