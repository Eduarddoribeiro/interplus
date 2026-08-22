import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

import SectionTitle from "../../../components/common/SectionTitle";

import { getActiveUnits } from "../../../../services/administration/units";
import { getActiveLocations } from "../../../../services/administration/locations";
import { getActiveModalities } from "../../../../services/administration/modalities";
import { getActiveCategories } from "../../../../services/categories";
import { getActiveCoaches } from "../../../../services/administration/coaches";
import { createTrainingGroup } from "../../../../services/administration/trainingGroups";

export default function TrainingGroupForm() {
  const navigate = useNavigate();

  const [units, setUnits] = useState([]);
  const [locations, setLocations] = useState([]);
  const [modalities, setModalities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coaches, setCoaches] = useState([]);

const [form, setForm] = useState({
  name: "",
  unit_id: "",
  modality_id: "",
  category_id: "",
  coach_id: "",
  active: true,
});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [
      units,
      locations,
      modalities,
      categories,
    coaches,
    ] = await Promise.all([
      getActiveUnits(),
      getActiveLocations(),
      getActiveModalities(),
      getActiveCategories(),
      getActiveCoaches(),
    ]);

    setUnits(units);
    setLocations(locations);
    setModalities(modalities);
    setCategories(categories);
    setCoaches(coaches);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((old) => ({
      ...old,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

 async function handleSubmit(e) {
  e.preventDefault();

  try {
    const trainingGroup =
      await createTrainingGroup(form);

    navigate(
      `/admin/administration/training-groups/${trainingGroup.id}`
    );
  } catch (err) {
    console.error(err);
  }
}

  return (
    <div className="space-y-8">

      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={18} />
        Voltar
      </button>

      <SectionTitle
        title="Nova Turma"
        subtitle="Cadastre uma nova turma."
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-neutral-200 bg-white p-8 space-y-6"
      >

        <div>

          <label>Nome</label>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="mt-2 w-full rounded-xl border px-4 py-3"
          />

        </div>

        <div className="grid grid-cols-2 gap-5">

          <Select
            label="Unidade"
            name="unit_id"
            value={form.unit_id}
            onChange={handleChange}
            items={units}
          />

         

          <Select
            label="Modalidade"
            name="modality_id"
            value={form.modality_id}
            onChange={handleChange}
            items={modalities}
          />

          <Select
            label="Categoria"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            items={categories}
          />

           <Select
            label="Professor"
            name="coach_id"
            value={form.coach_id}
            onChange={handleChange}
            items={coaches} 
          />

   

        </div>

        <label className="flex items-center gap-3">

          <input
            type="checkbox"
            name="active"
            checked={form.active}
            onChange={handleChange}
          />

          Turma ativa

        </label>

        <div className="flex justify-end">

          <button
            className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-white"
          >
            <Save size={18} />
            Salvar Turma
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