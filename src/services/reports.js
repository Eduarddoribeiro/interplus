import { supabase } from "../lib/supabase";
import { withSessionLocation } from "../helpers/reportLocation";

const CONTACT_SELECT = `
  id,
  child_name,
  birth_date,
  responsible_name,
  phone,
  source,
  status,
  experimental_date,
  experimental_result,
  follow_up_date,
  enrolled_at,
  lost_reason,
  waiting_list_reason,
  waiting_list_at,
  entry_channel,
  first_contact_at,
  created_at,
  category:categories!contacts_category_id_fkey (
  id,
  name
),
  location_id,
  location:locations (
    id,
    name
  )
`;

// Local da experimental (horário → turma → local) de cada contato
const SESSION_LOCATION_SELECT = `
  contact_id,
  status,
  experimental_date,
  schedule:training_group_schedules (
    training_group:training_groups (
      location:locations ( id, name )
    )
  )
`;

export async function getReportsData() {
  const [contactsResult, sessionsResult] = await Promise.all([
    supabase
      .from("contacts")
      .select(CONTACT_SELECT)
      // Fora dos relatórios: arquivados e os criados automaticamente
      // pelo WhatsApp que ainda não passaram pela triagem (status "new")
      .is("archived_at", null)
      .neq("status", "new")
      .order("created_at", {
        ascending: true,
      }),
    supabase.from("experimental_sessions").select(SESSION_LOCATION_SELECT),
  ]);

  if (contactsResult.error) throw contactsResult.error;

  // Sem as aulas, o relatório continua com o local gravado no contato
  if (sessionsResult.error) {
    console.error("Erro ao buscar o local das experimentais:", sessionsResult.error);
    return contactsResult.data ?? [];
  }

  return withSessionLocation(contactsResult.data ?? [], sessionsResult.data ?? []);
}
