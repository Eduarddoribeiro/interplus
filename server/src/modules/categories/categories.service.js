import * as repository from "./categories.repository.js";

export async function getCategories() {
  return repository.getAll();
}