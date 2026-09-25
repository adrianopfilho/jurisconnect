import { expect } from "@playwright/test";

import { MAILPIT_URL } from "./env";

type MailSummary = { ID: string; Subject: string; Created: string };

async function search(to: string, subject?: string): Promise<MailSummary[]> {
  const query = encodeURIComponent(`to:"${to}"${subject ? ` subject:"${subject}"` : ""}`);
  const response = await fetch(`${MAILPIT_URL}/api/v1/search?query=${query}`);
  if (!response.ok) return [];
  const body = (await response.json()) as { messages?: MailSummary[] };
  return body.messages ?? [];
}

/** Aguarda o e-mail mais recente para o destinatário e devolve o primeiro link que casa com o padrão. */
export async function waitForEmailLink(
  to: string,
  pattern: RegExp,
  subject?: string,
): Promise<string> {
  let link: string | undefined;

  await expect
    .poll(
      async () => {
        const [latest] = await search(to, subject);
        if (!latest) return false;
        const response = await fetch(`${MAILPIT_URL}/api/v1/message/${latest.ID}`);
        const message = (await response.json()) as { HTML?: string; Text?: string };
        const content = `${message.HTML ?? ""}\n${message.Text ?? ""}`.replace(/&amp;/g, "&");
        link = content.match(pattern)?.[0];
        return Boolean(link);
      },
      { timeout: 20_000, message: `e-mail para ${to}` },
    )
    .toBe(true);

  return link as string;
}

export async function countEmails(to: string, subject?: string): Promise<number> {
  return (await search(to, subject)).length;
}
