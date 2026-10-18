import { supabase } from "../../lib/supabase";

export async function getSchedulesByTrainingGroup(trainingGroupId) {
  const { data, error } = await supabase
    .from("training_group_schedules")
    .select(`
      *,
      coaches:training_group_schedule_coaches(
        coach:coaches(id, name)
      )
    `)
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
/**
 * Substitui os professores de um horário.
 */
export async function setScheduleCoaches(scheduleId, coachIds) {
  const { error: deleteError } = await supabase
    .from("training_group_schedule_coaches")
    .delete()
    .eq("schedule_id", scheduleId);

  if (deleteError) throw deleteError;

  if (!coachIds.length) return;

  const { error } = await supabase
    .from("training_group_schedule_coaches")
    .insert(
      coachIds.map((coachId) => ({
        schedule_id: scheduleId,
        coach_id: coachId,
      })),
    );

  if (error) throw error;
}
