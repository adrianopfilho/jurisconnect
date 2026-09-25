/**
 * Tipos do banco. Arquivo gerado: rode `pnpm db:types` após alterar migrations.
 * Placeholder até a Fase 1 (ainda não há tabelas).
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
