const digits = (value: string) => value.replace(/\D/g, "");

/** CPF mascarado (padrão de exibição, regra 9): ***.456.789-** */
export function maskCpf(cpf: string): string {
  const d = digits(cpf);
  if (d.length !== 11) return "***.***.***-**";
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

export function formatCpf(cpf: string): string {
  const d = digits(cpf);
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** CNPJ identifica pessoa jurídica (não é dado pessoal): exibido completo. */
export function formatCnpj(cnpj: string): string {
  const d = digits(cnpj);
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Número de processo no padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO */
export function formatCnj(cnj: string): string {
  const d = digits(cnj);
  if (d.length !== 20) return cnj;
  return `${d.slice(0, 7)}-${d.slice(7, 9)}.${d.slice(9, 13)}.${d.slice(13, 14)}.${d.slice(14, 16)}.${d.slice(16)}`;
}

export function formatPhone(phone: string): string {
  const d = digits(phone);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

export function formatCep(cep: string): string {
  const d = digits(cep);
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : cep;
}
