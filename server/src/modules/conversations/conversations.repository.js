import { supabase } from "../../config/supabase.js";

export async function getAll() {

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
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) throw error;

  return data ?? [];

}

