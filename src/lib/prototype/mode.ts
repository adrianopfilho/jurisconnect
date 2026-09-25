/**
 * Modo protótipo: navegação com dados fictícios, sem Supabase.
 * Ativado somente por NEXT_PUBLIC_PROTOTYPE=true (valor embutido no build).
 * Fora dele, as rotas /prototipo não existem (404) e nada aqui é usado.
 */
export const PROTOTYPE_BASE = "/prototipo";

/** Cookie da sessão de demonstração (não é credencial: só escolhe a visão). */
export const DEMO_PROFILE_COOKIE = "jc_demo_perfil";

export const DEMO_PROFILES = ["escritorio", "cliente"] as const;
export type DemoProfile = (typeof DEMO_PROFILES)[number];

export function isPrototypeMode(): boolean {
  return process.env.NEXT_PUBLIC_PROTOTYPE === "true";
}

export function parseDemoProfile(value: string | undefined | null): DemoProfile | null {
  return DEMO_PROFILES.find((profile) => profile === value) ?? null;
}

export function demoHome(profile: DemoProfile): string {
  return profile === "cliente" ? `${PROTOTYPE_BASE}/portal` : PROTOTYPE_BASE;
}
