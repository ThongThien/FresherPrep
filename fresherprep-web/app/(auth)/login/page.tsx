import type { Metadata } from "next";

import { AuthFormShell } from "@/components/auth/auth-form-shell";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to continue your FresherPrep learning plan.",
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams;
  const nextPath = Array.isArray(query.next) ? query.next[0] : query.next;
  const registerHref = nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";

  return (
    <AuthFormShell
      eyebrow="Learning workspace"
      title="Welcome back"
      description="Sign in to continue your Java backend learning and interview preparation."
      alternateText="New to FresherPrep?"
      alternateHref={registerHref}
      alternateLabel="Create an account"
    >
      <LoginForm nextPath={nextPath} />
    </AuthFormShell>
  );
}
