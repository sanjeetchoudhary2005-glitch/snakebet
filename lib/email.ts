import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'Snakebet <onboarding@resend.dev>';

let resendClient: Resend | null = null;

function getResend() {
  if (!resendApiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }
  return resendClient;
}

export type SendEmailResult =
  | { ok: true; id?: string }
  | { ok: false; error: string };

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<SendEmailResult> {
  const client = getResend();

  if (!client) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, error: 'Email provider is not configured (RESEND_API_KEY missing)' };
    }
    console.info(`[dev email] To: ${params.to}\nSubject: ${params.subject}\n${params.text || params.html}`);
    return { ok: true, id: 'dev-logged' };
  }

  try {
    const { data, error } = await client.emails.send({
      from: emailFrom,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      console.error('Resend error:', error);
      return { ok: false, error: error.message || 'Failed to send email' };
    }

    return { ok: true, id: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send email';
    console.error('Email send exception:', error);
    return { ok: false, error: message };
  }
}
