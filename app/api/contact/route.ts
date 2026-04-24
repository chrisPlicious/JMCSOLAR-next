import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { rateLimit } from '@/lib/rate-limit';
import nodemailer from 'nodemailer';

// 5 submissions per IP per 15 minutes
const RATE_LIMIT = 5;
const RATE_WINDOW = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { allowed, retryAfterMs } = rateLimit(ip, RATE_LIMIT, RATE_WINDOW);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) },
      },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 200) : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 30) : '';
  const email = typeof body.email === 'string' ? body.email.trim().slice(0, 254) : '';
  const city = typeof body.city === 'string' ? body.city.trim().slice(0, 200) : '';
  const systemType = typeof body.systemType === 'string' ? body.systemType.trim().slice(0, 200) : '';
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 2000) : '';

  if (!name || !phone) {
    return NextResponse.json(
      { error: 'Name and phone are required.' },
      { status: 400 }
    );
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: 'Invalid email address.' },
      { status: 400 }
    );
  }

  // Save to Firestore
  const id = crypto.randomUUID();
  try {
    await adminDb.collection('contactSubmissions').doc(id).set({
      id,
      name,
      phone,
      email: email || null,
      city: city || null,
      system_type: systemType || null,
      message: message || null,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Firestore insert error:', err);
    return NextResponse.json(
      { error: 'Failed to save submission.' },
      { status: 500 }
    );
  }

  // Send email notification via Zoho SMTP
  const smtpUser = process.env.ZOHO_SMTP_USER;
  const smtpPass = process.env.ZOHO_SMTP_PASS;

  if (smtpUser && smtpPass) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"JMC Solar Website" <${smtpUser}>`,
      to: smtpUser,
      replyTo: email || undefined,
      subject: `New Inquiry: ${systemType || 'General'} — ${name}`,
      text: [
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Email: ${email || 'Not provided'}`,
        `City: ${city || 'Not provided'}`,
        `System Type: ${systemType || 'Not specified'}`,
        ``,
        `Message:`,
        message || '(no message)',
      ].join('\n'),
    }).catch((err) => {
      console.error('Email send error:', err);
    });
  }

  return NextResponse.json({ success: true });
}
