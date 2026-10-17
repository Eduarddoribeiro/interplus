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
      location:locations(
        id,
        name
      ),
      modality:modalities(
        id,
        name
      ),
      category:categories!classes_category_id_fkey(
        id,
        name
      ),
      categories:training_group_categories(
        category:categories(id, name, order_index)
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
      location:locations(
        id,
        name
      ),
      modality:modalities(
        id,
        name
      ),
      category:categories!classes_category_id_fkey(
        id,
        name
      ),
      categories:training_group_categories(
        category:categories(id, name, order_index)
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

export async function updateTrainingGroupStatus(id, status) {
  const { data, error } = await supabase
    .from("training_groups")
    .update({
      status,
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
      category:categories!classes_category_id_fkey(name),
      modality:modalities(name),
      unit:units(name),
      location:locations(name)
    `)
    .neq("status", "inactive")
    .order("name");

  if (error) throw error;

  return data ?? [];
}
/**
 * Substitui as categorias atendidas pela turma.
 */
export async function setTrainingGroupCategories(trainingGroupId, categoryIds) {
  const { error: deleteError } = await supabase
    .from("training_group_categories")
    .delete()
    .eq("training_group_id", trainingGroupId);

  if (deleteError) throw deleteError;

  if (!categoryIds.length) return;

  const { error } = await supabase
    .from("training_group_categories")
    .insert(
      categoryIds.map((categoryId) => ({
        training_group_id: trainingGroupId,
        category_id: categoryId,
      })),
    );

  if (error) throw error;
}

/**
 * Nomes das categorias da turma, na ordem das categorias.
 */
export function getTrainingGroupCategoryNames(group) {
  const categories = (group?.categories ?? [])
    .map((item) => item.category)
    .filter(Boolean)
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  if (!categories.length) return group?.category?.name ?? "-";

  return categories.map((category) => category.name).join(", ");
}
