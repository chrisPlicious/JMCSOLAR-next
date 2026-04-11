import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  const body = await request.json();
  const { name, phone, email, city, systemType, message } = body;

  if (!name || !phone) {
    return NextResponse.json(
      { error: 'Name and phone are required.' },
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
