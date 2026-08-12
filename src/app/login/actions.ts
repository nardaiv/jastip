"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginSchema, SignupSchema } from "@/types/database";

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Validate credentials with Zod
  const result = LoginSchema.safeParse({ email, password });
  if (!result.success) {
    const errorMsg = result.error.issues[0].message;
    redirect(`/login?error=${encodeURIComponent(errorMsg)}`);
  }

  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    redirect("/login?error=Invalid email or password");
  }

  const { data } = await supabase.from("profiles").select('role').eq('email', email).single();
  if (data?.role === "admin") {
    revalidatePath("/", "layout");
    redirect("/admin");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const role = (formData.get("role") as string) || "buyer"; // Default fallback

  // Validate signup fields with Zod
  const result = SignupSchema.safeParse({ email, password, full_name: fullName, role });
  if (!result.success) {
    const errorMsg = result.error.issues[0].message;
    redirect(`/signup?error=${encodeURIComponent(errorMsg)}`);
  }

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.full_name,
        role: result.data.role, // Sent to database trigger as raw_user_meta_data
      },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // Handle case where Supabase requires email confirmation before logging in
  if (data.user && !data.session) {
    redirect(
      "/signup?message=Please check your email to confirm your account before logging in.",
    );
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
