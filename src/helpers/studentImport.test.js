import { describe, expect, it } from "vitest";

import {
  checklistStatus,
  decodeFile,
  eventStatus,
  feeStatus,
  findContact,
  findStudent,
  headerKeys,
  parseCsv,
  parseDate,
  readSpreadsheet,
} from "./studentImport.js";

// Mesmos cabeçalhos da planilha de controle (dados inventados)
const HEADERS = [
  "Ativo", "Carimbo de data/hora", "Endereço de e-mail", "E-mail", "Nome do Aluno", "Categoria",
  "Experiência Colorada", "Pagamento", "Copa Colorado", "Numeração", "Comunidade",
  "Participa da Taça Gaúcha?", "Inscrição", "Rodada 1", "Rodada 2", "Rodada 05",
  "Contrato gerado?", "Contrato assinado?", "Contrato Digitalizado?", "Contrato enviado?",
  "Nome do Responsável", "Matrícula", "Primeira mensalidade", "Tel. Celular", "Uniforme",
  "Próxima ação", "Método ", "Data de nascimento", "Nome do segundo responsável",
  "Escolha o tamanho ideal:", "Tel.Celular ", "Sexo", "CPF", "RG", "Sexo ", "CPF 2", "RG 2",
  "Sexo 2", "Melhor dia de vencimento", "Tipo Sanguíneo", "Plano de Saúde? Se sim qual?",
  "Alergia a medicamentos? Se sim, quais?",
];

const ROW = [
  "Sim", "15/02/2026 10:20:00", "conta@exemplo.com", "mae@exemplo.com", "Teo Exemplo", "Sub-11",
  "Interessado", "Pago", "Não", "Interesse", "Sim",
  "Sim", "Pago", "Pago", "Isento", "Não participou",
  "Sim", "Sim", "Não", "—",
  "Ana Exemplo", "—", "Paga", "(00) 99999-1234", "Pendente",
  "Cobrar uniforme", "Pix", "03/05/2015", "Não tem",
  "Tamanho 12", "", "Feminino", "000.000.000-00", "123", "", "", "", "Masculino", "Dia 7", "O+", "Não",
  "Dipirona",
];

const CATEGORIES = [{ id: 11, name: "Sub-11" }, { id: 9, name: "Sub-09" }];

function csv(rows) {
  return rows.map((cells) => cells.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\r\n");
}

describe("parseCsv", () => {
  it("lê aspas, vírgula e quebra de linha dentro do campo", () => {
    expect(parseCsv('a,b\r\n"x, y","linha 1\nlinha 2"\r\n')).toEqual([
      ["a", "b"],
      ["x, y", "linha 1\nlinha 2"],
    ]);
  });

  it("aceita ponto e vírgula (Excel)", () => {
    expect(parseCsv("a;b\n1;2")).toEqual([["a", "b"], ["1", "2"]]);
  });

  it("decodifica UTF-8 e cai para Windows-1252", () => {
    expect(decodeFile(new TextEncoder().encode("Matrícula"))).toBe("Matrícula");
    expect(decodeFile(new Uint8Array([0x4d, 0x61, 0x74, 0x72, 0xed, 0x63, 0x75, 0x6c, 0x61]))).toBe("Matrícula");
  });
});

describe("headerKeys", () => {
  it("numera cabeçalhos repetidos pela ordem", () => {
    expect(headerKeys(["Sexo", "CPF", "Sexo ", "CPF", "Sexo"])).toEqual(["sexo", "cpf", "sexo#2", "cpf#2", "sexo#3"]);
  });
});

describe("valores da planilha", () => {
  it("datas no formato brasileiro", () => {
    expect(parseDate("03/05/2015")).toBe("2015-05-03");
    expect(parseDate("15/02/2026 10:20:00")).toBe("2026-02-15");
    expect(parseDate("—")).toBeNull();
    // Número de série do Excel
    expect(parseDate("42127")).toBe("2015-05-03");
    expect(parseDate("46068.43")).toBe("2026-02-15");
  });

  it("contrato: só Sim é feito", () => {
    expect(checklistStatus("Sim")).toBe("done");
    expect(checklistStatus("Não")).toBe("pending");
    expect(checklistStatus("—")).toBe("pending");
  });

  it("pagamentos: travessão vira não se aplica", () => {
    expect(feeStatus("Paga")).toBe("done");
    expect(feeStatus("Pago")).toBe("done");
    expect(feeStatus("Pendente")).toBe("pending");
    expect(feeStatus("Data combinada")).toBe("pending");
    expect(feeStatus("Isento")).toBe("exempt");
    expect(feeStatus("—")).toBe("exempt");
  });

  it("situação nas rodadas", () => {
    expect(eventStatus("Pago (Próximo)")).toBe("paid");
    expect(eventStatus("Não participou")).toBe("absent");
    expect(eventStatus("Devolver")).toBe("refund");
    expect(eventStatus("Confirmado")).toBe("confirmed");
    expect(eventStatus("—")).toBeNull();
  });
});

describe("readSpreadsheet", () => {
  const { records, ignored } = readSpreadsheet(csv([HEADERS, ROW]), { categories: CATEGORIES });
  const [record] = records;

  it("monta aluno, responsável e matrícula", () => {
    expect(record.line).toBe(2);
    expect(record.student).toMatchObject({ name: "Teo Exemplo", birth_date: "2015-05-03", gender: "Masculino" });
    expect(record.guardians).toEqual([
      { email: "mae@exemplo.com", name: "Ana Exemplo", phone: "(00) 99999-1234", gender: "Feminino", cpf: "000.000.000-00", rg: "123" },
    ]);
    expect(record.enrollment).toMatchObject({
      start_date: "2026-02-15",
      category_id: 11,
      payment_method: "pix",
      due_day: 7,
      uniform_size: "Tamanho 12",
      next_action: "Cobrar uniforme",
    });
    expect(record.issues).toEqual([]);
  });

  it("pendências pelas colunas de controle", () => {
    expect(record.tasks).toEqual({
      community: "done",
      contract_signed: "done",
      enrollment_fee: "exempt",
      first_payment: "done",
      uniform: "pending",
    });
  });

  it("saúde e eventos", () => {
    expect(record.health).toEqual({ blood_type: "O+", health_plan: "Não", drug_allergies: "Dipirona" });
    expect(record.taca).toEqual({ entry: "paid", rounds: { 1: "paid", 2: "exempt", 5: "absent" } });
    expect(record.events).toEqual({ experience: "paid", cup: null });
  });

  it("lista as colunas que não entram", () => {
    expect(ignored).toEqual(["Numeração", "Contrato gerado?", "Contrato Digitalizado?", "Contrato enviado?"]);
  });

  it("aluno inativo entra como 'saiu' e categoria desconhecida vira aviso", () => {
    const other = [...ROW];
    other[0] = "Não";
    other[5] = "Sub-21";
    const [result] = readSpreadsheet(csv([HEADERS, other]), { categories: CATEGORIES }).records;

    expect(result.student.status).toBe("left");
    expect(result.issues).toEqual(['Categoria "Sub-21" não existe no CRM']);
  });

  it("quem não participa da Taça não leva as rodadas", () => {
    const other = [...ROW];
    other[11] = "Não";
    expect(readSpreadsheet(csv([HEADERS, other]), { categories: CATEGORIES }).records[0].taca).toBeNull();
  });
});

describe("quem já está no CRM", () => {
  const { records } = readSpreadsheet(csv([HEADERS, ROW]), { categories: CATEGORIES });
  const [record] = records;

  it("contato com mesmo telefone e primeiro nome", () => {
    const contacts = [
      { id: "a", child_name: "Teo Outro", phone: "00999991234" },
      { id: "b", child_name: "Teo da Silva", phone: "5500999991234" },
    ];
    expect(findContact(record, [contacts[0]])?.id).toBe("a");
    expect(findContact(record, [contacts[1]])?.id).toBe("b");
  });

  it("nome completo e nascimento iguais, telefone diferente", () => {
    expect(findContact(record, [{ id: "c", child_name: "teo exemplo", birth_date: "2015-05-03", phone: "1" }])?.id).toBe("c");
  });

  it("irmão com o mesmo telefone não casa", () => {
    expect(findContact(record, [{ id: "d", child_name: "Lia Exemplo", phone: "00999991234" }])).toBeNull();
  });

  it("aluno já importado", () => {
    expect(findStudent(record, [{ id: "s", name: "Teo Exemplo", birth_date: "2015-05-03" }])?.id).toBe("s");
  });
});
