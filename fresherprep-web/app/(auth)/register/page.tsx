import type { Metadata } from "next";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a FresherPrep account and begin your structured Java learning path.",
};

interface RegisterPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const query = await searchParams;
  const nextPath = Array.isArray(query.next) ? query.next[0] : query.next;
  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  return (
    <AuthFormShell
      eyebrow="Start with a clear plan"
      title="Create your account"
      description="Set up a focused learning workspace for Java backend fundamentals and fresher interviews."
      alternateText="Already have an account?"
      alternateHref={loginHref}
      alternateLabel="Sign in"
    >
      <RegisterForm nextPath={nextPath} />
    </AuthFormShell>
  );
}
