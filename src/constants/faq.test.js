import { describe, expect, it } from "vitest";

import { FAQ, faqJsonLd } from "./faq";

describe("FAQ do site", () => {
  it("não cita preço nem deixa resposta curta demais", () => {
    for (const item of FAQ) {
      expect(item.a).not.toMatch(/R\$\s?\d+,\d{2}|por mês/i);
      expect(item.a.length).toBeGreaterThan(80);
    }
  });

  it("gera o FAQPage do Google com todas as perguntas", () => {
    const data = JSON.parse(faqJsonLd());

    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toHaveLength(FAQ.length);
    expect(data.mainEntity[0].acceptedAnswer.text).toBe(FAQ[0].a);
  });

  it("escapa o < para não fechar a tag script", () => {
    const json = faqJsonLd([{ q: "a", a: "</script><b>" }]);

    expect(json).not.toContain("<");
    expect(JSON.parse(json).mainEntity[0].acceptedAnswer.text).toBe("</script><b>");
  });
});
