/*
 * Números de camisa. Linha: o próximo número depois do maior já dado
 * à linha. Goleiro: 1, 12, 23, 34... (de 11 em 11), também depois do
 * maior. Os números de goleiro nunca vão para a linha. Quem saiu da
 * escola continua com o número, então ele não volta a ser sugerido.
 */

export const isGoalkeeperNumber = (number) => number % 11 === 1;

// students: [{ shirt_number }]
export function nextShirtNumber(students, goalkeeper) {
  const used = new Set(students.map((student) => student.shirt_number).filter(Boolean));
  const same = [...used].filter((number) => isGoalkeeperNumber(number) === goalkeeper);
  const step = goalkeeper ? 11 : 1;

  let number = same.length ? Math.max(...same) : goalkeeper ? -10 : 1;
  do {
    number += step;
  } while (isGoalkeeperNumber(number) !== goalkeeper || used.has(number));

  return number;
}

// Aluno que já usa o número (outro que não o próprio)
export function shirtOwner(students, number, studentId) {
  return students.find((student) => student.shirt_number === number && student.id !== studentId) ?? null;
}

// Mensagem de número repetido, ou "" se pode usar
export function shirtConflict(students, number, studentId) {
  const owner = shirtOwner(students, number, studentId);
  if (!owner) return "";
  return `O número ${number} já é de ${owner.name}${owner.status === "left" ? " (saiu da escola)" : ""}.`;
}
