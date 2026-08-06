import type { Metadata } from "next";
import Link from "next/link";
import { signup } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "Create an Account | Jastip",
  description: "Sign up for a Jastip account as a buyer or traveler.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-canvas-soft px-4 py-12 dark:bg-zinc-950 font-sans text-ink">
      <div className="relative z-10 w-full max-w-md card-content bg-canvas border border-canvas-soft/85 shadow-lg dark:bg-zinc-900 dark:border-zinc-800">
        <div className="space-y-2 text-center pb-6">
          <h2 className="text-display-xs font-bold text-ink dark:text-zinc-50">
            Create an account
          </h2>
          <p className="text-caption text-mute">
            Get started by creating your traveler or customer account
          </p>
        </div>
        <div className="space-y-4">
          {params?.error && (
            <div
              id="signup-error"
              className="badge-negative rounded-lg p-3.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{params.error}</span>
            </div>
          )}

          {params?.message && (
            <div
              id="signup-message"
              className="badge-positive rounded-lg p-3.5 text-xs font-semibold flex items-center gap-2 animate-in fade-in"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{params.message}</span>
            </div>
          )}

          <form action={signup} className="space-y-4">
            <div className="space-y-1.5 flex flex-col">
              <label htmlFor="signup-fullname" className="text-body-sm-strong text-ink dark:text-zinc-300">Full Name</label>
              <input
                id="signup-fullname"
                name="full_name"
                type="text"
                placeholder="Jane Doe"
                required
                className="bg-canvas border border-ink rounded-md px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/40 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              />
            </div>

            <div className="space-y-1.5 flex flex-col">
              <label htmlFor="signup-role" className="text-body-sm-strong text-ink dark:text-zinc-300">Register As</label>
              <select
                id="signup-role"
                name="role"
                defaultValue="buyer"
                className="bg-canvas border border-ink rounded-md px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/40 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 appearance-none cursor-pointer"
              >
                <option value="buyer">Buyer (Jastip Customer)</option>
                <option value="seller">Seller (Traveler / Jastiper)</option>
              </select>
            </div>

            <div className="space-y-1.5 flex flex-col">
              <label htmlFor="signup-email" className="text-body-sm-strong text-ink dark:text-zinc-300">Email Address</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                className="bg-canvas border border-ink rounded-md px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/40 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              />
            </div>

            <div className="space-y-1.5 flex flex-col">
              <label htmlFor="signup-password" className="text-body-sm-strong text-ink dark:text-zinc-300">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-canvas border border-ink rounded-md px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/40 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              />
            </div>

            <button type="submit" className="button-primary w-full h-12 text-sm font-semibold mt-2">
              Sign Up
            </button>
          </form>
        </div>
        <div className="pt-6 text-center text-body-sm text-mute">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 hover:underline dark:text-primary"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
