import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("renderiza e dispara onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar</Button>);

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("não dispara onClick quando desabilitado", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Salvar
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
