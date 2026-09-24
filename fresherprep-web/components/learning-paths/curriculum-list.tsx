import Link from "next/link";

import { Badge } from "@/components/ui";
import type {
  LearningPathDetailData,
  LearningPathItem,
  LearningPathProgress,
} from "@/lib/learning-paths/types";

export function CurriculumList({
  data,
  continueLessonId,
}: {
  data: LearningPathDetailData;
  continueLessonId?: string;
}) {
  const orderedItems = [...data.path.items].sort((a, b) => a.displayOrder - b.displayOrder);
  const progressByLessonId = new Map(
    (data.progress?.lessons ?? []).map((progress) => [progress.lessonId, progress]),
  );
  const startedLessonIds = new Set(data.lessonProgress.map((progress) => progress.lessonId));

  if (!orderedItems.length) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-surface px-6 py-10 text-center">
        <h3 className="font-semibold text-text">Curriculum is not available yet</h3>
        <p className="mt-2 text-sm text-text-muted">Lessons will appear here when they are published.</p>
      </div>
    );
  }

  return (
    <ol className="overflow-hidden rounded-lg border border-border bg-surface shadow-card">
      {orderedItems.map((item, index) => {
        const progress = progressByLessonId.get(item.lessonId);
        const state = itemState(item, data, progress, startedLessonIds.has(item.lessonId));
        const current = item.lessonId === continueLessonId && !progress?.completed;
        return (
          <li
            key={item.id}
            className={`relative border-b border-border p-5 last:border-b-0 sm:p-6 ${current ? "bg-primary-subtle/55" : ""}`}
          >
            {current ? <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" /> : null}
            <div className="flex gap-4 sm:gap-5">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${progress?.completed ? "border-success/25 bg-success-subtle text-success-strong" : "border-border-strong bg-surface-muted text-text-muted"}`}
                aria-hidden="true"
              >
                {progress?.completed ? "✓" : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-text">{item.lessonTitle}</h3>
                      <Badge variant={item.required ? "info" : "neutral"}>
                        {item.required ? "Required" : "Optional"}
                      </Badge>
                      {current ? <Badge variant="info">Continue here</Badge> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
                      <span>Order {item.displayOrder}</span>
                      <span>Weight {item.weight}</span>
                      <span>{state.label}</span>
                    </div>
                    {progress?.assessmentRequired ? (
                      <p className="mt-2 text-xs text-text-muted">
                        Assessment: {assessmentLabel(progress.assessmentStatus)}
                      </p>
                    ) : null}
                  </div>

                  {data.joined === true ? (
                    <Link
                      href={"/lessons/" + item.lessonId + "?pathId=" + encodeURIComponent(data.path.id)}
                      className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-md border border-border-strong px-3 text-sm font-semibold text-text transition-colors hover:border-primary/40 hover:bg-primary-subtle hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20"
                    >
                      {progress?.completed ? "Review" : startedLessonIds.has(item.lessonId) ? "Continue" : "Open lesson"}
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function itemState(
  _item: LearningPathItem,
  data: LearningPathDetailData,
  progress: LearningPathProgress["lessons"][number] | undefined,
  started: boolean,
) {
  if (data.joined !== true) return { label: "Path preview" };
  if (progress?.completed) return { label: "Completed" };
  if (started) return { label: "In progress" };
  if (data.lessonProgressUnavailable) return { label: "Incomplete" };
  return { label: "Not started" };
}

function assessmentLabel(status: LearningPathProgress["lessons"][number]["assessmentStatus"]) {
  if (status === "PASSED") return "Passed";
  if (status === "FAILED") return "Needs another attempt";
  if (status === "IN_PROGRESS") return "In progress";
  if (status === "NOT_STARTED") return "Not started";
  return "Not required";
}
