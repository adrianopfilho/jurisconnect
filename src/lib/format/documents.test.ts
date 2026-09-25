import { describe, expect, it } from "vitest";

import { formatCep, formatCnj, formatCnpj, formatCpf, formatPhone, maskCpf } from "./documents";

describe("formatação de documentos", () => {
  it("mascara o CPF por padrão, escondendo início e dígitos verificadores", () => {
    expect(maskCpf("123.456.789-01")).toBe("***.456.789-**");
    expect(maskCpf("12345678901")).toBe("***.456.789-**");
    expect(maskCpf("123")).toBe("***.***.***-**");
  });

  it("formata CPF, CNPJ, CEP e telefone", () => {
    expect(formatCpf("12345678901")).toBe("123.456.789-01");
    expect(formatCnpj("12345678000190")).toBe("12.345.678/0001-90");
    expect(formatCep("50030230")).toBe("50030-230");
    expect(formatPhone("81987654321")).toBe("(81) 98765-4321");
    expect(formatPhone("8132214567")).toBe("(81) 3221-4567");
  });

  it("formata o número CNJ", () => {
    expect(formatCnj("00012345620258170001")).toBe("0001234-56.2025.8.17.0001");
    expect(formatCnj("inválido")).toBe("inválido");
  });
});
