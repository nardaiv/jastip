import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/UserNav";
import { UserStoreProvider } from "@/providers/user-store-provider";

export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <UserStoreProvider>
      <div className="min-h-screen bg-background">
        {/* Hapus border-b dan tambahkan sticky top-0 z-50 agar header tetap di atas */}
        <header className="sticky top-0 z-50 bg-card px-6 py-4">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
            {/* Brand Logo */}
            <div className="flex items-center gap-2 font-bold text-xl text-foreground">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-sm">
                J
              </div>
              <span>Jastip</span>
            </div>

            {/* Navigasi & Info Pengguna */}
            <UserNav fallbackEmail={user.email || ""} />
          </div>
        </header>

        <main className="mx-auto max-w-7xl p-6">{children}</main>
      </div>
    </UserStoreProvider>
  );
}