import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { adminDb } from '@/lib/firebase/admin';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-client-ip';
import nodemailer from 'nodemailer';

// 3 review submissions per IP per 30 minutes
const RATE_LIMIT = 3;
const RATE_WINDOW = 30 * 60 * 1000;

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { allowed, retryAfterMs } = await rateLimit(ip, RATE_LIMIT, RATE_WINDOW);
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

  const name = typeof body.name === 'string' ? body.name.replace(/[\r\n]/g, ' ').trim().slice(0, 200) : '';
  const company_name = typeof body.company_name === 'string' ? body.company_name.replace(/[\r\n]/g, ' ').trim().slice(0, 200) : '';
  const contact_type = body.contact_type;
  const contact_value = typeof body.contact_value === 'string' ? body.contact_value.trim().slice(0, 254) : '';
  const rating = body.rating;
  const quote = typeof body.quote === 'string' ? body.quote.trim().slice(0, 2000) : '';

  // Validation
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!quote) {
    return NextResponse.json({ error: 'Review quote is required.' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5.' }, { status: 400 });
  }
  if (!contact_value) {
    return NextResponse.json({ error: 'Contact value is required.' }, { status: 400 });
  }
  if (contact_type !== 'email' && contact_type !== 'phone') {
    return NextResponse.json({ error: 'Contact type must be "email" or "phone".' }, { status: 400 });
  }
  if (contact_type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_value)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    // M3: create() fails loudly on UUID collision
    await adminDb.collection('reviews').doc(id).create({
      id,
      reviewer_name: name,
      quote,
      source: 'website',
      rating,
      status: 'pending',
      company_name: company_name || null,
      contact_type,
      // H3: HMAC-SHA256 with server pepper — lookup-table attacks blocked
      contact_value: createHmac('sha256', process.env.CONTACT_PEPPER!).update(contact_value).digest('hex'),
      created_at: now,
      updated_at: now,
    });
  } catch (err) {
    console.error('Firestore insert error:', err);
    return NextResponse.json({ error: 'Failed to save review.' }, { status: 500 });
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

    const stars = '★'.repeat(rating as number) + '☆'.repeat(5 - (rating as number));

    await transporter
      .sendMail({
        from: `"JMC Solar Website" <${smtpUser}>`,
        to: smtpUser,
        subject: `New Review Submission: ${name}`,
        text: [
          `New review submitted via the website (pending approval).`,
          ``,
          `Name: ${name}`,
          `Company: ${company_name || 'Not provided'}`,
          `Rating: ${stars} (${rating}/5)`,
          `Contact Type: ${contact_type}`,
          `Contact: ${contact_value}`,
          ``,
          `Review:`,
          quote,
        ].join('\n'),
      })
      .catch((err) => {
        console.error('Email send error:', err);
      });
  }

  return NextResponse.json({ success: true });
}
