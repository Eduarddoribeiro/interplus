export default function LeadExperimental({
  conversation,
}) {
  if (!conversation) return null;

  const {
    experimentalDate,
    experimentalStatus,
  } = conversation;

  return (
    <section className="rounded-2xl border bg-white p-5">

      <h3 className="font-bold">
        Experimental
      </h3>

      {!experimentalDate ? (

        <p className="mt-3 text-sm text-neutral-500">
          Nenhuma experimental agendada.
        </p>

      ) : (

        <>
          <p className="mt-3 text-sm font-medium">
            {new Date(
              experimentalDate
            ).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {experimentalStatus && (
            <p className="mt-2 text-xs text-neutral-500">
              {experimentalStatus}
            </p>
          )}

        </>

      )}

    </section>
  );
}