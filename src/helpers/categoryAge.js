// src/helpers/categoryAge.js

/*
 * Categoria pela IDADE QUE O ATLETA COMPLETA NO ANO (padrão do
 * futebol de base): Sub-09 = completa 8 ou 9 anos no ano.
 *
 * Assim a virada do ano não exige reescrever datas: em 2027 o
 * Sub-09 passa a ser quem nasceu em 2018–2019 automaticamente.
 */

export function currentYear() {
  return new Date().getFullYear();
}

// "2017-05-20" -> idade que completa no ano corrente
export function ageInYear(birthDate, year = currentYear()) {
  const birthYear = Number(String(birthDate).slice(0, 4));

  return birthYear ? year - birthYear : null;
}

// Anos de nascimento da categoria no ano corrente
export function birthYearsOf(category, year = currentYear()) {
  if (category?.min_age == null || category?.max_age == null) return null;

  return {
    from: year - category.max_age,
    to: year - category.min_age,
  };
}

/*
 * Datas antigas (min/max_birth_date) mantidas em sincronia com as
 * idades, para quem ainda as lê.
 */
export function birthDatesFor(minAge, maxAge, year = currentYear()) {
  return {
    min_birth_date: `${year - maxAge}-01-01`,
    max_birth_date: `${year - minAge}-12-31`,
  };
}
