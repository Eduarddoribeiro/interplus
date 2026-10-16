import { supabase } from "../../lib/supabase";

export async function getUnits() {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function createUnit(unit) {
  const { data, error } = await supabase
    .from("units")
    .insert(unit)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateUnit(id, unit) {
  const { data, error } = await supabase
    .from("units")
    .update(unit)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function toggleUnit(id, active) {
  const { data, error } = await supabase
    .from("units")
    .update({
      active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteUnit(id) {
  const { error } = await supabase
    .from("units")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getActiveUnits() {
  const { data, error } = await supabase
    .from("units")
    .select("id, name")
    .eq("active", true)
    .order("name");

  if (error) throw error;

  return data ?? [];
}