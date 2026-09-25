/**
 * DADOS FICTÍCIOS — somente para o modo protótipo (NEXT_PUBLIC_PROTOTYPE=true).
 * Nomes inventados; CPFs com dígitos verificadores inválidos (não pertencem a
 * ninguém); e-mails no domínio reservado .test.
 */
import { daysFromToday } from "@/lib/prototype/dates";

import { type Client } from "../types";

export function getMockClients(now = new Date()): Client[] {
  const d = (days: number, time?: string) => daysFromToday(days, time, now);

  return [
    {
      id: "cli-001",
      kind: "PF",
      name: "Mariana Exemplo Albuquerque",
      document: "12345678900",
      rg: "1234567",
      email: "mariana.exemplo@cliente.test",
      phone: "81987650001",
      address: {
        cep: "50030230",
        street: "Rua Fictícia das Flores",
        number: "120",
        district: "Boa Vista",
        city: "Recife",
        uf: "PE",
      },
      legalBasis: "execucao_contrato",
      consent: { acceptedAt: d(-120, "10:12"), ip: "203.0.113.24", termVersion: "2026-09" },
      responsible: "Dra. Helena Modelo",
      status: "ativo",
      createdAt: d(-120),
      history: [
        {
          at: d(-120, "10:12"),
          description: "Cadastro criado e termo de consentimento aceito (versão 2026-09)",
          actor: "Carla Demonstração",
        },
        {
          at: d(-90, "15:40"),
          description: "Contrato de honorários assinado",
          actor: "Dra. Helena Modelo",
        },
        { at: d(-12, "11:05"), description: "Endereço atualizado", actor: "Carla Demonstração" },
      ],
    },
    {
      id: "cli-002",
      kind: "PJ",
      name: "Padaria Pão Fictício Ltda.",
      document: "11222333000199",
      email: "financeiro@paoficticio.test",
      phone: "8132210002",
      address: {
        cep: "51020000",
        street: "Avenida Exemplo",
        number: "900",
        district: "Boa Viagem",
        city: "Recife",
        uf: "PE",
      },
      legalBasis: "execucao_contrato",
      responsible: "Dr. Rafael Exemplo",
      status: "ativo",
      createdAt: d(-300),
      history: [
        { at: d(-300, "09:00"), description: "Cadastro criado", actor: "Carla Demonstração" },
        {
          at: d(-40, "16:20"),
          description: "Novo processo trabalhista vinculado",
          actor: "Dr. Rafael Exemplo",
        },
      ],
    },
    {
      id: "cli-003",
      kind: "PF",
      name: "João Teste de Souza",
      document: "98765432100",
      rg: "7654321",
      email: "joao.teste@cliente.test",
      phone: "81999990003",
      address: {
        cep: "53020140",
        street: "Rua dos Exemplos",
        number: "45",
        district: "Carmo",
        city: "Olinda",
        uf: "PE",
      },
      legalBasis: "exercicio_direitos",
      responsible: "Dra. Helena Modelo",
      status: "ativo",
      createdAt: d(-60),
      history: [
        { at: d(-60, "14:00"), description: "Cadastro criado", actor: "Carla Demonstração" },
      ],
    },
    {
      id: "cli-004",
      kind: "PF",
      name: "Ana Amostra Lins",
      document: "45678912300",
      email: "ana.amostra@cliente.test",
      phone: "81988880004",
      address: {
        cep: "54410010",
        street: "Rua Demonstração",
        number: "77",
        district: "Piedade",
        city: "Jaboatão dos Guararapes",
        uf: "PE",
      },
      legalBasis: "consentimento",
      consent: { acceptedAt: d(-30, "09:48"), ip: "198.51.100.77", termVersion: "2026-09" },
      responsible: "Dr. Rafael Exemplo",
      status: "ativo",
      createdAt: d(-30),
      history: [
        {
          at: d(-30, "09:48"),
          description: "Cadastro criado pelo portal e consentimento registrado",
          actor: "Ana Amostra Lins",
        },
      ],
    },
    {
      id: "cli-005",
      kind: "PJ",
      name: "Construtora Modelo S.A.",
      document: "44555666000188",
      email: "juridico@construtoramodelo.test",
      phone: "8134560005",
      address: {
        cep: "50050000",
        street: "Avenida Fictícia",
        number: "1500",
        district: "Ilha do Leite",
        city: "Recife",
        uf: "PE",
      },
      legalBasis: "execucao_contrato",
      responsible: "Dra. Helena Modelo",
      status: "ativo",
      createdAt: d(-500),
      history: [
        { at: d(-500, "10:00"), description: "Cadastro criado", actor: "Carla Demonstração" },
      ],
    },
    {
      id: "cli-006",
      kind: "PF",
      name: "Carlos Fictício Barreto",
      document: "32165498700",
      email: "carlos.ficticio@cliente.test",
      phone: "81977770006",
      address: {
        cep: "50710000",
        street: "Rua do Teste",
        number: "8",
        district: "Madalena",
        city: "Recife",
        uf: "PE",
      },
      legalBasis: "exercicio_direitos",
      responsible: "Dr. Rafael Exemplo",
      status: "inativo",
      createdAt: d(-800),
      history: [
        { at: d(-800, "10:00"), description: "Cadastro criado", actor: "Carla Demonstração" },
        {
          at: d(-100, "17:30"),
          description: "Cliente inativado após encerramento do processo",
          actor: "Dra. Helena Modelo",
        },
      ],
    },
  ];
}

export function getMockClient(id: string, now = new Date()): Client | undefined {
  return getMockClients(now).find((client) => client.id === id);
}
