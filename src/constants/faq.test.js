import { describe, expect, it } from "vitest";

import { FAQ } from "./faq";

describe("FAQ do site", () => {
  it("não mostra preço (só o valor do seguro pode aparecer)", () => {
    const semSeguro = FAQ.filter((item) => !/seguro/i.test(item.q));

    for (const item of semSeguro) {
      expect(item.a).not.toMatch(/R\$\s?\d/);
      expect(item.a).not.toMatch(/reais|por mês|mensalidade de/i);
    }
  });

  it("não tem resposta de uma palavra", () => {
    for (const item of FAQ) {
      expect(item.a.split(/\s+/).length).toBeGreaterThan(10);
    }
  });

  it("não repete pergunta", () => {
    const perguntas = FAQ.map((item) => item.q);

    expect(new Set(perguntas).size).toBe(perguntas.length);
  });
});
