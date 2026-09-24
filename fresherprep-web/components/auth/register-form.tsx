"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { Button, Feedback, FieldError, FieldHint, Input, Label } from "@/components/ui";
import { readApiError, userFacingAuthMessage } from "@/lib/api/client";
import { getSafeRedirectPath } from "@/lib/auth/redirects";

import { PasswordField } from "./password-field";

interface RegisterFormProps {
  nextPath?: string;
}

export function RegisterForm({ nextPath }: RegisterFormProps) {
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: String(formData.get("displayName") ?? ""),
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      });

      if (!response.ok) {
        const error = await readApiError(response);
        setFieldErrors(error.fieldErrors);
        setMessage(userFacingAuthMessage(error, "register"));
        return;
      }

      window.location.assign(getSafeRedirectPath(nextPath));
    } catch {
      setMessage("Unable to connect to FresherPrep. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {message ? (
        <Feedback tone="error" title="Unable to create account">
          {message}
        </Feedback>
      ) : null}

      <div>
        <Label htmlFor="displayName">Display name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          maxLength={100}
          required
          autoFocus
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.displayName) || undefined}
          aria-describedby={fieldErrors.displayName ? "display-name-error" : undefined}
        />
        {fieldErrors.displayName ? (
          <FieldError id="display-name-error">{fieldErrors.displayName}</FieldError>
        ) : null}
      </div>

      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          required
          disabled={submitting}
          aria-invalid={Boolean(fieldErrors.email) || undefined}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email ? <FieldError id="email-error">{fieldErrors.email}</FieldError> : null}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <PasswordField
          id="password"
          name="password"
          autoComplete="new-password"
          disabled={submitting}
          invalid={Boolean(fieldErrors.password)}
          describedBy={fieldErrors.password ? "password-error password-hint" : "password-hint"}
        />
        <FieldHint id="password-hint">Use between 8 and 72 characters.</FieldHint>
        {fieldErrors.password ? (
          <FieldError id="password-error">{fieldErrors.password}</FieldError>
        ) : null}
      </div>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
