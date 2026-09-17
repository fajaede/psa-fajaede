// lib/email.ts
import nodemailer from "nodemailer";

export async function sendPurchaseConfirmation(email: string, tier: string, orderId: number) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `${process.env.SMTP_FROM}`,
    to: email,
    subject: "Bevestiging van uw premium aankoop",
    text: `Bedankt voor uw aankoop van de ${tier} re‑scan.\n\nOrder ID: ${orderId}\n\nU kunt de resultaten bekijken op uw dashboard.`,
    html: `<p>Bedankt voor uw aankoop van de <strong>${tier}</strong> re‑scan.</p>
           <p>Order ID: <strong>${orderId}</strong></p>
           <p>U kunt de resultaten bekijken op uw <a href="/dashboard?email=${encodeURIComponent(email)}">dashboard</a>.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${email}`);
  } catch (err) {
    console.error("Error sending confirmation email", err);
  }
}
