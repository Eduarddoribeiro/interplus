import { supabase } from "../lib/supabase";

export async function getContacts() {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

export async function createContact(contact) {
  console.log("Contato enviado:", contact);

  const { data, error } = await supabase
    .from("contacts")
    .insert(contact)
    .select()
    .single();

  console.log({ data, error });

  if (error) throw error;

  return data;
}