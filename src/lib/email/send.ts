import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { getEmailEnv } from "@/lib/env/server";

import { type EmailMessage } from "./templates";

let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  if (!transporter) {
    const env = getEmailEnv();
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(to: string, message: EmailMessage): Promise<void> {
  await getTransporter().sendMail({
    from: getEmailEnv().SMTP_FROM,
    to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}
