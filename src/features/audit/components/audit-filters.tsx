import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

import { ACTION_FILTER_OPTIONS } from "../labels";
import { type AuditFilters } from "../schemas";

/** Formulário GET: os filtros ficam na URL (compartilháveis e sem estado no cliente). */
export function AuditFiltersForm({
  filters,
  people,
}: {
  filters: AuditFilters;
  people: { id: string; name: string }[];
}) {
  return (
    <form method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
      <div className="grid gap-2">
        <Label htmlFor="de">De</Label>
        <Input id="de" name="de" type="date" defaultValue={filters.de} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ate">Até</Label>
        <Input id="ate" name="ate" type="date" defaultValue={filters.ate} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="usuario">Usuário</Label>
        <NativeSelect id="usuario" name="usuario" defaultValue={filters.usuario ?? ""}>
          <option value="">Todos</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="acao">Tipo de ação</Label>
        <NativeSelect id="acao" name="acao" defaultValue={filters.acao ?? ""}>
          <option value="">Todas</option>
          {ACTION_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Filtrar
        </Button>
        <Button asChild variant="outline">
          <a href="/app/auditoria">Limpar</a>
        </Button>
      </div>
    </form>
  );
}
