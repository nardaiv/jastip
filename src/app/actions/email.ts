"use server";

import { transporter, SENDER_MAIL } from "@/lib/nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Server action to send an email using the nodemailer transporter.
 */
export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  try {
    if (!to || !subject) {
      throw new Error("Recipient (to) and subject are required.");
    }

    const mailOptions = {
      from: `"Jastip App" <${SENDER_MAIL}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully. Message ID:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error.message || "An unknown error occurred while sending email.",
    };
  }
}
