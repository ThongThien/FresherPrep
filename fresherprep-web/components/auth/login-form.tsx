"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { Button, Feedback, FieldError, Input, Label } from "@/components/ui";
import { readApiError, userFacingAuthMessage } from "@/lib/api/client";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { useI18n } from "@/lib/i18n";

import { PasswordField } from "./password-field";

interface LoginFormProps {
  nextPath?: string;
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const { t } = useI18n();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage(undefined);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });

      if (!response.ok) {
        const error = await readApiError(response);
        setFieldErrors(error.fieldErrors);
        setMessage(userFacingAuthMessage(error, "login"));
        return;
      }

      window.location.assign(getSafeRedirectPath(nextPath));
    } catch {
      setMessage(t("Unable to connect to FresherPrep. Check your connection and try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate={false} className="space-y-5">
      {message ? <Feedback tone="error" title={t("Unable to sign in")}>{message}</Feedback> : null}

      <div>
        <Label htmlFor="email">{t("Email address")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          required
          autoFocus
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.email) || undefined}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email ? <FieldError id="email-error">{fieldErrors.email}</FieldError> : null}
      </div>

      <div>
        <Label htmlFor="password">{t("Password")}</Label>
        <PasswordField
          id="password"
          name="password"
          autoComplete="current-password"
          disabled={submitting}
          invalid={Boolean(fieldErrors.password)}
          describedBy={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password ? (
          <FieldError id="password-error">{fieldErrors.password}</FieldError>
        ) : null}
      </div>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? t("Signing in...") : t("Sign in")}
      </Button>
    </form>
  );
}
