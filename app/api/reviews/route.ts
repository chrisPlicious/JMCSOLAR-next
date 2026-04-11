import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, company_name, contact_type, contact_value, rating, quote } = body;

  // Validation
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (!quote || typeof quote !== 'string' || quote.trim() === '') {
    return NextResponse.json({ error: 'Review quote is required.' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5.' }, { status: 400 });
  }
  if (!contact_value || typeof contact_value !== 'string' || contact_value.trim() === '') {
    return NextResponse.json({ error: 'Contact value is required.' }, { status: 400 });
  }
  if (contact_type !== 'email' && contact_type !== 'phone') {
    return NextResponse.json({ error: 'Contact type must be "email" or "phone".' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    await adminDb.collection('reviews').doc(id).set({
      id,
      reviewer_name: name.trim(),
      quote: quote.trim(),
      source: 'website',
      rating,
      status: 'pending',
      company_name: company_name ? company_name.trim() : null,
      contact_type,
      contact_value: contact_value.trim(),
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

    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);

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
