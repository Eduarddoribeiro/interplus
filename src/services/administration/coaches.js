import { supabase } from "../../lib/supabase";

export async function getCoaches() {
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getActiveCoaches() {
  const { data, error } = await supabase
    .from("coaches")
    .select("id, name")
    .eq("active", true)
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function createCoach(coach) {
  const { data, error } = await supabase
    .from("coaches")
    .insert(coach)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateCoach(id, coach) {
  const { data, error } = await supabase
    .from("coaches")
    .update(coach)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function toggleCoach(id, active) {
  const { data, error } = await supabase
    .from("coaches")
    .update({ active })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}