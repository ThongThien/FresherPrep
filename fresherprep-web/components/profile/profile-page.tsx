"use client";

import type { FormEvent } from "react";
import { useState } from "react";

import {
  useCurrentUser,
  useUpdateCurrentUser,
} from "@/components/auth/current-user-context";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Feedback,
  FieldError,
  FieldHint,
  Input,
  Label,
} from "@/components/ui";
import { readApiError } from "@/lib/api/client";
import type { CurrentUser } from "@/lib/auth/types";
import { cn } from "@/lib/cn";
import { type Locale, useI18n } from "@/lib/i18n";
import { type ThemePreference, useThemePreference } from "@/lib/theme";

const themeOptions: ThemePreference[] = ["light", "dark", "system"];
const localeOptions: Locale[] = ["vi", "en"];

export function ProfilePage() {
  const user = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { locale, setLocale, t } = useI18n();
  const { preference, setPreference } = useThemePreference();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preferenceNotice, setPreferenceNotice] = useState<string | null>(null);

  const normalizedName = displayName.trim();
  const nameError =
    normalizedName.length === 0
      ? t("Display name is required.")
      : normalizedName.length > 100
        ? t("Display name cannot exceed 100 characters.")
        : null;
  // aaabbbcccc
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (nameError || saving || normalizedName === user.displayName) return;

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: normalizedName }),
      });
      if (response.status === 401) {
        window.location.replace(
          `/login?next=${encodeURIComponent("/profile")}`,
        );
        return;
      }
      if (!response.ok) {
        const apiError = await readApiError(response);
        setError(t(apiError.fieldErrors.displayName ?? apiError.message));
        return;
      }

      const payload = (await response.json()) as { user?: CurrentUser };
      if (!payload.user) {
        setError(t("The updated profile could not be loaded."));
        return;
      }
      updateCurrentUser(payload.user);
      setDisplayName(payload.user.displayName);
      setSuccess(t("Profile updated."));
    } catch {
      setError(
        t(
          "Unable to update your profile. Check your connection and try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.replace("/login");
    }
  }

  function changeTheme(value: ThemePreference) {
    setPreference(value);
    setPreferenceNotice(t("Theme preference saved."));
  }

  function changeLocale(value: Locale) {
    setLocale(value);
    setPreferenceNotice(
      value === "vi" ? "Đã lưu ngôn ngữ." : "Language preference saved.",
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 py-2 sm:py-4">
      <header>
        <p className="text-sm font-semibold text-primary">{t("Account")}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-text sm:text-3xl">
          {t("Profile & settings")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted sm:text-base">
          {t("Manage your public name and local learning preferences.")}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(19rem,0.85fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar name={user.displayName} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-lg font-semibold text-text">
                    {user.displayName}
                  </h2>
                  <Badge variant={user.role === "ADMIN" ? "info" : "neutral"}>
                    {user.role === "ADMIN" ? t("Administrator") : t("Learner")}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-text-muted">
                  {user.email}
                </p>
                <p className="mt-1 text-xs text-text-subtle">
                  {t("Joined {{date}}", {
                    date: formatDate(user.createdAt, locale),
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveProfile} noValidate>
              <Label htmlFor="display-name">{t("Display name")}</Label>
              <Input
                id="display-name"
                name="displayName"
                value={displayName}
                maxLength={101}
                autoComplete="name"
                aria-invalid={Boolean(nameError)}
                aria-describedby={
                  nameError ? "display-name-error" : "display-name-hint"
                }
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setError(null);
                  setSuccess(null);
                }}
              />
              {nameError ? (
                <FieldError id="display-name-error">{nameError}</FieldError>
              ) : (
                <FieldHint id="display-name-hint">
                  {t("This name appears in your FresherPrep account.")}
                </FieldHint>
              )}

              <div className="mt-4">
                <Label htmlFor="profile-email">{t("Email")}</Label>
                <Input
                  id="profile-email"
                  value={user.email}
                  readOnly
                  disabled
                />
                <FieldHint>
                  {t(
                    "Email changes are not supported by the current account API.",
                  )}
                </FieldHint>
              </div>

              {error ? (
                <Feedback
                  className="mt-4"
                  tone="error"
                  title={t("Profile update failed")}
                >
                  {error}
                </Feedback>
              ) : null}
              {success ? (
                <Feedback className="mt-4" tone="success" title={success} />
              ) : null}

              <div className="mt-5 flex justify-end">
                <Button
                  type="submit"
                  loading={saving}
                  disabled={
                    Boolean(nameError) || normalizedName === user.displayName
                  }
                >
                  {saving ? t("Saving...") : t("Save changes")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold tracking-tight text-text">
                {t("Preferences")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-muted">
                {t("Saved on this device and applied immediately.")}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <ChoiceGroup
                legend={t("Appearance")}
                value={preference}
                options={themeOptions.map((value) => ({
                  value,
                  label: t(themeLabel(value)),
                }))}
                onChange={(value) => changeTheme(value as ThemePreference)}
              />
              <ChoiceGroup
                legend={t("Language")}
                value={locale}
                options={localeOptions.map((value) => ({
                  value,
                  label: value === "vi" ? "Tiếng Việt" : "English",
                }))}
                onChange={(value) => changeLocale(value as Locale)}
              />
              <p
                className="min-h-5 text-xs text-success-strong"
                role="status"
                aria-live="polite"
              >
                {preferenceNotice}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold tracking-tight text-text">
                {t("Account access")}
              </h2>
              <p className="mt-1 text-sm leading-6 text-text-muted">
                {t("End the current authenticated session on this device.")}
              </p>
            </CardHeader>
            <CardContent>
              <Button
                variant="secondary"
                loading={loggingOut}
                onClick={logout}
                className="w-full sm:w-auto"
              >
                {loggingOut ? t("Signing out...") : t("Sign out")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="flex size-16 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-subtle text-lg font-bold text-primary-strong"
      aria-label={name}
      role="img"
    >
      {initials || "FP"}
    </span>
  );
}

function ChoiceGroup({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-text">{legend}</legend>
      <div className="grid grid-cols-3 gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex min-h-10 cursor-pointer items-center justify-center rounded-md border px-2 text-center text-sm font-medium transition-colors focus-within:ring-3 focus-within:ring-focus/20",
              value === option.value
                ? "border-primary bg-primary-subtle text-primary-strong"
                : "border-border bg-surface text-text-muted hover:border-primary/35 hover:bg-surface-muted",
            )}
          >
            <input
              className="sr-only"
              type="radio"
              name={legend}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function themeLabel(theme: ThemePreference) {
  return theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";
}

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
