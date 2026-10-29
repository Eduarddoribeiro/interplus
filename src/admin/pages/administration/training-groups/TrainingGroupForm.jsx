import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";

import { getActiveLocations } from "../../../../services/administration/locations";
import { getActiveModalities } from "../../../../services/administration/modalities";
import { getActiveCategories } from "../../../../services/categories";
import {
  createTrainingGroup,
  getTrainingGroup,
  setTrainingGroupCategories,
  updateTrainingGroup,
} from "../../../../services/administration/trainingGroups";

import {
  TRAINING_GROUP_STATUS,
  TRAINING_GROUP_STATUS_OPTIONS,
} from "../../../../constants/trainingGroupStatus";
import { BackLink } from "../components/CrudPage";
import { Button, inputClass } from "../../../ui";

const EMPTY_FORM = {
  name: "",
  location_id: "",
  modality_id: "",
  category_ids: [],
  status: TRAINING_GROUP_STATUS.OPEN,
  featured: false,
};

/*
 * Cadastro e edição de turma.
 *
 * A unidade não é escolhida aqui: ela vem do local
 * (Unidade = cidade, Local = ginásio/arena). Uma turma pode
 * atender mais de uma categoria (ex.: Sub-15 e Sub-17); os
 * professores ficam em cada horário.
 */
export default function TrainingGroupForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [locations, setLocations] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadData() {
    try {
      const [locations, modalities, categories, group] =
        await Promise.all([
          getActiveLocations(),
          getActiveModalities(),
          getActiveCategories(),
          isEditing ? getTrainingGroup(id) : null,
        ]);

      setLocations(locations);
      setModalities(modalities);
      setCategories(categories);

      if (group) {
        setForm({
          name: group.name ?? "",
          location_id: group.location_id ?? "",
          modality_id: group.modality_id ?? "",
          category_ids: group.categories?.length
            ? group.categories.map((item) => item.category?.id).filter(Boolean)
            : [group.category_id].filter(Boolean),
          status: group.status ?? TRAINING_GROUP_STATUS.OPEN,
          featured: !!group.featured,
        });
      }
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os dados da turma.");
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((old) => ({
      ...old,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function toggleCategory(categoryId) {
    setForm((old) => ({
      ...old,
      category_ids: old.category_ids.includes(categoryId)
        ? old.category_ids.filter((item) => item !== categoryId)
        : [...old.category_ids, categoryId],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const location = locations.find(
      (item) => String(item.id) === String(form.location_id),
    );

    // Categorias na ordem do cadastro (a primeira é a principal)
    const categoryIds = categories
      .map((category) => category.id)
      .filter((categoryId) => form.category_ids.includes(categoryId));

    if (!form.name.trim() || !location || !form.modality_id || !categoryIds.length) {
      setError("Preencha nome, local, modalidade e ao menos uma categoria.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      location_id: location.id,
      unit_id: location.unit_id,
      modality_id: form.modality_id,
      category_id: categoryIds[0],
      status: form.status,
      featured: form.featured,
    };

    try {
      setSaving(true);
      setError("");

      const trainingGroup = isEditing
        ? await updateTrainingGroup(id, payload)
        : await createTrainingGroup(payload);

      await setTrainingGroupCategories(trainingGroup.id, categoryIds);

      navigate(`/admin/administration/training-groups/${trainingGroup.id}`);
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar a turma.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">

      <BackLink
        to={isEditing ? `/admin/administration/training-groups/${id}` : "/admin/administration/training-groups"}
        label={isEditing ? "Voltar para a turma" : "Turmas"}
      />

      <SectionTitle title={isEditing ? "Editar turma" : "Nova turma"} />

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl space-y-6 rounded-xl border border-line bg-white p-5 sm:p-6"
      >

        <div>
          <label htmlFor="group-name" className="mb-1.5 block text-sm font-medium text-ink">Nome</label>

          <input
            id="group-name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ex.: Sub-09 Noite"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <Select
            label="Local"
            name="location_id"
            value={form.location_id}
            onChange={handleChange}
            items={locations.map((location) => ({
              id: location.id,
              name: location.unit?.name
                ? `${location.name} (${location.unit.name})`
                : location.name,
            }))}
          />

          <Select
            label="Modalidade"
            name="modality_id"
            value={form.modality_id}
            onChange={handleChange}
            items={modalities}
          />

        </div>

        {/* CATEGORIAS */}
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink">Categorias atendidas</legend>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = form.category_ids.includes(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(category.id)}
                  className={`h-9 rounded-lg border px-3 text-sm font-medium transition-colors ${
                    selected
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-ink hover:border-neutral-400"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-sm text-muted">
            Marque mais de uma quando a turma juntar categorias (ex.: Sub-15 e Sub-17).
          </p>
        </fieldset>

        {/* SITUAÇÃO */}
        <fieldset className="space-y-3">
          <legend className="mb-1.5 text-sm font-medium text-ink">Situação</legend>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {TRAINING_GROUP_STATUS_OPTIONS.map((option) => {
              const selected = form.status === option.value;

              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-lg border p-4 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ink ${
                    selected
                      ? "border-ink ring-1 ring-ink"
                      : "border-line hover:border-neutral-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value={option.value}
                    checked={selected}
                    onChange={handleChange}
                    className="sr-only"
                  />

                  <span className="block font-semibold text-ink">
                    {option.label}
                  </span>

                  <span className="mt-1 block text-sm text-muted">
                    {option.description}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
            className="mt-1 h-4 w-4 accent-ink"
          />

          <span>
            <span className="block text-sm font-medium">Destacar no formulário</span>
            <span className="block text-sm text-muted">
              Turmas em destaque aparecem primeiro para os pais.
            </span>
          </span>
        </label>

        {error && (
          <p className="text-sm font-medium text-alert-text">{error}</p>
        )}

        <div className="flex justify-end border-t border-line pt-5">
          <Button type="submit" variant="primary" disabled={saving}>
            <Save size={17} aria-hidden="true" />
            {saving ? "Salvando…" : "Salvar turma"}
          </Button>
        </div>

      </form>

    </div>
  );
}

function Select({
  label,
  name,
  value,
  onChange,
  items,
}) {
  return (
    <div>
      <label htmlFor={`group-${name}`} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>

      <select
        id={`group-${name}`}
        name={name}
        value={value}
        onChange={onChange}
        className={inputClass}
      >
        <option value="">
          Selecione…
        </option>

        {items.map((item) => (
          <option
            key={item.id}
            value={item.id}
          >
            {item.name}
          </option>
        ))}

      </select>

    </div>
  );
}
