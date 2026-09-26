"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge, Button, Card, CardContent, Feedback, FieldError, Input, Label, Select, Textarea } from "@/components/ui";
import { adminOptional, adminRequest, jsonBody } from "@/lib/admin/client";
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
import { KnowledgePathSelect, knowledgePathLabel } from "@/components/content/knowledge-path-select";
import { AdminPagination } from "./admin-ui";

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
  const [relationLessons, setRelationLessons] = useState<LessonSummary[]>([]);
  const [subtopics, setSubtopics] = useState<KnowledgeNode[]>([]);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [detail, setDetail] = useState<LessonDetail>();
  const [assessment, setAssessment] = useState<LessonAssessment>();
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [validation, setValidation] = useState<Record<string, string>>({});
  const [selectedSubtopicId, setSelectedSubtopicId] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadReferences = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const [nodes, quizPage] = await Promise.all([
        adminRequest<KnowledgeNode[]>("knowledge/nodes"),
        adminRequest<AdminPage<QuizSummary>>("quizzes?page=0&size=200&sort=title,asc"),
      ]);
      const available = nodes.filter((node) => node.type === "SUBTOPIC");
      setSubtopics(nodes);
      setSelectedSubtopicId((current) => current || available[0]?.id || "");
      setQuizzes(quizPage.content);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLessons = useCallback(async () => {
    if (!selectedSubtopicId) { setLessons([]); setTotalPages(0); return; }
    setLoading(true);
    try {
      const result = await adminRequest<AdminPage<LessonSummary>>(`lessons?subtopicId=${encodeURIComponent(selectedSubtopicId)}&page=${page}&size=20&sort=displayOrder,asc`);
      setLessons(result.content);
      setTotalPages(result.totalPages);
    } catch (reason) { setError(messageOf(reason)); }
    finally { setLoading(false); }
  }, [page, selectedSubtopicId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReferences(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReferences]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLessons(), 0);
    return () => window.clearTimeout(timer);
  }, [loadLessons]);

  const visibleLessons = useMemo(() => lessons.filter((lesson) =>
    `${lesson.title} ${lesson.slug}`.toLowerCase().includes(query.toLowerCase()),
  ), [lessons, query]);

  async function selectLesson(lessonId: string) {
    setError(undefined);
    setSuccess(undefined);
    try {
      const [selected, selectedAssessment, relationPage] = await Promise.all([
        adminRequest<LessonDetail>(`lessons/${lessonId}`),
        adminOptional<LessonAssessment>(`lessons/${lessonId}/assessment`),
        adminRequest<AdminPage<LessonSummary>>("lessons?page=0&size=200&sort=title,asc"),
      ]);
      setDetail(selected);
      setAssessment(selectedAssessment);
      setRelationLessons(relationPage.content);
      setForm({
        subtopicId: selected.subtopicId,
        title: selected.title,
        content: selected.content,
        displayOrder: selected.displayOrder,
        minimumReadSeconds: selected.minimumReadSeconds,
        requiredScrollPercent: selected.requiredScrollPercent,
      });
      setValidation({});
    } catch (reason) {
      setError(messageOf(reason));
    }
  }

  function startCreate() {
    setDetail(undefined);
    setAssessment(undefined);
    setForm({ ...emptyForm, subtopicId: selectedSubtopicId });
    setError(undefined);
    setSuccess(undefined);
    setValidation({});
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!form.subtopicId) errors.subtopicId = "Select a subtopic.";
    if (!form.title.trim()) errors.title = "Title is required.";
    if (!form.content.trim()) errors.content = "Lesson content is required.";
    if (form.displayOrder < 0) errors.displayOrder = "Display order cannot be negative.";
    if (form.minimumReadSeconds < 1) errors.minimumReadSeconds = "Minimum read time must be at least one second.";
    if (form.requiredScrollPercent < 1 || form.requiredScrollPercent > 100) errors.requiredScrollPercent = "Scroll requirement must be between 1 and 100.";
    setValidation(errors);
    if (Object.keys(errors).length) return;

    setPending(true);
    setError(undefined);
    setSuccess(undefined);
    try {
      const payload = { ...form, title: form.title.trim(), content: form.content.trim() };
      const saved = await adminRequest<LessonDetail>(
        detail ? `lessons/${detail.id}` : "lessons",
        { method: detail ? "PUT" : "POST", ...jsonBody(payload) },
      );
      await loadLessons();
      await selectLesson(saved.id);
      setSuccess(detail ? "Lesson updated." : "Lesson created.");
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
      const saved = await adminRequest<LessonDetail>(`lessons/${detail.id}/status`, {
        method: "PATCH",
        ...jsonBody({ status }),
      });
      setDetail(saved);
      await loadLessons();
      setSuccess(`Status changed to ${status.toLowerCase()}.`);
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }

  async function deleteLesson() {
    if (!detail || !window.confirm("Delete this lesson? This cannot be undone.")) return;
    setPending(true);
    setError(undefined);
    try {
      await adminRequest<void>(`lessons/${detail.id}`, { method: "DELETE" });
      startCreate();
      await loadLessons();
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
      <header className="flex flex-col gap-4 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{t("Administration")}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text">{t("Lessons")}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-text-muted">{t("Maintain content, reading requirements, prerequisites, and assessment links.")}</p></div>
        <Button disabled={!selectedSubtopicId} onClick={startCreate}>{t("New lesson")}</Button>
      </header>
      {error ? <Feedback className="mt-6" tone="error" title={t("Action failed")}>{error}</Feedback> : null}
      {success ? <Feedback className="mt-6" tone="success" title={success} /> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(18rem,0.65fr)_minmax(0,1.35fr)]">
        <Card><CardContent>
          <KnowledgePathSelect nodes={subtopics} value={selectedSubtopicId} onChange={(value) => { setSelectedSubtopicId(value); setPage(0); setQuery(""); setDetail(undefined); setAssessment(undefined); }} idPrefix="lesson-filter" />
          <Label htmlFor="lesson-search">{t("Search lessons")}</Label>
          <Input id="lesson-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Title or slug")} />
          {loading ? <p className="py-10 text-center text-sm text-text-muted">{t("Loading lessons...")}</p> : visibleLessons.length ? <ul className="mt-5 space-y-2">{visibleLessons.map((lesson) => <li key={lesson.id}><button type="button" onClick={() => void selectLesson(lesson.id)} className={`w-full rounded-md border p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus/20 ${detail?.id === lesson.id ? "border-primary/40 bg-primary-subtle" : "border-border"}`}><span className="flex items-start justify-between gap-2"><span className="font-semibold text-text">{lesson.title}</span><LessonStatus status={lesson.status} /></span><span className="mt-1 block text-xs text-text-muted">{lesson.slug} · {t("order {{order}}", { order: lesson.displayOrder })}</span></button></li>)}</ul> : <p className="py-10 text-center text-sm text-text-muted">{t("No matching lessons.")}</p>}
          <AdminPagination page={page} totalPages={totalPages} disabled={loading} onPageChange={setPage} />
        </CardContent></Card>

        <div className="space-y-6">
          <Card><CardContent>
            <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-text">{detail ? t("Edit lesson") : t("Create lesson")}</h2><p className="mt-1 text-sm text-text-muted">{t("Content is stored as the backend lesson content string.")}</p></div>{detail ? <LessonStatus status={detail.status} /> : null}</div>
            <form className="mt-6 grid gap-5 sm:grid-cols-2" onSubmit={submit} noValidate>
              <div className="sm:col-span-2"><KnowledgePathSelect nodes={subtopics} value={form.subtopicId} onChange={(subtopicId) => setForm((current) => ({ ...current, subtopicId }))} idPrefix="lesson-form" />{form.subtopicId ? <p className="mt-2 text-xs text-text-muted">{knowledgePathLabel(subtopics, form.subtopicId)}</p> : null}</div>
              <Field label={t("Title")} htmlFor="lesson-title" error={validation.title}><Input id="lesson-title" maxLength={200} aria-invalid={Boolean(validation.title)} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></Field>
              <div><Label>{t("System slug")}</Label><p className="mt-2 font-mono text-xs text-text-muted">{detail?.slug ?? t("Generated automatically after creation")}</p></div>
              <Field label={t("Display order")} htmlFor="lesson-order" error={validation.displayOrder}><Input id="lesson-order" type="number" min={0} aria-invalid={Boolean(validation.displayOrder)} value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: Number(event.target.value) }))} /></Field>
              <Field label={t("Minimum read seconds")} htmlFor="lesson-read-time" error={validation.minimumReadSeconds}><Input id="lesson-read-time" type="number" min={1} aria-invalid={Boolean(validation.minimumReadSeconds)} value={form.minimumReadSeconds} onChange={(event) => setForm((current) => ({ ...current, minimumReadSeconds: Number(event.target.value) }))} /></Field>
              <Field label={t("Required scroll percent")} htmlFor="lesson-scroll" error={validation.requiredScrollPercent}><Input id="lesson-scroll" type="number" min={1} max={100} aria-invalid={Boolean(validation.requiredScrollPercent)} value={form.requiredScrollPercent} onChange={(event) => setForm((current) => ({ ...current, requiredScrollPercent: Number(event.target.value) }))} /></Field>
              <div className="sm:col-span-2"><Label htmlFor="lesson-content">{t("Content")}</Label><p className="mb-2 text-xs text-text-muted">{t("Use headings, lists and fenced code blocks. The learner view renders this content as a technical lesson.")}</p><Textarea id="lesson-content" className="min-h-80 font-mono text-sm" aria-invalid={Boolean(validation.content)} value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} />{validation.content ? <FieldError>{validation.content}</FieldError> : null}{form.content.trim() ? <details className="mt-3 rounded-md border border-border p-4"><summary className="cursor-pointer text-sm font-semibold text-text">{t("Content preview")}</summary><div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-text">{form.content}</div></details> : null}</div>
              <div className="sm:col-span-2"><Button type="submit" loading={pending}>{detail ? t("Save lesson") : t("Create lesson")}</Button></div>
            </form>
            {detail ? <div className="mt-7 border-t border-border pt-6"><h3 className="text-sm font-semibold text-text">{t("Publishing status")}</h3><div className="mt-3 flex flex-wrap gap-2">{statuses.map((status) => <Button key={status} size="sm" variant="secondary" disabled={pending || detail.status === status} onClick={() => void changeStatus(status)}>{t(status)}</Button>)}</div><Button className="mt-6" size="sm" variant="danger" loading={pending} onClick={() => void deleteLesson()}>{t("Delete lesson")}</Button></div> : null}
          </CardContent></Card>

          {detail ? <LessonRelations key={detail.id} lesson={detail} allLessons={relationLessons} quizzes={quizzes} assessment={assessment} pending={pending} setPending={setPending} onChanged={reloadDetail} onError={setError} /> : null}
        </div>
      </div>
    </div>
  );
}

function LessonRelations({ lesson, allLessons, quizzes, assessment, pending, setPending, onChanged, onError }: { lesson: LessonDetail; allLessons: LessonSummary[]; quizzes: QuizSummary[]; assessment?: LessonAssessment; pending: boolean; setPending: (value: boolean) => void; onChanged: (message?: string) => Promise<void>; onError: (message: string) => void }) {
  const { t } = useI18n();
  const [prerequisiteId, setPrerequisiteId] = useState("");
  const [quizId, setQuizId] = useState("");
  const availablePrerequisites = allLessons.filter((candidate) => candidate.id !== lesson.id && !lesson.prerequisites.some((item) => item.id === candidate.id));

  async function mutate(path: string, method: "POST" | "DELETE", message: string, body?: unknown) {
    setPending(true);
    onError("");
    try {
      await adminRequest(path, { method, ...(body ? jsonBody(body) : {}) });
      await onChanged(message);
    } catch (reason) { onError(messageOf(reason)); } finally { setPending(false); }
  }

  return <div className="grid gap-6 xl:grid-cols-2">
    <Card><CardContent><h2 className="text-lg font-semibold text-text">{t("Prerequisites")}</h2><p className="mt-1 text-sm text-text-muted">{t("The backend prevents self-reference, duplicates, and cycles.")}</p>
      {lesson.prerequisites.length ? <ul className="mt-5 space-y-2">{lesson.prerequisites.map((item) => <li key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3"><div className="min-w-0"><p className="truncate text-sm font-semibold text-text">{item.title}</p><p className="text-xs text-text-muted">{t(item.status)}</p></div><Button size="sm" variant="ghost" disabled={pending} onClick={() => { if (window.confirm(t("Remove prerequisite {{title}}?", { title: item.title }))) void mutate(`lessons/${lesson.id}/prerequisites/${item.id}`, "DELETE", t("Prerequisite removed.")); }}>{t("Remove")}</Button></li>)}</ul> : <p className="mt-5 text-sm text-text-muted">{t("No prerequisites.")}</p>}
      <div className="mt-5 border-t border-border pt-5"><Label htmlFor="prerequisite">{t("Add prerequisite")}</Label><Select id="prerequisite" value={prerequisiteId} onChange={(event) => setPrerequisiteId(event.target.value)}><option value="">{t("Select lesson")}</option>{availablePrerequisites.map((item) => <option key={item.id} value={item.id}>{item.title} ({item.status})</option>)}</Select><Button className="mt-3" size="sm" disabled={!prerequisiteId} loading={pending} onClick={() => void mutate(`lessons/${lesson.id}/prerequisites/${prerequisiteId}`, "POST", t("Prerequisite added."))}>{t("Add prerequisite")}</Button></div>
    </CardContent></Card>

    <Card><CardContent><h2 className="text-lg font-semibold text-text">{t("Assessment quiz")}</h2><p className="mt-1 text-sm text-text-muted">{t("A published lesson can only reference a published quiz.")}</p>
      {assessment ? <div className="mt-5 rounded-md border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-text">{assessment.quizTitle}</p><p className="mt-1 text-xs text-text-muted">{assessment.quizCode} · {t("pass {{percent}}%", { percent: assessment.passPercentage })}</p></div><LessonStatus status={assessment.quizStatus} /></div><Button className="mt-4" size="sm" variant="ghost" disabled={pending} onClick={() => { if (window.confirm(t("Remove this assessment from the lesson?"))) void mutate(`lessons/${lesson.id}/assessment`, "DELETE", t("Assessment removed.")); }}>{t("Remove assessment")}</Button></div> : <div className="mt-5"><Label htmlFor="assessment-quiz">{t("Assign quiz")}</Label><Select id="assessment-quiz" value={quizId} onChange={(event) => setQuizId(event.target.value)}><option value="">{t("Select quiz")}</option>{quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title} ({quiz.status})</option>)}</Select><Button className="mt-3" size="sm" disabled={!quizId} loading={pending} onClick={() => void mutate(`lessons/${lesson.id}/assessment`, "POST", t("Assessment assigned."), { quizId })}>{t("Assign assessment")}</Button></div>}
    </CardContent></Card>
  </div>;
}

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return <div><Label htmlFor={htmlFor}>{label}</Label>{children}{error ? <FieldError>{error}</FieldError> : null}</div>;
}
function LessonStatus({ status }: { status: ContentStatus }) {
  const { t } = useI18n();
  return <Badge variant={status === "PUBLISHED" ? "success" : status === "REVIEW" ? "warning" : status === "DRAFT" ? "info" : "neutral"}>{t(status)}</Badge>;
}
function messageOf(reason: unknown) { return reason instanceof Error ? reason.message : "The request could not be completed."; }
