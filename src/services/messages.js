import { supabase } from "../lib/supabase";

export async function saveOutgoingMessage({
  contactId,
  message,
  whatsappMessageId = null,
  senderPhone = null,
  senderName = null,
  instanceName = import.meta.env.VITE_EVOLUTION_INSTANCE,
}) {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      contact_id: contactId,
      direction: "outgoing",
      message,
      message_type: "text",
      status: "sent",
      whatsapp_message_id: whatsappMessageId,
      sender_phone: senderPhone,
      sender_name: senderName,
      instance_name: instanceName,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function getMessages(contactId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}