import { describe, expect, it } from "vitest";

import { isGoalkeeperNumber, nextShirtNumber, shirtConflict } from "./shirtNumbers.js";

const withNumbers = (...numbers) => numbers.map((shirt_number, index) => ({ id: String(index), shirt_number }));

describe("nextShirtNumber", () => {
  it("começa em 2 na linha e em 1 no gol", () => {
    expect(nextShirtNumber([], false)).toBe(2);
    expect(nextShirtNumber([], true)).toBe(1);
  });

  it("linha segue depois do maior e pula os números de goleiro", () => {
    expect(nextShirtNumber(withNumbers(1, 5, 9), false)).toBe(10);
    expect(nextShirtNumber(withNumbers(1, 10, 11), false)).toBe(13);
    expect(nextShirtNumber(withNumbers(21), false)).toBe(22);
    expect(nextShirtNumber(withNumbers(22), false)).toBe(24);
  });

  it("goleiro vai de 11 em 11", () => {
    expect(nextShirtNumber(withNumbers(1), true)).toBe(12);
    expect(nextShirtNumber(withNumbers(1, 12, 40), true)).toBe(23);
  });

  it("não repete número já usado", () => {
    expect(nextShirtNumber(withNumbers(1, 12, 23), true)).toBe(34);
    expect(isGoalkeeperNumber(45)).toBe(true);
    expect(isGoalkeeperNumber(44)).toBe(false);
  });
});

describe("shirtConflict", () => {
  const students = [
    { id: "a", name: "Teo", shirt_number: 10, status: "active" },
    { id: "b", name: "Lia", shirt_number: 7, status: "left" },
  ];

  it("avisa quem já usa o número", () => {
    expect(shirtConflict(students, 10, "x")).toBe("O número 10 já é de Teo.");
    expect(shirtConflict(students, 7, "x")).toBe("O número 7 já é de Lia (saiu da escola).");
  });

  it("o próprio aluno pode manter o número", () => {
    expect(shirtConflict(students, 10, "a")).toBe("");
  });
});
