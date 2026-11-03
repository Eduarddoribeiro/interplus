import { describe, expect, it } from "vitest";

import {
  buildPayload,
  initialForm,
  isValidCpf,
  maskCep,
  maskCpf,
  maskPhone,
  validateStep,
} from "./enrollmentForm.js";
import { CONSENT_VERSION, HEALTH_QUESTIONS } from "../constants/enrollmentForm.js";

const TODAY = "2026-11-02";
// CPFs de exemplo, válidos só no cálculo (gerados para teste)
const CPF_A = "529.982.247-25";
const CPF_B = "111.444.777-35";

function filledForm() {
  const form = initialForm({
    student: { name: "Teo Exemplo", birth_date: "2016-05-03" },
    guardians: [{ name: "Ana Exemplo", phone: "5500999991234", email: "ana@exemplo.com" }],
  });

  Object.assign(form.student, { gender: "Masculino", cpf: CPF_A, school: "Escola Centro", school_type: "Pública" });
  Object.assign(form.enrollment, { uniform_size: "Tamanho 10", due_day: "7" });
  Object.assign(form.guardians[0], {
    gender: "Feminino",
    cpf: CPF_B,
    rg: "123",
    profession: "Professora",
    zip_code: "94400000",
    address: "Rua Um, 10",
    neighborhood: "Centro",
    city: "Viamão",
    state: "RS",
  });
  HEALTH_QUESTIONS.forEach(({ name }) => {
    form.health[name] = "Não";
  });

  return form;
}

describe("máscaras e CPF", () => {
  it("valida o dígito do CPF", () => {
    expect(isValidCpf(CPF_A)).toBe(true);
    expect(isValidCpf("52998224726")).toBe(false);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });

  it("formata CPF, celular e CEP enquanto digita", () => {
    expect(maskCpf("52998224725")).toBe("529.982.247-25");
    expect(maskCpf("5299")).toBe("529.9");
    expect(maskPhone("51999991234")).toBe("(51) 99999-1234");
    expect(maskPhone("5133331234")).toBe("(51) 3333-1234");
    expect(maskCep("94400000")).toBe("94400-000");
  });
});

describe("initialForm", () => {
  it("traz o que o CRM já sabe, sem o 55 do telefone", () => {
    const form = initialForm({
      student: { name: "Teo", birth_date: "2016-05-03" },
      guardians: [{ name: "Ana", phone: "5551999991234", email: null }, { name: null }],
    });

    expect(form.student).toMatchObject({ name: "Teo", birth_date: "2016-05-03" });
    expect(form.guardians[0]).toMatchObject({ name: "Ana", phone: "(51) 99999-1234", email: "" });
    expect(form.guardians[1].name).toBe("");
    expect(form.acceptedBy).toBe("Ana");
  });
});

describe("validateStep", () => {
  it("formulário completo passa em todas as etapas", () => {
    const form = { ...filledForm(), accepted: true };
    expect(validateStep("student", form, TODAY)).toEqual({});
    expect(validateStep("guardians", form, TODAY)).toEqual({});
    expect(validateStep("health", form, TODAY)).toEqual({});
    expect(validateStep("confirm", form, TODAY)).toEqual({});
  });

  it("saúde é obrigatória, menos o tipo sanguíneo", () => {
    const form = filledForm();
    form.health.drug_allergies = " ";
    expect(Object.keys(validateStep("health", form, TODAY))).toEqual(["health.drug_allergies"]);
  });

  it("aponta o campo que falta", () => {
    const form = filledForm();
    form.student.cpf = "123.456.789-00";
    form.enrollment.due_day = "";
    expect(Object.keys(validateStep("student", form, TODAY))).toEqual(["student.cpf", "enrollment.due_day"]);
  });

  it("nascimento no futuro não passa", () => {
    const form = filledForm();
    form.student.birth_date = "2027-01-01";
    expect(validateStep("student", form, TODAY)).toHaveProperty("student.birth_date");
  });

  it("segundo responsável é opcional, mas pede o nome se vier algo", () => {
    const form = filledForm();
    expect(validateStep("guardians", form, TODAY)).toEqual({});
    form.guardians[1].phone = "(51) 9999";
    expect(Object.keys(validateStep("guardians", form, TODAY))).toEqual(["guardians.1.name", "guardians.1.phone"]);
  });

  it("sem a autorização não envia", () => {
    expect(validateStep("confirm", filledForm(), TODAY)).toHaveProperty("accepted");
  });
});

describe("buildPayload", () => {
  it("monta o pacote com a versão da autorização", () => {
    const form = { ...filledForm(), accepted: true };
    const payload = buildPayload(form);

    expect(payload.student).toMatchObject({ name: "Teo Exemplo", cpf: CPF_A });
    expect(payload.guardians).toHaveLength(1);
    expect(payload.guardians[0]).toMatchObject({ phone: "(00) 99999-1234", zip_code: "94400-000" });
    expect(payload.enrollment).toEqual({ uniform_size: "Tamanho 10", due_day: 7 });
    expect(payload.consent).toMatchObject({ accepted: true, version: CONSENT_VERSION, health: true });
    expect(payload.consent.purpose_text).toContain("inclusive os de saúde");
  });

  it("saúde vai sempre, sem espaços nas pontas", () => {
    const form = { ...filledForm(), accepted: true };
    form.health.drug_allergies = " Dipirona ";
    expect(buildPayload(form).health.drug_allergies).toBe("Dipirona");
    expect(buildPayload(form).consent.health_text).toContain("obrigatórias");
  });
});
