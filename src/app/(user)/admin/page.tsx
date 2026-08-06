import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("*");

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-xs p-8 border border-zinc-200/80 dark:bg-zinc-900 dark:border-zinc-800 space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-red-600 dark:text-red-500 tracking-tight">Admin Control Panel</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Restricted page accessible only to authenticated administrator accounts.
          </p>
        </div>

        <div className="h-px bg-zinc-200/85 dark:bg-zinc-800" />

        <div className="overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800 shadow-xs">
          <table className="w-full border-collapse text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/80 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800 bg-white dark:bg-zinc-900">
              {profiles?.map((profile) => (
                <tr key={profile.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400 dark:text-zinc-500">{profile.id}</td>
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{profile.email || "N/A"}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                      profile.role === "admin" 
                        ? "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50" 
                        : profile.role === "seller"
                        ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/50"
                        : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50"
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${
                      profile.is_active 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" 
                        : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                    }`}>
                      {profile.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
