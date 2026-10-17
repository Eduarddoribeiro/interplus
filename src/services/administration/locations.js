import { supabase } from "../../lib/supabase";

export async function getLocations() {
  const { data, error } = await supabase
    .from("locations")
    .select(`
      *,
      unit:units (
        id,
        name
      )
    `)
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getActiveLocations() {
  const { data, error } = await supabase
    .from("locations")
    .select("id, name, unit_id, unit:units(id, name)")
    .eq("active", true)
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function createLocation(location) {
  const { data, error } = await supabase
    .from("locations")
    .insert(location)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateLocation(id, location) {
  const { data, error } = await supabase
    .from("locations")
    .update(location)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function toggleLocation(id, active) {
  const { data, error } = await supabase
    .from("locations")
    .update({ active })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}