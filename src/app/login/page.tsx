import type { Metadata } from "next";
import Link from "next/link";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-zinc-50 via-zinc-100 to-zinc-200 px-4 py-12 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-800">
      {/* Background ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-blue-500/10 blur-[120px] dark:bg-blue-900/15" />
        <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-indigo-500/10 blur-[120px] dark:bg-indigo-900/15" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-zinc-200/80 bg-white/80 shadow-2xl backdrop-blur-md transition-all duration-300 dark:border-zinc-800/80 dark:bg-zinc-900/80">
        <CardHeader className="space-y-1.5 text-center pb-6">
          <CardTitle className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Enter your email to sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {params?.error && (
            <div
              id="signin-error"
              className="rounded-lg bg-destructive/10 border border-destructive/20 p-3.5 text-sm text-destructive font-medium flex items-center gap-2 dark:bg-destructive/15 dark:border-destructive/25 animate-in fade-in slide-in-from-top-1"
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
              className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3.5 text-sm text-emerald-600 font-medium flex items-center gap-2 dark:bg-emerald-500/15 dark:border-emerald-500/25 animate-in fade-in slide-in-from-top-1"
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
            <div className="space-y-1.5">
              <Label htmlFor="signin-email">Email Address</Label>
              <Input
                id="signin-email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                className="w-full"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="signin-password">Password</Label>
              </div>
              <Input
                id="signin-password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="w-full"
              />
            </div>
            <Button type="submit" size="lg" className="w-full cursor-pointer mt-2 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 font-semibold shadow-md transition-all active:scale-[0.99]">
              Sign In
            </Button>
          </form>
        </CardContent>
        <div className="px-6 pb-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-blue-600 hover:underline hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Sign up
          </Link>
        </div>
      </Card>
    </div>
  );
}
