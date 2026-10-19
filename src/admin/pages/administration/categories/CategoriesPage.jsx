import { useEffect, useState } from "react";

import CrudPage from "../components/CrudPage";
import ConfirmDialog from "../components/ConfirmDialog";

import {
  getCategories,
  createCategory,
  updateCategory,
  toggleCategory,
  deleteCategory,
} from "../../../../services/categories";

import CategoriesTable from "./CategoriesTable";
import CategoryModal from "./CategoryModal";

import { birthDatesFor } from "../../../../helpers/categoryAge";

const EMPTY_FORM = {
  name: "",
  min_age: "",
  max_age: "",
  order_index: 0,
  active: true,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);

      const data = await getCategories();

      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

  function handleCreate() {
    setEditing(null);

    setForm(EMPTY_FORM);

    setOpen(true);
  }

  function handleEdit(category) {
    setEditing(category);

    setForm({
      name: category.name,
      min_age: category.min_age ?? "",
      max_age: category.max_age ?? "",
      order_index: category.order_index ?? 0,
      active: category.active,
    });

    setOpen(true);
  }

  async function handleSave() {
    try {
      const payload = {
        name: form.name,
        min_age: Number(form.min_age),
        max_age: Number(form.max_age),
        // Datas antigas mantidas em sincronia com as idades
        ...birthDatesFor(Number(form.min_age), Number(form.max_age)),
        order_index: Number(form.order_index) || 0,
        active: form.active,
      };

      if (editing) {
        await updateCategory(editing.id, payload);
      } else {
        await createCategory(payload);
      }

      setOpen(false);

      await loadCategories();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggle(category) {
    try {
      await toggleCategory(category.id, !category.active);

      await loadCategories();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete() {
    try {
      await deleteCategory(categoryToDelete.id);

      setCategoryToDelete(null);

      await loadCategories();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <CrudPage
        title="Categorias"
        subtitle="Gerencie as categorias (faixas etárias) da escola."
        createLabel="Nova Categoria"
        onCreate={handleCreate}
      >
        <CategoriesTable
          categories={categories}
          loading={loading}
          onEdit={handleEdit}
          onToggle={handleToggle}
          onDelete={setCategoryToDelete}
        />
      </CrudPage>

      <CategoryModal
        open={open}
        editing={editing}
        form={form}
        onChange={handleChange}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!categoryToDelete}
        title="Excluir categoria"
        description="Tem certeza que deseja excluir esta categoria? Essa ação não pode ser desfeita."
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
