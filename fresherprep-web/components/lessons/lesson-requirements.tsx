"use client";

import { Badge, Progress } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import type { LessonDetail, LessonProgress } from "@/lib/lessons/types";

export function LessonRequirements({
  lesson,
  progress,
  activeSeconds,
}: {
  lesson: LessonDetail;
  progress?: LessonProgress;
  activeSeconds: number;
}) {
  const { t } = useI18n();
  const currentScroll = progress?.maxScrollPercent ?? 0;
  const remainingScroll = Math.max(0, lesson.requiredScrollPercent - currentScroll);
  const assessmentPassed = progress?.assessmentStatus === "PASSED";
  const assessmentFailed = progress?.assessmentStatus === "FAILED";

  return (
    <section className="rounded-lg border border-border bg-surface p-5 shadow-card" aria-labelledby="lesson-requirements-title">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="lesson-requirements-title" className="text-sm font-semibold text-text">{t("Lesson requirements")}</h2>
          <p className="mt-1 text-xs leading-5 text-text-muted">{t("Complete each required step to unlock the next lesson.")}</p>
        </div>
        {progress?.completed ? <Badge variant="success">{t("Completed")}</Badge> : null}
      </div>

      <ul className="mt-5 space-y-5">
        <li>
          <RequirementHeading complete={Boolean(progress?.readQualified)} label={t("Reading progress")} />
          <Progress
            className="mt-2"
            value={Math.min(100, currentScroll / Math.max(1, lesson.requiredScrollPercent) * 100)}
            label={t("Required reading progress")}
          />
          <p className="mt-2 text-xs text-text-muted">
            {t("{{current}}% / {{required}}% required", { current: currentScroll, required: lesson.requiredScrollPercent })}
          </p>
        </li>

        <li>
          <RequirementHeading label={t("Reading activity")} />
          <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-text">
            {formatDuration(activeSeconds)} / {formatDuration(lesson.minimumReadSeconds)}
          </p>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            {t("This is activity guidance and does not block lesson completion.")}
          </p>
        </li>

        {progress?.assessmentRequired ? (
          <li>
            <RequirementHeading complete={assessmentPassed} label={t("Assessment")} />
            <p className="mt-1 text-sm text-text-muted">
              {!progress.readQualified
                ? t("Available after the reading requirement is complete.")
                : assessmentPassed
                  ? t("Assessment passed.")
                  : assessmentFailed
                    ? t("Assessment failed. Review the lesson and try again.")
                    : t("Not completed")}
            </p>
            {progress.assessmentPassPercentage !== null ? (
              <p className="mt-1 text-xs text-text-muted">
                {t("Passing score: {{score}}%", { score: progress.assessmentPassPercentage })}
                {progress.assessmentScorePercentage !== null
                  ? " - " + t("Latest score: {{score}}%", { score: progress.assessmentScorePercentage })
                  : ""}
              </p>
            ) : null}
          </li>
        ) : null}
      </ul>

      {!progress?.completed ? (
        <div className="mt-5 border-t border-border pt-4" aria-live="polite">
          <p className="text-sm font-semibold text-text">{t("Lesson not completed yet")}</p>
          <ul className="mt-2 space-y-1 text-xs leading-5 text-text-muted">
            {remainingScroll > 0 ? <li>{t("Explore {{percent}}% more of this lesson.", { percent: remainingScroll })}</li> : null}
            {progress?.assessmentRequired && !assessmentPassed ? (
              <li>{progress.readQualified ? t("Pass the assessment to continue.") : t("The assessment unlocks after reading.")}</li>
            ) : null}
          </ul>
        </div>
      ) : (
        <p className="mt-5 border-t border-border pt-4 text-sm font-semibold text-success-strong">
          {t("All lesson requirements are complete.")}
        </p>
      )}
    </section>
  );
}

function RequirementHeading({ label, complete = false }: { label: string; complete?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2">
      <span
        className={complete ? "text-success-strong" : "text-text-subtle"}
        aria-label={complete ? t("Completed") : t("In progress")}
      >
        {complete ? "\u2713" : "\u25cb"}
      </span>
      <h3 className="text-sm font-semibold text-text">{label}</h3>
    </div>
  );
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return minutes > 0 ? minutes + "m " + remainder + "s" : remainder + "s";
}
