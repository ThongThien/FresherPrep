"use client";

import type { ReactNode } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Feedback,
  FieldError,
  FieldHint,
  Input,
  Label,
  Progress,
  Select,
  Textarea,
} from "@/components/ui";
import { useI18n } from "@/lib/i18n";

const colors = [
  ["Primary", "bg-primary"],
  ["Success", "bg-success"],
  ["Warning", "bg-warning"],
  ["Danger", "bg-danger"],
  ["Neutral", "bg-text"],
] as const;

export function UiFoundationPreview() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-6xl">
      <header className="max-w-3xl border-b border-border pb-8">
        <Badge variant="info">{t("UI foundation")}</Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text sm:text-4xl">
          {t("FresherPrep Design System")}
        </h1>
        <p className="mt-3 text-base leading-7 text-text-muted sm:text-lg">
          {t("A calm, consistent visual foundation for focused Java Backend learning.")}
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-8">
          <Section title={t("Actions")} description={t("Primary, supporting, and system-level actions.")}>
            <div className="flex flex-wrap gap-3">
              <Button>{t("Continue learning")}</Button>
              <Button variant="secondary">{t("View learning path")}</Button>
              <Button variant="ghost">{t("Not now")}</Button>
              <Button variant="danger">{t("Delete")}</Button>
              <Button loading>{t("Saving")}</Button>
              <Button disabled>{t("Unavailable")}</Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Badge>{t("Default")}</Badge>
              <Badge variant="info">{t("In progress")}</Badge>
              <Badge variant="success">{t("Completed")}</Badge>
              <Badge variant="warning">{t("Review needed")}</Badge>
              <Badge variant="danger">{t("Not passed")}</Badge>
            </div>
          </Section>

          <Section title={t("Progress")} description={t("Color is reserved for meaningful learning states.")}>
            <div className="space-y-5">
              <Progress value={68} label={t("Java Fundamentals")} showValue />
              <Progress value={100} label={t("Lesson completed")} showValue tone="success" />
            </div>
          </Section>

          <Section title={t("Feedback")} description={t("Short, direct messages that never communicate with color alone.")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Feedback tone="success" title={t("Progress saved")}>{t("You can continue from this point on your next visit.")}</Feedback>
              <Feedback tone="error" title={t("Unable to submit")}>{t("Select an answer before continuing.")}</Feedback>
              <Feedback tone="info" title={t("Study tip")}>{t("Review the explanation after every question.")}</Feedback>
              <Feedback tone="warning" title={t("Time is running low")}>{t("You have 5 minutes left to finish this quiz.")}</Feedback>
            </div>
          </Section>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t("Set a learning goal")}</CardTitle>
              <CardDescription>{t("Form controls share consistent focus, spacing, and error language.")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="goal">{t("Goal")}</Label>
                <Input id="goal" placeholder={t("For example: Complete Java Core")} />
                <FieldHint>{t("Choose a specific and achievable target.")}</FieldHint>
              </div>
              <div>
                <Label htmlFor="pace">{t("Study pace")}</Label>
                <Select id="pace" defaultValue="steady">
                  <option value="steady">{t("Steady - 30 minutes/day")}</option>
                  <option value="focused">{t("Focused - 60 minutes/day")}</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="note">{t("Notes")}</Label>
                <Textarea id="note" placeholder={t("What would you like to focus on this week?")} />
              </div>
              <div>
                <Label htmlFor="invalid-goal">{t("Error example")}</Label>
                <Input id="invalid-goal" aria-invalid="true" />
                <FieldError>{t("A learning goal is required.")}</FieldError>
              </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row">
              <Button className="w-full sm:w-auto">{t("Save goal")}</Button>
              <Button variant="ghost" className="w-full sm:w-auto">{t("Cancel")}</Button>
            </CardFooter>
          </Card>

          <section aria-labelledby="palette-heading">
            <h2 id="palette-heading" className="text-lg font-semibold tracking-tight text-text">{t("State palette")}</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 lg:grid-cols-2 xl:grid-cols-5">
              {colors.map(([name, className]) => (
                <div key={name} className="rounded-md border border-border bg-surface p-2 shadow-input">
                  <div className={`h-10 rounded-sm ${className}`} />
                  <p className="mt-2 text-xs font-medium text-text-muted">{t(name)}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const headingId = `${title.toLowerCase()}-heading`;
  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4">
        <h2 id={headingId} className="text-lg font-semibold tracking-tight text-text">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-text-muted">{description}</p>
      </div>
      <Card><CardContent>{children}</CardContent></Card>
    </section>
  );
}
