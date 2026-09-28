"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import { Button, Feedback, FieldError, Input, Label } from "@/components/ui";
import { readApiError, userFacingAuthMessage } from "@/lib/api/client";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import type { LoginChallenge } from "@/lib/auth/types";
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
  const [challenge, setChallenge] = useState<LoginChallenge>();
  const [showHint, setShowHint] = useState(false);

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
          challengeId: challenge?.id,
          challengeAnswer: challenge ? String(formData.get("challengeAnswer") ?? "") : undefined,
        }),
      });

      if (!response.ok) {
        const error = await readApiError(response);
        setFieldErrors(error.fieldErrors);
        if (error.code === "LOGIN_CHALLENGE_REQUIRED" && error.challenge) {
          setChallenge(error.challenge);
          setShowHint(false);
          setMessage(t("Complete the Java check to continue."));
        } else {
          setMessage(userFacingAuthMessage(error, "login"));
        }
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

      {challenge ? (
        <fieldset className="rounded-md border border-border bg-surface-muted p-4">
          <legend className="px-1 text-sm font-semibold text-text">{t("Java knowledge check")}</legend>
          <div className="flex items-start gap-2">
            <p className="flex-1 text-sm leading-6 text-text">{challenge.question}</p>
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border-strong bg-surface text-sm font-bold text-primary hover:bg-primary-subtle focus-visible:ring-3 focus-visible:ring-focus/20"
              aria-label={t("Show answer hint")}
              aria-expanded={showHint}
              onClick={() => setShowHint((value) => !value)}
            >
              ?
            </button>
          </div>
          {showHint ? <p className="mt-2 text-xs leading-5 text-text-muted" role="status">{challenge.hint}</p> : null}
          <div className="mt-3">
            <Label htmlFor="challengeAnswer">{t("Your answer")}</Label>
            <Input
              id="challengeAnswer"
              name="challengeAnswer"
              maxLength={100}
              autoComplete="off"
              required
              disabled={submitting}
              aria-invalid={Boolean(fieldErrors.challengeAnswer) || undefined}
              aria-describedby={fieldErrors.challengeAnswer ? "challenge-answer-error" : "challenge-expiry"}
            />
            {fieldErrors.challengeAnswer ? <FieldError id="challenge-answer-error">{fieldErrors.challengeAnswer}</FieldError> : null}
            <p id="challenge-expiry" className="mt-1.5 text-xs text-text-subtle">{t("This one-time challenge expires shortly.")}</p>
          </div>
        </fieldset>
      ) : null}

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {submitting ? t("Signing in...") : t("Sign in")}
      </Button>
    </form>
  );
}
