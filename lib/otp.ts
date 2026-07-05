
import { randomInt } from 'crypto';
import { sendEmail } from '@/lib/email';

export function generateOTP(): string {
  return String(randomInt(100000, 1000000));
}

export async function sendOTP(phoneOrEmail: string, otp: string): Promise<void> {
  const isEmail = phoneOrEmail.includes('@');

  if (!isEmail) {
    if (process.env.NODE_ENV === 'production' && !process.env.MSG91_AUTH_KEY) {
      throw new Error('SMS OTP provider is not configured (MSG91_AUTH_KEY missing)');
    }
    if (process.env.NODE_ENV !== 'production') {
      console.info(`Development SMS OTP for ${phoneOrEmail}: ${otp}`);
      return;
    }
    throw new Error('Phone OTP is not implemented yet; use email signup');
  }

  const result = await sendEmail({
    to: phoneOrEmail,
    subject: 'Your Snakebet verification code',
    text: `Your Snakebet verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin:0 0 16px;">Verify your Snakebet account</h2>
        <p style="color:#555;">Use this one-time code to complete signup:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0;">${otp}</p>
        <p style="color:#888;font-size:14px;">This code expires in 10 minutes. If you did not request it, ignore this email.</p>
      </div>
    `,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }
}

function generateReferralCode(username: string): string {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${username.substring(0, 4).toUpperCase()}${randomStr}`;
}

export { generateReferralCode };
