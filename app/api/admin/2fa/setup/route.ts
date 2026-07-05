import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { encrypt } from '@/lib/encryption';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) return admin.response;

    const user = await prisma.user.findUnique({
      where: { id: admin.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: 'Snakebet',
      issuer: 'Snakebet',
    });

    // Encrypt secret before storing (we'll store it temporarily, then permanently when verified)
    const encryptedSecret = encrypt(secret.base32);

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return NextResponse.json({
      qrCode: qrCodeDataUrl,
      secret: secret.base32,
      encryptedSecret,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json({ error: 'Failed to setup 2FA' }, { status: 500 });
  }
}
