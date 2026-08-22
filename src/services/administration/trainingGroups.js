import { supabase } from "../../lib/supabase";


export async function getTrainingGroups() {
  const { data, error } = await supabase
    .from("training_groups")
    .select(`
      *,
      unit:units(
        id,
        name
      ),
      modality:modalities(
        id,
        name
      ),
      category:categories(
        id,
        name
      ),
      coach:coaches(
        id,
        name
      )
    `)
    .order("name");

  if (error) throw error;

  return data ?? [];
}

export async function getTrainingGroup(id) {
  const { data, error } = await supabase
    .from("training_groups")
    .select(`
      *,
      unit:units(
        id,
        name
      ),
      modality:modalities(
        id,
        name
      ),
      category:categories(
        id,
        name
      ),
      coach:coaches(
        id,
        name
      )
    `)
    .eq("id", id)
    .single();

  if (error) throw error;

  return data;
}

export async function createTrainingGroup(group) {
  const { data, error } = await supabase
    .from("training_groups")
    .insert(group)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateTrainingGroup(id, group) {
  const { data, error } = await supabase
    .from("training_groups")
    .update(group)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function toggleTrainingGroup(id, active) {
  const { data, error } = await supabase
    .from("training_groups")
    .update({
      active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteTrainingGroup(id) {
  const { error } = await supabase
    .from("training_groups")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getActiveTrainingGroups() {
  const { data, error } = await supabase
    .from("training_groups")
    .select(`
      id,
      name,
      category:categories(name),
      modality:modalities(name),
      unit:units(name)
    `)
    .eq("active", true)
    .order("name");

  if (error) throw error;

  return data ?? [];
}