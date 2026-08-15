import { NextRequest, NextResponse } from "next/server";
import { sendRequestStatusEmail } from "@/app/actions/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Supabase Webhook received payload:", JSON.stringify(body, null, 2));

    const { type, table, record, old_record } = body;

    if (table !== "item_requests") {
      return NextResponse.json({ message: "Ignored table: " + table }, { status: 200 });
    }

    if (type === "UPDATE") {
      const newStatus = record?.status;
      const oldStatus = old_record?.status;

      if (newStatus && newStatus !== oldStatus) {
        console.log(`Status changed for request ${record.id} from ${oldStatus} to ${newStatus}. Sending email...`);
        const emailRes = await sendRequestStatusEmail(record.id, newStatus);
        return NextResponse.json({ message: "Notification email sent", detail: emailRes }, { status: 200 });
      }
    } else if (type === "INSERT") {
      const newStatus = record?.status;
      console.log(`New request created with status ${newStatus}. Sending email...`);
      const emailRes = await sendRequestStatusEmail(record.id, newStatus);
      return NextResponse.json({ message: "Initial notification email sent", detail: emailRes }, { status: 200 });
    }

    return NextResponse.json({ message: "No action taken" }, { status: 200 });
  } catch (error: any) {
    console.error("Error in Supabase webhook handler:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
