/**
 * Headers de segurança HTTP.
 * - CSP é gerada por requisição (com nonce) no middleware.
 * - Os demais headers são estáticos e aplicados via next.config.ts.
 */

type CspOptions = {
  nonce: string;
  supabaseUrl: string;
  isDev: boolean;
};

export function buildContentSecurityPolicy({ nonce, supabaseUrl, isDev }: CspOptions): string {
  const supabase = new URL(supabaseUrl);
  const supabaseHttp = supabase.origin;
  const supabaseWs = `${supabase.protocol === "https:" ? "wss:" : "ws:"}//${supabase.host}`;

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'strict-dynamic' + nonce: só executam scripts emitidos pelo próprio Next.js.
    // 'unsafe-eval' apenas em desenvolvimento (React Refresh).
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    // Atributos style inline são usados por Radix/shadcn (posicionamento de popovers).
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", supabaseHttp],
    "font-src": ["'self'"],
    "connect-src": ["'self'", supabaseHttp, supabaseWs],
    "frame-src": ["'self'", "blob:", supabaseHttp],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const policy = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!isDev) policy.push("upgrade-insecure-requests");

  return policy.join("; ");
}

export const staticSecurityHeaders: { key: string; value: string }[] = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}
