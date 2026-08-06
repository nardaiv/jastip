import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserStoreProvider } from "@/providers/user-store-provider";
import { UserNav } from "@/components/UserNav";

interface UserLayoutProps {
  children: React.ReactNode;
}

export default async function UserLayout({ children }: UserLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <UserStoreProvider initialState={{ profile }}>
      <div className="flex flex-col min-h-screen bg-canvas-soft font-sans antialiased text-ink">
        {/* Wise-Style Sticky Header */}
        <header className="sticky top-0 z-50 w-full bg-canvas border-b border-canvas-soft/85 py-4">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            
            {/* Logo & Navigation */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2 font-display font-black text-2xl text-ink">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary stroke-[3px]"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
                <span>Jastip</span>
              </Link>
              
              <nav className="flex items-center gap-6 text-body-sm-strong text-ink">
                <Link
                  href="/dashboard"
                  className="hover:text-primary transition-colors"
                >
                  Dashboard
                </Link>
                {profile?.role === "admin" && (
                  <Link
                    href="/admin"
                    className="font-semibold text-negative hover:text-negative-deep transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
              </nav>
            </div>

            {/* User Profile & Actions (now a client-side reactive component) */}
            <UserNav fallbackEmail={user.email || "User"} />

          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </UserStoreProvider>
  );
}
