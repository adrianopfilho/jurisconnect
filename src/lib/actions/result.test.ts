import { describe, expect, it } from "vitest";
import { z } from "zod";

import { fromZodError } from "./result";

describe("fromZodError", () => {
  it("mantém a primeira mensagem de cada campo", () => {
    const schema = z.object({
      email: z.email({ error: "E-mail inválido." }),
      nome: z.string().min(2, { error: "Curto." }),
    });
    const result = schema.safeParse({ email: "x", nome: "a" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fromZodError(result.error).fieldErrors).toEqual({
        email: "E-mail inválido.",
        nome: "Curto.",
      });
    }
  });
});
