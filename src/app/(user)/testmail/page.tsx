"use client";

import { sendEmail } from "@/app/actions/email";
import { useState, useTransition } from "react";
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, RotateCcw } from "lucide-react";

export default function SendEmailForm() {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<{
        type: "success" | "error" | "";
        message: string;
    }>({ type: "", message: "" });

    const [to, setTo] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    const handleSend = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setStatus({ type: "", message: "" });

        startTransition(async () => {
            const res = await sendEmail({
                to,
                subject,
                text: message,
                html: `
          <div style="font-family: sans-serif; padding: 24px; color: #0e0f0c; background-color: #f9fbf8; border-radius: 16px; border: 1px solid #e8ebe6; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #163300; margin-top: 0; font-size: 20px; font-weight: bold; border-bottom: 2px solid #9fe870; padding-bottom: 12px;">Jastip Notification</h2>
            <p style="font-size: 16px; line-height: 1.6; margin: 18px 0; color: #454745;">${message.replace(/\n/g, "<br/>")}</p>
            <hr style="border: 0; border-top: 1px solid #e8ebe6; margin: 24px 0;" />
            <p style="font-size: 12px; color: #868685; text-align: center; margin-bottom: 0;">Sent via Jastip App Test Mail Utility.</p>
          </div>
        `,
            });

            if (res.success) {
                setStatus({
                    type: "success",
                    message: `Email sent successfully! Message ID: ${res.messageId}`,
                });
                // Clear fields on success
                setTo("");
                setSubject("");
                setMessage("");
            } else {
                setStatus({
                    type: "error",
                    message: res.error || "Failed to send email. Please check your credentials.",
                });
            }
        });
    };

    const handleClear = () => {
        setTo("");
        setSubject("");
        setMessage("");
        setStatus({ type: "", message: "" });
    };

    const isFormEmpty = !to && !subject && !message;

    return (
        <div className="max-w-xl mx-auto space-y-6">
            {/* Header section matching Wise UI aesthetic */}
            <div className="space-y-2 text-center md:text-left">
                <h1 className="text-display-xs font-black text-ink dark:text-zinc-50 flex items-center justify-center md:justify-start gap-2.5">
                    <Mail className="h-7 w-7 text-emerald-600 dark:text-wise-green stroke-[2.5px]" />
                    <span>Email Test Console</span>
                </h1>
                <p className="text-body-sm text-mute dark:text-zinc-400">
                    Verify SMTP settings by sending text and rich HTML emails through the Next.js Server Action.
                </p>
            </div>

            {/* Form Container with Wise card styling */}
            <div className="card-content border border-canvas-soft/85 bg-white dark:bg-zinc-900/60 dark:border-zinc-800/80">
                <form onSubmit={handleSend} className="space-y-5">

                    {/* Recipient Input */}
                    <div className="space-y-1.5 flex flex-col">
                        <label htmlFor="to" className="text-body-sm-strong text-ink dark:text-zinc-300">
                            Recipient Email Address
                        </label>
                        <input
                            id="to"
                            name="to"
                            type="email"
                            placeholder="recipient@example.com"
                            required
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            disabled={isPending}
                            className="bg-canvas border border-zinc-300/80 rounded-xl px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/60 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                    </div>

                    {/* Subject Input */}
                    <div className="space-y-1.5 flex flex-col">
                        <label htmlFor="subject" className="text-body-sm-strong text-ink dark:text-zinc-300">
                            Subject
                        </label>
                        <input
                            id="subject"
                            name="subject"
                            type="text"
                            placeholder="e.g., Hello from Jastip!"
                            required
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            disabled={isPending}
                            className="bg-canvas border border-zinc-300/80 rounded-xl px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/60 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                    </div>

                    {/* Message Content Input */}
                    <div className="space-y-1.5 flex flex-col">
                        <label htmlFor="message" className="text-body-sm-strong text-ink dark:text-zinc-300">
                            Message Body
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            placeholder="Write the message content here..."
                            required
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isPending}
                            className="bg-canvas border border-zinc-300/80 rounded-xl px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/60 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 transition-all resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                        />
                    </div>

                    {/* Form Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="button-primary flex-1 h-12 text-sm font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-ink" />
                                    <span>Sending email...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 text-ink" />
                                    <span>Send Test Email</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={isPending || isFormEmpty}
                            className="button-secondary h-12 px-5 text-sm font-semibold gap-2 disabled:opacity-50 disabled:cursor-not-allowed select-none dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                            title="Clear fields"
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span>Clear</span>
                        </button>
                    </div>
                </form>

                {/* Dynamic alert box for Success/Error feedback */}
                {status.type && (
                    <div
                        className={`mt-6 p-4 rounded-xl flex items-start gap-3 border transition-all ${status.type === "success"
                                ? "bg-wise-green-pale border-wise-green/60 text-positive-deep dark:bg-emerald-950/30 dark:border-emerald-800/80 dark:text-emerald-400"
                                : "bg-red-50 border-negative/30 text-negative-deep dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-400"
                            }`}
                    >
                        {status.type === "success" ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-positive dark:text-emerald-400" />
                        ) : (
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-negative dark:text-red-400" />
                        )}
                        <div className="space-y-0.5">
                            <p className="font-semibold text-sm">
                                {status.type === "success" ? "Message Sent" : "Sending Failed"}
                            </p>
                            <p className="text-xs font-medium leading-relaxed break-all opacity-90">
                                {status.message}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

