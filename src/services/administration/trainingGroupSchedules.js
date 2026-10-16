import { supabase } from "../../lib/supabase";

export async function getSchedulesByTrainingGroup(trainingGroupId) {
  const { data, error } = await supabase
    .from("training_group_schedules")
    .select("*")
    .eq("training_group_id", trainingGroupId)
    .order("weekday")
    .order("start_time");

  if (error) throw error;

  return data ?? [];
}

export async function createSchedule(schedule) {
  const { data, error } = await supabase
    .from("training_group_schedules")
    .insert(schedule)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateSchedule(id, schedule) {
  const { data, error } = await supabase
    .from("training_group_schedules")
    .update(schedule)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function toggleSchedule(id, active) {
  const { data, error } = await supabase
    .from("training_group_schedules")
    .update({
      active,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function deleteSchedule(id) {
  const { error } = await supabase
    .from("training_group_schedules")
    .delete()
    .eq("id", id);

  if (error) throw error;
}