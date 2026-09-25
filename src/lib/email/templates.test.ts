import { describe, expect, it } from "vitest";

import { accountLockedEmail, invitationEmail } from "./templates";

describe("templates de e-mail", () => {
  it("escapa dados informados pelo usuário no convite", () => {
    const email = invitationEmail({
      tenantName: "Silva & <script>alert(1)</script>",
      inviterName: "Ana",
      role: "lawyer",
      url: "http://localhost:3000/convite/abc",
      expiresAt: new Date("2026-01-02T15:00:00Z"),
    });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("Silva &amp; &lt;script&gt;");
    expect(email.text).toContain("02/01/2026, 12:00");
    expect(email.text).toContain("Advogado");
  });

  it("informa o horário de desbloqueio no fuso de Recife", () => {
    const email = accountLockedEmail({
      lockedUntil: new Date("2026-05-10T13:15:00Z"),
      resetUrl: "http://localhost:3000/recuperar-senha",
    });
    expect(email.text).toContain("10/05/2026, 10:15");
  });
});
