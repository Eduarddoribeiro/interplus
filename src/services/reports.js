import { supabase } from "../lib/supabase";

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

export async function getReportsData() {
  const { data, error } = await supabase
    .from("contacts")
    .select(CONTACT_SELECT)
    // Fora dos relatórios: arquivados e os criados automaticamente
    // pelo WhatsApp que ainda não passaram pela triagem (status "new")
    .is("archived_at", null)
    .neq("status", "new")
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return data ?? [];
}