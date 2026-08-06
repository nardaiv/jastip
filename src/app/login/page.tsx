import type { Metadata } from "next";
import Link from "next/link";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Sign In | Jastip",
  description: "Sign in to your Jastip account to manage your trips and requests.",
};

export default async function LoginPage({
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
            Welcome back
          </h2>
          <p className="text-caption text-mute">
            Enter your email to sign in to your account
          </p>
        </div>
        <div className="space-y-4">
          {params?.error && (
            <div
              id="signin-error"
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
              id="signin-message"
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

          <form action={login} className="space-y-4">
            <div className="space-y-1.5 flex flex-col">
              <label htmlFor="signin-email" className="text-body-sm-strong text-ink dark:text-zinc-300">Email Address</label>
              <input
                id="signin-email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                className="bg-canvas border border-ink rounded-md px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/40 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              />
            </div>
            <div className="space-y-1.5 flex flex-col">
              <div className="flex items-center justify-between">
                <label htmlFor="signin-password" className="text-body-sm-strong text-ink dark:text-zinc-300">Password</label>
              </div>
              <input
                id="signin-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-canvas border border-ink rounded-md px-4 py-2.5 text-body-md text-ink outline-none focus:ring-2 focus:ring-primary/40 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
              />
            </div>
            <button type="submit" className="button-primary w-full h-12 text-sm font-semibold mt-2">
              Sign In
            </button>
          </form>
        </div>
        <div className="pt-6 text-center text-body-sm text-mute">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-semibold text-emerald-700 hover:underline dark:text-primary"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
