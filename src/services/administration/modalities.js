import { supabase } from "../../lib/supabase";

export async function getModalities() {
  const { data, error } = await supabase
    .from("modalities")
    .select("*")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getActiveModalities() {
  const { data, error } = await supabase
    .from("modalities")
    .select("id, name")
    .eq("active", true)
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function createModality(modality) {
  const { data, error } = await supabase
    .from("modalities")
    .insert(modality)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateModality(id, modality) {
  const { data, error } = await supabase
    .from("modalities")
    .update(modality)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function toggleModality(id, active) {
  const { data, error } = await supabase
    .from("modalities")
    .update({ active })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}