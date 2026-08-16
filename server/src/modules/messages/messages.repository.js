import { supabase } from "../../config/supabase.js";

export async function create(message) {
  const { data, error } = await supabase
    .from("messages")
    .insert(message)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getInboxMessages() {
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      message,
      direction,
      created_at,
      contact:contacts (
        id,
        child_name,
        responsible_name,
        phone,
        status,
        unread_count
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data ?? [];
}