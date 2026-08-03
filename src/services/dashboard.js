import { supabase } from "../lib/supabase";

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStartOfMonthISO() {
  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  );

  return startOfMonth.toISOString();
}

export async function getDashboardData() {
  const today = getLocalDateString();
  const startOfMonth = getStartOfMonthISO();

  const [
    todayExperimentalsResult,
    pendingConfirmationResult,
    followUpsResult,
    monthEnrollmentsResult,
  ] = await Promise.all([
    // 1. Agenda de hoje
    supabase
      .from("contacts")
      .select(`
        id,
        child_name,
        birth_date,
        responsible_name,
        phone,
        source,
        neighborhood,
        status,
        experimental_date,
        experimental_time,
        category:categories (
          id,
          name,
          weekday,
          start_time,
          end_time
        )
      `)
      .eq("experimental_date", today)
      .in("status", [
        "pending_confirmation",
        "confirmed",
        "attended",
        "no_show",
      ])
      .order("experimental_time", {
        ascending: true,
      }),

    // 2. Experimentais futuras aguardando confirmação
    supabase
      .from("contacts")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "pending_confirmation")
      .gte("experimental_date", today),

    // 3. Retornos pendentes
    supabase
      .from("contacts")
      .select(`
        id,
        child_name,
        responsible_name,
        phone,
        status,
        follow_up_date,
        internal_notes,
        experimental_date
      `)
      .eq("status", "follow_up")
      .order("follow_up_date", {
        ascending: true,
        nullsFirst: false,
      }),

    // 4. Matrículas realizadas no mês atual
    supabase
      .from("contacts")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "enrolled")
      .gte("enrolled_at", startOfMonth),
  ]);

  if (todayExperimentalsResult.error) {
    throw todayExperimentalsResult.error;
  }

  if (pendingConfirmationResult.error) {
    throw pendingConfirmationResult.error;
  }

  if (followUpsResult.error) {
    throw followUpsResult.error;
  }

  if (monthEnrollmentsResult.error) {
    throw monthEnrollmentsResult.error;
  }

  const todayExperimentals =
    todayExperimentalsResult.data ?? [];

  const followUps =
    followUpsResult.data ?? [];

  return {
    stats: {
      todayExperimentals: todayExperimentals.length,

      pendingConfirmation:
        pendingConfirmationResult.count ?? 0,

      pendingFollowUps:
        followUps.length,

      monthEnrollments:
        monthEnrollmentsResult.count ?? 0,
    },

    todayExperimentals,

    followUps,
  };
}