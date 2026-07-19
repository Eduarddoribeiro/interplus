import { useState } from "react";
import { createContact } from "../../../services/contacts";

export default function ContactForm({ onSuccess, onCancel }) {
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
  child_name: "",
  birth_date: "",
  responsible_name: "",
  phone: "",
  email: "",
  neighborhood: "",
  source: "Instagram",
  trained_elsewhere: false,
  previous_club: "",
  observations: "",
});

  function handleChange(e) {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? e.target.checked
          : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSaving(true);

      await createContact({
        ...form,
        status: "new_contact",
        unit: "Viamão",
      });

      onSuccess();

    } catch (err) {
      console.error(err);
      alert("Erro ao salvar contato.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* Dados do Atleta */}

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Dados do Atleta</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Nome do atleta
            </label>

            <input
  type="text"
  name="child_name"
  value={form.child_name}
  onChange={handleChange}
  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-inter-red"
/>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Data de nascimento
            </label>

           <input
  type="date"
  name="birth_date"
  value={form.birth_date}
  onChange={handleChange}
  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-inter-red"
/>
          </div>
        </div>
      </section>

      {/* Responsável */}

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Dados do Responsável</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">
              Nome do responsável
            </label>

            <input
              type="text"
              name="responsible_name"
              value={form.responsible_name}
              onChange={handleChange}
              className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-inter-red"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">WhatsApp</label>

            <input
  type="tel"
  name="phone"
  value={form.phone}
  onChange={handleChange}
  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-inter-red"
/>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">E-mail</label>

          <input
  type="email"
  name="email"
  value={form.email}
  onChange={handleChange}
  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-inter-red"
/>
        </div>
      </section>

      {/* Informações */}

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Informações Gerais</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">Bairro</label>

                <input
                  type="text"
                  name="neighborhood"
                  value={form.neighborhood}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-inter-red"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Como conheceu a escola?
            </label>

            <select
  name="source"
  value={form.source}
  onChange={handleChange}
  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-inter-red"
>
  <option value="Instagram">Instagram</option>
  <option value="Facebook">Facebook</option>
  <option value="Google">Google</option>
  <option value="WhatsApp">WhatsApp</option>
  <option value="Indicação">Indicação</option>
  <option value="Passou em frente">Passou em frente</option>
  <option value="Evento">Evento</option>
  <option value="Outro">Outro</option>
</select>
          </div>
        </div>
      </section>

      {/* Histórico Esportivo */}

      <section className="space-y-4">
        <h3 className="text-lg font-semibold">Histórico Esportivo</h3>

        <div>
          <label className="mb-2 block text-sm font-medium">
            O atleta treina ou já treinou em outra escola?
          </label>

          <select
  name="trained_elsewhere"
  value={form.trained_elsewhere ? "Sim" : "Não"}
  onChange={(e) =>
    setForm((prev) => ({
      ...prev,
      trained_elsewhere: e.target.value === "Sim",
    }))
  }
  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-inter-red"
>
  <option value="Não">Não</option>
  <option value="Sim">Sim</option>
</select>
        </div>

       {form.trained_elsewhere && (
  <div>
    <label className="mb-2 block text-sm font-medium">
      Qual escola ou projeto?
    </label>

    <input
      type="text"
      name="previous_club"
      value={form.previous_club}
      onChange={handleChange}
      placeholder="Ex.: PSG Academy, Grêmio, Projeto Social..."
      className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-inter-red"
    />
  </div>
)}
      </section>

      {/* Observações */}

      <section>
        <label className="mb-2 block text-sm font-medium">Observações</label>

        <textarea
  rows={4}
  name="observations"
  value={form.observations}
  onChange={handleChange}
  className="w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-inter-red"
/>
      </section>

      {/* Botões */}

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-6">
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>

        <button
  type="submit"
  disabled={saving}
  className="rounded-xl bg-inter-red px-6 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50"
>
  {saving ? "Salvando..." : "Salvar Contato"}
</button>
      </div>
    </form>
  );
}
