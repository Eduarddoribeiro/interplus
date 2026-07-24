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

  // Não valida lista de interesse
  if (
    contact.status !== "waiting_list" &&
    contact.category_id &&
    contact.experimental_date
  ) {

    // Busca o limite da categoria
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("experimental_limit")
      .eq("id", contact.category_id)
      .single();

    if (categoryError) throw categoryError;

    // Conta quantos agendamentos já existem
    const { count, error: countError } = await supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("category_id", contact.category_id)
      .eq("experimental_date", contact.experimental_date)
      .in("status", [
        "pending_confirmation",
        "confirmed",
      ]);

    if (countError) throw countError;

    if (count >= category.experimental_limit) {
      throw new Error("Esta data não possui mais vagas.");
    }
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert(contact)
    .select()
    .single();

  if (error) throw error;

  return data;
}