"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  Feedback,
  FieldError,
  Input,
  Label,
  Select,
} from "@/components/ui";
import {
  adminOptional,
  adminRequest,
  adminRequestAllPages,
  jsonBody,
} from "@/lib/admin/client";
import type {
  AdminPage,
  ContentStatus,
  KnowledgeNode,
  LessonAssessment,
  LessonDetail,
  LessonSummary,
  QuizSummary,
} from "@/lib/admin/types";
import { useI18n } from "@/lib/i18n";
import {
  KnowledgePathSelect,
  knowledgePathLabel,
} from "@/components/content/knowledge-path-select";
import { LessonContent } from "@/components/lessons/lesson-content";
import { hasMeaningfulLessonContent } from "@/lib/lessons/content";
import {
  AdminConfirmDialog,
  AdminDataTable,
  AdminLoadingOverlay,
  AdminPagination,
  AdminViewTabs,
} from "./admin-ui";
import { LessonRichTextEditor } from "./lesson-rich-text-editor";
import { KnowledgeTree } from "./knowledge-tree";

const statuses: ContentStatus[] = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"];
const emptyForm = {
  subtopicId: "",
  title: "",
  content: "",
  displayOrder: 0,
  minimumReadSeconds: 60,
  requiredScrollPercent: 80,
};

export function LessonManagement() {
  const { t } = useI18n();
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [treeLessons, setTreeLessons] = useState<LessonSummary[]>([]);
  const [relationLessons, setRelationLessons] = useState<LessonSummary[]>([]);
  const [subtopics, setSubtopics] = useState<KnowledgeNode[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [detail, setDetail] = useState<LessonDetail>();
  const [assessment, setAssessment] = useState<LessonAssessment>();
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [loadingCount, setLoadingCount] = useState(0);
  const [tabLoading, setTabLoading] = useState(false);
  const loading = loadingCount > 0 || tabLoading;
  const [pending, setPending] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createDecisionOpen, setCreateDecisionOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [validation, setValidation] = useState<Record<string, string>>({});
  const [selectedSubtopicId, setSelectedSubtopicId] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [view, setView] = useState<"list" | "editor">("editor");
  const [leftTab, setLeftTab] = useState<"lessons" | "knowledge">("knowledge");
  const [treeQuery, setTreeQuery] = useState("");
  const [creatingSubtopicId, setCreatingSubtopicId] = useState<string>();
  const [returnLessonId, setReturnLessonId] = useState<string>();

  const loadReferences = useCallback(async () => {
    setLoadingCount((count) => count + 1);
    setError(undefined);
    try {
      const [nodes, quizPage, allTreeLessons] = await Promise.all([
        adminRequest<KnowledgeNode[]>("knowledge/nodes"),
        adminRequest<AdminPage<QuizSummary>>(
          "quizzes?page=0&size=200&sort=title,asc",
        ),
        adminRequest<LessonSummary[]>("lessons/tree"),
      ]);
      setSubtopics(nodes);
      setQuizzes(quizPage.content);
      setTreeLessons(allTreeLessons);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setLoadingCount((count) => Math.max(0, count - 1));
    }
  }, []);

  const loadLessons = useCallback(async () => {
    setLoadingCount((count) => count + 1);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: "20",
        sort: "title,asc",
      });
      if (selectedSubtopicId) params.set("subtopicId", selectedSubtopicId);
      const result = await adminRequest<AdminPage<LessonSummary>>(
        `lessons?${params.toString()}`,
      );
      setLessons(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setLoadingCount((count) => Math.max(0, count - 1));
      setTabLoading(false);
    }
  }, [page, selectedSubtopicId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReferences(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReferences]);

  useEffect(() => {
    if (view !== "list") return;
    const timer = window.setTimeout(() => void loadLessons(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLessons, view]);

  const visibleLessons = useMemo(
    () =>
      lessons.filter((lesson) =>
        `${lesson.title} ${lesson.slug}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [lessons, query],
  );

  async function selectLesson(lessonId: string) {
    setDetailLoading(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const [selected, selectedAssessment, allRelationLessons] = await Promise.all([
        adminRequest<LessonDetail>(`lessons/${lessonId}`),
        adminOptional<LessonAssessment>(`lessons/${lessonId}/assessment`),
        adminRequestAllPages<LessonSummary>(
          "lessons?sort=title,asc&sort=id,asc",
        ),
      ]);
      setDetail(selected);
      setSelectedSubtopicId(selected.subtopicId);
      setCreatingSubtopicId(undefined);
      setReturnLessonId(undefined);
      setAssessment(selectedAssessment);
      setRelationLessons(allRelationLessons);
      setForm({
        subtopicId: selected.subtopicId,
        title: selected.title,
        content: selected.content,
        displayOrder: selected.displayOrder,
        minimumReadSeconds: selected.minimumReadSeconds,
        requiredScrollPercent: selected.requiredScrollPercent,
      });
      setValidation({});
      setView("editor");
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setDetailLoading(false);
    }
  }

  function startCreate() {
    setReturnLessonId(detail?.id);
    setDetail(undefined);
    setCreatingSubtopicId(undefined);
    setAssessment(undefined);
    setForm({ ...emptyForm, subtopicId: selectedSubtopicId });
    setError(undefined);
    setSuccess(undefined);
    setValidation({});
    setLeftTab("knowledge");
    setView("editor");
    window.requestAnimationFrame(() =>
      document.getElementById("lesson-title")?.focus(),
    );
  }

  function startBlankCreate() {
    setReturnLessonId(undefined);
    setDetail(undefined);
    setCreatingSubtopicId(undefined);
    setSelectedSubtopicId("");
    setAssessment(undefined);
    setForm(emptyForm);
    setError(undefined);
    setSuccess(undefined);
    setValidation({});
    setLeftTab("knowledge");
    setView("editor");
    window.requestAnimationFrame(() =>
      document.getElementById("lesson-title")?.focus(),
    );
  }

  function startCreateForSubtopic(subtopic: KnowledgeNode) {
    setReturnLessonId(detail?.id);
    setSelectedSubtopicId(subtopic.id);
    setPage(0);
    setDetail(undefined);
    setAssessment(undefined);
    setCreatingSubtopicId(subtopic.id);
    setForm({ ...emptyForm, subtopicId: subtopic.id });
    setError(undefined);
    setSuccess(undefined);
    setValidation({});
    setView("editor");
    window.requestAnimationFrame(() =>
      document.getElementById("lesson-title")?.focus(),
    );
  }

  function cancelCreate() {
    const previousId = returnLessonId;
    setCreatingSubtopicId(undefined);
    setReturnLessonId(undefined);
    setValidation({});
    setError(undefined);
    setSuccess(undefined);
    if (previousId) {
      void selectLesson(previousId);
      return;
    }
    setForm({ ...emptyForm, subtopicId: selectedSubtopicId });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.subtopicId) errors.subtopicId = "Select a subtopic.";
    if (!form.title.trim()) errors.title = "Title is required.";
    if (!hasMeaningfulLessonContent(form.content))
      errors.content = "Lesson content is required.";
    if (detail && form.displayOrder < 0)
      errors.displayOrder = "Display order cannot be negative.";
    if (form.minimumReadSeconds < 1)
      errors.minimumReadSeconds =
        "Minimum read time must be at least one second.";
    if (form.requiredScrollPercent < 1 || form.requiredScrollPercent > 100)
      errors.requiredScrollPercent =
        "Scroll requirement must be between 1 and 100.";
    setValidation(errors);
    if (Object.keys(errors).length) return;

    if (!detail) {
      setCreateDecisionOpen(true);
      return;
    }
    void saveLesson(false);
  }

  async function saveLesson(publish: boolean) {
    setCreateDecisionOpen(false);
    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const basePayload = {
        subtopicId: form.subtopicId,
        title: form.title.trim(),
        content: form.content.trim(),
        minimumReadSeconds: form.minimumReadSeconds,
        requiredScrollPercent: form.requiredScrollPercent,
      };
      const editing = Boolean(detail);
      const payload = editing ? { ...basePayload, displayOrder: form.displayOrder } : basePayload;
      const saved = await adminRequest<LessonDetail>(
        detail ? `lessons/${detail.id}` : "lessons",
        {
          method: detail ? "PUT" : "POST",
          ...jsonBody(editing ? payload : { ...payload, publish }),
        },
      );
      await loadReferences();
      if (view === "list") await loadLessons();
      if (editing) {
        await selectLesson(saved.id);
        setSuccess("Lesson updated.");
      } else {
        setDetail(undefined);
        setAssessment(undefined);
        setReturnLessonId(undefined);
        setForm({ ...emptyForm, subtopicId: payload.subtopicId });
        setValidation({});
        setSuccess(
          publish
            ? t("Lesson created and published.")
            : t("Lesson created as draft."),
        );
        window.requestAnimationFrame(() =>
          document.getElementById("lesson-title")?.focus(),
        );
      }
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  async function changeStatus(status: ContentStatus) {
    if (!detail) return;
    setPending(true);
    setError(undefined);
    try {
      const saved = await adminRequest<LessonDetail>(
        `lessons/${detail.id}/status`,
        {
          method: "PATCH",
          ...jsonBody({ status }),
        },
      );
      setDetail(saved);
      await loadReferences();
      if (view === "list") await loadLessons();
      setSuccess(`Status changed to ${status.toLowerCase()}.`);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  async function deleteLesson() {
    if (
      !detail ||
      !window.confirm(t("Delete this lesson? This cannot be undone."))
    )
      return;
    setPending(true);
    setError(undefined);
    try {
      await adminRequest<void>(`lessons/${detail.id}`, { method: "DELETE" });
      startCreate();
      await loadReferences();
      if (view === "list") await loadLessons();
      setSuccess("Lesson deleted.");
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  async function reloadDetail(message?: string) {
    if (!detail) return;
    await selectLesson(detail.id);
    if (message) setSuccess(message);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <AdminLoadingOverlay
        show={loading || pending || detailLoading}
        label={t("Processing data...")}
      />
      <AdminConfirmDialog
        open={createDecisionOpen}
        title={t("Publish new lesson?")}
        description={t(
          "Choose whether this lesson is published immediately or kept as a draft.",
        )}
        confirmLabel={t("Yes, publish")}
        secondaryLabel={t("No, keep draft")}
        cancelLabel={t("Cancel")}
        pending={pending}
        onConfirm={() => void saveLesson(true)}
        onSecondary={() => void saveLesson(false)}
        onClose={() => setCreateDecisionOpen(false)}
      />
      {error ? (
        <Feedback className="mt-6" tone="error" title={t("Action failed")}>
          {error}
        </Feedback>
      ) : null}
      {success ? (
        <Feedback className="mt-6" tone="success" title={success} />
      ) : null}

      <AdminViewTabs
        value={view}
        label={t("Lesson management views")}
        onChange={(nextView) => { setTabLoading(nextView === "list"); setView(nextView); }}
        items={[
          { value: "editor", label: t("Create / edit lesson") },
          { value: "list", label: t("Lesson list") },
        ]}
      />

      {view === "list" ? (
        <section className="mt-7" aria-label={t("Lesson list")}>
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label htmlFor="lesson-list-search">{t("Search lessons")}</Label>
              <Input
                id="lesson-list-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Title or slug")}
              />
            </div>
            <div className="min-w-0 flex-1">
              <Label htmlFor="lesson-list-subtopic">{t("Subtopic")}</Label>
              <Select
                id="lesson-list-subtopic"
                value={selectedSubtopicId}
                onChange={(event) => {
                  setSelectedSubtopicId(event.target.value);
                  setPage(0);
                }}
              >
                <option value="">{t("All subtopics")}</option>
                {subtopics
                  .filter((node) => node.type === "SUBTOPIC")
                  .map((node) => (
                    <option key={node.id} value={node.id}>
                      {knowledgePathLabel(subtopics, node.id)}
                    </option>
                  ))}
              </Select>
            </div>
            <p className="shrink-0 pb-2 text-sm font-medium text-text-muted">
              {t("{{count}} lessons", { count: totalElements })}
            </p>
          </div>
          <div className="mt-5">
            {loading ? (
              <p className="py-12 text-center text-sm text-text-muted">
                {t("Loading lessons...")}
              </p>
            ) : visibleLessons.length ? (
              <>
                <AdminDataTable
                  caption={t("Lesson list")}
                  rows={visibleLessons}
                  rowKey={(lesson) => lesson.id}
                  columns={[
                    {
                      key: "title",
                      header: t("Lesson"),
                      cell: (lesson) => (
                        <div>
                          <p className="font-semibold text-text">
                            {lesson.title}
                          </p>
                          <p className="mt-1 text-xs">{lesson.slug}</p>
                        </div>
                      ),
                    },
                    {
                      key: "location",
                      header: t("Knowledge path"),
                      cell: (lesson) =>
                        knowledgePathLabel(subtopics, lesson.subtopicId),
                    },
                    {
                      key: "status",
                      header: t("Status"),
                      cell: (lesson) => <LessonStatus status={lesson.status} />,
                    },
                    {
                      key: "requirements",
                      header: t("Reading requirements"),
                      cell: (lesson) =>
                        t("{{seconds}}s / {{percent}}% scroll", {
                          seconds: lesson.minimumReadSeconds,
                          percent: lesson.requiredScrollPercent,
                        }),
                    },
                    {
                      key: "action",
                      header: t("Action"),
                      className: "text-right",
                      cell: (lesson) => (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void selectLesson(lesson.id)}
                        >
                          {t("Edit")}
                        </Button>
                      ),
                    },
                  ]}
                />
                <AdminPagination
                  page={page}
                  totalPages={totalPages}
                  disabled={loading}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-text-muted">
                {t("No matching lessons.")}
              </p>
            )}
          </div>
        </section>
      ) : null}

      <div
        className={
          view === "editor"
            ? "mt-8 grid gap-6 lg:grid-cols-2"
            : "hidden"
        }
      >
        <Card>
          <CardContent>
            <div
              className="hidden"
              role="tablist"
              aria-label={t("Lesson management views")}
            >
              <button
                type="button"
                role="tab"
                aria-selected={leftTab === "lessons"}
                aria-controls="lesson-list-panel"
                onClick={() => setLeftTab("lessons")}
                className={`min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${leftTab === "lessons" ? "border-primary text-primary-strong" : "border-transparent text-text-muted hover:text-text"}`}
              >
                {t("Lessons")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={leftTab === "knowledge"}
                aria-controls="lesson-tree-panel"
                onClick={() => setLeftTab("knowledge")}
                className={`min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${leftTab === "knowledge" ? "border-primary text-primary-strong" : "border-transparent text-text-muted hover:text-text"}`}
              >
                {t("Knowledge Tree")}
              </button>
            </div>

            {leftTab === "lessons" ? (
              <div id="lesson-list-panel" role="tabpanel">
                <KnowledgePathSelect
                  nodes={subtopics}
                  value={selectedSubtopicId}
                  onChange={(value) => {
                    setSelectedSubtopicId(value);
                    setPage(0);
                    setQuery("");
                    setDetail(undefined);
                    setAssessment(undefined);
                    setCreatingSubtopicId(undefined);
                  }}
                  idPrefix="lesson-filter"
                />
                <Label htmlFor="lesson-search">{t("Search lessons")}</Label>
                <Input
                  id="lesson-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("Title or slug")}
                />
                {loading ? (
                  <p className="py-10 text-center text-sm text-text-muted">
                    {t("Loading lessons...")}
                  </p>
                ) : visibleLessons.length ? (
                  <ul className="mt-5 max-h-[50vh] space-y-2 overflow-y-auto overscroll-contain pr-1 sm:max-h-[32rem]">
                    {visibleLessons.map((lesson) => (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => void selectLesson(lesson.id)}
                          className={`w-full rounded-md border p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${detail?.id === lesson.id ? "border-primary/40 bg-primary-subtle" : "border-border"}`}
                        >
                          <span className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-text">
                              {lesson.title}
                            </span>
                            <LessonStatus status={lesson.status} />
                          </span>
                          <span className="mt-1 block text-xs text-text-muted">
                            {lesson.slug} ·{" "}
                            {t("order {{order}}", {
                              order: lesson.displayOrder,
                            })}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-10 text-center text-sm text-text-muted">
                    {t("No matching lessons.")}
                  </p>
                )}
                <AdminPagination
                  page={page}
                  totalPages={totalPages}
                  disabled={loading}
                  onPageChange={setPage}
                />
              </div>
            ) : (
              <div id="lesson-tree-panel" role="tabpanel">
                <Label htmlFor="lesson-tree-search">
                  {t("Search hierarchy")}
                </Label>
                <Input
                  id="lesson-tree-search"
                  value={treeQuery}
                  onChange={(event) => setTreeQuery(event.target.value)}
                  placeholder={t("Search by name, slug, or type")}
                />
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  {t(
                    "Lessons can only be attached to subtopics. Use the plus action on a subtopic to start creating one.",
                  )}
                </p>
                <div className="mt-4">
                  {loading ? (
                    <p className="py-10 text-center text-sm text-text-muted">
                      {t("Loading knowledge nodes")}
                    </p>
                  ) : (
                  <KnowledgeTree
                    nodes={subtopics}
                    lessons={treeLessons}
                      query={treeQuery}
                      mode="lesson"
                      selectedId={creatingSubtopicId ?? selectedSubtopicId}
                      onSelect={(node) => {
                        if (node.type !== "SUBTOPIC") return;
                        setSelectedSubtopicId(node.id);
                        setPage(0);
                      }}
                    onAddLesson={startCreateForSubtopic}
                    onSelectLesson={(lesson) => void selectLesson(lesson.id)}
                      onRefresh={() => void loadReferences()}
                      refreshing={loading}
                    />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardContent>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-text">
                    {detail ? t("Edit lesson") : t("Create lesson")}
                  </h2>
                  <p className="mt-1 text-sm text-text-muted">
                    {t(
                      "Content is stored as the backend lesson content string.",
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {detail ? <LessonStatus status={detail.status} /> : null}
                  {detail ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={startBlankCreate}
                    >
                      {t("Back to create")}
                    </Button>
                  ) : null}
                </div>
              </div>
              <form
                className="mt-6 grid gap-5 sm:grid-cols-2"
                onSubmit={submit}
                noValidate
              >
                <div className="sm:col-span-2">
                  {!detail && creatingSubtopicId ? (
                    <div className="rounded-md border border-primary/20 bg-primary-subtle px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-primary">
                        {t("Lesson location")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-text">
                        {knowledgePathLabel(subtopics, creatingSubtopicId)}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        {t("Selected automatically from the Knowledge Tree.")}
                      </p>
                    </div>
                  ) : (
                    <KnowledgePathSelect
                      nodes={subtopics}
                      value={form.subtopicId}
                      onChange={(subtopicId) =>
                        setForm((current) => ({ ...current, subtopicId }))
                      }
                      idPrefix="lesson-form"
                    />
                  )}
                  {form.subtopicId && !creatingSubtopicId ? (
                    <p className="mt-2 text-xs text-text-muted">
                      {knowledgePathLabel(subtopics, form.subtopicId)}
                    </p>
                  ) : null}
                  {validation.subtopicId ? (
                    <FieldError>{validation.subtopicId}</FieldError>
                  ) : null}
                </div>
                <Field
                  label={t("Title")}
                  htmlFor="lesson-title"
                  error={validation.title}
                >
                  <Input
                    id="lesson-title"
                    maxLength={200}
                    aria-invalid={Boolean(validation.title)}
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </Field>
                <div>
                  <Label>{t("System slug")}</Label>
                  <p className="mt-2 font-mono text-xs text-text-muted">
                    {detail?.slug ??
                      t("Generated automatically after creation")}
                  </p>
                </div>
                {detail ? (
                  <Field label={t("Display order")} htmlFor="lesson-order" error={validation.displayOrder}>
                    <Input
                      id="lesson-order"
                      type="number"
                      min={0}
                      aria-invalid={Boolean(validation.displayOrder)}
                      value={form.displayOrder}
                      onChange={(event) => setForm((current) => ({ ...current, displayOrder: Number(event.target.value) }))}
                    />
                  </Field>
                ) : (
                  <div>
                    <Label>{t("Display order")}</Label>
                    <p className="mt-2 text-sm text-text-muted">{t("Assigned automatically within the selected subtopic")}</p>
                  </div>
                )}
                <Field
                  label={t("Minimum read seconds")}
                  htmlFor="lesson-read-time"
                  error={validation.minimumReadSeconds}
                >
                  <Input
                    id="lesson-read-time"
                    type="number"
                    min={1}
                    aria-invalid={Boolean(validation.minimumReadSeconds)}
                    value={form.minimumReadSeconds}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        minimumReadSeconds: Number(event.target.value),
                      }))
                    }
                  />
                </Field>
                <Field
                  label={t("Required scroll percent")}
                  htmlFor="lesson-scroll"
                  error={validation.requiredScrollPercent}
                >
                  <Input
                    id="lesson-scroll"
                    type="number"
                    min={1}
                    max={100}
                    aria-invalid={Boolean(validation.requiredScrollPercent)}
                    value={form.requiredScrollPercent}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        requiredScrollPercent: Number(event.target.value),
                      }))
                    }
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Label>{t("Content")}</Label>
                  <p className="mb-2 text-xs text-text-muted">
                    {t(
                      "Format lesson content, insert code or tables, and upload images without leaving the editor.",
                    )}
                  </p>
                  <LessonRichTextEditor
                    invalid={Boolean(validation.content)}
                    value={form.content}
                    onChange={(content) =>
                      setForm((current) => ({ ...current, content }))
                    }
                  />
                  {validation.content ? (
                    <FieldError>{validation.content}</FieldError>
                  ) : null}
                  {hasMeaningfulLessonContent(form.content) ? (
                    <details className="mt-3 rounded-md border border-border p-4">
                      <summary className="cursor-pointer text-sm font-semibold text-text">
                        {t("Content preview")}
                      </summary>
                      <div className="mt-5">
                        <LessonContent content={form.content} />
                      </div>
                    </details>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3 sm:col-span-2">
                  <Button type="submit" loading={pending}>
                    {detail ? t("Save lesson") : t("Create lesson")}
                  </Button>
                  {!detail && (creatingSubtopicId || returnLessonId) ? (
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={pending}
                      onClick={cancelCreate}
                    >
                      {t("Cancel")}
                    </Button>
                  ) : null}
                </div>
              </form>
              {detail ? (
                <div className="mt-7 border-t border-border pt-6">
                  <h3 className="text-sm font-semibold text-text">
                    {t("Publishing status")}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statuses.map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant="secondary"
                        disabled={pending || detail.status === status}
                        onClick={() => void changeStatus(status)}
                      >
                        {t(status)}
                      </Button>
                    ))}
                  </div>
                  <Button
                    className="mt-6"
                    size="sm"
                    variant="danger"
                    loading={pending}
                    onClick={() => void deleteLesson()}
                  >
                    {t("Delete lesson")}
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {detail ? (
            <LessonRelations
              key={detail.id}
              lesson={detail}
              allLessons={relationLessons}
              quizzes={quizzes}
              assessment={assessment}
              pending={pending}
              setPending={setPending}
              onChanged={reloadDetail}
              onError={setError}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function LessonRelations({
  lesson,
  allLessons,
  quizzes,
  assessment,
  pending,
  setPending,
  onChanged,
  onError,
}: {
  lesson: LessonDetail;
  allLessons: LessonSummary[];
  quizzes: QuizSummary[];
  assessment?: LessonAssessment;
  pending: boolean;
  setPending: (value: boolean) => void;
  onChanged: (message?: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const { t } = useI18n();
  const [prerequisiteId, setPrerequisiteId] = useState("");
  const [quizId, setQuizId] = useState("");
  const availablePrerequisites = allLessons.filter(
    (candidate) =>
      candidate.id !== lesson.id &&
      !lesson.prerequisites.some((item) => item.id === candidate.id),
  );

  async function mutate(
    path: string,
    method: "POST" | "DELETE",
    message: string,
    body?: unknown,
    onSuccess?: () => void,
  ) {
    setPending(true);
    onError("");
    try {
      await adminRequest(path, { method, ...(body ? jsonBody(body) : {}) });
      await onChanged(message);
      onSuccess?.();
    } catch (reason) {
      onError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-text">
            {t("Prerequisites")}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {t("The backend prevents self-reference, duplicates, and cycles.")}
          </p>
          {lesson.prerequisites.length ? (
            <ul className="mt-5 space-y-2">
              {lesson.prerequisites.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-muted">{t(item.status)}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      if (
                        window.confirm(
                          t("Remove prerequisite {{title}}?", {
                            title: item.title,
                          }),
                        )
                      )
                        void mutate(
                          `lessons/${lesson.id}/prerequisites/${item.id}`,
                          "DELETE",
                          t("Prerequisite removed."),
                        );
                    }}
                  >
                    {t("Remove")}
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-text-muted">
              {t("No prerequisites.")}
            </p>
          )}
          <div className="mt-5 border-t border-border pt-5">
            <Label htmlFor="prerequisite">{t("Add prerequisite")}</Label>
            <Select
              id="prerequisite"
              value={prerequisiteId}
              onChange={(event) => setPrerequisiteId(event.target.value)}
            >
              <option value="">{t("Select lesson")}</option>
              {availablePrerequisites.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} ({item.status})
                </option>
              ))}
            </Select>
            <Button
              className="mt-3"
              size="sm"
              disabled={!prerequisiteId}
              loading={pending}
              onClick={() =>
                void mutate(
                  `lessons/${lesson.id}/prerequisites/${prerequisiteId}`,
                  "POST",
                  t("Prerequisite added."),
                  undefined,
                  () => setPrerequisiteId(""),
                )
              }
            >
              {t("Add prerequisite")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold text-text">
            {t("Assessment quiz")}
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            {t("A published lesson can only reference a published quiz.")}
          </p>
          {assessment ? (
            <div className="mt-5 rounded-md border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">
                    {assessment.quizTitle}
                  </p>
                  <p className="mt-1 text-xs text-text-muted">
                    {assessment.quizCode} ·{" "}
                    {t("pass {{percent}}%", {
                      percent: assessment.passPercentage,
                    })}
                  </p>
                </div>
                <LessonStatus status={assessment.quizStatus} />
              </div>
              <Button
                className="mt-4"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => {
                  if (
                    window.confirm(t("Remove this assessment from the lesson?"))
                  )
                    void mutate(
                      `lessons/${lesson.id}/assessment`,
                      "DELETE",
                      t("Assessment removed."),
                    );
                }}
              >
                {t("Remove assessment")}
              </Button>
            </div>
          ) : (
            <div className="mt-5">
              <Label htmlFor="assessment-quiz">{t("Assign quiz")}</Label>
              <Select
                id="assessment-quiz"
                value={quizId}
                onChange={(event) => setQuizId(event.target.value)}
              >
                <option value="">{t("Select quiz")}</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title} ({quiz.status})
                  </option>
                ))}
              </Select>
              <Button
                className="mt-3"
                size="sm"
                disabled={!quizId}
                loading={pending}
                onClick={() =>
                  void mutate(
                    `lessons/${lesson.id}/assessment`,
                    "POST",
                    t("Assessment assigned."),
                    { quizId },
                    () => setQuizId(""),
                  )
                }
              >
                {t("Assign assessment")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
function LessonStatus({ status }: { status: ContentStatus }) {
  const { t } = useI18n();
  return (
    <Badge
      variant={
        status === "PUBLISHED"
          ? "success"
          : status === "REVIEW"
            ? "warning"
            : status === "DRAFT"
              ? "info"
              : "neutral"
      }
    >
      {t(status)}
    </Badge>
  );
}
function messageOf(reason: unknown) {
  return reason instanceof Error
    ? reason.message
    : "The request could not be completed.";
}
