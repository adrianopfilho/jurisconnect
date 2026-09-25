import { type Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { getMockCases } from "@/features/cases/mocks";
import { AgendaView } from "@/features/deadlines/components/agenda-view";
import { getMockAgenda } from "@/features/deadlines/mocks";
import { recifeDay } from "@/lib/prototype/dates";

export const metadata: Metadata = { title: "Agenda de prazos" };

export default function DemoAgendaPage() {
  const now = new Date();
  const caseTitles = Object.fromEntries(getMockCases(now).map((c) => [c.id, c.title]));

  return (
    <>
      <PageHeader
        title="Agenda de prazos"
        description="Prazos, audiências e tarefas. A contagem em dias úteis com feriados e recesso chega na Fase 3."
      />
      <Card>
        <CardContent>
          <AgendaView
            items={getMockAgenda(now)}
            caseTitles={caseTitles}
            todayKey={recifeDay(now)}
          />
        </CardContent>
      </Card>
    </>
  );
}
