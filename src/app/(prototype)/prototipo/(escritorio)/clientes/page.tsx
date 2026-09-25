import { type Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMockCases } from "@/features/cases/mocks";
import { getMockClients } from "@/features/clients/mocks";
import { formatCnpj, formatPhone, maskCpf } from "@/lib/format/documents";

export const metadata: Metadata = { title: "Clientes" };

export default function DemoClientsPage() {
  const clients = getMockClients();
  const cases = getMockCases();

  return (
    <>
      <PageHeader
        title="Clientes"
        description={`${clients.length} clientes cadastrados (dados fictícios).`}
      />
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Documento</TableHead>
                <TableHead className="hidden md:table-cell">Contato</TableHead>
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                <TableHead className="text-right">Processos</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/prototipo/clientes/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {client.kind === "PF" ? "Pessoa física" : "Pessoa jurídica"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {client.kind === "PF" ? maskCpf(client.document) : formatCnpj(client.document)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {formatPhone(client.phone)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{client.responsible}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {cases.filter((c) => c.clientId === client.id).length}
                  </TableCell>
                  <TableCell>
                    <Badge variant={client.status === "ativo" ? "secondary" : "outline"}>
                      {client.status === "ativo" ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
