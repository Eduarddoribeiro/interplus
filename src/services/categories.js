import { supabase } from "../lib/supabase";

import { ageInYear } from "../helpers/categoryAge";

/**
 * Categoria pela idade que o atleta completa no ano corrente
 * (não depende de datas reescritas a cada janeiro).
 */
export async function getCategoryByBirthDate(birthDate) {
  const age = ageInYear(birthDate);

  if (age === null) return null;

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .lte("min_age", age)
    .gte("max_age", age)
    .eq("active", true)
    .order("order_index")
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select(`
      *,
      training_group_categories(count)
    `)
    .order("order_index");

  if (error) throw error;

  return (data ?? []).map((category) => ({
    ...category,
    training_groups_count: category.training_group_categories?.[0]?.count ?? 0,
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