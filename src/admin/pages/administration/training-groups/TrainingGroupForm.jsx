import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
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
    <div className="space-y-8">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <SectionTitle
        title={isEditing ? "Editar Turma" : "Nova Turma"}
        subtitle={
          isEditing
            ? "Altere os dados e a situação da turma."
            : "Cadastre uma nova turma."
        }
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-line bg-white p-8 space-y-6"
      >

        <div>
          <label>Nome</label>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ex.: Sub-09 Noite"
            className="mt-2 w-full rounded-xl border px-4 py-3"
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
          <legend className="mb-2">Categorias atendidas</legend>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = form.category_ids.includes(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    selected
                      ? "border-red-600 bg-alert-soft text-alert-text"
                      : "border-line text-neutral-600 hover:border-neutral-300"
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
          <legend className="mb-2">Situação</legend>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {TRAINING_GROUP_STATUS_OPTIONS.map((option) => {
              const selected = form.status === option.value;

              return (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    selected
                      ? "border-red-600 bg-alert-soft"
                      : "border-line hover:border-neutral-300"
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
            className="mt-1"
          />

          <span>
            <span className="block">Destacar no formulário</span>
            <span className="block text-sm text-muted">
              Turmas em destaque aparecem primeiro para os pais.
            </span>
          </span>
        </label>

        {error && (
          <p className="text-sm font-medium text-red-600">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-inter-red px-6 py-3 text-white disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Salvando..." : "Salvar Turma"}
          </button>
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

      <label>{label}</label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-xl border px-4 py-3"
      >
        <option value="">
          Selecione...
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
