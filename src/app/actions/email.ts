"use server";

import { transporter, SENDER_MAIL } from "@/lib/nodemailer";
import { createClient } from "@/lib/supabase/server";

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

/**
 * Sends a premium email notification for status changes to either the buyer or seller.
 */
export async function sendRequestStatusEmail(itemRequestId: string, newStatus: string) {
  try {
    const supabase = await createClient();

    // Fetch the request, buyer profile, and trip/seller profile
    const { data: req, error: reqError } = await supabase
      .from("item_requests")
      .select(`
        id,
        item_name,
        status,
        total_price,
        currency,
        buyer_id,
        buyer:profiles!buyer_id (
          full_name,
          email
        ),
        trips:trip_id (
          destination_country,
          seller:profiles!seller_id (
            full_name,
            email
          )
        )
      `)
      .eq("id", itemRequestId)
      .single();

    if (reqError) {
      return { success: false, error: reqError.message };
    }
    if (!req) {
      return { success: false, error: "Request details not found" };
    }

    const item_name = req.item_name;
    const total_price = req.total_price || 0;
    const currency = req.currency || "IDR";

    const buyer = req.buyer as any;
    const tripsData = req.trips as any;
    const seller = Array.isArray(tripsData)
      ? tripsData[0]?.seller
      : tripsData?.seller;

    if (!buyer || !seller) {
      return { success: false, error: "Buyer or Seller profile missing" };
    }

    const buyerName = buyer.full_name || "Buyer";
    const buyerEmail = buyer.email;

    const sellerName = seller.full_name || "Traveler";
    const sellerEmail = seller.email;

    const destination = Array.isArray(tripsData)
      ? tripsData[0]?.destination_country
      : tripsData?.destination_country || "Luar Negeri";

    // Detect the current user to find out who triggered the action
    let activeUserId = "";
    try {
      const { data: { user } } = await supabase.auth.getUser();
      activeUserId = user?.id || "";
    } catch {}

    let recipientEmail = "";
    let recipientName = "";
    let messageBody = "";
    let subject = "";

    let statusColor = "#f59e0b";
    let statusLabel = newStatus.toUpperCase();

    switch (newStatus.toLowerCase()) {
      case "pending":
        recipientEmail = sellerEmail;
        recipientName = sellerName;
        subject = `[Jastip] Permintaan Titipan Baru: ${item_name}`;
        messageBody = `Halo <strong>${sellerName}</strong>,<br/><br/><strong>${buyerName}</strong> telah mengirimkan permintaan titipan baru untuk barang <strong>"${item_name}"</strong> pada trip Anda ke <strong>${destination}</strong>.<br/>Silakan masuk ke Dashboard Seller untuk menyetujui permintaan dan memberikan penawaran harga.`;
        statusColor = "#f59e0b";
        statusLabel = "Menunggu";
        break;
      case "accepted":
        recipientEmail = buyerEmail;
        recipientName = buyerName;
        subject = `[Jastip] Permintaan Disetujui & Penawaran Harga: ${item_name}`;
        messageBody = `Halo <strong>${buyerName}</strong>,<br/><br/>Traveler <strong>${sellerName}</strong> telah menyetujui permintaan titipan Anda untuk <strong>"${item_name}"</strong>.<br/>Harga penawaran total yang diajukan adalah <strong>${currency} ${total_price.toLocaleString("id-ID")}</strong>.<br/>Silakan tinjau penawaran dan lakukan pembayaran jika Anda setuju dengan harga tersebut.`;
        statusColor = "#3b82f6";
        statusLabel = "Disetujui / Penawaran Harga";
        break;
      case "verifying":
        recipientEmail = buyerEmail;
        recipientName = buyerName;
        subject = `[Jastip] Pembayaran Sedang Diverifikasi: ${item_name}`;
        messageBody = `Halo <strong>${buyerName}</strong>,<br/><br/>Bukti transfer pembayaran Anda untuk <strong>"${item_name}"</strong> sedang diverifikasi oleh administrator.<br/>Kami akan segera mengabari Anda setelah pembayaran disetujui.`;
        statusColor = "#f59e0b";
        statusLabel = "Dalam Verifikasi";
        break;
      case "payment_rejected":
        recipientEmail = buyerEmail;
        recipientName = buyerName;
        subject = `[Jastip] Pembayaran Ditolak Admin: ${item_name}`;
        messageBody = `Halo <strong>${buyerName}</strong>,<br/><br/>Bukti pembayaran Anda untuk barang <strong>"${item_name}"</strong> ditolak oleh administrator.<br/>Silakan masuk ke Dashboard Buyer Anda untuk melakukan transfer ulang dan mengunggah bukti yang benar.`;
        statusColor = "#ef4444";
        statusLabel = "Pembayaran Ditolak";
        break;
      case "paid":
        recipientEmail = sellerEmail;
        recipientName = sellerName;
        subject = `[Jastip] Pembayaran Diterima untuk Barang: ${item_name}`;
        messageBody = `Halo <strong>${sellerName}</strong>,<br/><br/>Buyer <strong>${buyerName}</strong> telah melakukan pembayaran dan mengunggah bukti transfer untuk barang <strong>"${item_name}"</strong>.<br/>Silakan verifikasi pembayaran dan lakukan pembelian barang tersebut.`;
        statusColor = "#10b981";
        statusLabel = "Sudah Dibayar";
        break;
      case "purchased":
        recipientEmail = buyerEmail;
        recipientName = buyerName;
        subject = `[Jastip] Barang Berhasil Dibeli: ${item_name}`;
        messageBody = `Halo <strong>${buyerName}</strong>,<br/><br/>Kabar gembira! Traveler <strong>${sellerName}</strong> telah berhasil membelikan barang titipan Anda <strong>"${item_name}"</strong>.<br/>Barang akan segera dikirimkan ke alamat Anda.`;
        statusColor = "#6366f1";
        statusLabel = "Sudah Dibeli";
        break;
      case "shipped":
        recipientEmail = buyerEmail;
        recipientName = buyerName;
        subject = `[Jastip] Barang Sedang Dikirim via FedEx: ${item_name}`;
        messageBody = `Halo <strong>${buyerName}</strong>,<br/><br/>Barang titipan Anda <strong>"${item_name}"</strong> telah dikirim oleh traveler <strong>${sellerName}</strong> menggunakan kurir FedEx.<br/>Anda dapat melihat nomor resi dan memantau status pengiriman langsung dari halaman Tracking di Jastip.`;
        statusColor = "#8b5cf6";
        statusLabel = "Sedang Dikirim";
        break;
      case "cancelled":
        if (activeUserId === req.buyer_id) {
          recipientEmail = sellerEmail;
          recipientName = sellerName;
          messageBody = `Halo <strong>${sellerName}</strong>,<br/><br/>Buyer <strong>${buyerName}</strong> telah membatalkan permintaan titipan untuk barang <strong>"${item_name}"</strong>.`;
        } else {
          recipientEmail = buyerEmail;
          recipientName = buyerName;
          messageBody = `Halo <strong>${buyerName}</strong>,<br/><br/>Traveler <strong>${sellerName}</strong> telah membatalkan permintaan titipan Anda untuk barang <strong>"${item_name}"</strong>.`;
        }
        subject = `[Jastip] Permintaan Titipan Dibatalkan: ${item_name}`;
        statusColor = "#ef4444";
        statusLabel = "Dibatalkan";
        break;
      default:
        recipientEmail = activeUserId === req.buyer_id ? sellerEmail : buyerEmail;
        recipientName = activeUserId === req.buyer_id ? sellerName : buyerName;
        subject = `[Jastip] Pembaruan Status Barang: ${item_name}`;
        messageBody = `Halo <strong>${recipientName}</strong>,<br/><br/>Terdapat pembaruan status baru untuk barang titipan <strong>"${item_name}"</strong> menjadi <strong>${newStatus}</strong>.`;
        statusColor = "#64748b";
        statusLabel = newStatus;
    }

    if (!recipientEmail) {
      return { success: false, error: "Recipient email not found" };
    }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard`;

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #f1f5f9; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 28px; font-weight: 800; color: #00b159; letter-spacing: -0.5px;">Jastip</span>
          <div style="height: 1px; background-color: #f1f5f9; margin-top: 16px;"></div>
        </div>
        
        <div style="margin-bottom: 32px;">
          <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0;">
            ${messageBody}
          </p>
        </div>

        <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 32px; border: 1px solid #f1f5f9;">
          <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 14px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Detail Permintaan</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Barang</td>
              <td style="padding: 10px 0; color: #0f172a; font-weight: 600; text-align: right;">${item_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Status Baru</td>
              <td style="padding: 10px 0; text-align: right;">
                <span style="background-color: ${statusColor}; color: white; padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 700; display: inline-block;">
                  ${statusLabel}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b;">Total Biaya</td>
              <td style="padding: 10px 0; color: #00b159; font-weight: 700; text-align: right;">${currency} ${total_price.toLocaleString("id-ID")}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center;">
          <a href="${dashboardUrl}" style="background-color: #00b159; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 177, 89, 0.2);">
            Buka Dashboard Jastip
          </a>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0; line-height: 1.5;">
            Email ini dikirim secara otomatis oleh sistem Jastip.<br/>
            Harap jangan membalas email ini secara langsung.
          </p>
        </div>
      </div>
    `;

    const res = await sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent,
    });

    return res;
  } catch (error: any) {
    console.error("Error in sendRequestStatusEmail:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Centralized Server Action to update the request status and send the email notification.
 */
export async function updateRequestStatusAction(
  requestId: string,
  status: string,
  payload?: any
) {
  try {
    const supabase = await createClient();

    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      ...payload
    };

    const { error } = await supabase
      .from("item_requests")
      .update(updateData)
      .eq("id", requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Send the email notification
    await sendRequestStatusEmail(requestId, status);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
