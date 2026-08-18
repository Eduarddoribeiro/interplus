import { supabase } from "../../config/supabase.js";

export async function getAll() {

  const { data, error } = await supabase
    .from("contacts")
    .select(`
      id,
      child_name,
      responsible_name,
      phone,
      birth_date,
      source,
      unit,
      status,
      unread_count,
      whatsapp_push_name,

      category:categories!contacts_category_id_fkey (
        id,
        name
      )
    `);

  if (error) throw error;

  return data ?? [];

}