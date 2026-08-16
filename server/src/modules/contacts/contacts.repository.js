import { supabase } from "../../config/supabase.js";

export async function findByWhatsappJid(jid) {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("whatsapp_jid", jid)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function create(contact) {
  const { data, error } = await supabase
    .from("contacts")
    .insert(contact)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateInboxData(
  contactId,
  lastMessageAt
) {
  const { error } = await supabase
    .from("contacts")
    .update({
      last_message_at: lastMessageAt,
      unread_count: 1,
    })
    .eq("id", contactId);

  if (error) throw error;
}

export async function findByPhone(phone) {
  const { data, error } = await supabase
    .from("contacts")
    .select(`
      *,
      category:categories!contacts_category_id_fkey(
        id,
        name
      )
    `)
    .eq("phone", phone)
    .maybeSingle();

  if (error) throw error;

  return data;
}
export async function getAll() {

  const { data, error } =
    await supabase
      .from("contacts")
      .select(`
        *,
        category:categories!contacts_category_id_fkey(
          id,
          name
        )
      `);

  if (error) throw error;

  return data ?? [];

}