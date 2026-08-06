import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from("profiles").select("*");

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-red-600">Admin Control Panel</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Restricted page accessible only to admin users
            </p>
          </div>
          <form action={logout}>
            <Button variant="outline" type="submit" className="cursor-pointer font-medium hover:bg-zinc-50 border-zinc-200">
              Log Out
            </Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {profiles?.map((profile) => (
                <tr key={profile.id}>
                  <td className="px-4 py-3 font-mono text-xs">{profile.id}</td>
                  <td className="px-4 py-3">{profile.email}</td>
                  <td className="px-4 py-3 font-semibold">{profile.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
