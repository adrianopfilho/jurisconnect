import { describe, expect, it } from "vitest";

import { canInvite, invitableRoles, roleRequiresMfa } from "./roles";

describe("regras de perfis", () => {
  it("exige MFA somente para admin e advogado", () => {
    expect(roleRequiresMfa("admin")).toBe(true);
    expect(roleRequiresMfa("lawyer")).toBe(true);
    expect(roleRequiresMfa("intern")).toBe(false);
    expect(roleRequiresMfa("client")).toBe(false);
  });

  it("admin convida qualquer perfil; advogado só clientes; demais ninguém", () => {
    expect(invitableRoles("admin")).toHaveLength(7);
    expect(invitableRoles("lawyer")).toEqual(["client"]);
    expect(invitableRoles("reception")).toEqual([]);
    expect(canInvite("lawyer", "intern")).toBe(false);
  });
});
